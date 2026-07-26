import { NextRequest, NextResponse } from "next/server";
import { getStartingBalance, setStartingBalance } from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation";

export async function GET() {
  const startingBalance = await getStartingBalance();
  return NextResponse.json({ startingBalance });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const startingBalance = await setStartingBalance(parsed.data.startingBalance);
  return NextResponse.json({ startingBalance });
}
