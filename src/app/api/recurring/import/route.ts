import { NextRequest, NextResponse } from "next/server";
import { createRecurringRule, listWallets } from "@/lib/db";
import { csvImportInputSchema, recurringRuleInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { parseCsv, findColumn } from "@/lib/csv";
import { todayInputValue } from "@/lib/format";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = csvImportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rows = parseCsv(parsed.data.csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in that file." }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const typeCol = findColumn(header, ["type"]);
  const directionCol = findColumn(header, ["direction"]);
  const amountCol = findColumn(header, ["amount"]);
  const merchantCol = findColumn(header, ["merchant"]);
  const categoryCol = findColumn(header, ["category"]);
  const frequencyCol = findColumn(header, ["frequency"]);
  const startDateCol = findColumn(header, ["nextrundate", "next run date", "startdate", "start date"]);
  const notesCol = findColumn(header, ["notes"]);
  const walletCol = findColumn(header, ["wallet"]);

  if (typeCol === -1 || amountCol === -1 || merchantCol === -1 || categoryCol === -1 || frequencyCol === -1) {
    return NextResponse.json(
      { error: "CSV must have type, amount, merchant, category, and frequency columns." },
      { status: 400 },
    );
  }

  const wallets = await listWallets(userId, { includeArchived: true });
  const walletByName = new Map(wallets.map((w) => [w.name.toLowerCase(), w.id]));

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const walletName = walletCol !== -1 ? (r[walletCol] ?? "").trim().toLowerCase() : "";
    const candidate = {
      type: (r[typeCol] ?? "").trim().toLowerCase(),
      direction: directionCol !== -1 ? (r[directionCol] ?? "").trim() || undefined : undefined,
      amount: Number((r[amountCol] ?? "").trim()),
      merchant: (r[merchantCol] ?? "").trim(),
      category: (r[categoryCol] ?? "").trim(),
      frequency: (r[frequencyCol] ?? "").trim().toLowerCase(),
      startDate: startDateCol !== -1 ? (r[startDateCol] ?? "").trim() || todayInputValue() : todayInputValue(),
      notes: notesCol !== -1 ? (r[notesCol] ?? "").trim() || undefined : undefined,
      walletId: walletName ? (walletByName.get(walletName) ?? undefined) : undefined,
    };

    const validated = recurringRuleInputSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(`Row ${i + 1}: ${validated.error.issues[0]?.message ?? "invalid data"}`);
      continue;
    }
    try {
      await createRecurringRule(userId, validated.data);
      imported++;
    } catch {
      errors.push(`Row ${i + 1}: failed to save`);
    }
  }

  return NextResponse.json({ imported, skipped: errors.length, errors: errors.slice(0, 20) });
}
