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
    } catch {
      setError("Microphone access was denied or unavailable.");
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
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8">
            <path d="M10 12.5a3 3 0 0 0 3-3v-4a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" />
            <path d="M5.5 9.5a.75.75 0 0 0-1.5 0 6 6 0 0 0 5.25 5.955V17H7a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-2.25v-1.545A6 6 0 0 0 16 9.5a.75.75 0 0 0-1.5 0 4.5 4.5 0 0 1-9 0Z" />
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
