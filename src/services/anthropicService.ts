import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from '../types'

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
    .slice(0, 80000) // hard cap to avoid runaway tokens
}

const SYSTEM_PROMPT = `You are an expert UI/UX semantic analyst. Your job is to compare two web pages and identify semantic relationships between their components — even when naming conventions differ.

When analyzing:
- Focus on functionality and purpose, not just naming
- Identify structural and behavioral equivalence (e.g., an "Accordion" vs a "MultiFold Section")
- Use concise, clear language
- When referencing elements, use their tag, class, id, or visible text to identify them clearly
- Provide actionable, specific answers`

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

  async submitDomAndAsk(userMessage: string): Promise<string> {
    if (!this.context) {
      throw new Error('No DOM context set. Please load both pages first.')
    }

    // First message: include DOM context
    const domContextMessage = `I will provide you the HTML DOM structure of two web pages. Please analyze them to answer questions about semantic equivalences.

**Page A** (${this.context.titleA || this.context.urlA}):
\`\`\`html
${this.context.domA}
\`\`\`

**Page B** (${this.context.titleB || this.context.urlB}):
\`\`\`html
${this.context.domB}
\`\`\`

Now, my first question: ${userMessage}`

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: domContextMessage },
    ]

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    })

    const assistantReply =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Store compact history: save the original user message (not the DOM blob) for subsequent turns
    this.conversationHistory.push({ role: 'user', content: domContextMessage })
    this.conversationHistory.push({ role: 'assistant', content: assistantReply })

    return assistantReply
  }

  async ask(userMessage: string): Promise<string> {
    if (!this.context) {
      throw new Error('No DOM context set. Please load both pages first.')
    }

    // If no history yet, submit DOM on first message
    if (this.conversationHistory.length === 0) {
      return this.submitDomAndAsk(userMessage)
    }

    // Subsequent messages: only send the new question with conversation history
    this.conversationHistory.push({ role: 'user', content: userMessage })

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: this.conversationHistory,
    })

    const assistantReply =
      response.content[0].type === 'text' ? response.content[0].text : ''

    this.conversationHistory.push({ role: 'assistant', content: assistantReply })

    return assistantReply
  }

  async findSimilarElement(selection: {
    sourcePane: 'A' | 'B'
    tagName: string
    outerHTML: string
    textContent: string
    className: string
  }): Promise<string> {
    const sourcePage = selection.sourcePane === 'A'
      ? (this.context?.titleA || this.context?.urlA || 'Page A')
      : (this.context?.titleB || this.context?.urlB || 'Page B')
    const targetPage = selection.sourcePane === 'A' ? 'Page B' : 'Page A'

    const prompt = `On **${sourcePage}**, I selected this element:

Tag: \`${selection.tagName}\`
Class: \`${selection.className || '(none)'}\`
Content: "${selection.textContent.slice(0, 300)}"
HTML snippet:
\`\`\`html
${selection.outerHTML.slice(0, 1000)}
\`\`\`

What is the semantically equivalent or functionally similar component/element on **${targetPage}**? Explain the similarity and any differences in naming, structure, or behavior.`

    return this.ask(prompt)
  }

  generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  toChatMessages(history: typeof this.conversationHistory): ChatMessage[] {
    return history
      .filter((_, i) => i > 0) // skip the DOM submission message
      .map((m, i) => ({
        id: `history-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(),
      }))
  }
}
