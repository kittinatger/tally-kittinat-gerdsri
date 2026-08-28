import { NextRequest, NextResponse } from "next/server";
import { listRecurringSplits, createRecurringSplit } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { SPLIT_METHODS } from "@/lib/splits";
import { RECURRING_FREQUENCIES } from "@/lib/validation";

export async function GET() {
  const userId = await getUserId();
  const rows = await listRecurringSplits(userId);
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body.title !== "string" ||
    !body.title.trim() ||
    typeof body.totalAmount !== "number" ||
    body.totalAmount <= 0 ||
    !SPLIT_METHODS.includes(body.splitMethod) ||
    !Array.isArray(body.participantIds) ||
    body.participantIds.some((id: unknown) => typeof id !== "number") ||
    !RECURRING_FREQUENCIES.includes(body.frequency) ||
    typeof body.startDate !== "string"
  ) {
    return NextResponse.json({ error: "Invalid recurring split." }, { status: 400 });
  }

  const result = await createRecurringSplit(userId, {
    title: body.title.trim(),
    totalAmount: body.totalAmount,
    splitMethod: body.splitMethod,
    participantIds: body.participantIds,
    frequency: body.frequency,
    startDate: body.startDate,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ row: result.row }, { status: 201 });
}
