import { NextRequest, NextResponse } from "next/server";
import { listBudgets, upsertBudget } from "@/lib/db";
import { budgetInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const budgets = await listBudgets(userId);
  return NextResponse.json({ budgets });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = budgetInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const budget = await upsertBudget(userId, parsed.data.category, parsed.data.monthlyLimit, parsed.data.rollover);
  return NextResponse.json({ budget }, { status: 201 });
}
