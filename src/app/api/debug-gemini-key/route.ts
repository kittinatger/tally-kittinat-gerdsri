import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

// TEMPORARY diagnostic route — added to compare the GEMINI_API_KEY the live
// deployment actually sees against what's been tested locally, since scanning
// fails in production but an identical local test with the same key/model/
// SDK succeeds. Requires an authenticated session (not publicly reachable),
// and never returns the full key. Remove once the mismatch is found.
export async function GET() {
  await getUserId();
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ set: false });
  }
  return NextResponse.json({
    set: true,
    length: key.length,
    prefix: key.slice(0, 8),
    suffix: key.slice(-6),
    hasWhitespace: /\s/.test(key),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
