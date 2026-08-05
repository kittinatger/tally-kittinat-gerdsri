import { NextResponse } from "next/server";
import { listExpenses } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const userId = await getUserId();
  const expenses = await listExpenses(userId);

  const header = ["date", "type", "direction", "amount", "merchant", "category", "notes", "tags", "wallet"];
  const lines = [header.join(",")];
  for (const e of expenses) {
    lines.push(
      [
        e.date,
        e.type,
        e.direction ?? "",
        e.amount,
        e.merchant,
        e.category,
        e.notes ?? "",
        e.tags.join("|"),
        e.wallet_name ?? "",
      ]
        .map(csvField)
        .join(","),
    );
  }
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tally-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
