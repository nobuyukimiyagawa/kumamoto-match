import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description:
    `${SITE.area}のアマチュアサッカー向けマッチング。チーム同士のトレーニングマッチと、` +
    `試合の助っ人を、日付と地図から探せます。`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} antialiased`}>{children}</body>
    </html>
  );
}
