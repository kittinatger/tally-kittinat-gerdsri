import { NextResponse } from "next/server";
import { listDistinctMerchants } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const merchants = await listDistinctMerchants(userId);
  return NextResponse.json({ merchants });
}
