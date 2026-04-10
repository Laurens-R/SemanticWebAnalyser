import { useState, useCallback } from 'react'
import type { ChatMessage, ElementSelection } from '../types'
import { AnthropicService } from '../services/anthropicService'

interface UseAnalysisOptions {
  apiKey: string
}

interface DomContextInput {
  domA: string
  domB: string
  urlA: string
  urlB: string
  titleA: string
  titleB: string
}

export function useAnalysis({ apiKey }: UseAnalysisOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domLoaded, setDomLoaded] = useState(false)
  const [service] = useState(() => new AnthropicService({ apiKey }))

  const updateApiKey = useCallback(
    (newKey: string) => {
      Object.assign(service, new AnthropicService({ apiKey: newKey }))
    },
    [service]
  )

  const loadDomContext = useCallback(
    (ctx: DomContextInput) => {
      service.setDomContext(ctx)
      setDomLoaded(true)
      setMessages([])
      setError(null)
    },
    [service]
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const userMsg: ChatMessage = {
        id: service.generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        const reply = await service.ask(content)
        const assistantMsg: ChatMessage = {
          id: service.generateMessageId(),
          role: 'assistant',
          content: reply,
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
    [service]
  )

  const findSimilarElement = useCallback(
    async (selection: ElementSelection) => {
      setIsLoading(true)
      setError(null)

      const userMsg: ChatMessage = {
        id: service.generateMessageId(),
        role: 'user',
        content: `Find the similar element in ${selection.sourcePane === 'A' ? 'Page B' : 'Page A'} for the selected **${selection.tagName}** element${selection.textContent ? ` ("${selection.textContent.slice(0, 60)}")` : ''} from ${selection.sourcePane === 'A' ? 'Page A' : 'Page B'}.`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])

      try {
        const reply = await service.findSimilarElement(selection)
        const assistantMsg: ChatMessage = {
          id: service.generateMessageId(),
          role: 'assistant',
          content: reply,
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
    [service]
  )

  const clearConversation = useCallback(() => {
    service.clearHistory()
    setMessages([])
    setError(null)
  }, [service])

  return {
    messages,
    isLoading,
    error,
    domLoaded,
    updateApiKey,
    loadDomContext,
    sendMessage,
    findSimilarElement,
    clearConversation,
  }
}
