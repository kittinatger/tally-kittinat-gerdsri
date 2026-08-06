import { NextRequest, NextResponse } from "next/server";
import { listSavingsGoalContributions } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const goalId = parseId(id);
  if (goalId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const contributions = await listSavingsGoalContributions(userId, goalId);
  return NextResponse.json({ contributions });
}
