import type { Metadata } from "next";
import { Radley, Arimo, Noto_Sans_Thai, Noto_Sans_Arabic, Noto_Sans_Devanagari, Noto_Sans_Bengali } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AppLockGate from "@/components/AppLockGate";
import OfflineProvider from "@/components/OfflineProvider";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";

const radley = Radley({
  variable: "--font-radley",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
});

// Arimo/Radley only cover Latin (plus Arimo covers Cyrillic + Vietnamese) —
// these fill in the scripts they don't, so every supported language renders
// in a deliberately-matched humanist sans instead of falling back to
// whatever default font each OS happens to pick. See globals.css's
// --font-sans/--font-display stacks for how they're chained in. Chinese and
// Japanese are deliberately left out here — Google's CJK subsets are huge
// (many MB) and can't be self-hosted piecemeal via next/font, so those two
// fall back to native OS UI fonts declared directly in globals.css instead.
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
});

// Same "pin a canonical domain via APP_URL, fall back to the request's own
// origin" reasoning as getAppOrigin() in lib/app-url.ts — metadataBase has
// to be a static URL evaluated at build/module-load time though (it can't
// read per-request headers), so this only ever uses the env var, with
// Vercel's own auto-populated VERCEL_URL as a second fallback so preview
// deployments still get resolvable (if not stable) og:image URLs.
const siteUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  ...(siteUrl && { metadataBase: new URL(siteUrl) }),
  title: "Tally — Personal Expense Tracker",
  description: "A private, personal expense tracker with receipt scanning.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Tally — Personal Expense Tracker",
    description: "A private, personal expense tracker with receipt scanning and voice entry.",
    siteName: "Tally",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tally — Personal Expense Tracker",
    description: "A private, personal expense tracker with receipt scanning and voice entry.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tally",
  },
  icons: {
    // The plain, unconditional PNG comes first as a fallback for surfaces
    // that don't evaluate the media-conditional SVGs below (e.g. Chrome on
    // Android's "Create shortcut" icon picker, which otherwise falls back
    // to a generated letter monogram instead of the real icon).
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0a130f" },
  ],
  // Without this, iOS treats the status bar/notch area as outside the
  // "layout viewport" entirely — a `fixed inset-0` element (Modal.tsx's
  // backdrop, ScanCardModal, CardPhotoScanModal, ...) stops short of the
  // real top edge instead of reaching it, leaving a gap that shows the
  // raw, unmasked page background above the overlay. `cover` extends the
  // layout viewport under the safe areas so those overlays truly go edge
  // to edge; body's own safe-area padding (globals.css) keeps ordinary
  // page content from sliding under the notch/status bar/home indicator
  // now that the viewport includes that space.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${radley.variable} ${arimo.variable} ${notoSansThai.variable} ${notoSansArabic.variable} ${notoSansDevanagari.variable} ${notoSansBengali.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint so the correct theme is applied with no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tally-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeSync />
        <ServiceWorkerRegister />
        <LanguageProvider>
          <AppLockGate>
            <OfflineProvider>{children}</OfflineProvider>
          </AppLockGate>
        </LanguageProvider>
      </body>
    </html>
  );
}
