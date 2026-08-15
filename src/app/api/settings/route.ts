import { NextRequest, NextResponse } from "next/server";
import {
  getAutoConvertCurrency,
  getCurrency,
  getLanguage,
  getRemaining,
  getConvertWalletBalances,
  getNotifyRecurringEmail,
  getNotifyBudgetEmail,
  getRequireSplitConfirmation,
  setAutoConvertCurrency,
  setCurrency,
  setLanguage,
  setRemaining,
  setConvertWalletBalances,
  setNotifyRecurringEmail,
  setNotifyBudgetEmail,
  setRequireSplitConfirmation,
} from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [
    remaining,
    currency,
    language,
    autoConvertCurrency,
    convertWalletBalances,
    notifyRecurringEmail,
    notifyBudgetEmail,
    requireSplitConfirmation,
  ] = await Promise.all([
    getRemaining(userId),
    getCurrency(userId),
    getLanguage(userId),
    getAutoConvertCurrency(userId),
    getConvertWalletBalances(userId),
    getNotifyRecurringEmail(userId),
    getNotifyBudgetEmail(userId),
    getRequireSplitConfirmation(userId),
  ]);
  return NextResponse.json({
    remaining,
    currency,
    language,
    autoConvertCurrency,
    convertWalletBalances,
    notifyRecurringEmail,
    notifyBudgetEmail,
    requireSplitConfirmation,
  });
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
    requireSplitConfirmation,
  });
}
