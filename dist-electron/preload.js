let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	extractDom: (webviewId) => electron.ipcRenderer.invoke("extract-dom", webviewId),
	platform: process.platform
});
//#endregion

//# sourceMappingURL=preload.js.map