import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listWebauthnCredentials } from "@/lib/db";
import { buildAuthenticationOptions, getRpId } from "@/lib/webauthn";

// Requires the existing session cookie — app-lock is a second gate shown on
// top of an already-authenticated session, not a login replacement, so
// this never needs to work pre-login (see AppLockGate.tsx).
export async function POST(req: Request) {
  const userId = await getUserId();
  const rpID = getRpId(req.headers.get("host"));
  const credentials = await listWebauthnCredentials(userId);
  if (credentials.length === 0) {
    return NextResponse.json({ error: "No device enrolled." }, { status: 400 });
  }
  const options = await buildAuthenticationOptions(rpID, credentials.map((c) => c.credential_id));
  return NextResponse.json(options);
}
