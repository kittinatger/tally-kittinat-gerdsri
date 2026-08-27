import type { NextRequest } from "next/server";
import { headers } from "next/headers";

// Vercel gives every deployment its own unique alias
// (project-hash-team.vercel.app) in addition to your real domain — visiting
// that alias instead of the real domain makes req.nextUrl.origin resolve to
// a URL that changes on every deploy, which breaks anything that must match
// a value registered elsewhere and pinned in advance (GitHub's OAuth
// callback URL, in particular — see /api/auth/github). Set APP_URL to your
// canonical domain to pin this; falls back to the request's own origin for
// deployments that don't set it (fine as long as you always visit the same
// URL).
export function getAppOrigin(req: NextRequest): string {
  return process.env.APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
}

// Same resolution as getAppOrigin, for Server Components/actions that only
// have next/headers rather than a NextRequest (e.g. a page.tsx rendering a
// referral link — see app/refer-a-friend/page.tsx).
export async function getAppOriginFromHeaders(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
