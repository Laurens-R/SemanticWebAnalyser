import { app, BrowserWindow, ipcMain, session, Menu } from 'electron'
import { join } from 'path'

let win: BrowserWindow | null

// Set by electron-vite in dev mode; undefined in production
const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']

function createWindow() {
  // Hide the native application menu entirely
  Menu.setApplicationMenu(null)

  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f8f9fa',
    frame: false,          // remove native title bar + frame
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  })

  // Allow webviews to load any URL
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true)
  })

  if (RENDERER_URL) {
    win.loadURL(RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Window control IPC
ipcMain.on('window-minimize', () => win?.minimize())
ipcMain.on('window-maximize', () => {
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})
ipcMain.on('window-close', () => win?.close())
ipcMain.handle('window-is-maximized', () => win?.isMaximized() ?? false)

// Open DevTools for the main renderer window
ipcMain.on('open-devtools', () => {
  win?.webContents.openDevTools({ mode: 'detach' })
})

// Handle DOM extraction from webview
ipcMain.handle('extract-dom', async (_event, _webviewId: number) => {
  return null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
