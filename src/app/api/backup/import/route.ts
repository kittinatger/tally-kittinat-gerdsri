import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { importBackupData, isKnownBackupTable } from "@/lib/backup/db";
import { checkMutationRateLimit } from "@/lib/mutation-rate-limit";

// Accepts already-decrypted plaintext JSON — decryption happens
// client-side before upload, same reasoning as export (see that route).
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!checkMutationRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests. Slow down and try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("tables" in body) ||
    typeof (body as { tables: unknown }).tables !== "object" ||
    (body as { tables: unknown }).tables === null
  ) {
    return NextResponse.json({ error: "This doesn't look like a Tally backup file." }, { status: 400 });
  }

  const rawTables = (body as { tables: Record<string, unknown> }).tables;
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const [name, rows] of Object.entries(rawTables)) {
    if (!isKnownBackupTable(name) || !Array.isArray(rows)) continue;
    tables[name] = rows as Record<string, unknown>[];
  }

  try {
    const result = await importBackupData(userId, tables);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed." },
      { status: 500 },
    );
  }
}
