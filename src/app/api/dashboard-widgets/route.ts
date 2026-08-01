import { NextRequest, NextResponse } from "next/server";
import { getDashboardWidgets, setDashboardWidgets } from "@/lib/db";
import { dashboardWidgetsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const widgets = await getDashboardWidgets(userId);
  return NextResponse.json({ widgets });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = dashboardWidgetsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const widgets = await setDashboardWidgets(userId, parsed.data.widgets);
  return NextResponse.json({ widgets });
}
