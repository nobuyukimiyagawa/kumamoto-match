import type { Metadata } from "next";
import { Barlow_Condensed, BIZ_UDPGothic } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";

// 数字と英字。時刻が締まり、案内板の質感になる
const display = Barlow_Condensed({
  subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display",
});
// 和文。公営施設の掲示に近い実用感。小さくても読める
const body = BIZ_UDPGothic({
  subsets: ["latin"], weight: ["400", "700"], variable: "--font-body",
});

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description:
    `${SITE.area}のアマチュアサッカー向けマッチング。チーム同士のトレーニングマッチと、` +
    `試合の助っ人を、日付と地図から探せます。`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
