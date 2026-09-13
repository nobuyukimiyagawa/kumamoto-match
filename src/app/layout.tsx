import type { Metadata, Viewport } from "next";
import { BIZ_UDPGothic } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";

// 和文もの数字も1書体で。UD フォントは小さくても読み違えが少ない
const body = BIZ_UDPGothic({
  subsets: ["latin"], weight: ["400", "700"], variable: "--font-body",
});

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description:
    `${SITE.area}のアマチュアサッカー向けマッチング。チーム同士のトレーニングマッチと、` +
    `試合の助っ人を、日付と地図から探せます。`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={body.variable}>
      <body>{children}</body>
    </html>
  );
}
