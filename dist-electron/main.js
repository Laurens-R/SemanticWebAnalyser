let electron = require("electron");
let path = require("path");
//#region electron/main.ts
var win;
var RENDERER_URL = process.env["ELECTRON_RENDERER_URL"];
function createWindow() {
	win = new electron.BrowserWindow({
		width: 1600,
		height: 1e3,
		minWidth: 1100,
		minHeight: 700,
		backgroundColor: "#f8f9fa",
		titleBarStyle: "hiddenInset",
		webPreferences: {
			preload: (0, path.join)(__dirname, "../preload/index.js"),
			nodeIntegration: false,
			contextIsolation: true,
			webviewTag: true
		}
	});
	electron.session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
		callback(true);
	});
	if (RENDERER_URL) win.loadURL(RENDERER_URL);
	else win.loadFile((0, path.join)(__dirname, "../renderer/index.html"));
}
electron.ipcMain.handle("extract-dom", async (_event, _webviewId) => {
	return null;
});
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
		win = null;
	}
});
electron.app.on("activate", () => {
	if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
electron.app.whenReady().then(createWindow);
//#endregion

//# sourceMappingURL=main.js.map