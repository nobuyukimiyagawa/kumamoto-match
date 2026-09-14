"use client";

import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AuthButtons from "@/components/AuthButtons";
import { useSessionId } from "@/lib/store";

/** 新規登録。手順を先に見せてから、Google / LINE / メールを選んでもらう */
export default function SignupPage() {
  const sid = useSessionId();
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-[22px] font-bold">新規登録（無料）</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          見るだけなら登録は要りません。募集を出す・エントリーする・評価するには登録が必要です。
        </p>

        <ol className="card mt-5 flex flex-col gap-2 p-4 text-[14px]">
          <li className="flex gap-2"><span className="badge badge-match">1</span>ログイン方法を選ぶ（Google / LINE / メール＋パスワード）</li>
          <li className="flex gap-2"><span className="badge badge-match">2</span>プロフィールを登録（表示名・エリア・ポジション）</li>
          <li className="flex gap-2"><span className="badge badge-match">3</span>完了。募集やエントリーができます</li>
        </ol>

        <div className="mt-5">
          {sid ? (
            <div className="card p-5 text-center">
              <p className="font-bold">すでにログイン済みです</p>
              <Link href="/me/" className="btn btn-primary mt-4">マイページへ</Link>
            </div>
          ) : (
            <AuthButtons intent="signup" />
          )}
        </div>
        {!sid && (
          <p className="mt-6 text-center text-[14px]">
            登録済みの方は
            <Link href="/login/" className="ml-1 font-bold" style={{ color: "var(--primary)" }}>ログイン</Link>
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
