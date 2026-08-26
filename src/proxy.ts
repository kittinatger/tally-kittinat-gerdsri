import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { getSessionVersion } from "@/lib/session-version";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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
      if (
        req.nextUrl.pathname.startsWith("/api/") &&
        MUTATING_METHODS.has(req.method) &&
        !checkMutationRateLimit(parsed.userId)
      ) {
        return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
      }
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", String(parsed.userId));
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Unauthenticated visits land on the splash screen (Sign in / Create
  // account) rather than straight on the login form — but `next` is still
  // carried through so the splash's "Sign in" button forwards to
  // /login?next=... and the user ends up where they were headed.
  const welcomeUrl = new URL("/welcome", req.url);
  welcomeUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(welcomeUrl);
}

export const config = {
  matcher: [
    // api/intake/* authenticates itself via a Bearer token (see
    // src/app/api/intake/receipt/route.ts) — it deliberately doesn't use
    // the cookie session, since it's meant to be called by an unattended
    // automation (e.g. an iOS Shortcut) with no browser involved.
    // api/auth/github (the sign-in initiator) and its callback are public
    // for the same reason every other auth endpoint here is — there's no
    // session yet when they run. api/auth/github/link is deliberately NOT
    // excluded: it links GitHub to an *already signed-in* account, so it
    // needs the normal auth gate (getUserId() inside it depends on this).
    // "splits" (bare, no api/ prefix) is the public read-only share-link
    // page (app/splits/[token]/page.tsx) — distinct from api/splits, the
    // authenticated CRUD routes for the Settings splitBills panel, which
    // stay behind the normal auth gate since this prefix match doesn't
    // touch anything starting with "api/".
    "/((?!welcome|login|register|forgot-password|reset-password|offline|manifest.json|sw.js|api/auth/login|api/auth/register|api/auth/forgot-password|api/auth/reset-password|api/auth/github/callback|api/auth/github$|api/intake|splits|_next/static|_next/image|favicon.ico|favicon-light.svg|favicon-dark.svg).*)",
  ],
};
