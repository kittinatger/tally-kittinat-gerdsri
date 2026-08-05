import { NextResponse } from "next/server";
import { listBudgets } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const userId = await getUserId();
  const budgets = await listBudgets(userId);

  const csv = toCsv(
    ["category", "monthlyLimit", "rollover"],
    budgets.map((b) => [b.category, b.monthly_limit, b.rollover ? "true" : "false"]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tally-budgets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
