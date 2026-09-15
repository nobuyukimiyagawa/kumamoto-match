import Link from "next/link";
import { OPERATOR } from "@/config/operator";
import { SITE } from "@/config/site";

/** 各ページの末尾。運営者と規約類への導線 */
export default function Footer() {
  return (
    <footer className="mt-10 px-4 pb-24 pt-6 text-[12.5px] sm:pb-8" style={{ borderTop: "1px solid var(--line)", color: "var(--text-sub)" }}>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1">
        <Link href="/legal/terms/" className="underline">利用規約</Link>
        <Link href="/legal/privacy/" className="underline">プライバシーポリシー</Link>
        <Link href="/legal/tokushoho/" className="underline">特定商取引法に基づく表記</Link>
        <span className="ml-auto">運営: {OPERATOR.name}　© {SITE.name}</span>
      </div>
    </footer>
  );
}
