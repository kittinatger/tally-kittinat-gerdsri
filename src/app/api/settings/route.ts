import { NextRequest, NextResponse } from "next/server";
import {
  getAutoConvertCurrency,
  getCurrency,
  getRemaining,
  getConvertWalletBalances,
  getNotifyRecurringEmail,
  getNotifyBudgetEmail,
  setAutoConvertCurrency,
  setCurrency,
  setRemaining,
  setConvertWalletBalances,
  setNotifyRecurringEmail,
  setNotifyBudgetEmail,
} from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [remaining, currency, autoConvertCurrency, convertWalletBalances, notifyRecurringEmail, notifyBudgetEmail] =
    await Promise.all([
      getRemaining(userId),
      getCurrency(userId),
      getAutoConvertCurrency(userId),
      getConvertWalletBalances(userId),
      getNotifyRecurringEmail(userId),
      getNotifyBudgetEmail(userId),
    ]);
  return NextResponse.json({
    remaining,
    currency,
    autoConvertCurrency,
    convertWalletBalances,
    notifyRecurringEmail,
    notifyBudgetEmail,
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [remaining, currency, autoConvertCurrency, convertWalletBalances, notifyRecurringEmail, notifyBudgetEmail] =
    await Promise.all([
      parsed.data.remaining !== undefined ? setRemaining(userId, parsed.data.remaining) : getRemaining(userId),
      parsed.data.currency !== undefined ? setCurrency(userId, parsed.data.currency) : getCurrency(userId),
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
    ]);
  return NextResponse.json({
    remaining,
    currency,
    autoConvertCurrency,
    convertWalletBalances,
    notifyRecurringEmail,
    notifyBudgetEmail,
  });
}
