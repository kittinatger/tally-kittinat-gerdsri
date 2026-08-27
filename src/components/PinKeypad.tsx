"use client";

import { useEffect, useRef } from "react";

// A tappable numeric keypad + dot progress indicator for entering a 4-8
// digit passcode — used by AppLockGate's unlock screen. The passcode's
// exact length isn't known in advance (it can be 4-8 digits, see
// AppLockSettingsPanel.tsx), so the dots grow with what's been typed
// rather than showing a fixed number of empty slots to fill. Also listens
// for a physical keyboard (digit keys, Backspace, Enter) — this is the
// unlock screen for the whole app, so it has to work on desktop too, not
// just via tapping.

const MAX_LENGTH = 8;

function BackspaceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M7.5 4.5h8A1.5 1.5 0 0 1 17 6v8a1.5 1.5 0 0 1-1.5 1.5h-8L2.5 10Z" />
      <path d="M8.5 7.5l4 5M12.5 7.5l-4 5" />
    </svg>
  );
}

export default function PinKeypad({
  value,
  onChange,
  onSubmit,
  shake = false,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Enter/Return on the keyboard — the caller decides whether the current
   * value is submittable (e.g. long enough) and what to do with it. */
  onSubmit?: () => void;
  /** Briefly nudges the dots — the caller sets this after a rejected
   * passcode so the "wrong" feels tactile, not just a text error. */
  shake?: boolean;
}) {
  // Tracks the current value synchronously, ahead of React's next render —
  // two keystrokes (very plausible when actually typing, not just tapping)
  // can both fire before a re-render commits, and both handlers reading
  // the same stale `value` prop would silently drop one of them (each
  // computing `value + digit` from the same starting point instead of
  // stacking). Every mutation below updates this ref immediately, so the
  // next keystroke — even one fired microseconds later — always builds on
  // the true current value.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function press(digit: string) {
    if (valueRef.current.length >= MAX_LENGTH) return;
    valueRef.current = valueRef.current + digit;
    onChange(valueRef.current);
  }

  function backspace() {
    valueRef.current = valueRef.current.slice(0, -1);
    onChange(valueRef.current);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore typing while focus is in a real text field elsewhere on the
      // page (shouldn't normally happen on the lock screen, but this is
      // a global window listener, so it's a cheap guard against stealing
      // keystrokes from some other input).
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        press(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // press/backspace read from valueRef (always current), not the `value`
    // prop, so they don't need to be in this dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSubmit]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`flex items-center gap-2.5 ${shake ? "animate-[pin-shake_0.35s_ease-in-out]" : ""}`}>
        {value.length === 0 ? (
          <span className="h-3 w-3 rounded-full border border-line" />
        ) : (
          Array.from({ length: value.length }).map((_, i) => (
            <span key={i} className="h-3 w-3 rounded-full bg-surface-accent" />
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-x-5 gap-y-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-xl font-medium text-foreground transition active:scale-95 active:bg-[var(--nav-hover-bg)]"
          >
            {d}
          </button>
        ))}
        <span aria-hidden="true" />
        <button
          type="button"
          onClick={() => press("0")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-xl font-medium text-foreground transition active:scale-95 active:bg-[var(--nav-hover-bg)]"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={value.length === 0}
          aria-label="Backspace"
          className="flex h-14 w-14 items-center justify-center rounded-full text-ink-soft transition active:scale-95 disabled:opacity-30"
        >
          <BackspaceIcon />
        </button>
      </div>
    </div>
  );
}
