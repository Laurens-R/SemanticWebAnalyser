import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, ElementSelection } from '../types'
import { AnthropicService } from '../services/anthropicService'

interface UseAnalysisOptions {
  apiKey: string
  maxMatches: number
  maxTokens: number
}

interface DomContextInput {
  domA: string
  domB: string
  urlA: string
  urlB: string
  titleA: string
  titleB: string
}

export function useAnalysis({ apiKey, maxMatches, maxTokens }: UseAnalysisOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domLoaded, setDomLoaded] = useState(false)
  const configRef = useRef({ apiKey, maxMatches, maxTokens })
  const serviceRef = useRef(new AnthropicService({ apiKey, maxMatches, maxTokens }))

  const updateApiKey = useCallback(
    (newKey: string) => {
      configRef.current.apiKey = newKey
      serviceRef.current = new AnthropicService({ ...configRef.current })
    },
    []
  )

  const updateSettings = useCallback(
    (newMaxMatches: number, newMaxTokens: number) => {
      configRef.current.maxMatches = newMaxMatches
      configRef.current.maxTokens = newMaxTokens
      serviceRef.current = new AnthropicService({ ...configRef.current })
    },
    []
  )

  const loadDomContext = useCallback(
    (ctx: DomContextInput) => {
      serviceRef.current.setDomContext(ctx)
      setDomLoaded(true)
      setMessages([])
      setError(null)
    },
    []
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return
      const svc = serviceRef.current

      const userMsg: ChatMessage = {
        id: svc.generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        const result = await svc.ask(content)
        const assistantMsg: ChatMessage = {
          id: svc.generateMessageId(),
          role: 'assistant',
          content: result.summary,
          structured: result,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const findSimilarElement = useCallback(
    async (selection: ElementSelection) => {
      const svc = serviceRef.current
      setIsLoading(true)
      setError(null)

      const userMsg: ChatMessage = {
        id: svc.generateMessageId(),
        role: 'user',
        content: `Find the similar element in ${selection.sourcePane === 'A' ? 'Page B' : 'Page A'} for the selected **${selection.tagName}** element${selection.textContent ? ` ("${selection.textContent.slice(0, 60)}")` : ''} from ${selection.sourcePane === 'A' ? 'Page A' : 'Page B'}.`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])

      try {
        const result = await svc.findSimilarElement(selection)
        const assistantMsg: ChatMessage = {
          id: svc.generateMessageId(),
          role: 'assistant',
          content: result.summary,
          structured: result,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const clearConversation = useCallback(() => {
    serviceRef.current.clearHistory()
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    domLoaded,
    updateApiKey,
    updateSettings,
    loadDomContext,
    sendMessage,
    findSimilarElement,
    clearConversation,
  }
}
