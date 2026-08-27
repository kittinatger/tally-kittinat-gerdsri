import { sql, db } from "@vercel/postgres";
import { APP_SETTINGS_BACKUP_COLUMNS, BACKUP_TABLES, BACKUP_TABLE_NAMES, type BackupTable } from "./tables";

export type BackupPayload = {
  exportedAt: string;
  appVersion: string;
  tables: Record<string, Record<string, unknown>[]>;
};

// Column/table names below are always drawn from the static BACKUP_TABLES
// registry (never from request input), so interpolating them directly into
// SQL text is safe — only values go through parameters.
export async function exportBackupData(userId: number): Promise<BackupPayload["tables"]> {
  const tables: BackupPayload["tables"] = {};

  for (const t of BACKUP_TABLES) {
    const cols = ["id", ...t.columns.map((c) => c.name)];
    const colList = cols.map((c) => `"${c}"`).join(", ");
    let text: string;
    if (t.ownerJoin) {
      text = `SELECT ${cols.map((c) => `t."${c}"`).join(", ")} FROM "${t.name}" t JOIN "${t.ownerJoin.parentTable}" p ON t."${t.ownerJoin.parentIdColumn}" = p.id WHERE p.user_id = $1 ORDER BY t.id;`;
    } else {
      text = `SELECT ${colList} FROM "${t.name}" WHERE user_id = $1 ORDER BY id;`;
    }
    const { rows } = await sql.query(text, [userId]);
    tables[t.name] = rows;
  }

  return tables;
}

export type ImportResult = {
  imported: Record<string, number>;
  skipped: Record<string, number>;
  errors: string[];
};

// Always inserts as new rows — never overwrites or deletes existing data
// (see tables.ts header). Old-id → new-id maps are built table-by-table in
// BACKUP_TABLES' declared order, so a later table's refTable lookups are
// always already populated.
export async function importBackupData(userId: number, tables: BackupPayload["tables"]): Promise<ImportResult> {
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  const errors: string[] = [];
  const idMaps = new Map<string, Map<number, number>>();

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // app_settings: always exactly one row per account already — apply as
    // an UPDATE, not an insert, per tables.ts.
    const appSettingsRows = tables["app_settings"];
    if (Array.isArray(appSettingsRows) && appSettingsRows[0]) {
      const row = appSettingsRows[0];
      const setCols = APP_SETTINGS_BACKUP_COLUMNS.filter((c) => c in row);
      if (setCols.length > 0) {
        const assignments = setCols.map((c, i) => `"${c}" = $${i + 2}`).join(", ");
        const values = setCols.map((c) => row[c]);
        await client.query(`UPDATE app_settings SET ${assignments} WHERE user_id = $1;`, [userId, ...values]);
        imported["app_settings"] = 1;
      }
    }

    for (const t of BACKUP_TABLES) {
      const rows = tables[t.name];
      const map = new Map<number, number>();
      idMaps.set(t.name, map);
      if (!Array.isArray(rows) || rows.length === 0) {
        imported[t.name] = 0;
        continue;
      }

      let importedCount = 0;
      let skippedCount = 0;
      for (const row of rows) {
        try {
          const oldId = Number(row.id);
          const insertCols = ["user_id", ...t.columns.map((c) => c.name)];
          const values: unknown[] = [userId];
          for (const c of t.columns) {
            let v = row[c.name];
            if (c.refTable) {
              const parentMap = idMaps.get(c.refTable);
              const remapped = typeof v === "number" ? parentMap?.get(v) : undefined;
              v = remapped ?? (c.nullableRef ? null : undefined);
              if (v === undefined) {
                // Referenced row wasn't in this backup (or wasn't
                // remappable) and the FK isn't nullable — skip this row
                // rather than insert a dangling/incorrect reference.
                throw new Error(`skip: unresolved reference ${c.refTable} for ${t.name}`);
              }
            }
            values.push(v ?? null);
          }
          const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(", ");
          const colList = insertCols.map((c) => `"${c}"`).join(", ");
          const conflictClause = t.hasUniqueConflict ? " ON CONFLICT DO NOTHING" : "";
          const { rows: inserted } = await client.query(
            `INSERT INTO "${t.name}" (${colList}) VALUES (${placeholders})${conflictClause} RETURNING id;`,
            values,
          );
          const newId = inserted[0]?.id;
          if (newId) {
            if (Number.isFinite(oldId)) map.set(oldId, newId);
            importedCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
          if (err instanceof Error && err.message.startsWith("skip:")) {
            skippedCount++;
          } else {
            errors.push(`${t.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
      imported[t.name] = importedCount;
      skipped[t.name] = skippedCount;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { imported, skipped, errors };
}

export function isKnownBackupTable(name: string): boolean {
  return BACKUP_TABLE_NAMES.has(name) || name === "app_settings";
}

export type { BackupTable };
