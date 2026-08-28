import { NextResponse } from "next/server";
import { listExpenses, listRecurringRules } from "@/lib/db";
import { detectRecurringCandidates } from "@/lib/recurring-detection";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [expenses, existingRules] = await Promise.all([listExpenses(userId), listRecurringRules(userId)]);

  const alreadyTracked = new Set(
    existingRules.map((r) => `${r.merchant.trim().toLowerCase()}|${r.category}|${r.type}|${r.direction ?? ""}`),
  );

  const candidates = detectRecurringCandidates(expenses).filter((c) => !alreadyTracked.has(c.key));
  return NextResponse.json({ candidates });
}
