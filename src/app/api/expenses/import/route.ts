import { NextRequest, NextResponse } from "next/server";
import { createExpense, listWallets } from "@/lib/db";
import { csvImportInputSchema, expenseInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import type { ExpenseInput } from "@/lib/validation";

// Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas,
// and "" as an escaped quote — matches what /api/expenses/export produces
// and what Excel/Sheets/Numbers export by default.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim().length > 0));
}

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
  const col = (name: string) => header.indexOf(name);
  const dateCol = col("date");
  const typeCol = col("type");
  const directionCol = col("direction");
  const amountCol = col("amount");
  const merchantCol = col("merchant");
  const categoryCol = col("category");
  const notesCol = col("notes");
  const tagsCol = col("tags");
  const walletCol = col("wallet");

  if (dateCol === -1 || typeCol === -1 || amountCol === -1 || merchantCol === -1 || categoryCol === -1) {
    return NextResponse.json(
      { error: "CSV must have at least date, type, amount, merchant, and category columns." },
      { status: 400 },
    );
  }

  const wallets = await listWallets(userId, { includeArchived: true });
  const walletByName = new Map(wallets.map((w) => [w.name.toLowerCase(), w.id]));

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawType = (r[typeCol] ?? "").trim().toLowerCase();
    const walletName = walletCol !== -1 ? (r[walletCol] ?? "").trim().toLowerCase() : "";
    const candidate = {
      type: rawType,
      direction: directionCol !== -1 ? (r[directionCol] ?? "").trim() || undefined : undefined,
      date: (r[dateCol] ?? "").trim(),
      amount: Number((r[amountCol] ?? "").trim()),
      merchant: (r[merchantCol] ?? "").trim(),
      category: (r[categoryCol] ?? "").trim(),
      notes: notesCol !== -1 ? (r[notesCol] ?? "").trim() || undefined : undefined,
      tags: tagsCol !== -1 ? (r[tagsCol] ?? "").split("|").map((t) => t.trim()).filter(Boolean) : [],
      walletId: walletName ? (walletByName.get(walletName) ?? undefined) : undefined,
    };

    const validated = expenseInputSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(`Row ${i + 1}: ${validated.error.issues[0]?.message ?? "invalid data"}`);
      continue;
    }
    try {
      await createExpense(userId, validated.data as ExpenseInput);
      imported++;
    } catch {
      errors.push(`Row ${i + 1}: failed to save`);
    }
  }

  return NextResponse.json({ imported, skipped: errors.length, errors: errors.slice(0, 20) });
}
