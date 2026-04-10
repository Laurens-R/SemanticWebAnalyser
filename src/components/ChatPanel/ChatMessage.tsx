import React from 'react'
import type { ChatMessage } from '../../types'
import './ChatMessage.scss'

interface ChatMessageProps {
  message: ChatMessage
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  // Minimal markdown rendering: bold, inline code, code blocks
  const renderContent = (text: string) => {
    const lines = text.split('\n')
    const result: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockLines: string[] = []
    let codeBlockLang = ''

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeBlockLang = line.slice(3).trim()
          codeBlockLines = []
        } else {
          inCodeBlock = false
          result.push(
            <pre key={i} className="chat-message__code-block">
              <code data-lang={codeBlockLang}>{codeBlockLines.join('\n')}</code>
            </pre>
          )
          codeBlockLines = []
        }
        return
      }

      if (inCodeBlock) {
        codeBlockLines.push(line)
        return
      }

      // Headings
      if (line.startsWith('### ')) {
        result.push(<h4 key={i}>{inlineFormat(line.slice(4))}</h4>)
      } else if (line.startsWith('## ')) {
        result.push(<h3 key={i}>{inlineFormat(line.slice(3))}</h3>)
      } else if (line.startsWith('# ')) {
        result.push(<h2 key={i}>{inlineFormat(line.slice(2))}</h2>)
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push(<li key={i}>{inlineFormat(line.slice(2))}</li>)
      } else if (line.trim() === '') {
        result.push(<br key={i} />)
      } else {
        result.push(<p key={i}>{inlineFormat(line)}</p>)
      }
    })

    return result
  }

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__avatar">
        {isUser ? <UserIcon /> : <AiIcon />}
      </div>
      <div className="chat-message__bubble">
        <div className="chat-message__content">
          {renderContent(message.content)}
        </div>
        <span className="chat-message__time">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

function inlineFormat(text: string): React.ReactNode {
  // Bold: **text** and inline code: `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="chat-message__inline-code">{part.slice(1, -1)}</code>
    }
    return part
  })
}

const UserIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
)

const AiIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2a1 1 0 011 1v1.07A7.002 7.002 0 0116.93 10H18a1 1 0 110 2h-1.07A7.002 7.002 0 0111 17.93V19a1 1 0 11-2 0v-1.07A7.002 7.002 0 013.07 12H2a1 1 0 110-2h1.07A7.002 7.002 0 019 4.07V3a1 1 0 011-1z" />
    <circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none" />
  </svg>
)
