import { ipcMain } from "electron";
import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveAppById, APP_WHITELIST } from "../security/actionRegistry";

const execAsync = promisify(exec);

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Launches a whitelisted app by ID. We NEVER take a path or command string
 * from the renderer — only an `id`, which we resolve server-side against
 * APP_WHITELIST. This makes arbitrary command injection structurally
 * impossible: whatever the renderer sends, only a known executable name
 * from the registry can ever reach the shell.
 */
async function launchApp(appId: string): Promise<ActionResult> {
  const app = resolveAppById(appId);
  if (!app) {
    return { success: false, error: `Unknown app id: ${appId}` };
  }

  try {
    // `start` resolves via Windows App Paths / PATH, matching how the
    // Start Menu and `Win+R` launch things — no shell metacharacters from
    // user input are ever interpolated here since `app.executable` comes
    // only from our static whitelist, never from the IPC payload.
    await execAsync(`start "" "${app.executable}"`, { windowsHide: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

async function closeApp(appId: string): Promise<ActionResult> {
  const app = resolveAppById(appId);
  if (!app) {
    return { success: false, error: `Unknown app id: ${appId}` };
  }

  try {
    const processName = app.executable;
    await promisify(execFile)("taskkill", ["/IM", processName, "/F"]);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export function registerAppControlHandlers(): void {
  ipcMain.handle("apps:list", () => {
    return APP_WHITELIST;
  });

  ipcMain.handle("apps:open", (_event, appId: unknown) => {
    if (typeof appId !== "string") return { success: false, error: "Invalid app id" };
    return launchApp(appId);
  });

  ipcMain.handle("apps:close", (_event, appId: unknown) => {
    if (typeof appId !== "string") return { success: false, error: "Invalid app id" };
    return closeApp(appId);
  });

  ipcMain.handle("apps:minimize", (_event, appId: unknown) => {
    if (typeof appId !== "string") return { success: false, error: "Invalid app id" };
    // Per-application window minimize requires a native window-management
    // dependency (e.g. a Win32 addon) beyond Node's stdlib. Wire this up
    // in Phase 7's native-integration pass; stubbed for now so IPC stays
    // fully wired end to end.
    return { success: false, error: "Not yet implemented" };
  });

  ipcMain.handle("apps:maximize", (_event, appId: unknown) => {
    if (typeof appId !== "string") return { success: false, error: "Invalid app id" };
    return { success: false, error: "Not yet implemented" };
  });
}
