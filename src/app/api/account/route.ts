import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  deleteUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updatePasswordHash,
  updateUsername,
  updateUserEmail,
  bumpSessionVersion,
  logSecurityEvent,
} from "@/lib/db";
import { hashPassword, verifyPasswordHash } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

export async function GET() {
  const userId = await getUserId();
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    hasPassword: user.password_hash !== null,
    githubLinked: user.github_id !== null,
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);

  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newUsername = typeof body?.newUsername === "string" ? body.newUsername.trim() : undefined;
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;
  const newEmailRaw = typeof body?.newEmail === "string" ? body.newEmail.trim() : undefined;
  const newEmail = newEmailRaw === "" ? null : newEmailRaw;

  if (!newUsername && !newPassword && newEmail === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Accounts created via OAuth (GitHub, etc.) have no password to check —
  // trust the session instead. Everyone else must confirm with it.
  if (user.password_hash) {
    const currentOk = await verifyPasswordHash(currentPassword, user.password_hash);
    if (!currentOk) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
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
      await logSecurityEvent(userId, "username_changed");
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      throw err;
    }
  }

  let newSessionVersion: number | null = null;
  if (newPassword !== undefined) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    const passwordHash = await hashPassword(newPassword);
    await updatePasswordHash(userId, passwordHash);
    await logSecurityEvent(userId, "password_changed");
    // Signs out every other device but keeps this one — see the cookie
    // reissue below, which carries the bumped version forward.
    newSessionVersion = await bumpSessionVersion(userId);
  }

  let email = user.email;

  if (newEmail !== undefined && newEmail !== user.email) {
    if (newEmail !== null) {
      if (!EMAIL_PATTERN.test(newEmail) || newEmail.length > 255) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      }
      const existing = await getUserByEmail(newEmail);
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
      }
    }
    try {
      email = await updateUserEmail(userId, newEmail);
      await logSecurityEvent(userId, newEmail === null ? "email_removed" : "email_changed");
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
      }
      throw err;
    }
  }

  const res = NextResponse.json({ username, email });
  if (newSessionVersion !== null) {
    const token = await createSessionToken(userId, newSessionVersion);
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
  }
  return res;
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (user.password_hash) {
    const currentOk = await verifyPasswordHash(currentPassword, user.password_hash);
    if (!currentOk) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
  }

  await deleteUser(userId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
