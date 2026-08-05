import { NextResponse } from "next/server";
import { listRecurringRules, listWallets } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const userId = await getUserId();
  const [rules, wallets] = await Promise.all([listRecurringRules(userId), listWallets(userId, { includeArchived: true })]);
  const walletNameById = new Map(wallets.map((w) => [w.id, w.name]));

  const csv = toCsv(
    ["type", "direction", "amount", "merchant", "category", "frequency", "nextRunDate", "notes", "wallet", "active"],
    rules.map((r) => [
      r.type,
      r.direction ?? "",
      r.amount,
      r.merchant,
      r.category,
      r.frequency,
      r.next_run_date,
      r.notes ?? "",
      r.wallet_id ? (walletNameById.get(r.wallet_id) ?? "") : "",
      r.active ? "true" : "false",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tally-recurring-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
