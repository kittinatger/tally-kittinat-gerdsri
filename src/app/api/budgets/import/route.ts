import { NextRequest, NextResponse } from "next/server";
import { upsertBudget } from "@/lib/db";
import { csvImportInputSchema, budgetInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { parseCsv, findColumn } from "@/lib/csv";

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
  const categoryCol = findColumn(header, ["category"]);
  const limitCol = findColumn(header, ["monthlylimit", "monthly limit", "limit"]);
  const rolloverCol = findColumn(header, ["rollover"]);

  if (categoryCol === -1 || limitCol === -1) {
    return NextResponse.json({ error: "CSV must have category and monthlyLimit columns." }, { status: 400 });
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const candidate = {
      category: (r[categoryCol] ?? "").trim(),
      monthlyLimit: Number((r[limitCol] ?? "").trim()),
      rollover: rolloverCol !== -1 ? (r[rolloverCol] ?? "").trim().toLowerCase() === "true" : false,
    };
    const validated = budgetInputSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(`Row ${i + 1}: ${validated.error.issues[0]?.message ?? "invalid data"}`);
      continue;
    }
    try {
      await upsertBudget(userId, validated.data.category, validated.data.monthlyLimit, validated.data.rollover);
      imported++;
    } catch {
      errors.push(`Row ${i + 1}: failed to save`);
    }
  }

  return NextResponse.json({ imported, skipped: errors.length, errors: errors.slice(0, 20) });
}
