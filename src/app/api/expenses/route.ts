import { NextRequest, NextResponse } from "next/server";
import { createExpense, findPossibleDuplicateExpense, listExpenses } from "@/lib/db";
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

  // `confirmDuplicate` isn't a financial field, so it's read off the raw
  // body rather than added to expenseInputSchema — the client sets it
  // once the user has seen the warning below and chosen to save anyway.
  const confirmDuplicate = Boolean((body as Record<string, unknown> | null)?.confirmDuplicate);
  if (!confirmDuplicate) {
    const duplicate = await findPossibleDuplicateExpense(userId, parsed.data.date, parsed.data.amount, parsed.data.merchant);
    if (duplicate) {
      return NextResponse.json({ duplicate }, { status: 409 });
    }
  }

  const expense = await createExpense(userId, parsed.data);
  return NextResponse.json({ expense }, { status: 201 });
}
