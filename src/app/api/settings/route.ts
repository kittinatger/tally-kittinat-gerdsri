import { NextRequest, NextResponse } from "next/server";
import {
  getAppSettingsRow,
  getAutoConvertCurrency,
  getCurrency,
  getLanguage,
  getRemaining,
  getConvertWalletBalances,
  getNotifyRecurringEmail,
  getNotifyBudgetEmail,
  getNotifyPushReminders,
  getRequireSplitConfirmation,
  setAutoConvertCurrency,
  setCurrency,
  setLanguage,
  setRemaining,
  setConvertWalletBalances,
  setNotifyRecurringEmail,
  setNotifyBudgetEmail,
  setNotifyPushReminders,
  setRequireSplitConfirmation,
} from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

// One query. The wallet balance total (`remaining`) is deliberately not part
// of this read: it's an aggregate over every wallet and transaction, no
// reader of this endpoint uses it, and this runs on every page load. PATCH
// still returns it after a balance edit (EditBalanceModal reads that).
export async function GET() {
  const userId = await getUserId();
  return NextResponse.json(await getAppSettingsRow(userId));
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [
    remaining,
    currency,
    language,
    autoConvertCurrency,
    convertWalletBalances,
    notifyRecurringEmail,
    notifyBudgetEmail,
    notifyPushReminders,
    requireSplitConfirmation,
  ] = await Promise.all([
    parsed.data.remaining !== undefined ? setRemaining(userId, parsed.data.remaining) : getRemaining(userId),
    parsed.data.currency !== undefined ? setCurrency(userId, parsed.data.currency) : getCurrency(userId),
    parsed.data.language !== undefined ? setLanguage(userId, parsed.data.language) : getLanguage(userId),
    parsed.data.autoConvertCurrency !== undefined
      ? setAutoConvertCurrency(userId, parsed.data.autoConvertCurrency)
      : getAutoConvertCurrency(userId),
    parsed.data.convertWalletBalances !== undefined
      ? setConvertWalletBalances(userId, parsed.data.convertWalletBalances)
      : getConvertWalletBalances(userId),
    parsed.data.notifyRecurringEmail !== undefined
      ? setNotifyRecurringEmail(userId, parsed.data.notifyRecurringEmail)
      : getNotifyRecurringEmail(userId),
    parsed.data.notifyBudgetEmail !== undefined
      ? setNotifyBudgetEmail(userId, parsed.data.notifyBudgetEmail)
      : getNotifyBudgetEmail(userId),
    parsed.data.notifyPushReminders !== undefined
      ? setNotifyPushReminders(userId, parsed.data.notifyPushReminders)
      : getNotifyPushReminders(userId),
    parsed.data.requireSplitConfirmation !== undefined
      ? setRequireSplitConfirmation(userId, parsed.data.requireSplitConfirmation)
      : getRequireSplitConfirmation(userId),
  ]);
  return NextResponse.json({
    remaining,
    currency,
    language,
    autoConvertCurrency,
    convertWalletBalances,
    notifyRecurringEmail,
    notifyBudgetEmail,
    notifyPushReminders,
    requireSplitConfirmation,
  });
}
