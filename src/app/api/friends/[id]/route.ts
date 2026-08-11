import { NextRequest, NextResponse } from "next/server";
import { removeFriend } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const friendId = parseId(id);
  if (friendId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await removeFriend(userId, friendId);
  return NextResponse.json({ ok: true });
}
