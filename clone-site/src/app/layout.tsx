import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crypto.com International: Buy, Sell & Trade Crypto with a Trusted App",
  description:
    "Trade BTC, ETH, CRO, and 400+ crypto in your local currency. The only crypto platform you need.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#080D1B] font-sans text-[#F7F9FA]">
        {children}
      </body>
    </html>
  );
}
