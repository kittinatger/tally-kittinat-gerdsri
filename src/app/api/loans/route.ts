import { NextRequest, NextResponse } from "next/server";
import { createLoan, listLoans } from "@/lib/db";
import { loanInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const loans = await listLoans(userId);
  return NextResponse.json({ loans });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = loanInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await createLoan(userId, {
    counterpartyFriendId: parsed.data.counterpartyFriendId,
    counterpartyName: parsed.data.counterpartyName,
    direction: parsed.data.direction,
    principal: parsed.data.principal,
    notes: parsed.data.notes ?? null,
    installments: parsed.data.installments ?? [],
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
