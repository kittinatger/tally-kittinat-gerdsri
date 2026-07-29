import { NextRequest, NextResponse } from "next/server";
import {
  getAutoConvertCurrency,
  getCurrency,
  getRemaining,
  setAutoConvertCurrency,
  setCurrency,
  setRemaining,
} from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [remaining, currency, autoConvertCurrency] = await Promise.all([
    getRemaining(userId),
    getCurrency(userId),
    getAutoConvertCurrency(userId),
  ]);
  return NextResponse.json({ remaining, currency, autoConvertCurrency });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [remaining, currency, autoConvertCurrency] = await Promise.all([
    parsed.data.remaining !== undefined ? setRemaining(userId, parsed.data.remaining) : getRemaining(userId),
    parsed.data.currency !== undefined ? setCurrency(userId, parsed.data.currency) : getCurrency(userId),
    parsed.data.autoConvertCurrency !== undefined
      ? setAutoConvertCurrency(userId, parsed.data.autoConvertCurrency)
      : getAutoConvertCurrency(userId),
  ]);
  return NextResponse.json({ remaining, currency, autoConvertCurrency });
}
