import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { deleteUser, getUserById, getUserByUsername, updatePasswordHash, updateUsername } from "@/lib/db";
import { hashPassword, verifyPasswordHash } from "@/lib/password";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

export async function GET() {
  const userId = await getUserId();
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  return NextResponse.json({ username: user.username });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);

  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newUsername = typeof body?.newUsername === "string" ? body.newUsername.trim() : undefined;
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;

  if (!newUsername && !newPassword) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const currentOk = await verifyPasswordHash(currentPassword, user.password_hash);
  if (!currentOk) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  let username = user.username;

  if (newUsername !== undefined && newUsername !== user.username) {
    if (!USERNAME_PATTERN.test(newUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-32 characters: letters, numbers, . _ -" },
        { status: 400 },
      );
    }
    const existing = await getUserByUsername(newUsername);
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    try {
      username = await updateUsername(userId, newUsername);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      throw err;
    }
  }

  if (newPassword !== undefined) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    const passwordHash = await hashPassword(newPassword);
    await updatePasswordHash(userId, passwordHash);
  }

  return NextResponse.json({ username });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const currentOk = await verifyPasswordHash(currentPassword, user.password_hash);
  if (!currentOk) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  await deleteUser(userId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
