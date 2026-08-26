import { NextRequest, NextResponse } from "next/server";
import { addExpenseReceipt, listExpenseReceipts } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_RECEIPTS_PER_EXPENSE = 10;

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const expenseId = parseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const receipts = await listExpenseReceipts(userId, expenseId);
  return NextResponse.json({ receipts });
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

  const existing = await listExpenseReceipts(userId, expenseId);
  if (existing.length >= MAX_RECEIPTS_PER_EXPENSE) {
    return NextResponse.json({ error: `You can attach up to ${MAX_RECEIPTS_PER_EXPENSE} photos per transaction.` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const receiptId = await addExpenseReceipt(userId, expenseId, buffer, file.type);
    if (receiptId === null) {
      return NextResponse.json({ error: "That transaction could not be found." }, { status: 404 });
    }
    return NextResponse.json({ id: receiptId }, { status: 201 });
  } catch (err) {
    console.error("add expense receipt: failed to save image:", err);
    return NextResponse.json({ error: "Could not save that image. Please try again." }, { status: 502 });
  }
}
