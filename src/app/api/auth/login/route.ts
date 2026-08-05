import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { verifyPasswordHash } from "@/lib/password";
import {
  getUserByUsername,
  getSessionVersionForUser,
  countRecentLoginAttempts,
  recordFailedLoginAttempt,
} from "@/lib/db";

// At most 10 failed attempts per username per 15 minutes — keyed by the
// submitted username (not user id) so it throttles brute-forcing an unknown
// username too, without adding a response-timing difference attackers could
// use to tell real usernames apart from made-up ones.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  let username = "";
  let password = "";
  try {
    const body = await req.json();
    if (typeof body?.username === "string") username = body.username;
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const recentFailures = await countRecentLoginAttempts(username, RATE_LIMIT_WINDOW_MINUTES);
  if (recentFailures >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  // Always run the hash comparison, even for an unknown username, so response
  // timing doesn't reveal whether the username exists.
  const DUMMY_HASH = `scrypt$16384$8$1$${"00".repeat(16)}$${"00".repeat(64)}`;
  const user = await getUserByUsername(username);
  const ok = await verifyPasswordHash(password, user?.password_hash ?? DUMMY_HASH);

  if (!ok || !user) {
    await recordFailedLoginAttempt(username);
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const sessionVersion = await getSessionVersionForUser(user.id);
  const token = await createSessionToken(user.id, sessionVersion);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
