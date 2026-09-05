import { NextRequest, NextResponse } from "next/server";
import { attachMembershipLogo, getMembershipLogo, removeMembershipLogo } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — the logo is rendered small, no need for the receipt's 8MB ceiling
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const cardId = parseId(id);
  if (cardId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
    const ok = await attachMembershipLogo(userId, cardId, buffer, file.type);
    if (!ok) {
      return NextResponse.json({ error: "That card could not be found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("attach membership logo: failed to save image:", err);
    return NextResponse.json({ error: "Could not save that image. Please try again." }, { status: 502 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const cardId = parseId(id);
  if (cardId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const image = await getMembershipLogo(userId, cardId);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mimeType,
      // Was "private, max-age=86400" — this URL never changes when the
      // logo itself is replaced (no version/ETag in the path or headers),
      // so the browser kept serving the old cached bytes for a full day
      // after a re-crop/re-upload with no way to tell it's stale. Editing
      // a logo, saving, then reopening the pass showed the old image —
      // and re-editing it read that same stale cache right back in,
      // making it look like the crop itself hadn't taken effect.
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const cardId = parseId(id);
  if (cardId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = await removeMembershipLogo(userId, cardId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
