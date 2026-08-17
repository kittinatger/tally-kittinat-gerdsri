import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import type { MembershipCodeFormat } from "@/lib/memberships";

// Anything the multi-format reader can decode that isn't one of our six
// supported symbologies (Code 39, ITF, Codabar, EAN-8, UPC-E, ...) still
// gets treated as a usable linear-barcode value — rendered back as
// CODE128, which is the most broadly compatible fallback — rather than
// rejecting a successful scan outright.
export function toMembershipFormat(format: BarcodeFormat): MembershipCodeFormat {
  switch (format) {
    case BarcodeFormat.QR_CODE:
      return "qr";
    case BarcodeFormat.EAN_13:
      return "ean13";
    case BarcodeFormat.UPC_A:
      return "upc";
    case BarcodeFormat.PDF_417:
      return "pdf417";
    case BarcodeFormat.AZTEC:
      return "aztec";
    default:
      return "code128";
  }
}

// Decodes a QR/barcode from a still image file — shared by ScanCardModal's
// "Choose from photos" button and AddCardEntryModal's Photo gallery/From
// file tiles, so this is written once. Returns null (never throws) on
// failure so callers can show their own error copy.
export async function decodePassImage(file: File): Promise<{ value: string; format: MembershipCodeFormat } | null> {
  const url = URL.createObjectURL(file);
  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(url);
    return { value: result.getText(), format: toMembershipFormat(result.getBarcodeFormat()) };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
