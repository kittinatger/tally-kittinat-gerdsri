import { NextRequest, NextResponse } from "next/server";
import { listRecurringRules, createRecurringRule } from "@/lib/db";
import { recurringRuleInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const rules = await listRecurringRules(userId);
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = recurringRuleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.type === "transfer" && !parsed.data.direction) {
    return NextResponse.json({ error: "Transfers need a direction" }, { status: 400 });
  }
  const rule = await createRecurringRule(userId, parsed.data);
  return NextResponse.json({ rule }, { status: 201 });
}
