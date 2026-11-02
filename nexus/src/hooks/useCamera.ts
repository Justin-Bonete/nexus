import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackingStatus } from "@/types";

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: TrackingStatus;
  error: string | null;
  restart: () => void;
}

/**
 * Owns the raw webcam MediaStream lifecycle: requests the camera, attaches
 * it to a hidden <video> element (the actual pixel source MediaPipe reads
 * from), and tears the stream down cleanly on unmount so we never leave a
 * camera light on after the user leaves NEXUS.
 */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [restartToken, setRestartToken] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("initializing");
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("camera_unavailable");
        setError("This environment does not expose a camera API.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 60, max: 60 },
            facingMode: "user",
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // If the OS/browser revokes the device mid-session (unplugged,
        // permission revoked), degrade gracefully instead of crashing.
        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          if (!cancelled) {
            setStatus("camera_unavailable");
            setError("Camera stream ended unexpectedly.");
          }
        });

        setStatus("active");
      } catch (err) {
        if (cancelled) return;
        const domError = err as DOMException;
        if (domError.name === "NotAllowedError" || domError.name === "SecurityError") {
          setStatus("camera_denied");
          setError("Camera permission was denied.");
        } else if (domError.name === "NotFoundError") {
          setStatus("camera_unavailable");
          setError("No camera device was found.");
        } else {
          setStatus("error");
          setError(domError.message ?? "Unknown camera error.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [restartToken, stopStream]);

  const restart = useCallback(() => {
    stopStream();
    setRestartToken((t) => t + 1);
  }, [stopStream]);

  return { videoRef, status, error, restart };
}
