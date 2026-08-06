"use client";

import { useEffect, useRef, useState } from "react";

const MIME_CANDIDATES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const candidate of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "";
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// getUserMedia rejects with a DOMException whose `name` distinguishes why —
// collapsing all of these into one "denied or unavailable" message hides
// which of several very different fixes actually applies (grant a
// permission vs. close another app vs. use a different browser).
function describeMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Microphone access is blocked. Enable it for this site in your browser or device settings, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone was found on this device.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your microphone is already in use by another app. Close it and try again.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "Couldn't access the microphone with this device's settings.";
    case "SecurityError":
      return "Microphone access requires a secure (HTTPS) connection.";
    case "AbortError":
      return "Microphone access was interrupted. Please try again.";
    default:
      return "Couldn't access the microphone. Please try again.";
  }
}

export default function VoiceRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (blob: Blob, mimeType: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser doesn't support microphone recording.");
      return;
    }
    const mimeType = pickMimeType();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        onRecorded(blob, blob.type);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      setError(describeMicError(err));
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        aria-pressed={recording}
        className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-soft transition disabled:opacity-40 ${
          recording ? "animate-pulse bg-red-600 hover:bg-red-700" : "bg-navy hover:bg-navy-dark"
        }`}
      >
        {recording ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
            <rect x="5" y="5" width="10" height="10" rx="1.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 17.959 28.4668" fill="currentColor" className="h-8 w-8">
            <path d="M8.79883 17.3926C11.2793 17.3926 12.9199 15.5371 12.9199 12.9102L12.9199 4.48242C12.9199 1.86523 11.2793 0 8.79883 0C6.32812 0 4.67773 1.86523 4.67773 4.48242L4.67773 12.9102C4.67773 15.5371 6.32812 17.3926 8.79883 17.3926ZM8.79883 21.7969C14.0625 21.7969 17.5977 18.2715 17.5977 13.1934L17.5977 10.6934C17.5977 10.2441 17.2363 9.88281 16.7871 9.88281C16.3281 9.88281 15.9668 10.2441 15.9668 10.6934L15.9668 13.1348C15.9668 17.3926 13.1445 20.2734 8.79883 20.2734C4.45312 20.2734 1.63086 17.3926 1.63086 13.1348L1.63086 10.6934C1.63086 10.2441 1.26953 9.88281 0.820312 9.88281C0.361328 9.88281 0 10.2441 0 10.6934L0 13.1934C0 18.2715 3.54492 21.7969 8.79883 21.7969ZM3.17383 26.6602L14.4336 26.6602C14.8828 26.6602 15.2441 26.2891 15.2441 25.8398C15.2441 25.3906 14.8828 25.0293 14.4336 25.0293L3.17383 25.0293C2.71484 25.0293 2.35352 25.3906 2.35352 25.8398C2.35352 26.2891 2.71484 26.6602 3.17383 26.6602ZM8.79883 26.2891C9.25781 26.2891 9.61914 25.9277 9.61914 25.4785L9.61914 21.4062C9.61914 20.957 9.25781 20.5859 8.79883 20.5859C8.34961 20.5859 7.98828 20.957 7.98828 21.4062L7.98828 25.4785C7.98828 25.9277 8.34961 26.2891 8.79883 26.2891Z" />
          </svg>
        )}
      </button>
      <div>
        <p className="text-sm font-semibold text-surface-foreground">
          {recording ? `Recording… ${formatElapsed(seconds)}` : "Tap to record a transaction"}
        </p>
        <p className="mt-1 text-xs text-surface-foreground-soft">
          {recording
            ? "Tap again to stop and analyze."
            : `Say something like "spent 12 dollars on coffee at Starbucks today"`}
        </p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
