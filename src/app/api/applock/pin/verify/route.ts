import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getAppLockPinHash, countRecentLoginAttempts, recordFailedLoginAttempt } from "@/lib/db";
import { verifyPasswordHash } from "@/lib/password";

// Reuses the login_attempts table (see api/auth/login/route.ts) keyed by a
// synthetic "applock:<userId>" bucket rather than a real username — a
// 4-8 digit passcode has far less entropy than a password, so this is
// intentionally stricter than login's own 10-per-15-minutes.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

export async function POST(req: Request) {
  const userId = await getUserId();
  const bucket = `applock:${userId}`;

  const recentFailures = await countRecentLoginAttempts(bucket, RATE_LIMIT_WINDOW_MINUTES);
  if (recentFailures >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { pin } = (await req.json()) as { pin?: unknown };
  const hash = await getAppLockPinHash(userId);

  // Always run the hash comparison, even with no PIN configured, so
  // response timing doesn't reveal whether one exists.
  const DUMMY_HASH = `scrypt$16384$8$1$${"00".repeat(16)}$${"00".repeat(64)}`;
  const ok = typeof pin === "string" && (await verifyPasswordHash(pin, hash ?? DUMMY_HASH));

  if (!ok || !hash) {
    await recordFailedLoginAttempt(bucket);
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
