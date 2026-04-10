export interface PageContext {
  url: string
  title: string
  dom: string | null
  loading: boolean
  error: string | null
}

export type MatchRelationship = 'equivalent' | 'similar' | 'one-sided'

export interface AnalysisMatch {
  id: string
  labelA: string
  selectorA: string | null
  labelB: string
  selectorB: string | null
  relationship: MatchRelationship
  explanation: string
}

export interface StructuredResponse {
  summary: string
  matches: AnalysisMatch[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string           // plain text label / user message
  structured?: StructuredResponse   // present on assistant messages
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
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  windowIsMaximized: () => Promise<boolean>
  openDevTools: () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
