import { useState, useCallback, useRef } from 'react'
import type { PageContext, ElementSelection } from '../types'
import { extractDomFromWebview } from '../services/domExtractor'

export function usePageContext(paneId: 'A' | 'B') {
  const [page, setPage] = useState<PageContext>({
    url: '',
    title: '',
    dom: null,
    loading: false,
    error: null,
  })

  const webviewRef = useRef<Electron.WebviewTag | null>(null)

  const setWebviewRef = useCallback((el: Electron.WebviewTag | null) => {
    webviewRef.current = el
  }, [])

  const navigate = useCallback((url: string) => {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    setPage((prev) => ({
      ...prev,
      url: normalizedUrl,
      loading: true,
      error: null,
      dom: null,
      title: '',
    }))
  }, [])

  const handleLoadCommit = useCallback((url: string) => {
    setPage((prev) => ({ ...prev, url, loading: true }))
  }, [])

  const handleDomReady = useCallback(async () => {
    setPage((prev) => ({ ...prev, loading: false }))
  }, [])

  const handleTitleUpdate = useCallback((title: string) => {
    setPage((prev) => ({ ...prev, title }))
  }, [])

  const handleError = useCallback((errorMsg: string) => {
    setPage((prev) => ({ ...prev, loading: false, error: errorMsg }))
  }, [])

  const extractDom = useCallback(async (): Promise<{ title: string; dom: string } | null> => {
    if (!webviewRef.current) return null
    try {
      setPage((prev) => ({ ...prev, loading: true }))
      const result = await extractDomFromWebview(webviewRef.current)
      setPage((prev) => ({ ...prev, dom: result.dom, title: result.title, loading: false }))
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'DOM extraction failed'
      setPage((prev) => ({ ...prev, error: message, loading: false }))
      return null
    }
  }, [])

  const getSelectedElement = useCallback(async (): Promise<ElementSelection | null> => {
    if (!webviewRef.current) return null
    try {
      const script = `
        (function() {
          const el = document.querySelector(':focus') || document.querySelector('[data-swa-selected]');
          if (!el) return null;
          return JSON.stringify({
            tagName: el.tagName.toLowerCase(),
            outerHTML: el.outerHTML.slice(0, 2000),
            textContent: el.textContent.trim().slice(0, 300),
            className: el.className || '',
            id: el.id || '',
          });
        })()
      `
      const result = await webviewRef.current.executeJavaScript(script)
      if (!result) return null
      const data = JSON.parse(result as string)
      return { ...data, sourcePane: paneId } as ElementSelection
    } catch {
      return null
    }
  }, [paneId])

  return {
    page,
    webviewRef,
    setWebviewRef,
    navigate,
    handleLoadCommit,
    handleDomReady,
    handleTitleUpdate,
    handleError,
    extractDom,
    getSelectedElement,
  }
}
