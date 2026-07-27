import { NextRequest, NextResponse } from "next/server";
import { extractTransactionFromAudio } from "@/lib/gemini";
import { listCategories } from "@/lib/db";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
]);

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("audio");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No audio recording was uploaded." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported audio format." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording is too long (max 15MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const categoryRows = await listCategories();
    const categories = {
      expense: categoryRows.filter((c) => c.type === "expense").map((c) => c.name),
      income: categoryRows.filter((c) => c.type === "income").map((c) => c.name),
    };
    const result = await extractTransactionFromAudio(base64, file.type, categories);
    return NextResponse.json({ extraction: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to understand that recording.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
