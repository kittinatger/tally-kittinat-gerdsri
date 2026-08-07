import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUserId } from "@/lib/auth";
import { getAppOrigin } from "@/lib/app-url";

// Step 1 of linking GitHub to an *existing, already-signed-in* account —
// distinct from /api/auth/github, which is for signing in with no account
// yet. This route is behind the normal cookie-auth gate (unlike
// api/auth/github, which proxy.ts explicitly excludes), so getUserId() only
// succeeds if there's already a valid session. Stashes that user's id in a
// second short-lived cookie alongside the usual CSRF state one, so the
// shared callback (/api/auth/github/callback) knows to link rather than
// sign in or create an account.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub sign-in is not configured on this deployment." }, { status: 503 });
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${getAppOrigin(req)}/api/auth/github/callback`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  res.cookies.set("github_oauth_link_user_id", String(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
