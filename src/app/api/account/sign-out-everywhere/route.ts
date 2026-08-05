import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserById, bumpSessionVersion } from "@/lib/db";
import { verifyPasswordHash } from "@/lib/password";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Unlike changing your password from Account settings (which reissues a
// fresh cookie so the current device stays signed in), this deliberately
// signs the current device out too — it's the explicit "everywhere"
// action, so there's nothing left for it to distinguish.
export async function POST(req: NextRequest) {
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

  await bumpSessionVersion(userId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
