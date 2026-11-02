import { contextBridge, ipcRenderer } from "electron";
import type { AppDefinition } from "./security/actionRegistry";

/**
 * This is the ENTIRE surface area exposed to the renderer. No `fs`, no
 * `child_process`, no `shell`, no raw `ipcRenderer` — only these narrow,
 * purpose-built methods. Every one of them maps 1:1 to a whitelisted
 * action checked again on the main-process side.
 */
const nexusApi = {
  apps: {
    list: (): Promise<AppDefinition[]> => ipcRenderer.invoke("apps:list"),
    open: (appId: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("apps:open", appId),
    close: (appId: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("apps:close", appId),
    minimize: (appId: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("apps:minimize", appId),
    maximize: (appId: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("apps:maximize", appId),
  },
  system: {
    volumeUp: (): Promise<{ success: boolean }> => ipcRenderer.invoke("system:volumeUp"),
    volumeDown: (): Promise<{ success: boolean }> => ipcRenderer.invoke("system:volumeDown"),
    mute: (): Promise<{ success: boolean }> => ipcRenderer.invoke("system:mute"),
    playPause: (): Promise<{ success: boolean }> => ipcRenderer.invoke("system:playPause"),
    nextTrack: (): Promise<{ success: boolean }> => ipcRenderer.invoke("system:nextTrack"),
    previousTrack: (): Promise<{ success: boolean }> => ipcRenderer.invoke("system:previousTrack"),
    screenshot: (): Promise<{ success: boolean; path?: string }> =>
      ipcRenderer.invoke("system:screenshot"),
    lockWorkstation: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("system:lockWorkstation"),
    getStatus: (): Promise<{ cpu: number; ram: number; online: boolean }> =>
      ipcRenderer.invoke("system:getStatus"),
  },
  window: {
    minimize: (): void => ipcRenderer.send("window:minimize"),
    maximize: (): void => ipcRenderer.send("window:maximize"),
    restore: (): void => ipcRenderer.send("window:restore"),
    close: (): void => ipcRenderer.send("window:close"),
  },
  platform: process.platform,
};

contextBridge.exposeInMainWorld("nexus", nexusApi);

export type NexusApi = typeof nexusApi;
