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

// Accepts a handful of common synonyms per field (in addition to our own
// export's exact headers) so CSVs from other budgeting apps or bank exports
// have a decent chance of importing without the user hand-editing headers.
const HEADER_ALIASES: Record<string, string[]> = {
  date: ["date", "transaction date", "posted date", "trans date"],
  type: ["type", "transaction type"],
  direction: ["direction"],
  amount: ["amount", "value", "transaction amount", "debit/credit"],
  merchant: ["merchant", "description", "payee", "name", "vendor"],
  category: ["category", "category name"],
  notes: ["notes", "memo", "note"],
  tags: ["tags", "labels", "tag"],
  wallet: ["wallet", "account", "account name"],
};

function findCol(header: string[], field: keyof typeof HEADER_ALIASES): number {
  for (const name of HEADER_ALIASES[field]) {
    const idx = header.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
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
  const dateCol = findCol(header, "date");
  const typeCol = findCol(header, "type");
  const directionCol = findCol(header, "direction");
  const amountCol = findCol(header, "amount");
  const merchantCol = findCol(header, "merchant");
  const categoryCol = findCol(header, "category");
  const notesCol = findCol(header, "notes");
  const tagsCol = findCol(header, "tags");
  const walletCol = findCol(header, "wallet");

  if (dateCol === -1 || amountCol === -1 || merchantCol === -1) {
    return NextResponse.json(
      { error: "Couldn't find date, amount, and merchant/description columns in that file's header row." },
      { status: 400 },
    );
  }

  const wallets = await listWallets(userId, { includeArchived: true });
  const walletByName = new Map(wallets.map((w) => [w.name.toLowerCase(), w.id]));

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawAmount = Number((r[amountCol] ?? "").trim());
    // No "type" column (common for plain bank exports) — infer expense vs.
    // income from the amount's sign, and always store a positive amount.
    const inferredType = rawAmount < 0 ? "expense" : "income";
    const rawType = typeCol !== -1 ? (r[typeCol] ?? "").trim().toLowerCase() : inferredType;
    const walletName = walletCol !== -1 ? (r[walletCol] ?? "").trim().toLowerCase() : "";
    const tagsRaw = tagsCol !== -1 ? (r[tagsCol] ?? "") : "";
    const candidate = {
      type: rawType,
      direction: directionCol !== -1 ? (r[directionCol] ?? "").trim() || undefined : undefined,
      date: (r[dateCol] ?? "").trim(),
      amount: Math.abs(rawAmount),
      merchant: (r[merchantCol] ?? "").trim(),
      category: categoryCol !== -1 ? (r[categoryCol] ?? "").trim() || "Other" : "Other",
      notes: notesCol !== -1 ? (r[notesCol] ?? "").trim() || undefined : undefined,
      tags: tagsRaw
        .split(/[|;]/)
        .map((t) => t.trim())
        .filter(Boolean),
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
