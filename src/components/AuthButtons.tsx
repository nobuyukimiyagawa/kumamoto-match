"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_MODE, signInWithGoogle, signInWithLine, signInWithPassword, signUpWithPassword } from "@/lib/store";

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

/** Supabase の英語エラーを利用者向けの日本語にする */
function jpError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "メールアドレスかパスワードが違います。";
  if (m.includes("email not confirmed")) return "メールアドレスの確認が済んでいません。登録時に届いたメールのリンクを押してください。";
  if (m.includes("already registered") || m.includes("already been registered")) return "このメールアドレスはすでに登録されています。ログインしてください。";
  if (m.includes("password should be at least")) return "パスワードは8文字以上にしてください。";
  if (m.includes("rate limit") || m.includes("too many")) return "しばらく時間をおいてからもう一度お試しください。";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "メールアドレスの形式が正しくありません。";
  return "エラーが発生しました。（" + msg + "）";
}

const MIN_PW = 8;

/**
 * 入口は3つ: Google / LINE / メール＋パスワード。ログインと新規登録で同じ部品を使い、文言と項目を変える。
 * Google と LINE はパスワード無し（各社の画面で許可するだけ）。
 * メールは新規登録時に確認メールが届き、リンクを押すと有効になる。
 */
export default function AuthButtons({ intent }: { intent: AuthIntent }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const verb = intent === "signup" ? "で登録" : "でログイン";

  if (AUTH_MODE === "local") {
    return (
      <div className="card p-5 text-center">
        <p className="font-bold">いまはデモモードです</p>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>右上の「アカウント」から誰として使うかを選んでください。</p>
      </div>
    );
  }

  if (sentTo) {
    return (
      <div className="card p-5">
        <p className="text-[16px] font-bold" style={{ color: "var(--primary)" }}>確認メールを送りました</p>
        <p className="mt-2 text-[14px]">
          <b>{sentTo}</b> 宛に確認用のリンクを送りました。メールを開いてリンクを押すと登録が有効になり、プロフィール登録に進みます。
        </p>
        <p className="mt-2 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
          数分待っても届かない場合は、迷惑メールフォルダを確認してください。
        </p>
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
            if (r.error) setError(jpError(r.error));
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
        <p className="text-center text-[13px]" style={{ color: "var(--text-sub)" }}>または、メールアドレスとパスワードで</p>

        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (intent === "signup") {
              if (pw.length < MIN_PW) { setError(`パスワードは${MIN_PW}文字以上にしてください。`); return; }
              if (pw !== pw2) { setError("パスワード（確認用）が一致しません。"); return; }
            }
            setBusy(true); setAuthIntent(intent);
            const r = intent === "signup"
              ? await signUpWithPassword(email.trim(), pw)
              : await signInWithPassword(email.trim(), pw);
            setBusy(false);
            if (r.error) { setError(jpError(r.error)); return; }
            if (intent === "signup" && "needsConfirm" in r && r.needsConfirm) { setSentTo(email.trim()); return; }
            router.push("/auth/done/");
          }}
        >
          <div>
            <label className="label" htmlFor="email">メールアドレス</label>
            <input
              id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" inputMode="email" required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">パスワード{intent === "signup" && <span className="ml-1 font-normal" style={{ color: "var(--text-sub)" }}>（{MIN_PW}文字以上）</span>}</label>
            <div className="relative">
              <input
                id="password" type={showPw ? "text" : "password"} className="field" style={{ paddingRight: 64 }}
                value={pw} onChange={(e) => setPw(e.target.value)}
                autoComplete={intent === "signup" ? "new-password" : "current-password"} required minLength={intent === "signup" ? MIN_PW : undefined}
              />
              <button
                type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] font-bold"
                style={{ color: "var(--primary)" }} onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPw ? "隠す" : "表示"}
              </button>
            </div>
          </div>
          {intent === "signup" && (
            <div>
              <label className="label" htmlFor="password2">パスワード（確認用）</label>
              <input
                id="password2" type={showPw ? "text" : "password"} className="field"
                value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
            {busy ? "送信中…" : intent === "signup" ? "メールアドレスで登録する" : "ログインする"}
          </button>
          {intent === "login" && (
            <p className="text-center text-[13.5px]">
              <Link href="/auth/forgot/" className="font-bold" style={{ color: "var(--primary)" }}>パスワードを忘れた方はこちら</Link>
            </p>
          )}
        </form>
      </div>
      {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
