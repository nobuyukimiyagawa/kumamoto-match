"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AUTH_MODE, signInWithEmail, signInWithGoogle, signInWithLine, useSessionId } from "@/lib/store";

/** メールアドレスだけでログインする。届いたリンクを押せば完了（パスワード不要） */
export default function LoginPage() {
  const sid = useSessionId();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-[22px] font-bold">ログイン・新規登録</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          募集やエントリーにはログインが必要です。見るだけならログインは要りません。初めての方も同じ手順で登録できます。
        </p>

        {AUTH_MODE === "local" ? (
          <div className="card mt-5 p-5 text-center">
            <p className="font-bold">いまはデモモードです</p>
            <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>右上の「アカウント」から誰として使うかを選んでください。</p>
          </div>
        ) : sid ? (
          <div className="card mt-5 p-5 text-center">
            <p className="font-bold">ログイン済みです</p>
            <Link href="/me/" className="btn btn-primary mt-4">マイページへ</Link>
          </div>
        ) : (
          <>
          {/* まず Google / LINE。押すと各社の画面へ移り、戻ってくるとログイン済みになる */}
          {!sent && (
            <div className="card mt-5 flex flex-col gap-3 p-5">
              <button
                type="button" className="btn w-full" style={{ minHeight: 50, fontSize: 16, background: "#fff", border: "1px solid var(--line)", color: "var(--text)" }}
                onClick={async () => { setError(null); const r = await signInWithGoogle(); if (r.error) setError("Google でログインできませんでした。（" + r.error + "）"); }}
              >
                <span aria-hidden style={{ fontWeight: 700, color: "#4285F4" }}>G</span> Google でログイン
              </button>
              <button
                type="button" className="btn w-full" style={{ minHeight: 50, fontSize: 16, background: "#06C755", color: "#fff" }}
                onClick={() => signInWithLine()}
              >
                LINE でログイン
              </button>
              <p className="text-center text-[13px]" style={{ color: "var(--text-sub)" }}>または、メールアドレスで</p>
            </div>
          )}
          {sent ? (
          <div className="card mt-5 p-5">
            <p className="text-[16px] font-bold" style={{ color: "var(--primary)" }}>メールを送りました</p>
            <p className="mt-2 text-[14px]">
              <b>{email}</b> 宛にログイン用のリンクを送りました。メールを開いてリンクを押すと、このサイトに戻ってログインが完了します。
            </p>
            <p className="mt-2 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
              数分待っても届かない場合は、迷惑メールフォルダを確認するか、もう一度お試しください。
            </p>
            <button type="button" className="btn btn-ghost mt-4" onClick={() => setSent(false)}>別のアドレスで送り直す</button>
          </div>
        ) : (
          <form
            className="card mt-3 flex flex-col gap-4 p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true); setError(null);
              const r = await signInWithEmail(email.trim());
              setBusy(false);
              if (r.error) setError("送信できませんでした。アドレスを確認してもう一度お試しください。（" + r.error + "）");
              else setSent(true);
            }}
          >
            <div>
              <label className="label" htmlFor="email">メールアドレス</label>
              <input
                id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" inputMode="email" required
              />
            </div>
            {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "送信中…" : "ログイン用のリンクを送る"}
            </button>
          </form>
          )}
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
