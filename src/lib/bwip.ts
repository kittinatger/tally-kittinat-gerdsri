// bwip-js renders every barcode/QR in the app, but it's a large library
// (most of the Wallet page's JavaScript when it was imported statically).
// Loaded once, on the first code actually drawn, and shared after that.
type Bwip = typeof import("bwip-js/browser");

let loading: Promise<Bwip> | null = null;

export function loadBwip(): Promise<Bwip> {
  loading ??= import("bwip-js/browser").then(
    // The package is CommonJS: bundlers expose it as `default` on the module.
    (m) => ((m as unknown as { default?: Bwip }).default ?? m) as Bwip,
  );
  return loading;
}
