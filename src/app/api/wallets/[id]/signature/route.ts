import { NextRequest, NextResponse } from "next/server";
import { setWalletSignature } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseSignature } from "@/lib/signature";

// One card's own signature. Body: { signature: string | null } — null goes
// back to the default signature.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = Number(id);
  if (!Number.isInteger(walletId) || walletId <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { signature?: unknown } | null;
  const parsed = parseSignature(body?.signature ?? null);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  const ok = await setWalletSignature(userId, walletId, parsed.signature);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ signature: parsed.signature });
}
