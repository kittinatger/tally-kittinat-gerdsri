import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { countGuestsCreatedSince, createGuestUser, seedDefaultCategoriesForUser, seedDefaultWalletForUser } from "@/lib/db";

// Guests cost nothing to mint, so cap how many can be created across the whole
// deployment per hour — enough for real traffic, not enough to flood the DB.
const MAX_GUESTS_PER_HOUR = 120;

export async function POST() {
  if ((await countGuestsCreatedSince(60)) >= MAX_GUESTS_PER_HOUR) {
    return NextResponse.json({ error: "Too many guest sessions right now. Please try again shortly." }, { status: 429 });
  }

  // Random, never-disclosed password: nobody can sign in to a guest account by
  // username — the session cookie is the only way back in until it's upgraded.
  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
  const user = await createGuestUser(`guest-${randomBytes(5).toString("hex")}`, passwordHash);
  await seedDefaultCategoriesForUser(user.id);
  await seedDefaultWalletForUser(user.id);

  const token = await createSessionToken(user.id, 0);
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
