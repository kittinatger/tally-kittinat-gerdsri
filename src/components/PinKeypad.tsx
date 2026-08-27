"use client";

// A tappable numeric keypad + dot progress indicator for entering a 4-8
// digit passcode — used by AppLockGate's unlock screen. The passcode's
// exact length isn't known in advance (it can be 4-8 digits, see
// AppLockSettingsPanel.tsx), so the dots grow with what's been typed
// rather than showing a fixed number of empty slots to fill.

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
  shake = false,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Briefly nudges the dots — the caller sets this after a rejected
   * passcode so the "wrong" feels tactile, not just a text error. */
  shake?: boolean;
}) {
  function press(digit: string) {
    if (value.length >= MAX_LENGTH) return;
    onChange(value + digit);
  }

  function backspace() {
    onChange(value.slice(0, -1));
  }

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
