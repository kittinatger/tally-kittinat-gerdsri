import { NextRequest, NextResponse } from "next/server";
import { addFamilyMember, removeFamilyMember } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const memberId = parseId(id);
  if (memberId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const result = await addFamilyMember(userId, memberId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const memberId = parseId(id);
  if (memberId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await removeFamilyMember(userId, memberId);
  return NextResponse.json({ ok: true });
}
