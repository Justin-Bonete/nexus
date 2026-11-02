import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { registerAppControlHandlers } from "./ipc/appControl";
import { registerSystemControlHandlers } from "./ipc/systemControl";
import { registerWindowControlHandlers } from "./ipc/windowControl";

const isDev = !app.isPackaged;
const DEV_SERVER_URL = "http://localhost:5173";

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#04060a",
    frame: false, // NEXUS renders its own custom HUD chrome
    show: false,
    webPreferences: {
      // --- Security: never relax these ---
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Prevent the renderer from navigating anywhere or opening new windows —
  // this is a controlled desktop app, not a browser shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => undefined);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith(DEV_SERVER_URL)) return;
    event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  if (!mainWindow) return;
  registerAppControlHandlers();
  registerSystemControlHandlers();
  registerWindowControlHandlers(mainWindow);
}

app.whenReady().then(() => {
  createMainWindow();
  registerIpcHandlers();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      registerIpcHandlers();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Camera permission handling (Windows prompts occur at the OS level for
// getUserMedia, but we also gate Electron's own permission checks here).
app.on("web-contents-created", (_event, contents) => {
  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = permission === "media";
    callback(allowed);
  });
});
