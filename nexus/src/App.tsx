import { useCamera } from "@/hooks/useCamera";
import { HudStatusPanel } from "@/components/HudStatusPanel";

function CenterMessage({ status }: { status: ReturnType<typeof useCamera>["status"] }) {
  if (status === "active") {
    return (
      <div className="text-center animate-drift">
        <div className="font-display text-2xl tracking-[0.4em] text-nexus-cyan text-glow">
          NEXUS READY
        </div>
        <div className="font-mono text-xs tracking-[0.3em] text-slate-500 mt-2">
          SHOW YOUR HAND
        </div>
      </div>
    );
  }

  if (status === "initializing") {
    return (
      <div className="text-center">
        <div className="font-display text-xl tracking-[0.3em] text-nexus-amber animate-pulseGlow">
          INITIALIZING CAMERA
        </div>
      </div>
    );
  }

  if (status === "camera_denied") {
    return (
      <div className="text-center max-w-md">
        <div className="font-display text-xl tracking-[0.3em] text-nexus-danger">
          CAMERA ACCESS DENIED
        </div>
        <div className="font-mono text-xs text-slate-500 mt-3">
          NEXUS needs webcam access to track your hands. Grant camera
          permission and restart tracking.
        </div>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md">
      <div className="font-display text-xl tracking-[0.3em] text-nexus-danger">
        CAMERA UNAVAILABLE
      </div>
      <div className="font-mono text-xs text-slate-500 mt-3">
        No compatible camera device was detected.
      </div>
    </div>
  );
}

export default function App() {
  const { videoRef, status, error, restart } = useCamera();

  return (
    <div className="relative w-screen h-screen grid-bg overflow-hidden select-none">
      {/* Draggable custom title bar region for the frameless window */}
      <div className="absolute top-0 left-0 right-0 h-10 [-webkit-app-region:drag] z-20" />

      {/* Hidden raw video element — the actual pixel source for MediaPipe
          in later phases. Never shown directly per spec section 5. */}
      <video ref={videoRef} className="hidden" muted playsInline />

      <div className="absolute top-6 left-6 z-10">
        <HudStatusPanel trackingStatus={status} cameraError={error} />
      </div>

      <div className="w-full h-full flex items-center justify-center">
        <CenterMessage status={status} />
      </div>

      {(status === "camera_denied" || status === "camera_unavailable" || status === "error") && (
        <button
          onClick={restart}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 font-mono text-xs tracking-widest px-4 py-2 rounded border border-nexus-cyan/40 text-nexus-cyan hover:bg-nexus-cyan/10 transition-colors [-webkit-app-region:no-drag]"
        >
          RETRY CAMERA
        </button>
      )}
    </div>
  );
}
