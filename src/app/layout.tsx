import type { Metadata } from "next";
import { Inter, Radley, Arimo, Noto_Sans_Thai, Noto_Sans_Arabic, Noto_Sans_Devanagari, Noto_Sans_Bengali } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AppLockGate from "@/components/AppLockGate";
import OfflineProvider from "@/components/OfflineProvider";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";

// Only Inter's Latin file is preloaded (it is what virtually every first paint
// uses). Everything else is declared with preload: false — the @font-face rules
// still exist, so the browser fetches a file only when a page actually renders a
// character from it (via unicode-range) instead of every visitor downloading all
// of them up front. Preloading all of these was ~650KB on the welcome page.
const radley = Radley({
  variable: "--font-radley",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Inter's other scripts as a second, never-preloaded family chained after the
// Latin one in globals.css, so Russian/Vietnamese/Greek/extended-Latin text
// still renders in Inter without everyone paying for those files.
const interExtended = Inter({
  variable: "--font-inter-ext",
  subsets: ["latin-ext", "cyrillic", "vietnamese", "greek"],
  preload: false,
});

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  preload: false,
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
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  preload: false,
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  preload: false,
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  preload: false,
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
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
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
      data-design="modern"
      className={`${inter.variable} ${interExtended.variable} ${radley.variable} ${arimo.variable} ${notoSansThai.variable} ${notoSansArabic.variable} ${notoSansDevanagari.variable} ${notoSansBengali.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint so the correct theme is applied with no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tally-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);if(localStorage.getItem('tally-design')==='classic'){document.documentElement.setAttribute('data-design','classic');}}catch(e){}})();`,
          }}
        />
        {/* Starts AppLockGate's own check as early as the browser can issue a
         * request — document parse time, well before the JS bundle has even
         * downloaded, let alone hydrated and run the effect that used to be
         * the earliest this could start. AppLockGate picks this promise up
         * instead of firing its own fetch when it's already in flight;
         * either way the real server response is still always what's
         * waited on, so this only removes dead time, not the check itself.
         * The exempt-path list has to be duplicated here (AppLockGate's own
         * EXEMPT_PREFIXES is the source of truth) since this plain script
         * runs before any app code is loaded to import it from. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;var exempt=["/welcome","/login","/register","/forgot-password","/reset-password","/splits/","/offline","/embed/"];for(var i=0;i<exempt.length;i++){if(p.indexOf(exempt[i])===0)return;}window.__appLockPrecheck=fetch('/api/webauthn/credentials').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeSync />
        <ServiceWorkerRegister />
        <LanguageProvider>
          <AppLockGate>
            <OfflineProvider>{children}</OfflineProvider>
            <CommandPalette />
            <KeyboardShortcuts />
          </AppLockGate>
        </LanguageProvider>
      </body>
    </html>
  );
}
