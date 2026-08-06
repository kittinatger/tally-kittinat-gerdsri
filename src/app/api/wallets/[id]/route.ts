import { NextRequest, NextResponse } from "next/server";
import { updateWallet, deleteWallet, moveWallet, listWallets } from "@/lib/db";
import { walletUpdateSchema, reorderMoveSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = parseId(id);
  if (walletId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  const moveParsed = reorderMoveSchema.safeParse(body);
  if (moveParsed.success) {
    await moveWallet(userId, walletId, moveParsed.data.move);
    const wallets = await listWallets(userId, { includeArchived: true });
    return NextResponse.json({ wallets });
  }

  const parsed = walletUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateWallet(userId, walletId, parsed.data);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if ("ok" in result && result.ok === false) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ wallet: result });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = parseId(id);
  if (walletId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await deleteWallet(userId, walletId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
