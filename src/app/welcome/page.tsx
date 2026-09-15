"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ProfileForm from "@/components/ProfileForm";
import { getAuthMeta, getProfile, useDB, useSessionId } from "@/lib/store";

/** 初回登録の続き。プロフィールを入れてもらい、完了画面で次の行動を示す */
export default function WelcomePage() {
  return <Suspense fallback={null}><Welcome /></Suspense>;
}

function Step({ n, label, state }: { n: number; label: string; state: "done" | "now" | "todo" }) {
  const bg = state === "done" ? "var(--primary)" : state === "now" ? "var(--primary-bg)" : "var(--surface-2)";
  const fg = state === "done" ? "#061008" : state === "now" ? "var(--primary)" : "var(--text-sub)";
  return (
    <li className="flex items-center gap-2 text-[13.5px]" style={{ color: state === "todo" ? "var(--text-sub)" : "var(--text)" }}>
      <span className="num inline-flex h-6 w-6 items-center justify-center rounded-full font-bold" style={{ background: bg, color: fg }}>
        {state === "done" ? "✓" : n}
      </span>
      {label}
    </li>
  );
}

function Welcome() {
  const db = useDB();
  const sid = useSessionId();
  const params = useSearchParams();
  const router = useRouter();
  const done = params.get("done") === "1";
  const me = sid ? getProfile(db, sid) : null;

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;
  if (!sid) {
    return (
      <main className="min-h-dvh"><Header />
        <div className="mx-auto max-w-md px-4 pt-10 text-center">
          <p className="font-bold">先に登録方法を選んでください</p>
          <Link href="/signup/" className="btn btn-primary mt-4">新規登録へ</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <ol className="mb-5 flex flex-wrap gap-x-6 gap-y-2">
          <Step n={1} label="ログイン方法を選ぶ" state="done" />
          <Step n={2} label="プロフィールを登録" state={done || me ? "done" : "now"} />
          <Step n={3} label="完了" state={done ? "now" : "todo"} />
        </ol>

        {done && me ? (
          <div className="card p-6 text-center">
            <p className="text-[20px] font-bold">登録が完了しました</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>
              {me.displayName} さん、ようこそ。募集を探してエントリーしたり、チームを作って募集を出したりできます。
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/" className="btn btn-primary">募集を探す</Link>
              <Link href="/team/new/" className="btn btn-ghost">チームを作る（チーム運営の方）</Link>
            </div>
          </div>
        ) : me ? (
          <div className="card p-6 text-center">
            <p className="font-bold">プロフィールは登録済みです</p>
            <Link href="/me/" className="btn btn-primary mt-4">マイページへ</Link>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-bold">はじめまして</h1>
            <p className="mb-4 mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
              最初にプロフィールを登録してください。募集チームや対戦相手に見える情報です。
            </p>
            <ProfileForm id={sid} defaultName={getAuthMeta()?.name} onDone={() => router.replace("/welcome/?done=1")} />
          </>
        )}
      </div>
    </main>
  );
}
