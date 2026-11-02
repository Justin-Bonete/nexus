// ---------------------------------------------------------------------------
// HAND LANDMARKS
// ---------------------------------------------------------------------------

/** A single MediaPipe hand landmark, normalized [0,1] against the video frame. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** MediaPipe's 21-point hand model, indexed by name for readability. */
export enum LandmarkIndex {
  WRIST = 0,
  THUMB_CMC = 1,
  THUMB_MCP = 2,
  THUMB_IP = 3,
  THUMB_TIP = 4,
  INDEX_MCP = 5,
  INDEX_PIP = 6,
  INDEX_DIP = 7,
  INDEX_TIP = 8,
  MIDDLE_MCP = 9,
  MIDDLE_PIP = 10,
  MIDDLE_DIP = 11,
  MIDDLE_TIP = 12,
  RING_MCP = 13,
  RING_PIP = 14,
  RING_DIP = 15,
  RING_TIP = 16,
  PINKY_MCP = 17,
  PINKY_PIP = 18,
  PINKY_DIP = 19,
  PINKY_TIP = 20,
}

export type HandLandmarks = Landmark[]; // length 21, indexed by LandmarkIndex

export type Handedness = "Left" | "Right";

export interface TrackedHand {
  id: string; // stable per-hand id across frames (for two-hand gestures)
  handedness: Handedness;
  landmarks: HandLandmarks;
  worldLandmarks?: HandLandmarks;
  confidence: number; // 0..1
  timestamp: number; // performance.now() at detection
}

export interface HandTrackingFrame {
  hands: TrackedHand[];
  fps: number;
  frameTimestamp: number;
}

export type TrackingStatus =
  | "idle"
  | "initializing"
  | "active"
  | "hand_lost"
  | "camera_denied"
  | "camera_unavailable"
  | "error";

// ---------------------------------------------------------------------------
// GESTURES
// ---------------------------------------------------------------------------

export type Gesture =
  | "NONE"
  | "OPEN_PALM"
  | "PINCH"
  | "POINT"
  | "FIST"
  | "THUMBS_UP"
  | "THUMBS_DOWN"
  | "SWIPE_LEFT"
  | "SWIPE_RIGHT"
  | "SWIPE_UP"
  | "SWIPE_DOWN"
  | "TWO_HAND_PINCH"
  | "TWO_HAND_MOVE"
  | "TWO_HAND_ROTATE";

export interface GestureEvent {
  gesture: Gesture;
  handId: string;
  confidence: number;
  position: { x: number; y: number }; // normalized screen-space anchor (e.g. index tip)
  velocity?: { x: number; y: number };
  timestamp: number;
}

export interface GestureState {
  current: Gesture;
  stableSince: number | null; // timestamp the current gesture became stable
  lastFired: Gesture | null;
  lastFiredAt: number | null;
  cooldownUntil: number | null;
  history: Gesture[]; // rolling window, most recent last
}

// ---------------------------------------------------------------------------
// APPLICATIONS
// ---------------------------------------------------------------------------

export interface AppDefinition {
  id: string;
  name: string;
  executable: string;
  icon: string;
  category: "productivity" | "system" | "browser" | "dev";
}

export interface AppLaunchResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// COMMANDS
// ---------------------------------------------------------------------------

export type CommandType =
  | "OPEN_APP"
  | "CLOSE_APP"
  | "MINIMIZE_APP"
  | "MAXIMIZE_APP"
  | "VOLUME_UP"
  | "VOLUME_DOWN"
  | "MUTE"
  | "PLAY_PAUSE"
  | "NEXT_TRACK"
  | "PREVIOUS_TRACK"
  | "SCREENSHOT"
  | "LOCK_WORKSTATION"
  | "OPEN_LAUNCHER"
  | "CLOSE_PANEL"
  | "CURSOR_MOVE"
  | "CURSOR_CLICK"
  | "CURSOR_DRAG_START"
  | "CURSOR_DRAG_END"
  | "CONFIRM"
  | "CANCEL"
  | "NAV_PREV_APP"
  | "NAV_NEXT_APP"
  | "SYSTEM_PANEL"
  | "MINIMIZE_INTERFACE";

export interface NexusCommand {
  id: string;
  type: CommandType;
  payload?: unknown;
  requiresConfirmation?: boolean;
  sourceGesture?: Gesture;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// SYSTEM STATUS
// ---------------------------------------------------------------------------

export interface SystemStatus {
  cpu: number;
  ram: number;
  online: boolean;
}

export interface NexusRuntimeStatus {
  system: "online" | "offline";
  handTracking: TrackingStatus;
  gestureEngine: "active" | "idle";
  voice: "ready" | "listening" | "disabled";
  fps: number;
  confidence: number;
  activeApp: string | null;
}

// ---------------------------------------------------------------------------
// IPC MESSAGE CONTRACTS (mirrors electron/preload.ts surface)
// ---------------------------------------------------------------------------

export interface NexusApi {
  apps: {
    list: () => Promise<AppDefinition[]>;
    open: (appId: string) => Promise<AppLaunchResult>;
    close: (appId: string) => Promise<AppLaunchResult>;
    minimize: (appId: string) => Promise<AppLaunchResult>;
    maximize: (appId: string) => Promise<AppLaunchResult>;
  };
  system: {
    volumeUp: () => Promise<{ success: boolean }>;
    volumeDown: () => Promise<{ success: boolean }>;
    mute: () => Promise<{ success: boolean }>;
    playPause: () => Promise<{ success: boolean }>;
    nextTrack: () => Promise<{ success: boolean }>;
    previousTrack: () => Promise<{ success: boolean }>;
    screenshot: () => Promise<{ success: boolean; path?: string }>;
    lockWorkstation: () => Promise<{ success: boolean }>;
    getStatus: () => Promise<SystemStatus>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    restore: () => void;
    close: () => void;
  };
  platform: string;
}

declare global {
  interface Window {
    nexus: NexusApi;
  }
}
