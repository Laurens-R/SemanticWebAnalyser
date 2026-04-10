import React from 'react'
import { Button } from '../shared/Button/Button'
import { Badge } from '../shared/Badge/Badge'
import { Tooltip } from '../shared/Tooltip/Tooltip'
import './Toolbar.scss'

interface ToolbarProps {
  isAnalysing: boolean
  domLoaded: boolean
  urlA: string
  urlB: string
  onLoadAndAnalyse: () => void
  onRefresh: () => void
  onOpenSettings: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isAnalysing,
  domLoaded,
  urlA,
  urlB,
  onLoadAndAnalyse,
  onRefresh,
  onOpenSettings,
}) => {
  const canAnalyse = Boolean(urlA && urlB)

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <LogoIcon />
        <span className="toolbar__title">Semantic Web Analyser</span>
      </div>

      <div className="toolbar__actions">
        {domLoaded && <Badge label="Context loaded" variant="success" />}

        <Tooltip content="Extract DOM from both pages and load into AI context">
          <Button
            variant="primary"
            size="sm"
            onClick={onLoadAndAnalyse}
            loading={isAnalysing}
            disabled={!canAnalyse}
            icon={<AnalyseIcon />}
          >
            {domLoaded ? 'Re-analyse' : 'Load & Analyse'}
          </Button>
        </Tooltip>

        <Tooltip content="Reload both pages">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshIcon />}>
            Refresh
          </Button>
        </Tooltip>

        <Tooltip content="Settings">
          <Button variant="ghost" size="sm" onClick={onOpenSettings} icon={<SettingsIcon />} />
        </Tooltip>
      </div>
    </header>
  )
}

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const AnalyseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <circle cx="7" cy="7" r="5" />
    <path d="M13 13l-2.5-2.5" />
    <path d="M5 7h4M7 5v4" />
  </svg>
)

const RefreshIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <path d="M13.5 3.5A7 7 0 102.5 10" />
    <path d="M2 7v3.5H5.5" />
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15" />
    <path d="M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
  </svg>
)
