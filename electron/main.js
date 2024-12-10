const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { handleLLMRequest } = require("./api");
require("dotenv").config();

// Instead of using electron-is-dev, we'll check the environment directly
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Disable GPU acceleration to avoid Vulkan errors
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");

  console.log("Preload script path:", preloadPath);
  console.log("current directory (__dirname):", __dirname);
  console.log("File exists:", fs.existsSync(preloadPath));
  console.log("Direcory contents:", fs.readdirSync(__dirname));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false,
    },
    backgroundColor: "#ffffff",
    show: false,
  });

  // Show window when ready to avoid flashing
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    console.log("Loading development URL...");
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    console.log("Loading production build...");
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Handle errors globally
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle("test-connection", async (event, data) => {
  console.log("Test connection received:", data);
  return { success: true, message: "Connection working!" };
});

ipcMain.handle("llm-request", async (event, { message, spreadsheetData }) => {
  console.log("LLM request received:", { message, spreadsheetData });
  try {
    const result = await handleLLMRequest(message, spreadsheetData);
    console.log("LLM result:", result);
    return result;
  } catch (error) {
    console.error("LLM request error:", error);
    throw error;
  }
});
