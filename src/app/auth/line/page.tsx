"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { finishLineLogin } from "@/lib/store";

/** LINE 認証の戻り先。Edge Function が付けた token_hash でセッションを作り、マイページへ */
export default function LineReturnPage() {
  return <Suspense fallback={null}><Finish /></Suspense>;
}

function Finish() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // token_hash は # 以降に来る（URL の履歴やログに残さないため）。error はクエリで来る
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const tokenHash = hash.get("token_hash");
    const err = params.get("error");
    if (err) { setError(err); return; }
    if (!tokenHash) { setError("トークンがありません。"); return; }
    // 使い終わったトークンは URL から消す
    history.replaceState(null, "", window.location.pathname);
    finishLineLogin(tokenHash).then((r) => {
      if (r.error) setError(r.error);
      else router.replace("/me/");
    });
  }, [params, router]);

  return (
    <main className="min-h-dvh">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-10 text-center">
        {error ? (
          <>
            <p className="text-[16px] font-bold" style={{ color: "var(--danger)" }}>LINE でのログインに失敗しました</p>
            <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>{error}</p>
            <Link href="/login/" className="btn btn-ghost mt-4">ログイン画面に戻る</Link>
          </>
        ) : (
          <p className="text-[15px]" style={{ color: "var(--text-sub)" }}>LINE でログインしています…</p>
        )}
      </div>
    </main>
  );
}
