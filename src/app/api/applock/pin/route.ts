import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { setAppLockPinHash, getAppLockPinHash, setAppLockEnabled, listWebauthnCredentials } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";

const PIN_PATTERN = /^\d{4,8}$/;

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }

  const { pin } = (await req.json()) as { pin?: unknown };
  if (typeof pin !== "string" || !PIN_PATTERN.test(pin)) {
    return NextResponse.json({ error: "Passcode must be 4-8 digits." }, { status: 400 });
  }

  const hash = await hashPassword(pin);
  await setAppLockPinHash(userId, hash, pin.length);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }

  await setAppLockPinHash(userId, null, null);

  // Auto-disable app-lock if that was the only unlock method configured —
  // an enabled lock with nothing left to unlock it would strand the user
  // (mirrors the same guard in the webauthn credentials DELETE route).
  const [remainingHash, credentials] = await Promise.all([getAppLockPinHash(userId), listWebauthnCredentials(userId)]);
  if (!remainingHash && credentials.length === 0) {
    await setAppLockEnabled(userId, false);
  }
  return NextResponse.json({ ok: true });
}
