import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  listWebauthnCredentials,
  deleteWebauthnCredential,
  getAppLockEnabled,
  setAppLockEnabled,
  getAppLockPinHash,
  getAppLockPinLength,
  getAppLockTimeoutSeconds,
  setAppLockTimeoutSeconds,
} from "@/lib/db";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";
import { APPLOCK_TIMEOUT_OPTIONS } from "@/lib/applock-timeout";

export async function GET() {
  const userId = await getUserId();
  const [credentials, enabled, pinHash, pinLength, timeoutSeconds] = await Promise.all([
    listWebauthnCredentials(userId),
    getAppLockEnabled(userId),
    getAppLockPinHash(userId),
    getAppLockPinLength(userId),
    getAppLockTimeoutSeconds(userId),
  ]);
  return NextResponse.json({
    enabled,
    hasPasscode: pinHash !== null,
    pinLength,
    timeoutSeconds,
    credentials: credentials.map((c) => ({
      id: c.id,
      deviceLabel: c.device_label,
      createdAt: c.created_at,
      lastUsedAt: c.last_used_at,
    })),
  });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }
  const body = (await req.json()) as { enabled?: boolean; timeoutSeconds?: number };

  if (body.enabled !== undefined) {
    if (body.enabled) {
      const [credentials, pinHash] = await Promise.all([listWebauthnCredentials(userId), getAppLockPinHash(userId)]);
      if (credentials.length === 0 && !pinHash) {
        return NextResponse.json({ error: "Enroll a device or set a passcode before turning this on." }, { status: 400 });
      }
    }
    await setAppLockEnabled(userId, Boolean(body.enabled));
  }

  if (body.timeoutSeconds !== undefined) {
    if (!APPLOCK_TIMEOUT_OPTIONS.some((o) => o.seconds === body.timeoutSeconds)) {
      return NextResponse.json({ error: "Invalid lock timeout." }, { status: 400 });
    }
    await setAppLockTimeoutSeconds(userId, body.timeoutSeconds);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }
  const { id } = (await req.json()) as { id: number };
  await deleteWebauthnCredential(userId, id);
  const [remaining, pinHash] = await Promise.all([listWebauthnCredentials(userId), getAppLockPinHash(userId)]);
  // Auto-disable app-lock once the last unlock method (device or passcode)
  // is removed — an enabled lock with nothing to unlock it would strand
  // the user.
  if (remaining.length === 0 && !pinHash) {
    await setAppLockEnabled(userId, false);
  }
  return NextResponse.json({ ok: true });
}
