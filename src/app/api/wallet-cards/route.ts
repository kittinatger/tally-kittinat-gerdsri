import { NextRequest, NextResponse } from "next/server";
import { listWalletCards, createWalletCard } from "@/lib/db";
import { walletCardInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const cards = await listWalletCards(userId);
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = walletCardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const card = await createWalletCard(userId, parsed.data);
  return NextResponse.json({ card }, { status: 201 });
}
