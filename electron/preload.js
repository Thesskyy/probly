const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script is executing...");

contextBridge.exposeInMainWorld("electron", {
  invoke: async (channel, data) => {
    console.log("Preload: Invoking channel:", channel, "with data:", data);
    try {
      const result = await ipcRenderer.invoke(channel, data);
      console.log("Preload: Received result:", result);
      return result;
    } catch (error) {
      console.error("Preload: Error during invoke:", error);
      throw error;
    }
  },
  isElectronApp: true,
});
