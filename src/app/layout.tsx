import type { Metadata } from "next";
import { Radley, Arimo, Noto_Sans_Thai, Noto_Sans_Arabic, Noto_Sans_Devanagari, Noto_Sans_Bengali } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AppLockGate from "@/components/AppLockGate";
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

export const metadata: Metadata = {
  title: "Tally — Personal Expense Tracker",
  description: "A private, personal expense tracker with receipt scanning.",
  manifest: "/manifest.json",
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
          <AppLockGate>{children}</AppLockGate>
        </LanguageProvider>
      </body>
    </html>
  );
}
