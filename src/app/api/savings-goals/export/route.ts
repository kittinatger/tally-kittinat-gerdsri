import { NextResponse } from "next/server";
import { listSavingsGoals } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const userId = await getUserId();
  const goals = await listSavingsGoals(userId);

  const csv = toCsv(
    ["name", "color", "targetAmount", "currentAmount"],
    goals.map((g) => [g.name, g.color, g.target_amount, g.current_amount]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tally-savings-goals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
