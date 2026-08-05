import { NextRequest, NextResponse } from "next/server";
import { createSplitExpense } from "@/lib/db";
import { splitExpenseInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = splitExpenseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const expenses = await createSplitExpense(userId, parsed.data);
  return NextResponse.json({ expenses }, { status: 201 });
}
