import { NextRequest, NextResponse } from "next/server";
import { convertAmount } from "@/lib/exchange-rate";
import { getUserId } from "@/lib/auth";

// Client-facing wrapper around convertAmount (Frankfurter/ECB rates,
// cached — see exchange-rate.ts) — used by WalletTransferModal to preview
// a converted amount when the source and destination wallets have
// different currencies. Everything else that converts (receipt
// auto-convert) runs entirely server-side and never needed a route of its
// own; this is the first place a browser needs the rate directly.
export async function GET(req: NextRequest) {
  // Auth-gated like every other route, even though the rate itself isn't
  // user data — keeps this consistent with the rest of the API surface
  // rather than being the one open endpoint.
  await getUserId();

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const amountRaw = req.nextUrl.searchParams.get("amount");
  const amount = Number(amountRaw);

  if (!from || !to || !/^[A-Za-z]{3}$/.test(from) || !/^[A-Za-z]{3}$/.test(to)) {
    return NextResponse.json({ error: "Invalid or missing from/to currency code." }, { status: 400 });
  }
  if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid or missing amount." }, { status: 400 });
  }

  const converted = await convertAmount(amount, from.toUpperCase(), to.toUpperCase());
  return NextResponse.json({ converted });
}
