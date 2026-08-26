import { NextRequest, NextResponse } from "next/server";
import { deleteExpenseReceipt, getExpenseReceiptImage } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// `id` (the expense) isn't read here — every lookup is scoped by
// receiptId + userId (see db.ts), which is sufficient on its own; it's
// only in the URL to keep receipts nested under their expense.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ receiptId: string }> }) {
  const userId = await getUserId();
  const { receiptId } = await params;
  const parsedId = parseId(receiptId);
  if (parsedId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const image = await getExpenseReceiptImage(userId, parsedId);
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ receiptId: string }> }) {
  const userId = await getUserId();
  const { receiptId } = await params;
  const parsedId = parseId(receiptId);
  if (parsedId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteExpenseReceipt(userId, parsedId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
