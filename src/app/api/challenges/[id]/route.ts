import { NextRequest, NextResponse } from "next/server";
import { getChallenge, leaveChallenge } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const challengeId = parseId(id);
  if (challengeId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const result = await getChallenge(userId, challengeId);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const challengeId = parseId(id);
  if (challengeId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await leaveChallenge(userId, challengeId);
  return NextResponse.json({ ok: true });
}
