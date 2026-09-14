"use client";

import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AuthButtons from "@/components/AuthButtons";
import { useSessionId } from "@/lib/store";

/** ログイン。すでに登録した人向け。初めての人は /signup/ へ */
export default function LoginPage() {
  const sid = useSessionId();
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-[22px] font-bold">ログイン</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          登録したときと同じ方法でログインしてください。
        </p>
        <div className="mt-5">
          {sid ? (
            <div className="card p-5 text-center">
              <p className="font-bold">ログイン済みです</p>
              <Link href="/me/" className="btn btn-primary mt-4">マイページへ</Link>
            </div>
          ) : (
            <AuthButtons intent="login" />
          )}
        </div>
        {!sid && (
          <>
            <p className="mt-6 text-center text-[14px]">
              初めての方は
              <Link href="/signup/" className="ml-1 font-bold" style={{ color: "var(--primary)" }}>新規登録（無料）</Link>
            </p>
            <details className="card mt-6 p-4 text-[14px]">
              <summary className="cursor-pointer font-bold">ログインできないときは</summary>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5" style={{ color: "var(--text-sub)" }}>
                <li>メールアドレスで登録した方: パスワードを忘れた場合は「パスワードを忘れた方はこちら」から再設定できます。</li>
                <li>「メールアドレスの確認が済んでいません」と出る場合: 登録時に届いた確認メールのリンクを押してください。</li>
                <li>Google や LINE で登録した方: パスワードはありません。それぞれのボタンで許可するだけでログインできます。</li>
                <li>どの方法で登録したか忘れた場合: Google、LINE、メールの順に試してください。「初めてのようです」と出た方法は未登録です。</li>
              </ul>
            </details>
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
