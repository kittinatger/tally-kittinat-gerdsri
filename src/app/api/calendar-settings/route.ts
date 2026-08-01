import { NextRequest, NextResponse } from "next/server";
import { getCalendarSettings, setCalendarSettings } from "@/lib/db";
import { calendarSettingsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const settings = await getCalendarSettings(userId);
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = calendarSettingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const settings = await setCalendarSettings(userId, parsed.data);
  return NextResponse.json(settings);
}
