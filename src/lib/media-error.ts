import { logAppError } from "@/lib/error-log";

// getUserMedia rejects with a DOMException whose `name` distinguishes why —
// collapsing all of these into one "denied or unavailable" message hides
// which of several very different fixes actually applies (grant a
// permission vs. close another app vs. use a different browser vs. use
// HTTPS). Shared by every mic/camera prompt in the app (VoiceRecorder,
// Settings > Permissions, and the legacy nav-menu permissions panel). Also
// logs to the local error log — see lib/error-log.ts.
export function describeMediaError(err: unknown, kind: "microphone" | "camera"): string {
  const name = err instanceof DOMException ? err.name : "";
  const message = (() => {
    switch (name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return `${kind === "microphone" ? "Microphone" : "Camera"} access is blocked. Enable it for this site in your browser or device settings, then try again.`;
      case "NotFoundError":
      case "DevicesNotFoundError":
        return `No ${kind} was found on this device.`;
      case "NotReadableError":
      case "TrackStartError":
        return `Your ${kind} is already in use by another app. Close it and try again.`;
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return `Couldn't access the ${kind} with this device's settings.`;
      case "SecurityError":
        return `${kind === "microphone" ? "Microphone" : "Camera"} access requires a secure (HTTPS) connection.`;
      case "AbortError":
        return `${kind === "microphone" ? "Microphone" : "Camera"} access was interrupted. Please try again.`;
      default:
        return `Couldn't access the ${kind}. Please try again.`;
    }
  })();
  logAppError(kind === "microphone" ? "Microphone" : "Camera", message);
  return message;
}
