import { NextRequest, NextResponse } from "next/server";
import { listDueInstallmentReminders, markInstallmentReminderSent, getCurrency, createNotification } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { formatCurrency } from "@/lib/format";

// Invoked once a day by Vercel Cron (see vercel.json) — the only
// background-worker-like trigger in this deployment (everything else,
// like the recurring-rule/budget email notifications, only ever runs
// on-demand when a user's own dashboard load hits it). Vercel signs its
// own cron requests with an Authorization: Bearer <CRON_SECRET> header
// automatically once CRON_SECRET is set as a project env var — see the
// deployment notes for exactly what to add.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await listDueInstallmentReminders();
  let sent = 0;
  for (const reminder of due) {
    const verb = reminder.direction === "lent" ? "owes you" : "you owe";
    const currency = await getCurrency(reminder.userId);
    const title = "Loan payment due";
    const body = `${formatCurrency(Number(reminder.amount), currency)} ${verb} ${reminder.counterpartyName}`;
    const url = "/settings?panel=loans";
    await sendPushToUser(reminder.userId, { title, body, url });
    await createNotification(reminder.userId, { type: "loan_due", title, body, url });
    await markInstallmentReminderSent(reminder.installmentId);
    sent++;
  }

  return NextResponse.json({ sent });
}
