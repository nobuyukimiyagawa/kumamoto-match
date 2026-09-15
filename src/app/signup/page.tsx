"use client";

import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import RoleCards from "@/components/RoleCards";
import { useSessionId } from "@/lib/store";

/** 新規登録の入口。チーム（募集する側）と個人（エントリーする側）で分ける */
export default function SignupPage() {
  const sid = useSessionId();
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <p className="hud hud-accent">sign up</p>
        <h1 className="mt-1 text-[22px] font-bold">新規登録（無料）</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          見るだけなら登録は要りません。どちらで使うかを選んでください。あとから両方使うこともできます。
        </p>

        <div className="mt-5">
          {sid ? (
            <div className="card p-5 text-center">
              <p className="font-bold">すでにログイン済みです</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link href="/me/" className="btn btn-primary">マイページへ</Link>
                <Link href="/team/new/" className="btn btn-ghost">チームを作る</Link>
              </div>
            </div>
          ) : (
            <RoleCards teamHref="/signup/team/" playerHref="/signup/player/" />
          )}
        </div>
        {!sid && (
          <p className="mt-6 text-center text-[14px]">
            登録済みの方は
            <Link href="/login/" className="ml-1 font-bold" style={{ color: "var(--primary)" }}>ログイン</Link>
          </p>
        )}
      </div>
      <Footer />
      <BottomNav />
    </main>
  );
}
