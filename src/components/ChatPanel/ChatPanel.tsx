import React, { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ElementSelection, AnalysisMatch } from '../../types'
import { ChatMessageItem } from './ChatMessage'
import { Button } from '../shared/Button/Button'
import { Badge } from '../shared/Badge/Badge'
import './ChatPanel.scss'

interface ChatPanelProps {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  domLoaded: boolean
  pendingSelection: ElementSelection | null
  onSendMessage: (content: string) => void
  onFindSimilar: (selection: ElementSelection) => void
  onClearPendingSelection: () => void
  onClearConversation: () => void
  onHighlight: (match: AnalysisMatch) => void
  onClearHighlights: () => void
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  error,
  domLoaded,
  pendingSelection,
  onSendMessage,
  onFindSimilar,
  onClearPendingSelection,
  onClearConversation,
  onHighlight,
  onClearHighlights,
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSendMessage(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const handleFindSimilar = () => {
    if (pendingSelection) {
      onFindSimilar(pendingSelection)
      onClearPendingSelection()
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <div className="chat-panel__header-left">
          <AnalysisIcon />
          <span>Analysis</span>
          {domLoaded && <Badge label="DOM loaded" variant="success" />}
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearConversation}>
            Clear
          </Button>
        )}
      </div>

      {!domLoaded && (
        <div className="chat-panel__hint">
          <InfoIcon />
          <p>Load both pages and click <strong>Load &amp; Analyse</strong> to start asking questions.</p>
        </div>
      )}

      {pendingSelection && (
        <div className="chat-panel__selection-bar">
          <div className="chat-panel__selection-info">
            <span className="chat-panel__selection-tag">{`<${pendingSelection.tagName}>`}</span>
            <span className="chat-panel__selection-text">
              {pendingSelection.textContent?.slice(0, 60) || 'Selected element'}
            </span>
            <Badge label={`Page ${pendingSelection.sourcePane}`} variant={pendingSelection.sourcePane === 'A' ? 'info' : 'success'} />
          </div>
          <div className="chat-panel__selection-actions">
            <Button variant="primary" size="sm" onClick={handleFindSimilar} loading={isLoading}>
              Find Similar
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearPendingSelection}>
              ✕
            </Button>
          </div>
        </div>
      )}

      <div className="chat-panel__messages">
        {messages.length === 0 && domLoaded && (
          <div className="chat-panel__empty-messages">
            <p>Ask anything about the two pages.</p>
            <div className="chat-panel__suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="chat-panel__suggestion"
                  onClick={() => onSendMessage(s)}
                  disabled={isLoading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onHighlight={onHighlight}
            onClearHighlights={onClearHighlights}
          />
        ))}

        {isLoading && (
          <div className="chat-panel__thinking">
            <span />
            <span />
            <span />
          </div>
        )}

        {error && (
          <div className="chat-panel__error">
            <ErrorIcon />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-panel__input-area">
        <textarea
          ref={textareaRef}
          className="chat-panel__textarea"
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={domLoaded ? 'Ask about semantic differences…' : 'Load pages first…'}
          disabled={!domLoaded || isLoading}
          rows={1}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={!domLoaded || !input.trim() || isLoading}
          loading={isLoading}
          icon={<SendIcon />}
          iconPosition="right"
        >
          Send
        </Button>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'What components appear on both pages?',
  'Are there any navigation patterns that differ?',
  'What is the equivalent of the header on each page?',
]

const AnalysisIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M9 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
    <path d="M13 3l4 4-6 6H7v-4l6-6z" />
  </svg>
)

const InfoIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
)

const ErrorIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
)
