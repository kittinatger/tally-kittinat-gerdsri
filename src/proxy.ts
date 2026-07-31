import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = await verifySessionToken(token);

  if (userId !== null) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", String(userId));
    return NextResponse.next({ request: { headers: requestHeaders } });
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
    "/((?!login|register|api/auth/login|api/auth/register|_next/static|_next/image|favicon.ico|favicon-light.svg|favicon-dark.svg).*)",
  ],
};
