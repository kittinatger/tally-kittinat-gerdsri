import { NextRequest, NextResponse } from "next/server";
import { updateRecurringRule, deleteRecurringRule, moveRecurringRule, listRecurringRules } from "@/lib/db";
import { recurringRuleUpdateSchema, reorderMoveSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const ruleId = parseId(id);
  if (ruleId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  const moveParsed = reorderMoveSchema.safeParse(body);
  if (moveParsed.success) {
    await moveRecurringRule(userId, ruleId, moveParsed.data.move);
    const rules = await listRecurringRules(userId);
    return NextResponse.json({ rules });
  }

  const parsed = recurringRuleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rule = await updateRecurringRule(userId, ruleId, parsed.data);
  if (!rule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ rule });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const ruleId = parseId(id);
  if (ruleId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = await deleteRecurringRule(userId, ruleId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
