import { NextRequest, NextResponse } from "next/server";
import { attachPassTemplateBanner, getPassTemplateBanner, removePassTemplateBanner, getPassTemplateOwnerAndStatus } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// See the matching logo route's comment for the write/read access rules —
// identical here, just for the banner image.
async function canWrite(userId: number, templateId: number): Promise<boolean> {
  const owner = await getPassTemplateOwnerAndStatus(templateId);
  if (!owner) return false;
  if (owner.submittedBy === userId) return true;
  return isAdminUser(userId);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const templateId = parseId(id);
  if (templateId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!(await canWrite(userId, templateId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, or WEBP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 4MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const ok = await attachPassTemplateBanner(templateId, buffer, file.type);
    if (!ok) {
      return NextResponse.json({ error: "That template could not be found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("attach pass template banner: failed to save image:", err);
    return NextResponse.json({ error: "Could not save that image. Please try again." }, { status: 502 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const templateId = parseId(id);
  if (templateId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const owner = await getPassTemplateOwnerAndStatus(templateId);
  if (!owner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const allowed = owner.status === "approved" || owner.submittedBy === userId || (await isAdminUser(userId));
  if (!allowed) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const image = await getPassTemplateBanner(templateId);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const templateId = parseId(id);
  if (templateId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!(await canWrite(userId, templateId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const ok = await removePassTemplateBanner(templateId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
