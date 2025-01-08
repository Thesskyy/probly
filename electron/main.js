const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const { handleLLMRequest } = require("./api");
require("dotenv").config();

// Instead of using electron-is-dev, we'll check the environment directly
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Disable GPU acceleration to avoid Vulkan errors
app.disableHardwareAcceleration();

// Add command line switches for GPU-related issues
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-gpu-rasterization");

let mainWindow;

function createFileDialogOptions(type = "open") {
  const baseOptions = {
    filters: [{ name: "Spreadsheets", extensions: ["xlsx", "xls", "csv"] }],
    properties: type === "open" ? ["openFile"] : ["saveFile"],
    title: type === "open" ? "Open Spreadsheet" : "Save Spreadsheet",
    buttonLabel: type === "open" ? "Open" : "Save",
    securityScopedBookmarks: true,
  };

  if (process.platform === "linux") {
    baseOptions.properties.push("dontAddToRecent");
  }

  return baseOptions;
}

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");

  console.log("Preload script path:", preloadPath);
  console.log("current directory (__dirname):", __dirname);
  console.log("File exists:", fs.existsSync(preloadPath));
  console.log("Directory contents:", fs.readdirSync(__dirname));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#ffffff",
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false,
      offscreen: false,
      accelerator: false,
      enableWebGL: false,
      webgl: false,
      disableHardwareAcceleration: true,
    },
  });

  // Show window when ready to avoid flashing
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Import",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            try {
              const result = await dialog.showOpenDialog(
                mainWindow,
                createFileDialogOptions("open"),
              );
              if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send(
                  "file-imported",
                  result.filePaths[0],
                );
              }
            } catch (error) {
              console.error("Error showing import dialog:", error);
            }
          },
        },
        {
          label: "Export",
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            try {
              const result = await dialog.showSaveDialog(
                mainWindow,
                createFileDialogOptions("save"),
              );
              if (!result.canceled && result.filePath) {
                mainWindow.webContents.send("file-exported", result.filePath);
              }
            } catch (error) {
              console.error("Error showing export dialog:", error);
            }
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

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

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    // Check if file exists before trying to read it
    await fsPromises.access(filePath, fs.constants.R_OK);
    const buffer = await fsPromises.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error("Error reading file:", error);
    if (error.code === "ENOENT") {
      throw new Error("File not found");
    } else if (error.code === "EACCES") {
      throw new Error("Permission denied");
    }
    throw error;
  }
});

ipcMain.handle("minimize-window", () => {
  mainWindow?.minimize();
});

ipcMain.handle("maximize-window", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle("close-window", () => {
  mainWindow?.close();
});

// File dialog handlers
ipcMain.handle("show-open-dialog", async () => {
  try {
    return await dialog.showOpenDialog(
      mainWindow,
      createFileDialogOptions("open"),
    );
  } catch (error) {
    console.error("Error showing open dialog:", error);
    throw error;
  }
});

ipcMain.handle("show-save-dialog", async () => {
  try {
    return await dialog.showSaveDialog(
      mainWindow,
      createFileDialogOptions("save"),
    );
  } catch (error) {
    console.error("Error showing save dialog:", error);
    throw error;
  }
});

// Additional error handling for IPC
ipcMain.on("error", (event, error) => {
  console.error("IPC Error:", error);
});
