import { NextRequest, NextResponse } from "next/server";
import { listWallets, createWallet } from "@/lib/db";
import { walletInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "1";
  const wallets = await listWallets(userId, { includeArchived });
  return NextResponse.json({ wallets });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = walletInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const wallet = await createWallet(userId, parsed.data);
  return NextResponse.json({ wallet }, { status: 201 });
}
