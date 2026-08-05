import { NextRequest, NextResponse } from "next/server";
import { createSavingsGoal, updateSavingsGoal } from "@/lib/db";
import { csvImportInputSchema, savingsGoalInputSchema } from "@/lib/validation";
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
  const nameCol = findColumn(header, ["name"]);
  const colorCol = findColumn(header, ["color"]);
  const targetCol = findColumn(header, ["targetamount", "target amount", "target"]);
  const currentCol = findColumn(header, ["currentamount", "current amount", "current"]);

  if (nameCol === -1 || targetCol === -1) {
    return NextResponse.json({ error: "CSV must have name and targetAmount columns." }, { status: 400 });
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const candidate = {
      name: (r[nameCol] ?? "").trim(),
      color: colorCol !== -1 ? (r[colorCol] ?? "").trim() || "emerald" : "emerald",
      targetAmount: Number((r[targetCol] ?? "").trim()),
    };
    const validated = savingsGoalInputSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(`Row ${i + 1}: ${validated.error.issues[0]?.message ?? "invalid data"}`);
      continue;
    }
    const startingAmount = currentCol !== -1 ? Number((r[currentCol] ?? "").trim()) || 0 : 0;
    try {
      const goal = await createSavingsGoal(userId, validated.data);
      if (startingAmount > 0) {
        await updateSavingsGoal(userId, goal.id, { contributeDelta: startingAmount });
      }
      imported++;
    } catch {
      errors.push(`Row ${i + 1}: failed to save`);
    }
  }

  return NextResponse.json({ imported, skipped: errors.length, errors: errors.slice(0, 20) });
}
