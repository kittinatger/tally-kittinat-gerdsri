// A plain <img>/Image() element has always reliably respected EXIF
// orientation across every browser — unlike createImageBitmap(), whose
// imageOrientation: "from-image" option (needed to get the same result)
// isn't consistently supported everywhere, notably on some iOS Safari
// versions, where it can silently no-op and hand back un-rotated pixels
// anyway. image-crop.ts and image-downscale.ts both need to draw a raw,
// possibly-EXIF-tagged photo into a <canvas> with the exact orientation
// the user actually sees on screen, so both go through this instead of
// createImageBitmap for that first read.
export function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}
