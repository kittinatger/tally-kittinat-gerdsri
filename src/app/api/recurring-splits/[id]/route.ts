import { NextRequest, NextResponse } from "next/server";
import { deleteRecurringSplit, setRecurringSplitActive } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  await setRecurringSplitActive(userId, Number(id), body.active);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  await deleteRecurringSplit(userId, Number(id));
  return NextResponse.json({ ok: true });
}
