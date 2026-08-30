import { NextRequest, NextResponse } from "next/server";
import { updateCardTemplate, deleteCardTemplate } from "@/lib/db";
import { toCardTemplateOption } from "@/lib/wallet-mapper";
import { cardTemplateUpdateSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Admin-only — approve/reject (just `{status}`) or a full edit (any
// combination of name/color/background/textColor/force_*/status).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const templateId = parseId(id);
  if (templateId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = cardTemplateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await updateCardTemplate(templateId, parsed.data);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ template: toCardTemplateOption(template) });
}

// Admin-only, permanent — a template is never referenced by a wallet (only
// copied from at pick time), so there's nothing else to clean up.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const templateId = parseId(id);
  if (templateId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteCardTemplate(templateId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
