export const SESSION_COOKIE_NAME = "tally_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return secret;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    bytes[i] = byte;
  }
  return bytes;
}

// sessionVersion is embedded so "sign out of all devices" (bumping a user's
// session_version in the DB) invalidates every previously-issued token
// without needing a per-token revocation list — see lib/session-version.ts
// for the edge-safe check that compares this embedded value against the
// current one on every request.
export async function createSessionToken(userId: number, sessionVersion: number): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expires}.${sessionVersion}`;
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export type SessionTokenPayload = { userId: number; sessionVersion: number };

export async function verifySessionToken(token: string | undefined | null): Promise<SessionTokenPayload | null> {
  if (!token) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const signatureHex = token.slice(lastDot + 1);

  const [userIdStr, expiresStr, versionStr] = payload.split(".");
  const userId = Number(userIdStr);
  const expires = Number(expiresStr);
  // Older tokens minted before session_version existed have no third
  // segment — treat them as version 0, matching every user's DB default.
  const sessionVersion = versionStr === undefined ? 0 : Number(versionStr);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!Number.isFinite(expires) || Date.now() > expires) return null;
  if (!Number.isInteger(sessionVersion) || sessionVersion < 0) return null;

  const signatureBytes = fromHex(signatureHex);
  if (!signatureBytes) return null;

  const key = await getKey();
  const ok = await crypto.subtle.verify("HMAC", key, signatureBytes as BufferSource, new TextEncoder().encode(payload));
  return ok ? { userId, sessionVersion } : null;
}
