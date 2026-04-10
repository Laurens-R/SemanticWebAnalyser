import { useState, useCallback, useRef } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { PageColumn } from './components/PageColumn/PageColumn'
import { ChatPanel } from './components/ChatPanel/ChatPanel'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { usePageContext } from './hooks/usePageContext'
import { useAnalysis } from './hooks/useAnalysis'
import type { ElementSelection, AnalysisMatch } from './types'
export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('swa-api-key') || ''
  )
  const [maxMatches, setMaxMatches] = useState<number>(
    () => parseInt(localStorage.getItem('swa-max-matches') || '12', 10)
  )
  const [maxTokens, setMaxTokens] = useState<number>(
    () => parseInt(localStorage.getItem('swa-max-tokens') || '4096', 10)
  )
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('swa-api-key'))
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<ElementSelection | null>(null)

  const pageA = usePageContext('A')
  const pageB = usePageContext('B')

  const analysis = useAnalysis({ apiKey, maxMatches, maxTokens })

  const handleSaveApiKey = useCallback(
    (key: string, newMaxMatches: number, newMaxTokens: number) => {
      setApiKey(key)
      localStorage.setItem('swa-api-key', key)
      setMaxMatches(newMaxMatches)
      localStorage.setItem('swa-max-matches', String(newMaxMatches))
      setMaxTokens(newMaxTokens)
      localStorage.setItem('swa-max-tokens', String(newMaxTokens))
      analysis.updateApiKey(key)
      analysis.updateSettings(newMaxMatches, newMaxTokens)
    },
    [analysis]
  )

  const handleLoadAndAnalyse = useCallback(async () => {
    if (!pageA.page.url || !pageB.page.url) return
    setIsAnalysing(true)
    try {
      const [resultA, resultB] = await Promise.all([
        pageA.extractDom(),
        pageB.extractDom(),
      ])

      if (resultA && resultB) {
        analysis.loadDomContext({
          domA: resultA.dom,
          domB: resultB.dom,
          urlA: pageA.page.url,
          urlB: pageB.page.url,
          titleA: resultA.title,
          titleB: resultB.title,
        })
      }
    } finally {
      setIsAnalysing(false)
    }
  }, [pageA, pageB, analysis])

  const handleRefresh = useCallback(() => {
    if (pageA.webviewRef.current) {
      pageA.webviewRef.current.reload()
    }
    if (pageB.webviewRef.current) {
      pageB.webviewRef.current.reload()
    }
  }, [pageA.webviewRef, pageB.webviewRef])

  const [sidebarWidth, setSidebarWidth] = useState(340)
  const [paneRatio, setPaneRatio] = useState(0.5) // fraction of pages area for pane A
  const [drag, setDrag] = useState<{ type: 'sidebar' | 'pane'; startX: number; startValue: number } | null>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  const startDrag = useCallback((type: 'sidebar' | 'pane', e: React.MouseEvent) => {
    e.preventDefault()
    setDrag({
      type,
      startX: e.clientX,
      startValue: type === 'sidebar' ? sidebarWidth : paneRatio,
    })
  }, [sidebarWidth, paneRatio])

  const onOverlayMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return
    const delta = e.clientX - drag.startX
    if (drag.type === 'sidebar') {
      // sidebar is on the right — dragging left increases width
      const next = Math.min(700, Math.max(260, drag.startValue as number - delta))
      setSidebarWidth(next)
    } else {
      // pane divider — dragging right increases pane A
      const ws = workspaceRef.current
      if (!ws) return
      const totalW = ws.getBoundingClientRect().width - sidebarWidth - 4 // 4px divider
      const next = Math.min(0.8, Math.max(0.2, (drag.startValue as number) + delta / totalW))
      setPaneRatio(next)
    }
  }, [drag, sidebarWidth])

  const onOverlayUp = useCallback(() => {
    setDrag(null)
  }, [])

  const handleElementSelected = useCallback((selection: ElementSelection) => {
    setPendingSelection(selection)
  }, [])

  const handleHighlight = useCallback((match: AnalysisMatch) => {
    void pageA.highlightElements([match.selectorA])
    void pageB.highlightElements([match.selectorB])
  }, [pageA, pageB])

  const handleClearHighlights = useCallback(() => {
    void pageA.clearHighlights()
    void pageB.clearHighlights()
  }, [pageA, pageB])

  return (
    <div className="app">
      <Toolbar
        isAnalysing={isAnalysing}
        domLoaded={analysis.domLoaded}
        urlA={pageA.page.url}
        urlB={pageB.page.url}
        onLoadAndAnalyse={handleLoadAndAnalyse}
        onRefresh={handleRefresh}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="app__workspace" ref={workspaceRef}>
        {/* Full-screen drag overlay — sits above webviews during resize */}
        {drag && (
          <div
            className="app__drag-overlay"
            onMouseMove={onOverlayMove}
            onMouseUp={onOverlayUp}
            onMouseLeave={onOverlayUp}
          />
        )}

        <div className="app__pages">
          <PageColumn
            paneId="A"
            page={pageA.page}
            onNavigate={pageA.navigate}
            onDomReady={pageA.handleDomReady}
            onLoadCommit={pageA.handleLoadCommit}
            onTitleUpdate={pageA.handleTitleUpdate}
            onError={pageA.handleError}
            onWebviewMount={pageA.setWebviewRef}
            onElementSelected={handleElementSelected}
            style={{ flex: `0 0 calc(${paneRatio * 100}% - 2px)` }}
          />
          <div
            className="app__divider"
            onMouseDown={(e) => startDrag('pane', e)}
          />
          <PageColumn
            paneId="B"
            page={pageB.page}
            onNavigate={pageB.navigate}
            onDomReady={pageB.handleDomReady}
            onLoadCommit={pageB.handleLoadCommit}
            onTitleUpdate={pageB.handleTitleUpdate}
            onError={pageB.handleError}
            onWebviewMount={pageB.setWebviewRef}
            onElementSelected={handleElementSelected}
            style={{ flex: `0 0 calc(${(1 - paneRatio) * 100}% - 2px)` }}
          />
        </div>

        <aside className="app__sidebar" style={{ width: sidebarWidth }}>
          <div
            className="app__sidebar-resizer"
            onMouseDown={(e) => startDrag('sidebar', e)}
          />
          <ChatPanel
            messages={analysis.messages}
            isLoading={analysis.isLoading}
            error={analysis.error}
            domLoaded={analysis.domLoaded}
            pendingSelection={pendingSelection}
            onSendMessage={analysis.sendMessage}
            onFindSimilar={analysis.findSimilarElement}
            onClearPendingSelection={() => setPendingSelection(null)}
            onClearConversation={analysis.clearConversation}
            onHighlight={handleHighlight}
            onClearHighlights={handleClearHighlights}
          />
        </aside>
      </div>

      {showSettings && (
        <SettingsPanel
          apiKey={apiKey}
          maxMatches={maxMatches}
          maxTokens={maxTokens}
          onSave={handleSaveApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
