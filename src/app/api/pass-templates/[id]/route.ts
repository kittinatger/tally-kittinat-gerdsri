import { NextRequest, NextResponse } from "next/server";
import { updatePassTemplateStatus, deletePassTemplate } from "@/lib/db";
import { toPassTemplateOption } from "@/lib/membership-card-mapper";
import { passTemplateStatusSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Admin-only — approve/reject/re-review (`{status}`). No full-edit surface
// here, unlike /api/card-templates/[id] — see updatePassTemplateStatus's
// comment in db.ts for why.
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
  const parsed = passTemplateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await updatePassTemplateStatus(templateId, parsed.data.status);
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
