import { NextRequest, NextResponse } from "next/server";
import { setWalletBackDesign } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { serializeBackDesign } from "@/lib/card-back";

// One card's back design (Customise back on its detail view). Body:
// { design: CardBackDesign | null } — null resets to the default back.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = Number(id);
  if (!Number.isInteger(walletId) || walletId <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { design?: unknown } | null;
  const parsed = serializeBackDesign(body?.design ?? null);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid back design." }, { status: 400 });
  const ok = await setWalletBackDesign(userId, walletId, parsed.json);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
