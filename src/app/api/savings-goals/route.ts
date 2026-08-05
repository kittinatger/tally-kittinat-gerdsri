import { NextRequest, NextResponse } from "next/server";
import { listSavingsGoals, createSavingsGoal } from "@/lib/db";
import { savingsGoalInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const goals = await listSavingsGoals(userId);
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = savingsGoalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const goal = await createSavingsGoal(userId, parsed.data);
  return NextResponse.json({ goal }, { status: 201 });
}
