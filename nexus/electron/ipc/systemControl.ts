import { ipcMain, desktopCapturer, screen } from "electron";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);

/**
 * Media/volume keys are sent via a tiny PowerShell SendKeys call — this is
 * the standard, dependency-free way to simulate hardware media keys on
 * Windows without shelling out to arbitrary commands. The PowerShell
 * script text below is a fixed constant per action; nothing from the
 * renderer is ever interpolated into it.
 */
async function sendMediaKey(virtualKeyCode: number): Promise<void> {
  const script = `
    Add-Type -TypeDefinition '
      using System;
      using System.Runtime.InteropServices;
      public class NexusKeys {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
      }
    ';
    [NexusKeys]::keybd_event(${virtualKeyCode}, 0, 0, [UIntPtr]::Zero);
    Start-Sleep -Milliseconds 50;
    [NexusKeys]::keybd_event(${virtualKeyCode}, 0, 2, [UIntPtr]::Zero);
  `;
  await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, {
    windowsHide: true,
  });
}

// Standard Windows virtual key codes for media control.
const VK_VOLUME_MUTE = 0xad;
const VK_VOLUME_DOWN = 0xae;
const VK_VOLUME_UP = 0xaf;
const VK_MEDIA_NEXT_TRACK = 0xb0;
const VK_MEDIA_PREV_TRACK = 0xb1;
const VK_MEDIA_PLAY_PAUSE = 0xb3;

async function takeScreenshot(): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: primaryDisplay.size.width,
        height: primaryDisplay.size.height,
      },
    });

    const primarySource = sources[0];
    if (!primarySource) {
      return { success: false, error: "No screen source available" };
    }

    const png = primarySource.thumbnail.toPNG();
    const outDir = path.join(os.homedir(), "Pictures", "NEXUS Screenshots");
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, `nexus-${Date.now()}.png`);
    await fs.writeFile(filePath, png);

    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

async function lockWorkstation(): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync("rundll32.exe user32.dll,LockWorkStation", { windowsHide: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

async function getSystemStatus(): Promise<{ cpu: number; ram: number; online: boolean }> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  // Rough instantaneous CPU load sample from the idle/total tick ratio.
  const cpuLoad =
    cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + (1 - idle / total);
    }, 0) / cpus.length;

  return {
    cpu: Math.round(cpuLoad * 100),
    ram: Math.round(((totalMem - freeMem) / totalMem) * 100),
    online: true,
  };
}

export function registerSystemControlHandlers(): void {
  ipcMain.handle("system:volumeUp", async () => {
    await sendMediaKey(VK_VOLUME_UP);
    return { success: true };
  });

  ipcMain.handle("system:volumeDown", async () => {
    await sendMediaKey(VK_VOLUME_DOWN);
    return { success: true };
  });

  ipcMain.handle("system:mute", async () => {
    await sendMediaKey(VK_VOLUME_MUTE);
    return { success: true };
  });

  ipcMain.handle("system:playPause", async () => {
    await sendMediaKey(VK_MEDIA_PLAY_PAUSE);
    return { success: true };
  });

  ipcMain.handle("system:nextTrack", async () => {
    await sendMediaKey(VK_MEDIA_NEXT_TRACK);
    return { success: true };
  });

  ipcMain.handle("system:previousTrack", async () => {
    await sendMediaKey(VK_MEDIA_PREV_TRACK);
    return { success: true };
  });

  ipcMain.handle("system:screenshot", () => takeScreenshot());

  ipcMain.handle("system:lockWorkstation", () => lockWorkstation());

  ipcMain.handle("system:getStatus", () => getSystemStatus());
}
