"use client";

import { useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/language-context";

// Pages that never need app-lock: unauthenticated ones (a locked-out
// session there would be meaningless) and the public split-share viewer.
// The actual auth boundary is still src/proxy.ts — this is purely about
// where the *lock overlay* should never appear.
const EXEMPT_PREFIXES = ["/welcome", "/login", "/register", "/forgot-password", "/reset-password", "/splits/", "/offline"];

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
  const [locked, setLocked] = useState(false);
  const [method, setMethod] = useState<UnlockMethod>("biometric");
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");

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
          setMethod(credsAvailable ? "biometric" : "pin");
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

  // Re-lock whenever the tab comes back from being backgrounded — this is
  // the actual "app lock" behavior, distinct from the one-time check on
  // load above.
  useEffect(() => {
    if (exempt || !appLockEnabled) return;
    function onVisibilityChange() {
      if (document.visibilityState === "visible") setLocked(true);
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

  async function handleUnlockPin() {
    setError(null);
    setAuthenticating(true);
    try {
      const res = await fetch("/api/applock/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("appLock.gate.pinFailed"));
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="font-display text-xl text-foreground">{t("appLock.gate.title")}</p>
      <p className="max-w-xs text-sm text-ink-soft">{t("appLock.gate.description")}</p>

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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUnlockPin();
          }}
          className="flex w-full max-w-[220px] flex-col items-center gap-3"
        >
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            autoComplete="off"
            autoFocus
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={t("appLock.gate.pinPlaceholder")}
            className="w-full rounded-input border border-line bg-surface px-3 py-2.5 text-center text-lg tracking-[0.4em] text-foreground outline-none focus:border-surface-accent"
          />
          <button
            type="submit"
            disabled={authenticating || pin.length < 4}
            className="w-full rounded-full bg-surface-accent px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            {authenticating ? t("appLock.gate.unlocking") : t("appLock.gate.unlock")}
          </button>
        </form>
      )}

      {bothAvailable && (
        <button
          type="button"
          onClick={() => {
            setError(null);
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
