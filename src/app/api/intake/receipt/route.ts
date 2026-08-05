import { NextRequest, NextResponse } from "next/server";
import { verifyApiToken, countRecentAutoImports } from "@/lib/db";
import { importReceiptImage } from "@/lib/receipt-intake";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_IMPORTS_PER_DAY = 100;

// Token-authenticated (not cookie/session-based) so an automation — an iOS
// Shortcut, for instance — can call this without a browser session. See
// Settings > Automatic import for how a user creates a token, and
// lib/receipt-intake.ts for what actually happens with the image: unlike
// the interactive /api/extract-receipt, this creates the transaction
// directly (no review step), since it's meant to run unattended.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <token> header." }, { status: 401 });
  }

  const userId = await verifyApiToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or revoked token." }, { status: 401 });
  }

  const recentCount = await countRecentAutoImports(userId, 24);
  if (recentCount >= MAX_IMPORTS_PER_DAY) {
    return NextResponse.json({ error: "Daily automatic import limit reached." }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No image file was uploaded (expected field name 'image')." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, WEBP, or HEIC." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importReceiptImage(userId, buffer, file.type);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, expense: { id: result.expense.id, merchant: result.expense.merchant, amount: result.expense.amount } }, { status: 201 });
}
