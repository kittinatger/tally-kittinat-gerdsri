import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredGuests } from "@/lib/db";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session";

// Vercel Cron (see vercel.json) — same CRON_SECRET bearer auth as push-reminders.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // A guest's only way back in is its 30-day session cookie, so one older than
  // that (plus a few days' slack) can never be reached again.
  const graceDays = 5;
  const deleted = await deleteExpiredGuests(Math.ceil(SESSION_MAX_AGE_SECONDS / 86400) + graceDays);
  return NextResponse.json({ deleted });
}
