"use client";

import { useState } from "react";
import { AUTH_MODE, signInWithEmail, signInWithGoogle, signInWithLine } from "@/lib/store";

export type AuthIntent = "login" | "signup";
const INTENT_KEY = "pitchmate-auth-intent";

/** 認証から戻ったときに「ログインのつもりだったか、新規登録のつもりだったか」を知るために残す */
export function setAuthIntent(i: AuthIntent) {
  try { localStorage.setItem(INTENT_KEY, i); } catch { /* ignore */ }
}
export function takeAuthIntent(): AuthIntent | null {
  try {
    const v = localStorage.getItem(INTENT_KEY) as AuthIntent | null;
    localStorage.removeItem(INTENT_KEY);
    return v;
  } catch { return null; }
}

/**
 * Google / LINE / メールの3つの入口。ログインと新規登録で同じ部品を使い、文言だけ変える。
 * 仕組みは同じ（パスワード無し）。どちらから入っても、アカウントがあれば入り、無ければ作られる。
 */
export default function AuthButtons({ intent }: { intent: AuthIntent }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verb = intent === "signup" ? "で登録" : "でログイン";

  if (AUTH_MODE === "local") {
    return (
      <div className="card p-5 text-center">
        <p className="font-bold">いまはデモモードです</p>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>右上の「アカウント」から誰として使うかを選んでください。</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="card p-5">
        <p className="text-[16px] font-bold" style={{ color: "var(--primary)" }}>メールを送りました</p>
        <p className="mt-2 text-[14px]">
          <b>{email}</b> 宛に{intent === "signup" ? "登録" : "ログイン"}用のリンクを送りました。メールを開いてリンクを押すと、このサイトに戻って続きに進みます。
        </p>
        <p className="mt-2 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
          数分待っても届かない場合は、迷惑メールフォルダを確認するか、もう一度お試しください。
        </p>
        <button type="button" className="btn btn-ghost mt-4" onClick={() => setSent(false)}>別のアドレスで送り直す</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="card flex flex-col gap-3 p-5">
        <button
          type="button" className="btn w-full"
          style={{ minHeight: 50, fontSize: 16, background: "#fff", border: "1px solid var(--line)", color: "var(--text)" }}
          onClick={async () => {
            setError(null); setAuthIntent(intent);
            const r = await signInWithGoogle();
            if (r.error) setError("Google で続行できませんでした。（" + r.error + "）");
          }}
        >
          <span aria-hidden style={{ fontWeight: 700, color: "#4285F4" }}>G</span> Google{verb}
        </button>
        <button
          type="button" className="btn w-full"
          style={{ minHeight: 50, fontSize: 16, background: "#06C755", color: "#fff" }}
          onClick={() => { setAuthIntent(intent); signInWithLine(); }}
        >
          LINE{verb}
        </button>
        <p className="text-center text-[13px]" style={{ color: "var(--text-sub)" }}>または、メールアドレスで</p>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true); setError(null); setAuthIntent(intent);
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
          <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
            {busy ? "送信中…" : intent === "signup" ? "登録用のリンクを送る" : "ログイン用のリンクを送る"}
          </button>
          <p className="hint text-center">パスワードは不要です。届いたリンクを押すだけで完了します。</p>
        </form>
      </div>
      {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
