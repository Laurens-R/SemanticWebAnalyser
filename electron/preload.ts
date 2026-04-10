import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  extractDom: (webviewId: number) => ipcRenderer.invoke('extract-dom', webviewId),
  platform: process.platform,
})
