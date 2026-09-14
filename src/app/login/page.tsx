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
          <p className="mt-6 text-center text-[14px]">
            初めての方は
            <Link href="/signup/" className="ml-1 font-bold" style={{ color: "var(--primary)" }}>新規登録（無料）</Link>
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
