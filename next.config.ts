import type { NextConfig } from "next";

// GitHub Pages のプロジェクトページ配信に合わせる。
// 独自ドメインや Vercel に移すときは REPO を空にする。
const REPO = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",          // サーバー不要の静的書き出し
  trailingSlash: true,       // /post/new/ で index.html が引けるように
  basePath: REPO || undefined,
  assetPrefix: REPO || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
