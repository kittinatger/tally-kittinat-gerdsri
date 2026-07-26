import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = await req.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let ok: boolean;
  try {
    ok = await verifyPassword(password);
  } catch {
    return NextResponse.json(
      { error: "Server is missing APP_PASSWORD / SESSION_SECRET configuration." },
      { status: 500 },
    );
  }

  if (!ok) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken();
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
