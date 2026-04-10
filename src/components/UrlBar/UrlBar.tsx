import React, { useRef } from 'react'
import { TextInput } from '../shared/TextInput/TextInput'
import { Button } from '../shared/Button/Button'
import { Badge } from '../shared/Badge/Badge'
import './UrlBar.scss'

interface UrlBarProps {
  paneId: 'A' | 'B'
  url: string
  loading: boolean
  title?: string
  onNavigate: (url: string) => void
}

export const UrlBar: React.FC<UrlBarProps> = ({
  paneId,
  url,
  loading,
  title,
  onNavigate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputRef.current) {
      onNavigate(inputRef.current.value)
    }
  }

  const handleGoClick = () => {
    if (inputRef.current) {
      onNavigate(inputRef.current.value)
    }
  }

  return (
    <div className="url-bar">
      <Badge label={`Page ${paneId}`} variant={paneId === 'A' ? 'info' : 'success'} />
      <div className="url-bar__input-wrap">
        <TextInput
          ref={inputRef}
          defaultValue={url}
          key={url}
          placeholder={`Enter URL for page ${paneId}…`}
          onKeyDown={handleKeyDown}
          prefix={
            loading ? (
              <span className="url-bar__spinner" aria-label="Loading" />
            ) : (
              <GlobeIcon />
            )
          }
        />
      </div>
      {title && <span className="url-bar__title">{title}</span>}
      <Button variant="secondary" size="sm" onClick={handleGoClick} disabled={loading}>
        Go
      </Button>
    </div>
  )
}

const GlobeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <circle cx="8" cy="8" r="6.5" />
    <ellipse cx="8" cy="8" rx="2.5" ry="6.5" />
    <path d="M1.5 8h13M2 5h12M2 11h12" />
  </svg>
)
