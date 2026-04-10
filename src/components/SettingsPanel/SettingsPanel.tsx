import React, { useState } from 'react'
import { Button } from '../shared/Button/Button'
import { TextInput } from '../shared/TextInput/TextInput'
import './SettingsPanel.scss'

interface SettingsPanelProps {
  apiKey: string
  maxMatches: number
  maxTokens: number
  onSave: (apiKey: string, maxMatches: number, maxTokens: number) => void
  onClose: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ apiKey, maxMatches, maxTokens, onSave, onClose }) => {
  const [localKey, setLocalKey] = useState(apiKey)
  const [localMaxMatches, setLocalMaxMatches] = useState(String(maxMatches))
  const [localMaxTokens, setLocalMaxTokens] = useState(String(maxTokens))
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    const parsedMatches = Math.max(1, Math.min(50, parseInt(localMaxMatches, 10) || maxMatches))
    const parsedTokens = Math.max(256, Math.min(16384, parseInt(localMaxTokens, 10) || maxTokens))
    onSave(localKey.trim(), parsedMatches, parsedTokens)
    onClose()
  }

  return (
    <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">
        <div className="settings-panel__header">
          <h2>Settings</h2>
          <button className="settings-panel__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="settings-panel__body">
          <section className="settings-panel__section">
            <h3>Anthropic API</h3>
            <p className="settings-panel__description">
              Your API key is stored locally in this session and never sent anywhere except
              the Anthropic API. The model used is <strong>claude-sonnet-4-5</strong>.
            </p>
            <TextInput
              label="API Key"
              type={showKey ? 'text' : 'password'}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="sk-ant-…"
              suffix={
                <button
                  className="settings-panel__toggle-visibility"
                  onClick={() => setShowKey((v) => !v)}
                  type="button"
                  tabIndex={-1}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />
          </section>

          <section className="settings-panel__section">
            <h3>Analysis Limits</h3>
            <p className="settings-panel__description">
              Control how many matches the AI returns per analysis and the maximum tokens it can use in a response.
            </p>
            <div className="settings-panel__row">
              <TextInput
                label="Max matches (1–50)"
                type="number"
                value={localMaxMatches}
                onChange={(e) => setLocalMaxMatches(e.target.value)}
                placeholder="12"
              />
              <TextInput
                label="Max response tokens (256–16384)"
                type="number"
                value={localMaxTokens}
                onChange={(e) => setLocalMaxTokens(e.target.value)}
                placeholder="4096"
              />
            </div>
          </section>

          <section className="settings-panel__section">
            <h3>About</h3>
            <p className="settings-panel__description">
              Semantic Web Analyser compares two web pages semantically using an AI model.
              Right-click elements in a preview to select them, then use the chat panel to
              find similar components on the other page.
            </p>
          </section>
        </div>

        <div className="settings-panel__footer">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

const EyeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <path d="M13 6.5C13.5 7 14.5 7.8 15 8.5c-2 3-4.5 4.5-7 4.5-1 0-2-.3-3-.7M3 3l10 10M1 8c.7-1 1.8-2.2 3-3" />
  </svg>
)
