import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "World Clock News Bubbles",
  description: "世界各国の時計とニュースをバブルで可視化するWebサイト",
  keywords: ["世界時計", "ニュース", "可視化", "地球儀"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ec4899",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
