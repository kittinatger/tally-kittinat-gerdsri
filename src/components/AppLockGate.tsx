"use client";

import { useEffect, useRef, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/language-context";
import PinKeypad from "./PinKeypad";

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="4.5" y="9" width="11" height="8" rx="2" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

// Pages that never need app-lock: unauthenticated ones (a locked-out
// session there would be meaningless) and the public split-share viewer.
// The actual auth boundary is still src/proxy.ts — this is purely about
// where the *lock overlay* should never appear.
const EXEMPT_PREFIXES = ["/welcome", "/login", "/register", "/forgot-password", "/reset-password", "/splits/", "/offline", "/embed/"];

type UnlockMethod = "biometric" | "pin";

// A client-rendered gate mounted above the routed app content, additive to
// (never a replacement for) the server-side cookie session check in
// proxy.ts. Shows a full-screen overlay on first mount and whenever the
// tab returns from being backgrounded, if the signed-in account has app
// lock turned on. Two unlock methods can be configured (WebAuthn and/or a
// 4-8 digit passcode — see AppLockSettingsPanel.tsx); this picks whichever
// one's configured, or lets the user switch if both are. A device with
// neither usable (declined biometric prompt, no passcode set) falls back
// to "sign out and back in" rather than a bypassable local-only check.
export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const exempt = EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  const [checked, setChecked] = useState(exempt);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [pinLength, setPinLength] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [method, setMethod] = useState<UnlockMethod>("biometric");
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  // Seconds the app can sit backgrounded before returning re-locks it — 0
  // (the default) means "immediately", matching the original behavior
  // before this was configurable. See AppLockSettingsPanel.tsx.
  const timeoutSecondsRef = useRef(0);
  // When the tab was last hidden — null means "not currently/recently
  // hidden" (or hasn't been evaluated yet). Read on the next visible
  // transition to decide whether enough inactive time has passed to
  // warrant re-locking.
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (exempt) return;
    let cancelled = false;
    fetch("/api/webauthn/credentials")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.enabled) {
          setAppLockEnabled(true);
          setLocked(true);
          const credsAvailable = Array.isArray(data.credentials) && data.credentials.length > 0;
          setHasCredentials(credsAvailable);
          setHasPasscode(Boolean(data.hasPasscode));
          setPinLength(typeof data.pinLength === "number" ? data.pinLength : null);
          setMethod(credsAvailable ? "biometric" : "pin");
          if (typeof data.timeoutSeconds === "number") timeoutSecondsRef.current = data.timeoutSeconds;
        }
        setChecked(true);
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [exempt]);

  // Re-lock when the tab returns from being backgrounded, but only once it
  // was hidden for at least the configured timeout — this is the actual
  // "app lock" behavior, distinct from the one-time check on load above.
  useEffect(() => {
    if (exempt || !appLockEnabled) return;
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      // visible
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null) return; // first activation — already handled by the mount check above
      const elapsedMs = Date.now() - hiddenAt;
      if (elapsedMs >= timeoutSecondsRef.current * 1000) setLocked(true);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [exempt, appLockEnabled]);

  async function handleUnlockBiometric() {
    setError(null);
    setAuthenticating(true);
    try {
      const optionsRes = await fetch("/api/webauthn/authenticate/options", { method: "POST" });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(options.error ?? t("appLock.gate.failed"));
        return;
      }
      const assertion = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch("/api/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error ?? t("appLock.gate.failed"));
        return;
      }
      setLocked(false);
    } catch {
      setError(t("appLock.gate.failed"));
    } finally {
      setAuthenticating(false);
    }
  }

  async function handleUnlockPin(candidate: string) {
    setError(null);
    setAuthenticating(true);
    try {
      const res = await fetch("/api/applock/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: candidate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("appLock.gate.pinFailed"));
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 350);
        return;
      }
      setPin("");
      setLocked(false);
    } catch {
      setError(t("appLock.gate.pinFailed"));
    } finally {
      setAuthenticating(false);
    }
  }

  if (!checked) return null;
  if (!locked) return <>{children}</>;

  const bothAvailable = hasCredentials && hasPasscode;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-accent/10 text-surface-accent">
          <LockIcon />
        </span>
        <div>
          <p className="font-display text-xl text-foreground">{t("appLock.gate.title")}</p>
          <p className="mt-1 max-w-xs text-sm text-ink-soft">{t("appLock.gate.description")}</p>
        </div>
      </div>

      {method === "biometric" ? (
        <button
          type="button"
          onClick={handleUnlockBiometric}
          disabled={authenticating}
          className="rounded-full bg-surface-accent px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {authenticating ? t("appLock.gate.unlocking") : t("appLock.gate.unlock")}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <PinKeypad
            value={pin}
            onChange={setPin}
            shake={shake}
            length={pinLength}
            onSubmit={(candidate) => {
              if (!authenticating && candidate.length >= (pinLength ?? 4)) handleUnlockPin(candidate);
            }}
          />
          {pinLength === null && (
            <button
              type="button"
              onClick={() => handleUnlockPin(pin)}
              disabled={authenticating || pin.length < 4}
              className="rounded-full bg-surface-accent px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
            >
              {authenticating ? t("appLock.gate.unlocking") : t("appLock.gate.unlock")}
            </button>
          )}
        </div>
      )}

      {bothAvailable && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setPin("");
            setMethod(method === "biometric" ? "pin" : "biometric");
          }}
          className="text-xs font-semibold text-ink-soft underline"
        >
          {method === "biometric" ? t("appLock.gate.usePin") : t("appLock.gate.useBiometric")}
        </button>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.assign("/welcome"))}
            className="text-xs font-semibold text-ink-soft underline"
          >
            {t("appLock.gate.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
