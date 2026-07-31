import type { Metadata } from "next";
import { Radley, Arimo } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
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

export const metadata: Metadata = {
  title: "Tally — Personal Expense Tracker",
  description: "A private, personal expense tracker with receipt scanning.",
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
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
      className={`${radley.variable} ${arimo.variable} h-full antialiased`}
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
        {children}
      </body>
    </html>
  );
}
