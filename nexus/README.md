# NEXUS

A futuristic, gesture-controlled spatial interface for Windows. Electron +
React + TypeScript + Vite + Tailwind, with MediaPipe Hands for tracking and
React Three Fiber for the holographic visualization layer.

## Status: Phase 1–2 complete

- **Phase 1 — Foundation.** Electron shell with a locked-down
  `BrowserWindow` (`contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`), a secure `preload.ts` bridge exposing only
  `window.nexus.*`, an `actionRegistry.ts` whitelist that is the single
  place any Windows-facing action is allowed to originate from, and Vite +
  React + Tailwind wired end to end.
- **Phase 2 — Webcam access.** `useCamera` hook requests
  `getUserMedia`, handles every documented failure mode (permission
  denied, no device, device unplugged mid-session), and cleans up the
  MediaStream on unmount. The HUD reflects tracking status live.

Everything from Phase 3 onward (MediaPipe landmark tracking, the gesture
engine, the holographic Three.js hand, the virtual cursor, the launcher,
voice control, and the AI layer) builds on top of this shell without
touching the security boundary.

## Run it

```bash
npm install
npm run dev            # starts the Vite dev server on :5173
npm run dev:electron   # in a second terminal — builds electron/ and launches the window
```

For a full local build:

```bash
npm run build:all
npm start
```

## Security model

The renderer (all of `src/`) never talks to Node.js, the filesystem, or a
shell directly. It can only call methods on `window.nexus`, which is a
fixed, typed object exposed via `contextBridge` in `electron/preload.ts`.
Each method maps to an `ipcMain.handle` in `electron/ipc/*.ts`, which in
turn checks the request against `electron/security/actionRegistry.ts`
before doing anything. App launches take an `id`, never a path or command
string — the executable name is resolved server-side from a static
whitelist, so no IPC payload can ever reach a shell as arbitrary text.

## Project layout

See the architecture tree in the original spec — `electron/` for the
main-process/security layer, `src/services/{handTracking,gestureEngine,
appLauncher,voiceControl}` for the domains that land in Phases 3–11, `src/
three/` for the R3F holographic scene, `src/types` for the shared contracts
every layer speaks.
