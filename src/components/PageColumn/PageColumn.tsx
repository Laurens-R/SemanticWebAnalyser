import React from 'react'
import { UrlBar } from '../UrlBar/UrlBar'
import { PreviewPane } from '../PreviewPane/PreviewPane'
import type { PageContext, ElementSelection } from '../../types'
import './PageColumn.scss'

interface PageColumnProps {
  paneId: 'A' | 'B'
  page: PageContext
  onNavigate: (url: string) => void
  onDomReady: () => void
  onLoadCommit: (url: string) => void
  onTitleUpdate: (title: string) => void
  onError: (msg: string) => void
  onWebviewMount: (el: Electron.WebviewTag) => void
  onElementSelected: (selection: ElementSelection) => void
  style?: React.CSSProperties
}

export const PageColumn: React.FC<PageColumnProps> = ({
  paneId,
  page,
  onNavigate,
  onDomReady,
  onLoadCommit,
  onTitleUpdate,
  onError,
  onWebviewMount,
  onElementSelected,
  style,
}) => {
  return (
    <div className={`page-column page-column--${paneId.toLowerCase()}`} style={style}>
      <UrlBar
        paneId={paneId}
        url={page.url}
        loading={page.loading}
        title={page.title}
        onNavigate={onNavigate}
      />
      {page.error && (
        <div className="page-column__error-bar">
          <span>{page.error}</span>
        </div>
      )}
      <PreviewPane
        paneId={paneId}
        url={page.url}
        onDomReady={onDomReady}
        onLoadCommit={onLoadCommit}
        onTitleUpdate={onTitleUpdate}
        onError={onError}
        onWebviewMount={onWebviewMount}
        onElementSelected={onElementSelected}
      />
    </div>
  )
}
