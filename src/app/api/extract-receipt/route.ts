import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { extractTransaction } from "@/lib/gemini";
import { getAutoConvertCurrency, getCurrency, listCategories, listWallets } from "@/lib/db";
import { maybeAutoConvert } from "@/lib/exchange-rate";
import { getUserId } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(req: NextRequest) {
  const userId = await getUserId();
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
    const [categoryRows, defaultCurrency, autoConvertEnabled, walletRows] = await Promise.all([
      listCategories(userId),
      getCurrency(userId),
      getAutoConvertCurrency(userId),
      listWallets(userId),
    ]);
    const categories = {
      expense: categoryRows.filter((c) => c.type === "expense").map((c) => c.name),
      income: categoryRows.filter((c) => c.type === "income").map((c) => c.name),
      transfer: categoryRows.filter((c) => c.type === "transfer").map((c) => c.name),
    };
    const extraction = await extractTransaction(base64, file.type, categories, walletRows.map((w) => w.name));
    const result = await maybeAutoConvert(extraction, defaultCurrency, autoConvertEnabled);
    return NextResponse.json({ extraction: result });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 429 || err.status === 503)) {
      return NextResponse.json(
        { error: "Gemini is busy right now. Please try again in a moment." },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Failed to read the document.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
