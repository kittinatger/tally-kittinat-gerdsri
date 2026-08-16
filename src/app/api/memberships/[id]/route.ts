import { NextRequest, NextResponse } from "next/server";
import { updateMembershipCard, deleteMembershipCard, moveMembershipCard, listMembershipCards } from "@/lib/db";
import { membershipUpdateSchema, reorderMoveSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const cardId = parseId(id);
  if (cardId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  const moveParsed = reorderMoveSchema.safeParse(body);
  if (moveParsed.success) {
    await moveMembershipCard(userId, cardId, moveParsed.data.move);
    const cards = await listMembershipCards(userId);
    return NextResponse.json({ cards });
  }

  const parsed = membershipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const card = await updateMembershipCard(userId, cardId, parsed.data);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ card });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const cardId = parseId(id);
  if (cardId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = await deleteMembershipCard(userId, cardId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
