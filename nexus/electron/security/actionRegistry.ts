/**
 * ACTION REGISTRY
 * ----------------
 * This is the single hard boundary between "things the UI/AI can ask for"
 * and "things Windows will actually do". Nothing outside this list can ever
 * execute, no matter what the renderer, gesture engine, or AI assistant
 * sends over IPC. Every IPC handler must check against this before acting.
 */

export const ALLOWED_APP_ACTIONS = [
  "OPEN_APP",
  "CLOSE_APP",
  "MINIMIZE_APP",
  "MAXIMIZE_APP",
] as const;

export const ALLOWED_SYSTEM_ACTIONS = [
  "VOLUME_UP",
  "VOLUME_DOWN",
  "MUTE",
  "PLAY_PAUSE",
  "NEXT_TRACK",
  "PREVIOUS_TRACK",
  "SCREENSHOT",
  "LOCK_WORKSTATION",
] as const;

export const ALLOWED_WINDOW_ACTIONS = [
  "MINIMIZE_WINDOW",
  "MAXIMIZE_WINDOW",
  "RESTORE_WINDOW",
  "CLOSE_WINDOW",
] as const;

/** Actions that must show a confirm/cancel prompt in the UI before the
 * renderer is even allowed to send the IPC request. Enforced again here
 * as defense in depth. */
export const ACTIONS_REQUIRING_CONFIRMATION: readonly string[] = [
  "LOCK_WORKSTATION",
  "CLOSE_APP",
];

export type AppAction = (typeof ALLOWED_APP_ACTIONS)[number];
export type SystemAction = (typeof ALLOWED_SYSTEM_ACTIONS)[number];
export type WindowAction = (typeof ALLOWED_WINDOW_ACTIONS)[number];

export function isAllowedAppAction(action: string): action is AppAction {
  return (ALLOWED_APP_ACTIONS as readonly string[]).includes(action);
}

export function isAllowedSystemAction(action: string): action is SystemAction {
  return (ALLOWED_SYSTEM_ACTIONS as readonly string[]).includes(action);
}

export function isAllowedWindowAction(action: string): action is WindowAction {
  return (ALLOWED_WINDOW_ACTIONS as readonly string[]).includes(action);
}

/**
 * Application whitelist. This is intentionally NOT a free-form path —
 * the renderer sends an `id`, never a path or executable string, and this
 * registry resolves it server-side (main process). This prevents any
 * possibility of arbitrary command execution via IPC payload injection.
 */
export interface AppDefinition {
  id: string;
  name: string;
  /** Windows executable name resolvable via PATH/App Paths, or a shell
   * verb Electron's `shell.openPath`/`shell.openExternal` can use. */
  executable: string;
  icon: string;
  category: "productivity" | "system" | "browser" | "dev";
}

export const APP_WHITELIST: readonly AppDefinition[] = [
  { id: "chrome", name: "Google Chrome", executable: "chrome.exe", icon: "chrome", category: "browser" },
  { id: "edge", name: "Microsoft Edge", executable: "msedge.exe", icon: "edge", category: "browser" },
  { id: "vscode", name: "Visual Studio Code", executable: "code.exe", icon: "vscode", category: "dev" },
  { id: "explorer", name: "File Explorer", executable: "explorer.exe", icon: "folder", category: "system" },
  { id: "notepad", name: "Notepad", executable: "notepad.exe", icon: "notepad", category: "productivity" },
  { id: "terminal", name: "Windows Terminal", executable: "wt.exe", icon: "terminal", category: "dev" },
  { id: "calculator", name: "Calculator", executable: "calc.exe", icon: "calculator", category: "productivity" },
  { id: "taskmanager", name: "Task Manager", executable: "taskmgr.exe", icon: "activity", category: "system" },
];

export function resolveAppById(id: string): AppDefinition | undefined {
  return APP_WHITELIST.find((entry) => entry.id === id);
}
