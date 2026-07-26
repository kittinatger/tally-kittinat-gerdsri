import { NextRequest, NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/db";
import { expenseInputSchema } from "@/lib/validation";

export async function GET() {
  const expenses = await listExpenses();
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = expenseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const expense = await createExpense(parsed.data);
  return NextResponse.json({ expense }, { status: 201 });
}
