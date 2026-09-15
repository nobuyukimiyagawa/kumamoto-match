import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LEGAL_UPDATED } from "@/config/operator";

/** 規約類の共通の枠。見出し・更新日・本文 */
export default function LegalPage({ title, hud, children }: { title: string; hud: string; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh">
      <Header />
      <article className="mx-auto max-w-3xl px-4 pt-8">
        <p className="hud hud-accent">{hud}</p>
        <h1 className="mt-1 text-[24px] font-bold">{title}</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-sub)" }}>最終更新日: {LEGAL_UPDATED}</p>
        <div className="legal mt-6">{children}</div>
      </article>
      <Footer />
    </main>
  );
}
