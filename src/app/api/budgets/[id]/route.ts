import { NextRequest, NextResponse } from "next/server";
import { deleteBudget } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const budgetId = parseId(id);
  if (budgetId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = await deleteBudget(userId, budgetId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
