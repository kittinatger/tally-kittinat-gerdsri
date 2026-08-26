import { NextRequest, NextResponse } from "next/server";
import { removeWalletMember, respondToWalletInvite } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// The invitee accepts/declines their own pending invite here — a wallet
// owner has no "respond" action of their own, only invite/remove (below).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const userId = await getUserId();
  const { memberId } = await params;
  const parsedId = parseId(memberId);
  if (parsedId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const accept = Boolean((body as Record<string, unknown> | null)?.accept);
  const ok = await respondToWalletInvite(userId, parsedId, accept);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// Either the wallet's owner (removing a member) or the member themselves
// (leaving) can call this — see removeWalletMember's access check.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const userId = await getUserId();
  const { memberId } = await params;
  const parsedId = parseId(memberId);
  if (parsedId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await removeWalletMember(userId, parsedId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
