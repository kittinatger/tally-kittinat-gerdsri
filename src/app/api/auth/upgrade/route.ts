import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { convertGuestToAccount, getUserByUsername, isGuestUser } from "@/lib/db";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

// Turns the signed-in guest into a regular account in place — the session
// cookie stays valid and all of their data carries over.
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!(await isGuestUser(userId))) {
    return NextResponse.json({ error: "This is already a full account." }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username) || username.toLowerCase().startsWith("guest-")) {
    return NextResponse.json(
      { error: "Username must be 3-32 characters: letters, numbers, . _ - (and can't start with \"guest-\")." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (await getUserByUsername(username)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  try {
    await convertGuestToAccount(userId, username, await hashPassword(password));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}
