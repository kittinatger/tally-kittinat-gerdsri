import { loadImageElement } from "@/lib/load-image-element";

// Rasterizes a chosen crop rectangle (in natural image-pixel coordinates,
// top-left origin) out of a source image file into a new downscaled File —
// used by ImageCropModal once the user confirms their pan/zoom/frame
// selection. Always re-encodes as JPEG, same reasoning as
// image-downscale.ts (sidesteps any format quirks, e.g. HEIC).
export async function cropImageToFile(
  file: File,
  crop: { x: number; y: number; width: number; height: number },
  outputWidth: number,
  outputHeight: number,
): Promise<File> {
  // Goes through a plain <img> (loadImageElement), not createImageBitmap —
  // see that function's comment. ImageCropModal's whole frame/crop-
  // rectangle math is built on an <img>'s naturalWidth/naturalHeight, so
  // drawing from that same kind of element here is what actually
  // guarantees the saved crop matches what was visually framed, on every
  // browser.
  const img = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(outputWidth));
  canvas.height = Math.max(1, Math.round(outputHeight));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not export the cropped image");

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
