import type { Metadata } from "next";
import { Radley, Arimo } from "next/font/google";
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
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8eef4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1120" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${radley.variable} ${arimo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
