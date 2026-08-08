import { NextRequest, NextResponse } from "next/server";
import { getActivitiesDefaultWalletId, setActivitiesDefaultWalletId } from "@/lib/db";
import { activitiesDefaultWalletInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const walletId = await getActivitiesDefaultWalletId(userId);
  return NextResponse.json({ walletId });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = activitiesDefaultWalletInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    await setActivitiesDefaultWalletId(userId, parsed.data.walletId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update that setting.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ walletId: parsed.data.walletId });
}
