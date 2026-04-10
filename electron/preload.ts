import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  extractDom: (webviewId: number) => ipcRenderer.invoke('extract-dom', webviewId),
  platform: process.platform,
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  openDevTools: () => ipcRenderer.send('open-devtools'),
})
