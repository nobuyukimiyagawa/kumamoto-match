"use client";

import Link from "next/link";

/**
 * 「チームとして」「個人として」の入口を並べる。
 * 新規登録の最初と、登録の種類が分からないときのようこそ画面で使う。
 */
export default function RoleCards({
  teamHref, playerHref, onPick,
}: { teamHref?: string; playerHref?: string; onPick?: (r: "team" | "player") => void }) {
  const items = [
    {
      role: "team" as const, href: teamHref, hud: "team // 募集する側",
      title: "チームとして登録", color: "var(--match)",
      lead: "トレーニングマッチの相手や、試合の助っ人を募集する",
      points: ["募集を出して、エントリーを承認する", "他チームのトレーニングマッチにエントリーする", "対戦相手・助っ人を五つ星で評価する"],
    },
    {
      role: "player" as const, href: playerHref, hud: "player // エントリーする側",
      title: "個人として登録", color: "var(--helper)",
      lead: "試合の助っ人としてチームにエントリーする",
      points: ["ポジションと活動エリアを登録する", "助っ人募集にエントリーして、承認を待つ", "試合後にチームを五つ星で評価する"],
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((it) => {
        const body = (
          <>
            <p className="hud" style={{ color: it.color }}>{it.hud}</p>
            <p className="mt-1.5 text-[18px] font-bold">{it.title}</p>
            <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>{it.lead}</p>
            <ul className="mt-3 flex flex-col gap-1 text-[13.5px]">
              {it.points.map((p) => (
                <li key={p} className="flex gap-2"><span aria-hidden style={{ color: it.color }}>▸</span>{p}</li>
              ))}
            </ul>
            <span className="btn btn-primary mt-4 w-full" aria-hidden>{it.title.replace("登録", "はじめる")}</span>
          </>
        );
        const cls = "card block p-5 text-left no-underline transition-colors hover:border-[var(--text-sub)]";
        return it.href ? (
          <Link key={it.role} href={it.href} className={cls} style={{ color: "var(--text)" }}>{body}</Link>
        ) : (
          <button key={it.role} type="button" className={cls} style={{ color: "var(--text)" }} onClick={() => onPick?.(it.role)}>{body}</button>
        );
      })}
    </div>
  );
}
