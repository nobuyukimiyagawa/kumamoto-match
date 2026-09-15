"use client";

import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AuthButtons, { type SignupRole } from "@/components/AuthButtons";
import { useSessionId } from "@/lib/store";

const COPY: Record<SignupRole, { hud: string; title: string; lead: string; color: string; steps: string[]; other: { href: string; label: string } }> = {
  team: {
    hud: "team // 募集する側", title: "チームとして登録", color: "var(--match)",
    lead: "登録した人がチームのオーナーになります。募集を出す・エントリーを承認するのはオーナーと運営者だけです。",
    steps: ["ログイン方法を選ぶ（Google / LINE / メール＋パスワード）", "代表者のプロフィールを登録（表示名・エリア）", "チームを登録（チーム名・活動エリア・レベル帯）", "完了。募集を出せます"],
    other: { href: "/signup/player/", label: "個人（助っ人）として登録する" },
  },
  player: {
    hud: "player // エントリーする側", title: "個人として登録", color: "var(--helper)",
    lead: "助っ人としてチームの募集にエントリーします。募集チームに見えるのは表示名・活動エリア・ポジション・評価だけです。",
    steps: ["ログイン方法を選ぶ（Google / LINE / メール＋パスワード）", "プロフィールを登録（表示名・エリア・ポジション）", "完了。助っ人募集にエントリーできます"],
    other: { href: "/signup/team/", label: "チームとして登録する" },
  },
};

/** 種類ごとの新規登録画面。手順を先に見せてから、ログイン方法を選んでもらう */
export default function SignupRolePage({ role }: { role: SignupRole }) {
  const sid = useSessionId();
  const c = COPY[role];
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-8">
        <Link href="/signup/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← 登録の種類を選び直す</Link>
        <p className="hud mt-4" style={{ color: c.color }}>{c.hud}</p>
        <h1 className="mt-1 text-[22px] font-bold">{c.title}</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>{c.lead}</p>

        <ol className="card mt-5 flex flex-col gap-2 p-4 text-[14px]">
          {c.steps.map((s, i) => (
            <li key={s} className="flex gap-2">
              <span className="badge badge-gray num" style={{ color: c.color, borderColor: c.color }}>{i + 1}</span>{s}
            </li>
          ))}
        </ol>

        <div className="mt-5">
          {sid ? (
            <div className="card p-5 text-center">
              <p className="font-bold">すでにログイン済みです</p>
              <Link href={role === "team" ? "/team/new/" : "/me/"} className="btn btn-primary mt-4">
                {role === "team" ? "チームを作る" : "マイページへ"}
              </Link>
            </div>
          ) : (
            <AuthButtons intent="signup" role={role} />
          )}
        </div>
        {!sid && (
          <p className="mt-6 flex flex-col items-center gap-1 text-center text-[14px]">
            <span>登録済みの方は<Link href="/login/" className="ml-1 font-bold" style={{ color: "var(--primary)" }}>ログイン</Link></span>
            <Link href={c.other.href} className="font-bold" style={{ color: "var(--text-sub)" }}>{c.other.label} →</Link>
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
