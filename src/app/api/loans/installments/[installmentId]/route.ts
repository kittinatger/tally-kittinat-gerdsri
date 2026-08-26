import { NextRequest, NextResponse } from "next/server";
import { toggleLoanInstallmentPaid } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ installmentId: string }> }) {
  const userId = await getUserId();
  const { installmentId } = await params;
  const parsedId = parseId(installmentId);
  if (parsedId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await toggleLoanInstallmentPaid(userId, parsedId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
