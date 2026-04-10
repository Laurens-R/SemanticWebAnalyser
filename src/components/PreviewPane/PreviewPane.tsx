import React, { useEffect, useRef, useCallback } from 'react'
import type { ElementSelection } from '../../types'
import './PreviewPane.scss'

interface PreviewPaneProps {
  paneId: 'A' | 'B'
  url: string
  onDomReady: () => void
  onLoadCommit: (url: string) => void
  onTitleUpdate: (title: string) => void
  onError: (msg: string) => void
  onWebviewMount: (el: Electron.WebviewTag) => void
  onElementSelected: (selection: ElementSelection) => void
}

// Context menu injection script
const CONTEXT_MENU_SCRIPT = `
(function() {
  if (window.__swaInjected) return;
  window.__swaInjected = true;
  
  document.addEventListener('contextmenu', function(e) {
    const el = e.target;
    if (!el || el.nodeType !== 1) return;
    
    el.setAttribute('data-swa-selected', 'true');
    window.__swaSelectedEl = {
      tagName: el.tagName.toLowerCase(),
      outerHTML: el.outerHTML.slice(0, 2000),
      textContent: el.textContent.trim().slice(0, 300),
      className: (el.className && typeof el.className === 'string') ? el.className : '',
      id: el.id || '',
    };
  });
})()
`

export const PreviewPane = React.forwardRef<Electron.WebviewTag, PreviewPaneProps>(
  (
    {
      paneId,
      url,
      onDomReady,
      onLoadCommit,
      onTitleUpdate,
      onError,
      onWebviewMount,
      onElementSelected,
    },
    _ref
  ) => {
    const webviewRef = useRef<Electron.WebviewTag | null>(null)
    const currentUrlRef = useRef<string>('')
    const viewportRef = useRef<HTMLDivElement | null>(null)

    // Imperatively size the webview to match its container pixel-for-pixel.
    // CSS height/% is unreliable for Electron's <webview> custom element.
    const sizeWebview = useCallback(() => {
      if (!webviewRef.current || !viewportRef.current) return
      const { offsetWidth, offsetHeight } = viewportRef.current
      webviewRef.current.style.width = `${offsetWidth}px`
      webviewRef.current.style.height = `${offsetHeight}px`
    }, [])

    // Observe the viewport container and resize the webview whenever it changes
    useEffect(() => {
      const el = viewportRef.current
      if (!el) return
      const ro = new ResizeObserver(sizeWebview)
      ro.observe(el)
      sizeWebview() // initial sizing
      return () => ro.disconnect()
    }, [sizeWebview])

    const mountWebview = useCallback(
      (el: Electron.WebviewTag | null) => {
        if (!el || webviewRef.current === el) return
        webviewRef.current = el
        onWebviewMount(el)
        sizeWebview() // size immediately after mount

        el.addEventListener('dom-ready', async () => {
          onDomReady()
          try {
            await el.executeJavaScript(CONTEXT_MENU_SCRIPT)
          } catch {
            // ignore: page may have restrictions
          }
        })

        el.addEventListener('load-commit', (e: Electron.LoadCommitEvent) => {
          if (e.isMainFrame) {
            onLoadCommit(e.url)
          }
        })

        el.addEventListener('page-title-updated', (e: Electron.PageTitleUpdatedEvent) => {
          onTitleUpdate(e.title)
        })

        el.addEventListener('did-fail-load', (e: Electron.DidFailLoadEvent) => {
          if (e.errorCode !== -3) {
            // -3 is ERR_ABORTED (navigation cancelled), ignore
            onError(`Failed to load: ${e.errorDescription}`)
          }
        })

        el.addEventListener('ipc-message', (e: Electron.IpcMessageEvent) => {
          if (e.channel === 'element-selected') {
            const data = e.args[0] as Omit<ElementSelection, 'sourcePane'>
            onElementSelected({ ...data, sourcePane: paneId })
          }
        })
      },
      [paneId, sizeWebview, onDomReady, onLoadCommit, onTitleUpdate, onError, onWebviewMount, onElementSelected]
    )

    useEffect(() => {
      if (!url || !webviewRef.current || url === currentUrlRef.current) return
      currentUrlRef.current = url
      webviewRef.current.src = url
    }, [url])

    const emptyState = !url

    return (
      <div className={`preview-pane preview-pane--${paneId.toLowerCase()}`}>
        {emptyState ? (
          <div className="preview-pane__empty">
            <EmptyIcon />
            <p>Enter a URL above to load a page</p>
          </div>
        ) : (
          <div ref={viewportRef} className="preview-pane__viewport">
            <webview
              ref={mountWebview as unknown as React.Ref<HTMLElement>}
              className="preview-pane__webview"
              allowpopups={'true' as unknown as boolean}
              partition="persist:preview"
            />
          </div>
        )}
      </div>
    )
  }
)

PreviewPane.displayName = 'PreviewPane'

const EmptyIcon = () => (
  <svg className="preview-pane__empty-icon" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M6 16h36" stroke="currentColor" strokeWidth="2" />
    <circle cx="11" cy="13" r="1.5" fill="currentColor" />
    <circle cx="16" cy="13" r="1.5" fill="currentColor" />
    <circle cx="21" cy="13" r="1.5" fill="currentColor" />
    <path d="M18 28h12M15 33h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
