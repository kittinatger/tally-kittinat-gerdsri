import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function POST() {
  const userId = await getUserId();
  await markAllNotificationsRead(userId);
  return NextResponse.json({ ok: true });
}
