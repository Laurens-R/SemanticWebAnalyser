export interface PageContext {
  url: string
  title: string
  dom: string | null
  loading: boolean
  error: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AnalysisSession {
  pageA: PageContext
  pageB: PageContext
  domSubmitted: boolean
  messages: ChatMessage[]
}

export interface ElementSelection {
  sourcePane: 'A' | 'B'
  tagName: string
  outerHTML: string
  textContent: string
  className: string
  id: string
}

export interface DomExtractionResult {
  title: string
  dom: string
}

// Electron API exposed via preload
export interface ElectronAPI {
  extractDom: (webviewId: number) => Promise<null>
  platform: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
