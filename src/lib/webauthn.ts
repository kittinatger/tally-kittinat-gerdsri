import { cookies } from "next/headers";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON, AuthenticationResponseJSON, WebAuthnCredential } from "@simplewebauthn/server";

export const RP_NAME = "Tally";

const CHALLENGE_COOKIE = "tally_webauthn_challenge";
const CHALLENGE_MAX_AGE_SECONDS = 120;

// WebAuthn's RP ID must exactly match the domain the user authenticates
// from (no protocol, no port) — see app-url.ts for the same "pin a
// canonical domain via APP_URL, fall back to the request's own host"
// reasoning used for the GitHub OAuth callback. Falling back to
// "localhost" when nothing is configured keeps local dev working (a
// distinct, browser-recognized special case for WebAuthn).
export function getRpId(hostHeader: string | null): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    try {
      return new URL(appUrl).hostname;
    } catch {
      // fall through
    }
  }
  if (hostHeader) return hostHeader.split(":")[0];
  return "localhost";
}

export function getOrigin(hostHeader: string | null, protoHeader: string | null): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, "");
  const proto = protoHeader ?? "https";
  return `${proto}://${hostHeader ?? "localhost"}`;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set.");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// The in-flight challenge is stored in a short-lived signed cookie (same
// HMAC approach as session.ts) rather than a DB table, keeping registration/
// authentication ceremonies stateless between the options and verify calls.
export async function stashChallenge(challenge: string): Promise<void> {
  const key = await getKey();
  const signature = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(challenge)));
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, `${challenge}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function popChallenge(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete(CHALLENGE_COOKIE);
  if (!raw) return null;
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;
  const challenge = raw.slice(0, lastDot);
  const signatureHex = raw.slice(lastDot + 1);
  const key = await getKey();
  const bytes = signatureHex.match(/.{2}/g)?.map((b) => Number.parseInt(b, 16));
  if (!bytes) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(bytes) as BufferSource,
    new TextEncoder().encode(challenge),
  );
  return ok ? challenge : null;
}

export async function buildRegistrationOptions(
  rpID: string,
  userId: number,
  username: string,
  excludeCredentialIds: string[],
) {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: username,
    userID: new TextEncoder().encode(String(userId)),
    attestationType: "none",
    excludeCredentials: excludeCredentialIds.map((id) => ({ id })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred", authenticatorAttachment: "platform" },
  });
  await stashChallenge(options.challenge);
  return options;
}

export async function verifyRegistration(
  response: RegistrationResponseJSON,
  rpID: string,
  origin: string,
): ReturnType<typeof verifyRegistrationResponse> {
  const challenge = await popChallenge();
  if (!challenge) throw new Error("Registration expired — try again.");
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  };
  return verifyRegistrationResponse(opts);
}

export async function buildAuthenticationOptions(rpID: string, allowCredentialIds: string[]) {
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentialIds.map((id) => ({ id })),
    userVerification: "preferred",
  });
  await stashChallenge(options.challenge);
  return options;
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  rpID: string,
  origin: string,
  credential: WebAuthnCredential,
): ReturnType<typeof verifyAuthenticationResponse> {
  const challenge = await popChallenge();
  if (!challenge) throw new Error("Authentication expired — try again.");
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential,
  };
  return verifyAuthenticationResponse(opts);
}

// Storage helpers — public keys are stored as base64url TEXT (Postgres has
// no natural fit for a raw byte blob this small other than bytea, but
// base64url keeps this table symmetric with credential_id and easy to
// inspect), converted back to Uint8Array only when handed to the library.
export function publicKeyToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function publicKeyFromBase64Url(b64: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(b64, "base64url");
  // Buffer's backing ArrayBufferLike can widen to SharedArrayBuffer in
  // newer TS lib types; copy into a plain Uint8Array over a fresh
  // ArrayBuffer so this matches WebAuthnCredential.publicKey's exact type.
  const out = new Uint8Array(buf.length);
  out.set(buf);
  return out;
}
