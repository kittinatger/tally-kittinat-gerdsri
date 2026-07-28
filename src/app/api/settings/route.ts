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

export async function GET() {
  const [remaining, currency, autoConvertCurrency] = await Promise.all([
    getRemaining(),
    getCurrency(),
    getAutoConvertCurrency(),
  ]);
  return NextResponse.json({ remaining, currency, autoConvertCurrency });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [remaining, currency, autoConvertCurrency] = await Promise.all([
    parsed.data.remaining !== undefined ? setRemaining(parsed.data.remaining) : getRemaining(),
    parsed.data.currency !== undefined ? setCurrency(parsed.data.currency) : getCurrency(),
    parsed.data.autoConvertCurrency !== undefined
      ? setAutoConvertCurrency(parsed.data.autoConvertCurrency)
      : getAutoConvertCurrency(),
  ]);
  return NextResponse.json({ remaining, currency, autoConvertCurrency });
}
