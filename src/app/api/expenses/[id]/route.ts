import { NextRequest, NextResponse } from "next/server";
import { deleteExpense, updateExpense } from "@/lib/db";
import { expenseInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const expenseId = parseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = expenseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expense = await updateExpense(userId, expenseId, parsed.data);
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ expense });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const expenseId = parseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = await deleteExpense(userId, expenseId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
