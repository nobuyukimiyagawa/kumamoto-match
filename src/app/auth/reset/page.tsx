"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { updatePassword, useSessionId } from "@/lib/store";

const MIN_PW = 8;

/** 再設定メールのリンクから開く。リンクでセッションが作られているので、新しいパスワードを保存する */
export default function ResetPage() {
  const sid = useSessionId();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="min-h-dvh pb-10">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-[22px] font-bold">新しいパスワードを設定</h1>
        {!sid ? (
          <div className="card mt-5 p-5 text-center">
            {timedOut ? (
              <>
                <p className="font-bold">リンクを確認できませんでした</p>
                <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>リンクの有効期限が切れているか、すでに使われています。もう一度メールを送ってください。</p>
                <Link href="/auth/forgot/" className="btn btn-ghost mt-4">再設定メールを送り直す</Link>
              </>
            ) : (
              <p className="text-[14px]" style={{ color: "var(--text-sub)" }}>リンクを確認しています…</p>
            )}
          </div>
        ) : (
          <form
            className="card mt-5 flex flex-col gap-4 p-5"
            onSubmit={async (e) => {
              e.preventDefault(); setError(null);
              if (pw.length < MIN_PW) { setError(`パスワードは${MIN_PW}文字以上にしてください。`); return; }
              if (pw !== pw2) { setError("パスワード（確認用）が一致しません。"); return; }
              setBusy(true);
              const r = await updatePassword(pw);
              setBusy(false);
              if (r.error) { setError("保存できませんでした。（" + r.error + "）"); return; }
              router.replace("/me/");
            }}
          >
            <div>
              <label className="label" htmlFor="password">新しいパスワード（{MIN_PW}文字以上）</label>
              <div className="relative">
                <input id="password" type={showPw ? "text" : "password"} className="field" style={{ paddingRight: 64 }} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required minLength={MIN_PW} />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] font-bold" style={{ color: "var(--primary)" }} onClick={() => setShowPw(!showPw)}>
                  {showPw ? "隠す" : "表示"}
                </button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password2">新しいパスワード（確認用）</label>
              <input id="password2" type={showPw ? "text" : "password"} className="field" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
            </div>
            {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "保存中…" : "このパスワードで保存する"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
