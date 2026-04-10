import Anthropic from '@anthropic-ai/sdk'
import type { StructuredResponse, ElementSelection } from '../types'

export interface AnthropicServiceConfig {
  apiKey: string
}

interface ConversationContext {
  domA: string
  domB: string
  urlA: string
  urlB: string
  titleA: string
  titleB: string
}

// Compact DOM: strip style/script, collapse whitespace, keep structure
function compactDom(rawDom: string): string {
  return rawDom
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
    .slice(0, 80000)
}

const SYSTEM_PROMPT = `You are an expert UI/UX semantic analyst comparing two web pages.

Always respond with a single valid JSON object — no markdown fences, no prose outside JSON.
Schema:
{
  "summary": "1-2 sentence plain-text explanation of your findings",
  "matches": [
    {
      "id": "unique short id e.g. m1",
      "labelA": "Human-readable component name on Page A",
      "selectorA": "Most specific CSS selector to locate it on Page A, or null if absent",
      "labelB": "Human-readable component name on Page B",
      "selectorB": "Most specific CSS selector to locate it on Page B, or null if absent",
      "relationship": "equivalent | similar | one-sided",
      "explanation": "1-2 sentences on functional/semantic relationship"
    }
  ]
}

relationship values:
- equivalent: functionally and semantically identical
- similar: same purpose, different implementation or naming
- one-sided: exists only on one page (set the other selector + label to null / "Not present")

For CSS selectors: prefer #id > [data-*] > specific.class.combinations > tag[attr]. Make them specific enough to uniquely match. If a reliable selector cannot be determined, use null.
For non-comparison questions, return an empty matches array and answer in summary.
Return at most 12 matches — prioritise the most semantically significant ones.`

function parseResponse(raw: string): StructuredResponse {
  // Try increasingly aggressive extraction strategies
  const candidates: (string | null)[] = [
    // 1. Raw text as-is
    raw.trim(),
    // 2. Strip markdown fences (handles leading/trailing whitespace + optional lang tag)
    raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim(),
    // 3. Extract first {...} block — handles preamble text / fences with surrounding prose
    (() => { const m = raw.match(/\{[\s\S]*\}/); return m ? m[0] : null })(),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const parsed = JSON.parse(candidate) as StructuredResponse
      return {
        summary: parsed.summary ?? '',
        matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      }
    } catch {
      // try next strategy
    }
  }

  // Final fallback: plain text response (e.g. error message from model)
  return { summary: raw, matches: [] }
}

export class AnthropicService {
  private client: Anthropic
  private context: ConversationContext | null = null
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

  constructor(config: AnthropicServiceConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true })
  }

  setDomContext(ctx: ConversationContext): void {
    this.context = {
      ...ctx,
      domA: compactDom(ctx.domA),
      domB: compactDom(ctx.domB),
    }
    this.conversationHistory = []
  }

  clearHistory(): void {
    this.conversationHistory = []
  }

  hasDomContext(): boolean {
    return this.context !== null
  }

  private async callClaude(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<StructuredResponse> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    return parseResponse(raw)
  }

  async ask(userMessage: string): Promise<StructuredResponse> {
    if (!this.context) {
      throw new Error('No DOM context set. Please load both pages first.')
    }

    if (this.conversationHistory.length === 0) {
      // First message: prepend full DOM context
      const domContextMessage = `I will provide the HTML DOM of two web pages for semantic analysis.

**Page A** (${this.context.titleA || this.context.urlA}):
\`\`\`html
${this.context.domA}
\`\`\`

**Page B** (${this.context.titleB || this.context.urlB}):
\`\`\`html
${this.context.domB}
\`\`\`

First question: ${userMessage}`

      const messages = [{ role: 'user' as const, content: domContextMessage }]
      const result = await this.callClaude(messages)
      // Store the DOM-rich user turn + assistant reply in history
      this.conversationHistory.push({ role: 'user', content: domContextMessage })
      this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(result) })
      return result
    }

    // Subsequent turns: append only the new question
    this.conversationHistory.push({ role: 'user', content: userMessage })
    const result = await this.callClaude(this.conversationHistory)
    this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(result) })
    return result
  }

  async findSimilarElement(selection: ElementSelection): Promise<StructuredResponse> {
    const sourcePage = selection.sourcePane === 'A'
      ? (this.context?.titleA || this.context?.urlA || 'Page A')
      : (this.context?.titleB || this.context?.urlB || 'Page B')
    const targetPage = selection.sourcePane === 'A' ? 'Page B' : 'Page A'

    const prompt = `On **${sourcePage}**, I right-clicked this element:
Tag: \`${selection.tagName}\`  Class: \`${selection.className || '(none)'}\`  Id: \`${selection.id || '(none)'}\`
Content: "${selection.textContent.slice(0, 200)}"
HTML: \`${selection.outerHTML.slice(0, 600)}\`

Find the semantically equivalent or functionally similar element on **${targetPage}** and return it as a match in the JSON response.`

    return this.ask(prompt)
  }

  generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }
}

