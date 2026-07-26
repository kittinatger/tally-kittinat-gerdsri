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

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const signatureHex = token.slice(dotIndex + 1);

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const signatureBytes = fromHex(signatureHex);
  if (!signatureBytes) return false;

  const key = await getKey();
  return crypto.subtle.verify("HMAC", key, signatureBytes as BufferSource, new TextEncoder().encode(payload));
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error("APP_PASSWORD environment variable is not set.");
  }
  const key = await getKey();
  const [candidateSig, expectedSig] = await Promise.all([
    crypto.subtle.sign("HMAC", key, new TextEncoder().encode(candidate)),
    crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expected)),
  ]);
  const a = new Uint8Array(candidateSig);
  const b = new Uint8Array(expectedSig);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
