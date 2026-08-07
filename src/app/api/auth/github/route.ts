import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// Step 1 of the OAuth flow: redirect to GitHub's own consent screen with a
// random `state` value, stashed in a short-lived cookie so the callback can
// confirm the response actually came from a request we started (basic CSRF
// protection for the redirect flow — see /api/auth/github/callback).
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub sign-in is not configured on this deployment." }, { status: 503 });
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${req.nextUrl.origin}/api/auth/github/callback`;

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
  return res;
}
