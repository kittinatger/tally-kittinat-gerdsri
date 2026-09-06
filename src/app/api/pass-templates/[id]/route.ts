import { NextRequest, NextResponse } from "next/server";
import { updatePassTemplate, deletePassTemplate } from "@/lib/db";
import { toPassTemplateOption } from "@/lib/membership-card-mapper";
import { passTemplateUpdateSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Admin-only — approve/reject (just `{status}`) or a full edit (any
// combination of name/kind/color/background/textColor/force_*/category/
// status), same shape as /api/card-templates/[id].
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
  const parsed = passTemplateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await updatePassTemplate(templateId, parsed.data);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ template: toPassTemplateOption(template) });
}

// Admin-only, permanent — a template is never referenced by a pass (only
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
  const ok = await deletePassTemplate(templateId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
