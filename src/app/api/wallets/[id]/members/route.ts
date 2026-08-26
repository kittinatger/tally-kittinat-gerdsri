import { NextRequest, NextResponse } from "next/server";
import { inviteWalletMember, listWalletMembers } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = parseId(id);
  if (walletId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const members = await listWalletMembers(userId, walletId);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = parseId(id);
  if (walletId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const friendId = Number((body as Record<string, unknown> | null)?.friendId);
  if (!Number.isInteger(friendId) || friendId <= 0) {
    return NextResponse.json({ error: "friendId is required." }, { status: 400 });
  }
  const result = await inviteWalletMember(userId, walletId, friendId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
