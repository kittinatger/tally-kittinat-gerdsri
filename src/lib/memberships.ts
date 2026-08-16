// Exactly the symbologies both the client-side renderer (qrcode/jsbarcode)
// and the camera scanner (@zxing/browser) support well.
export const MEMBERSHIP_CODE_FORMATS = ["qr", "code128", "ean13", "upc"] as const;
export type MembershipCodeFormat = (typeof MEMBERSHIP_CODE_FORMATS)[number];

export function isMembershipCodeFormat(value: string): value is MembershipCodeFormat {
  return (MEMBERSHIP_CODE_FORMATS as readonly string[]).includes(value);
}
