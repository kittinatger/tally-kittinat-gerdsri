import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listSecurityEvents } from "@/lib/db";

export async function GET() {
  const userId = await getUserId();
  const events = await listSecurityEvents(userId);
  return NextResponse.json({ events });
}
