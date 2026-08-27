import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getUserId } from "@/lib/auth";
import { exportBackupData } from "@/lib/backup/db";
import { APP_VERSION } from "@/lib/version";

// Returns plaintext JSON — encryption happens client-side after this
// response, so the passphrase and derived key never transit the network.
// See src/lib/backup/tables.ts for exactly what's included/excluded.
export async function GET() {
  const userId = await getUserId();
  const tablesData = await exportBackupData(userId);

  const { rows } = await sql`SELECT starting_balance, starting_balance_set_at, currency, auto_convert_currency, language,
      convert_wallet_balances, notify_recurring_email, notify_budget_email, week_start_day,
      month_start_day, biweekly_anchor_date, default_view, timezone, show_week_numbers,
      alternate_calendar, dashboard_widgets, require_split_confirmation
      FROM app_settings WHERE user_id = ${userId};`;

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    tables: { ...tablesData, app_settings: rows },
  });
}
