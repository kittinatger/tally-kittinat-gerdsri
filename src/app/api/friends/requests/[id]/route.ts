import { NextRequest, NextResponse } from "next/server";
import { acceptFriendRequest, deleteFriendRequest } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Accept an incoming request. Declining an incoming request and cancelling
// one you sent are both handled by DELETE below.
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const requestId = parseId(id);
  if (requestId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await acceptFriendRequest(userId, requestId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const requestId = parseId(id);
  if (requestId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteFriendRequest(userId, requestId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
