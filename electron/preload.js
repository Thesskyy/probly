const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  invoke: async (channel, data) => {
    const validChannels = [
      "minimize-window",
      "maximize-window",
      "close-window",
      "read-file",
      "test-connection",
      "llm-request",
      "show-open-dialog",
      "show-save-dialog",
    ];

    if (validChannels.includes(channel)) {
      try {
        const result = await ipcRenderer.invoke(channel, data);
        return result;
      } catch (error) {
        console.error("Preload: Error during invoke:", error);
        throw error;
      }
    }
  },
  isElectronApp: true,
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),
  showSaveDialog: () => ipcRenderer.invoke("show-save-dialog"),
  onFileImported: (callback) =>
    ipcRenderer.on("file-imported", (_, path) => callback(path)),
  onFileExported: (callback) =>
    ipcRenderer.on("file-exported", (_, path) => callback(path)),
  on: (channel, callback) => {
    const validChannels = [
      "file-imported",
      "file-exported",
      "menu:import",
      "menu:export",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },
  removeListener: (channel, callback) => {
    const validChannels = [
      "file-imported",
      "file-exported",
      "menu:import",
      "menu:export",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
  removeAllListeners: (channel) => {
    const validChannels = [
      "file-imported",
      "file-exported",
      "menu:import",
      "menu:export",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});
