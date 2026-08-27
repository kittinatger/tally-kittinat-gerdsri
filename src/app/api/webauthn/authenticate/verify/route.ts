import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { getUserId } from "@/lib/auth";
import { getWebauthnCredentialById, updateWebauthnCredentialCounter } from "@/lib/db";
import { verifyAuthentication, getRpId, getOrigin, publicKeyFromBase64Url } from "@/lib/webauthn";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }

  const body = (await req.json()) as { response: AuthenticationResponseJSON };
  const rpID = getRpId(req.headers.get("host"));
  const origin = getOrigin(req.headers.get("host"), req.headers.get("x-forwarded-proto"));

  const stored = await getWebauthnCredentialById(body.response.id);
  // Scoped to the current session's own user — a credential ID that
  // resolves to someone else's account (shouldn't happen, but don't trust
  // client input) is treated the same as "not found".
  if (!stored || stored.user_id !== userId) {
    return NextResponse.json({ error: "Unrecognized device." }, { status: 400 });
  }

  try {
    const result = await verifyAuthentication(body.response, rpID, origin, {
      id: stored.credential_id,
      publicKey: publicKeyFromBase64Url(stored.public_key),
      counter: stored.counter,
      transports: stored.transports ? JSON.parse(stored.transports) : undefined,
    });
    if (!result.verified) {
      return NextResponse.json({ error: "Could not verify." }, { status: 400 });
    }
    await updateWebauthnCredentialCounter(stored.credential_id, result.authenticationInfo.newCounter);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Authentication failed." }, { status: 400 });
  }
}
