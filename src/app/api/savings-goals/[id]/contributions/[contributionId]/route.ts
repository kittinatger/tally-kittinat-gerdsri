import { NextRequest, NextResponse } from "next/server";
import { deleteSavingsGoalContribution } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ contributionId: string }> }) {
  const userId = await getUserId();
  const { contributionId } = await params;
  const id = parseId(contributionId);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const goal = await deleteSavingsGoalContribution(userId, id);
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ goal });
}
