import { NextRequest, NextResponse } from "next/server";
import { listRecentWalletExpenses } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

// Powers the "Latest Transactions" list on a wallet's detail view — see
// AccountDetail.tsx. Deliberately its own small, capped endpoint rather
// than reusing GET /api/expenses (which returns the account's entire
// history, up to 10,000 rows) just to filter and slice client-side.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const walletId = parseId(id);
  if (walletId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const rawLimit = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  const expenses = await listRecentWalletExpenses(userId, walletId, limit);
  return NextResponse.json({ expenses });
}
