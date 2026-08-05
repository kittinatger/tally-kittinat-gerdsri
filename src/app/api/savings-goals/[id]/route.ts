import { NextRequest, NextResponse } from "next/server";
import { updateSavingsGoal, deleteSavingsGoal } from "@/lib/db";
import { savingsGoalUpdateSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const goalId = parseId(id);
  if (goalId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = savingsGoalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const goal = await updateSavingsGoal(userId, goalId, parsed.data);
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ goal });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const goalId = parseId(id);
  if (goalId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = await deleteSavingsGoal(userId, goalId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
