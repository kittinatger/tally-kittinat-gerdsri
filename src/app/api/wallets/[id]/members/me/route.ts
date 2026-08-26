import { NextRequest, NextResponse } from "next/server";
import { leaveSharedWallet } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// "Leave" for a shared wallet the caller doesn't own — removes their own
// membership by wallet id, since the client showing this action only has
// the wallet's id, not their own wallet_members row id.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = parseId(id);
  if (walletId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await leaveSharedWallet(userId, walletId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
