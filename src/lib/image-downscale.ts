// Client-side only: shrinks a photo before it ever leaves the browser, for
// two reasons at once — camera photos are routinely 4-8MB at full
// resolution, which is unnecessary for Gemini to read text off a receipt
// and bloats the receipt_image column in Postgres for no benefit; and
// re-encoding through <canvas> always produces a plain JPEG regardless of
// the source format, which sidesteps any format Gemini's API is fussy
// about (e.g. iPhone photos captured as HEIC).
//
// Falls back to the original file untouched on any failure (unsupported
// format, decode error, etc.) — this is a best-effort optimization, not a
// correctness requirement, so a failure here should never block the user
// from submitting their original photo.

const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 0.82;

function isHeicLike(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;

    // Always take the re-encoded JPEG for HEIC/HEIF sources — some
    // environments reject HEIC when it's sent on to Gemini's API, so
    // normalizing the format matters here even if the JPEG re-encode isn't
    // smaller. Otherwise, only use it if it's actually smaller: a photo
    // that's already small/well-compressed can end up larger after a JPEG
    // re-encode, especially at less aggressive source compression.
    if (!isHeicLike(file) && scale === 1 && blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
