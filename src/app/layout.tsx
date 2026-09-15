import type { Metadata, Viewport } from "next";
import { BIZ_UDPGothic, Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";

// 和文もの数字も1書体で。UD フォントは小さくても読み違えが少ない
const body = BIZ_UDPGothic({
  subsets: ["latin"], weight: ["400", "700"], variable: "--font-body",
});
// 計器の英数字。ロゴと見出し用（和文には使わない）
const display = Orbitron({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
// 計器の読み取り値。日時・座標・件数など
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--font-mono" });

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description:
    `${SITE.area}のアマチュアサッカー向けマッチング。チーム同士のトレーニングマッチと、` +
    `試合の助っ人を、日付と地図から探せます。`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07090c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${body.variable} ${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
