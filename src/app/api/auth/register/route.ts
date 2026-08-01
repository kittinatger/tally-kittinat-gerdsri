import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { createUser, getUserByUsername, seedDefaultCategoriesForUser, seedDefaultWalletForUser } from "@/lib/db";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

export async function POST(req: NextRequest) {
  let username = "";
  let password = "";
  try {
    const body = await req.json();
    if (typeof body?.username === "string") username = body.username.trim();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-32 characters: letters, numbers, . _ -" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await getUserByUsername(username);
  if (existing) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  let user: { id: number; username: string };
  try {
    const passwordHash = await hashPassword(password);
    user = await createUser(username, passwordHash);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    throw err;
  }

  await seedDefaultCategoriesForUser(user.id);
  await seedDefaultWalletForUser(user.id);

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
