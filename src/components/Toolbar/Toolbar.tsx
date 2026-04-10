import React, { useState, useEffect } from 'react'
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

const api = () => (window as unknown as { electronAPI: { windowMinimize: () => void; windowMaximize: () => void; windowClose: () => void; windowIsMaximized: () => Promise<boolean>; openDevTools: () => void; platform: string } }).electronAPI

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
  const [isMaximized, setIsMaximized] = useState(false)
  const platform = api()?.platform ?? 'win32'
  const isWin = platform === 'win32'

  useEffect(() => {
    api()?.windowIsMaximized().then(setIsMaximized)
  }, [])

  const handleMaximize = () => {
    api()?.windowMaximize()
    setIsMaximized((v) => !v)
  }

  const windowControls = (
    <div className={`toolbar__window-controls toolbar__window-controls--${isWin ? 'win' : 'mac'}`}>
      <button className="toolbar__wc toolbar__wc--minimize" onClick={() => api()?.windowMinimize()} title="Minimise">
        <MinimizeIcon />
      </button>
      <button className="toolbar__wc toolbar__wc--maximize" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximise'}>
        {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
      </button>
      <button className="toolbar__wc toolbar__wc--close" onClick={() => api()?.windowClose()} title="Close">
        <CloseWinIcon />
      </button>
    </div>
  )

  return (
    <header className="toolbar">
      {!isWin && windowControls}

      <div className="toolbar__brand">
        <LogoIcon />
        <span className="toolbar__title">Semantic Web Analyser</span>
      </div>

      <div className="toolbar__drag-spacer" />

      <div className="toolbar__actions">
        {domLoaded && <Badge label="Context loaded" variant="success" />}

        <Tooltip content="Extract DOM from both pages and load into AI context" position="bottom">
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

        <Tooltip content="Reload both pages" position="bottom">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshIcon />}>
            Refresh
          </Button>
        </Tooltip>

        <Tooltip content="Settings" position="bottom">
          <Button variant="ghost" size="sm" onClick={onOpenSettings} icon={<SettingsIcon />} />
        </Tooltip>

        <Tooltip content="Open DevTools" position="bottom">
          <Button variant="ghost" size="sm" onClick={() => api()?.openDevTools()} icon={<DevToolsIcon />} style={{ display: 'none' }} />
        </Tooltip>
      </div>

      {isWin && windowControls}
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
    <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
    <polyline points="14,2 14,8 8,8" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15" />
    <path d="M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
  </svg>
)

const MinimizeIcon = () => (
  <svg viewBox="0 0 10 1" width="10" height="1" fill="currentColor">
    <rect width="10" height="1" />
  </svg>
)

const MaximizeIcon = () => (
  <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="0.5" y="0.5" width="9" height="9" />
  </svg>
)

const RestoreIcon = () => (
  <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="2.5" y="0.5" width="7" height="7" />
    <path d="M0.5 2.5v7h7" />
  </svg>
)

const CloseWinIcon = () => (
  <svg viewBox="0 0 10 10" width="10" height="10" stroke="currentColor" strokeWidth="1.2">
    <line x1="1" y1="1" x2="9" y2="9" />
    <line x1="9" y1="1" x2="1" y2="9" />
  </svg>
)

const DevToolsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <polyline points="4,6 1,8 4,10" />
    <polyline points="12,6 15,8 12,10" />
    <line x1="9" y1="4" x2="7" y2="12" />
  </svg>
)
