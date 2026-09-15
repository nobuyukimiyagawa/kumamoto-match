"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { takeAuthIntent } from "@/components/AuthButtons";
import { getProfile, teamsRunBy, useDB, useSessionId } from "@/lib/store";

/**
 * 認証（Google / LINE / メールリンク）から戻ってくる場所。
 * プロフィールの有無と「ログインのつもりか登録のつもりか」で行き先を分ける。
 *   プロフィールあり + 新規登録 → 「登録済みです」と伝えてマイページ
 *   プロフィールあり + ログイン → チームを運営していればチーム管理、そうでなければマイページ
 *   プロフィールなし → ようこそ（種類に応じた登録手順）
 */
export default function AuthDonePage() {
  const db = useDB();
  const sid = useSessionId();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!sid || !db.ready) return;
    const intent = takeAuthIntent();
    const me = getProfile(db, sid);
    if (!me) { router.replace("/welcome/"); return; }
    const home = teamsRunBy(db, sid).length > 0 ? "/team/" : "/me/";
    if (intent === "signup") {
      // 描画中の setState を避けるため、次のティックで出す
      window.setTimeout(() => setMsg("このアカウントはすでに登録済みです。管理画面に移動します。"), 0);
      window.setTimeout(() => router.replace(home), 1500);
    } else {
      router.replace(home);
    }
  }, [sid, db, router]);

  return (
    <main className="min-h-dvh">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-10 text-center">
        {msg ? (
          <p className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>{msg}</p>
        ) : timedOut && !sid ? (
          <>
            <p className="text-[15px] font-bold">ログインを確認できませんでした</p>
            <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>リンクの有効期限が切れているか、別のブラウザで開いた可能性があります。</p>
            <Link href="/login/" className="btn btn-ghost mt-4">ログイン画面へ</Link>
          </>
        ) : (
          <p className="text-[15px]" style={{ color: "var(--text-sub)" }}>ログインを確認しています…</p>
        )}
      </div>
    </main>
  );
}
