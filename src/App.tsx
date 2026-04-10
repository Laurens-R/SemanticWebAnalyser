import { useState, useCallback } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { PageColumn } from './components/PageColumn/PageColumn'
import { ChatPanel } from './components/ChatPanel/ChatPanel'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { usePageContext } from './hooks/usePageContext'
import { useAnalysis } from './hooks/useAnalysis'
import type { ElementSelection } from './types'
export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('swa-api-key') || ''
  )
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('swa-api-key'))
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<ElementSelection | null>(null)

  const pageA = usePageContext('A')
  const pageB = usePageContext('B')

  const analysis = useAnalysis({ apiKey })

  const handleSaveApiKey = useCallback(
    (key: string) => {
      setApiKey(key)
      localStorage.setItem('swa-api-key', key)
      analysis.updateApiKey(key)
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

  const handleElementSelected = useCallback((selection: ElementSelection) => {
    setPendingSelection(selection)
  }, [])

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

      <div className="app__workspace">
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
          />
          <div className="app__divider" />
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
          />
        </div>

        <aside className="app__sidebar">
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
          />
        </aside>
      </div>

      {showSettings && (
        <SettingsPanel
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
