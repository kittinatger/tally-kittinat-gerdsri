import { NextRequest, NextResponse } from "next/server";
import { getDefaultSignature, setDefaultSignature } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseSignature } from "@/lib/signature";

// The default signature shown on the back of every card (Settings > Wallets).
export async function GET() {
  const userId = await getUserId();
  return NextResponse.json({ signature: await getDefaultSignature(userId) });
}

// Body: { signature: string | null } — null removes it.
export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  const body = (await req.json().catch(() => null)) as { signature?: unknown } | null;
  const parsed = parseSignature(body?.signature ?? null);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  await setDefaultSignature(userId, parsed.signature);
  return NextResponse.json({ signature: parsed.signature });
}
