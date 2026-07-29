import { NextRequest, NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/db";
import { expenseInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const expenses = await listExpenses(userId);
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = expenseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const expense = await createExpense(userId, parsed.data);
  return NextResponse.json({ expense }, { status: 201 });
}
