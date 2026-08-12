import { NextRequest, NextResponse } from "next/server";
import { toggleSplitSettled } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const splitId = parseId(id);
  if (splitId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await toggleSplitSettled(userId, splitId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
