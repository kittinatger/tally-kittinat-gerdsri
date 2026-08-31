import { GoogleGenAI } from "@google/genai";
import { withGeminiRetry } from "@/lib/gemini";

// Generates a new, abstract decorative pattern "inspired by" a scanned
// card photo — used by CardPhotoScanModal's "Generate AI pattern" option,
// as an alternative to using the corrected photo directly (see the
// CardBackground union in card-backgrounds.ts; both end up stored the same
// way, as a plain image). Kept in its own file rather than gemini.ts since
// that one is entirely about text extraction (transactions from receipts/
// voice) — this is the only image *generation* call in the app.
// Unlike gemini.ts's text/vision calls, there's no separate lighter image-
// generation model to fall back to on this one when it's rate-limited —
// Gemini doesn't currently offer a "lite" image model with its own quota
// the way it does for text/vision. This stays single-model, retry-only;
// a rate-limited request here just fails with today's "model is busy"
// message and the user tries again shortly.
const IMAGE_MODEL = "gemini-2.5-flash-image";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
}

// Deliberately instructs the model to abstract away anything that could
// reproduce the real card's identifying details or a bank/network's
// trademarked branding — this must come back as an original decorative
// pattern "inspired by" the photo, never an attempted copy of it. Same
// reasoning as WalletCardShape's plain-text network labels (see its
// comment) — this app doesn't reproduce real card/logo artwork.
const PROMPT = `You are given a photo of a physical card (a payment card, membership card, or
similar), already cropped and straightened to the card's own rectangle.

Generate a NEW, original, abstract decorative background pattern or texture that takes
inspiration from this card's color palette and general visual style (its gradient, texture, or
geometric motifs) — this must NOT be a copy or close recreation of the card itself.

Strict rules:
- Do not reproduce any text, numbers, logos, brand marks, or other identifying details visible on
  the card.
- Do not attempt to recreate the exact card design — invent a new abstract pattern that merely
  echoes its colors and overall style.
- The output must be a flat, seamless, edge-to-edge pattern suitable as a smartphone wallet card
  background — no border, frame, or card-shaped outline in the image itself.

Output only the generated image, nothing else.`;

export async function generateCardPatternImage(imageBase64: string, mimeType: string): Promise<{ data: string; mimeType: string }> {
  const ai = getClient();
  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: PROMPT }, { inlineData: { mimeType, data: imageBase64 } }],
        },
      ],
    }),
  );

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    // Same wording as gemini.ts's empty-response errors, matched by
    // KNOWN_GEMINI_MESSAGES in gemini-error.ts so it's shown to the user
    // as-is instead of a generic fallback.
    throw new Error("The model returned an empty response.");
  }

  return { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType ?? "image/png" };
}
