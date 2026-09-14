"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { sendPasswordReset } from "@/lib/store";

/** パスワードを忘れた方。再設定用のリンクをメールで送る */
export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-[22px] font-bold">パスワードの再設定</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          登録したメールアドレスに、再設定用のリンクを送ります。Google や LINE で登録した方はパスワードがないので、そのままそれぞれのボタンでログインしてください。
        </p>
        {sent ? (
          <div className="card mt-5 p-5">
            <p className="text-[16px] font-bold" style={{ color: "var(--primary)" }}>メールを送りました</p>
            <p className="mt-2 text-[14px]"><b>{email}</b> 宛に再設定用のリンクを送りました。リンクを押すと、新しいパスワードを設定する画面が開きます。</p>
            <p className="mt-2 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
              届かない場合は、迷惑メールフォルダの確認と、アドレスの打ち間違いがないかの確認をお願いします。登録されていないアドレスには届きません。
            </p>
          </div>
        ) : (
          <form
            className="card mt-5 flex flex-col gap-4 p-5"
            onSubmit={async (e) => {
              e.preventDefault(); setBusy(true); setError(null);
              const r = await sendPasswordReset(email.trim());
              setBusy(false);
              if (r.error) setError("送信できませんでした。しばらくしてからもう一度お試しください。");
              else setSent(true);
            }}
          >
            <div>
              <label className="label" htmlFor="email">メールアドレス</label>
              <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required />
            </div>
            {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "送信中…" : "再設定用のリンクを送る"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-[14px]">
          <Link href="/login/" className="font-bold" style={{ color: "var(--primary)" }}>ログイン画面に戻る</Link>
        </p>
      </div>
      <BottomNav />
    </main>
  );
}
