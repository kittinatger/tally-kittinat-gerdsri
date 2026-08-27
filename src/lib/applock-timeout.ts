// Shared between the settings UI (AppLockSettingsPanel.tsx) and the API
// route that validates/persists it (api/webauthn/credentials/route.ts) —
// a fixed allowlist rather than a free-form number input, since arbitrary
// values wouldn't map to a translated label anywhere.
export const APPLOCK_TIMEOUT_OPTIONS = [
  { seconds: 0, labelKey: "appLock.timeout.immediately" },
  { seconds: 60, labelKey: "appLock.timeout.1min" },
  { seconds: 5 * 60, labelKey: "appLock.timeout.5min" },
  { seconds: 15 * 60, labelKey: "appLock.timeout.15min" },
  { seconds: 60 * 60, labelKey: "appLock.timeout.1hour" },
] as const;

export type AppLockTimeoutLabelKey = (typeof APPLOCK_TIMEOUT_OPTIONS)[number]["labelKey"];
