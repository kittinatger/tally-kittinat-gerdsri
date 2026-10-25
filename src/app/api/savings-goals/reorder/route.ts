import { NextRequest, NextResponse } from "next/server";
import { reorderSavingsGoals, listSavingsGoals } from "@/lib/db";
import { walletReorderInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

// Drag-to-reorder in Settings — sets the full order of the user's savings goals in
// one request (see reorderSavingsGoals in db.ts) and returns the list in its new order.
export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = walletReorderInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await reorderSavingsGoals(userId, parsed.data.orderedIds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ goals: await listSavingsGoals(userId) });
}
