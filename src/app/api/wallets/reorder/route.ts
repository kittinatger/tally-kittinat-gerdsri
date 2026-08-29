import { NextRequest, NextResponse } from "next/server";
import { reorderWallets, listWallets } from "@/lib/db";
import { walletReorderInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

// Drag-to-reorder on the Wallet page's card stack/grid — sets the full
// order in one request (see reorderWallets in db.ts) rather than chaining
// N adjacent-swap requests through the existing move-up/move-down
// endpoint, which the up/down buttons in Manage accounts still use.
export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = walletReorderInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await reorderWallets(userId, parsed.data.orderedIds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  const wallets = await listWallets(userId);
  return NextResponse.json({ wallets });
}
