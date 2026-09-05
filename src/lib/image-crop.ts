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
  // imageOrientation: "from-image" matches what a plain <img> (and its
  // naturalWidth/naturalHeight) already shows — ImageCropModal's frame
  // math is entirely based on that <img>'s dimensions/orientation. Without
  // this, createImageBitmap defaults to ignoring EXIF orientation and
  // hands back the raw, un-rotated sensor pixels — for a phone photo shot
  // in portrait (extremely common for e.g. a card banner), that's a
  // different orientation/dimensions than what the user actually framed,
  // so the exact crop rectangle they positioned gets applied to the wrong
  // orientation of the image. Everything looked right while dragging the
  // frame (that used the correctly-oriented <img>); only the saved result
  // came out wrong.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(outputWidth));
    canvas.height = Math.max(1, Math.round(outputHeight));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("Could not export the cropped image");

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
