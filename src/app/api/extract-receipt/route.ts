import { NextRequest, NextResponse } from "next/server";
import { extractReceipt } from "@/lib/gemini";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(req: NextRequest) {
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
  const base64 = buffer.toString("base64");

  try {
    const result = await extractReceipt(base64, file.type);
    return NextResponse.json({ extraction: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read the receipt.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
