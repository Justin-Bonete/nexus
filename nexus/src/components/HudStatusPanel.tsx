import type { TrackingStatus } from "@/types";

interface HudStatusPanelProps {
  trackingStatus: TrackingStatus;
  cameraError: string | null;
}

const TRACKING_LABEL: Record<TrackingStatus, string> = {
  idle: "IDLE",
  initializing: "INITIALIZING",
  active: "ACTIVE",
  hand_lost: "SEARCHING",
  camera_denied: "PERMISSION DENIED",
  camera_unavailable: "UNAVAILABLE",
  error: "ERROR",
};

function StatusRow({ label, value, tone = "cyan" }: { label: string; value: string; tone?: "cyan" | "success" | "danger" | "amber" }) {
  const toneClass = {
    cyan: "text-nexus-cyan",
    success: "text-nexus-success",
    danger: "text-nexus-danger",
    amber: "text-nexus-amber",
  }[tone];

  return (
    <div className="flex items-center justify-between font-mono text-xs tracking-widest">
      <span className="text-slate-400">{label}</span>
      <span className={toneClass}>{value}</span>
    </div>
  );
}

export function HudStatusPanel({ trackingStatus, cameraError }: HudStatusPanelProps) {
  const isHealthy = trackingStatus === "active";
  const tone = isHealthy ? "success" : trackingStatus === "initializing" ? "amber" : "danger";

  return (
    <div className="panel-glass rounded-lg px-5 py-4 w-72 shadow-glow">
      <div className="font-display text-nexus-cyan text-glow text-sm tracking-[0.3em] mb-3">
        NEXUS CORE
      </div>
      <div className="space-y-2">
        <StatusRow label="SYSTEM" value="ONLINE" tone="success" />
        <StatusRow label="HAND TRACK" value={TRACKING_LABEL[trackingStatus]} tone={tone} />
        <StatusRow label="GESTURE" value="PENDING" tone="amber" />
        <StatusRow label="VOICE" value="DISABLED" tone="amber" />
      </div>
      {cameraError && (
        <div className="mt-3 pt-3 border-t border-nexus-cyan/10 text-[11px] font-mono text-nexus-danger">
          {cameraError}
        </div>
      )}
    </div>
  );
}
