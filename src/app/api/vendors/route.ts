import { NextRequest, NextResponse } from "next/server";
import { listVendorStats, renameMerchant } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_MERCHANT_LENGTH = 120;

export async function GET() {
  const userId = await getUserId();
  const vendors = await listVendorStats(userId);
  return NextResponse.json({ vendors });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const oldName = typeof body?.oldName === "string" ? body.oldName.trim() : "";
  const newName = typeof body?.newName === "string" ? body.newName.trim() : "";

  if (!oldName || !newName) {
    return NextResponse.json({ error: "Both oldName and newName are required." }, { status: 400 });
  }
  if (newName.length > MAX_MERCHANT_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MAX_MERCHANT_LENGTH} characters or fewer.` }, { status: 400 });
  }

  await renameMerchant(userId, oldName, newName);
  return NextResponse.json({ ok: true });
}
