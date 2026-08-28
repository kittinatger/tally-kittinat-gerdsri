import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription, deletePushSubscription } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }
  await savePushSubscription(userId, endpoint, p256dh, auth);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await getUserId(); // just an auth check — deletePushSubscription is keyed by endpoint, not user
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  await deletePushSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
