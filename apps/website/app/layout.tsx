import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "lumipdf/styles";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "LumiPDF - Modern React PDF viewer",
    template: "%s · LumiPDF",
  },
  description:
    "LumiPDF is a high-performance React PDF viewer. Virtualized rendering, search, annotations, and a TypeScript-first API on PDF.js.",
  keywords: [
    "PDF",
    "React PDF",
    "PDF viewer",
    "document viewer",
    "PDF.js",
    "LumiPDF",
  ],
  openGraph: {
    title: "LumiPDF - Modern React PDF viewer",
    description:
      "A high-performance React PDF viewer. Install with npm install lumipdf.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} min-h-svh font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
