import { NextRequest, NextResponse } from "next/server";
import { attachReceiptImage, getReceiptImage } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const expenseId = parseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, WEBP, or HEIC." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ok = await attachReceiptImage(userId, expenseId, buffer, file.type);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const expenseId = parseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const image = await getReceiptImage(userId, expenseId);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
