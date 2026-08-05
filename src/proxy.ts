import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { getSessionVersion } from "@/lib/session-version";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const parsed = await verifySessionToken(token);

  if (parsed !== null) {
    // "Sign out of all devices" bumps session_version in the DB — any
    // token minted before that (this one included) stops matching and is
    // treated as signed out, without needing a per-token revocation list.
    // null means the check itself failed (see getSessionVersion) — fail
    // open and trust the token's signature rather than lock everyone out.
    const currentVersion = await getSessionVersion(parsed.userId);
    if (currentVersion === null || currentVersion === parsed.sessionVersion) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", String(parsed.userId));
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|register|forgot-password|reset-password|offline|manifest.json|sw.js|api/auth/login|api/auth/register|api/auth/forgot-password|api/auth/reset-password|_next/static|_next/image|favicon.ico|favicon-light.svg|favicon-dark.svg).*)",
  ],
};
