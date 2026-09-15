"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TeamForm from "@/components/TeamForm";
import { useSessionId } from "@/lib/store";

export default function NewTeamPage() {
  const sid = useSessionId();
  const router = useRouter();
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <Link href="/team/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← チーム管理に戻る</Link>
        <p className="hud mt-4" style={{ color: "var(--match)" }}>team // new</p>
        <h1 className="mt-1 text-[22px] font-bold">チームを作る</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          作った人がオーナーになります。募集と対戦エントリーはチームの運営者だけができます。
        </p>
        {!sid ? (
          <div className="card mt-5 p-5 text-center">
            <p className="font-bold">チームを作るにはログインが必要です</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/signup/team/" className="btn btn-primary">チームとして登録（無料）</Link>
              <Link href="/login/" className="btn btn-ghost">ログイン</Link>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <TeamForm ownerId={sid} onDone={() => router.push("/team/")} />
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
