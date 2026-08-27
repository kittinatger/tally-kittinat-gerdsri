import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserById, listWebauthnCredentials } from "@/lib/db";
import { buildRegistrationOptions, getRpId } from "@/lib/webauthn";

export async function POST(req: Request) {
  const userId = await getUserId();
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const rpID = getRpId(req.headers.get("host"));
  const existing = await listWebauthnCredentials(userId);
  const options = await buildRegistrationOptions(rpID, userId, user.username, existing.map((c) => c.credential_id));
  return NextResponse.json(options);
}
