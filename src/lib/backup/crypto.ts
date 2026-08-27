// Client-side only — the passphrase and the derived key must never leave
// the browser, so this always runs against window.crypto.subtle, never
// Node's crypto module. See format.ts for the envelope this produces.

const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 minimum for PBKDF2-SHA256
const SALT_BYTES = 16;
const IV_BYTES = 12; // AES-GCM's recommended nonce length

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type BackupEnvelope = {
  version: 1;
  algo: "AES-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

export async function encryptBackup(plaintext: unknown, passphrase: string): Promise<BackupEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const data = new TextEncoder().encode(JSON.stringify(plaintext));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data);
  return {
    version: 1,
    algo: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };
}

// Throws (with a message safe to show the user) on a wrong passphrase or
// corrupted file — AES-GCM's auth tag makes tampering/wrong-key
// detectable rather than silently producing garbage.
export async function decryptBackup(envelope: BackupEnvelope, passphrase: string): Promise<unknown> {
  if (envelope.version !== 1 || envelope.algo !== "AES-GCM" || envelope.kdf !== "PBKDF2-SHA256") {
    throw new Error("This file isn't a Tally backup, or was made by a newer app version.");
  }
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const key = await deriveKey(passphrase, salt);
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      fromBase64(envelope.ciphertext) as BufferSource,
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    throw new Error("Wrong passphrase, or the file is corrupted.");
  }
}
