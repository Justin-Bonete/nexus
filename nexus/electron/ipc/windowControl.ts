import { ipcMain, BrowserWindow } from "electron";

export function registerWindowControlHandlers(mainWindow: BrowserWindow): void {
  ipcMain.on("window:minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on("window:restore", () => {
    mainWindow.unmaximize();
  });

  ipcMain.on("window:close", () => {
    mainWindow.close();
  });
}
