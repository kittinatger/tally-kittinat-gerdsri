import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { verifyPasswordHash } from "@/lib/password";
import { getUserByUsername } from "@/lib/db";

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

  // Always run the hash comparison, even for an unknown username, so response
  // timing doesn't reveal whether the username exists.
  const DUMMY_HASH = `scrypt$16384$8$1$${"00".repeat(16)}$${"00".repeat(64)}`;
  const user = await getUserByUsername(username);
  const ok = await verifyPasswordHash(password, user?.password_hash ?? DUMMY_HASH);

  if (!ok || !user) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
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
