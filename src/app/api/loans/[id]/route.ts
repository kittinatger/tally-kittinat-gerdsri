import { NextRequest, NextResponse } from "next/server";
import { deleteLoan, listLoanInstallments } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const loanId = parseId(id);
  if (loanId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const installments = await listLoanInstallments(userId, loanId);
  return NextResponse.json({ installments });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const loanId = parseId(id);
  if (loanId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteLoan(userId, loanId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
