import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getUserId } from "@/lib/auth";
import { createWebauthnCredential } from "@/lib/db";
import { verifyRegistration, getRpId, getOrigin, publicKeyToBase64Url } from "@/lib/webauthn";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }

  const body = (await req.json()) as { response: RegistrationResponseJSON; deviceLabel?: string };
  const rpID = getRpId(req.headers.get("host"));
  const origin = getOrigin(req.headers.get("host"), req.headers.get("x-forwarded-proto"));

  try {
    const result = await verifyRegistration(body.response, rpID, origin);
    if (!result.verified || !result.registrationInfo) {
      return NextResponse.json({ error: "Could not verify this device." }, { status: 400 });
    }
    const { credential, credentialDeviceType } = result.registrationInfo;
    await createWebauthnCredential(
      userId,
      credential.id,
      publicKeyToBase64Url(credential.publicKey),
      credential.counter,
      credential.transports ?? [],
      body.deviceLabel?.trim() || (credentialDeviceType === "multiDevice" ? "This device (synced)" : "This device"),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Registration failed." }, { status: 400 });
  }
}
