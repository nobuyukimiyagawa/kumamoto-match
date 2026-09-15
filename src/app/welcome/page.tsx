"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ProfileForm from "@/components/ProfileForm";
import TeamForm from "@/components/TeamForm";
import RoleCards from "@/components/RoleCards";
import { clearSignupRole, peekSignupRole, setSignupRole, type SignupRole } from "@/components/AuthButtons";
import { getAuthMeta, getProfile, teamsRunBy, useDB, useSessionId } from "@/lib/store";

/**
 * 初回登録の続き。登録の種類（チーム／個人）で手順が変わる。
 *   個人:   プロフィール → 完了
 *   チーム: 代表者のプロフィール → チーム登録 → 完了
 * 種類が分からない（別のブラウザでメール確認をした等）ときは、先に選んでもらう。
 */
export default function WelcomePage() {
  return <Suspense fallback={null}><Welcome /></Suspense>;
}

function Step({ n, label, state }: { n: number; label: string; state: "done" | "now" | "todo" }) {
  const bg = state === "done" ? "var(--primary)" : state === "now" ? "var(--primary-bg)" : "var(--surface-2)";
  const fg = state === "done" ? "#061008" : state === "now" ? "var(--primary)" : "var(--text-sub)";
  return (
    <li className="flex items-center gap-2 text-[13.5px]" style={{ color: state === "todo" ? "var(--text-sub)" : "var(--text)" }}>
      <span className="num inline-flex h-6 w-6 items-center justify-center rounded-full font-bold" style={{ background: bg, color: fg }}>
        {state === "done" ? "✓" : n}
      </span>
      {label}
    </li>
  );
}

function Welcome() {
  const db = useDB();
  const sid = useSessionId();
  const params = useSearchParams();
  const router = useRouter();
  const done = params.get("done") === "1";
  const me = sid ? getProfile(db, sid) : null;
  const myTeams = sid ? teamsRunBy(db, sid) : [];
  const [role, setRole] = useState<SignupRole | null>(() => peekSignupRole());

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;
  if (!sid) {
    return (
      <main className="min-h-dvh"><Header />
        <div className="mx-auto max-w-md px-4 pt-10 text-center">
          <p className="font-bold">先に登録方法を選んでください</p>
          <Link href="/signup/" className="btn btn-primary mt-4">新規登録へ</Link>
        </div>
      </main>
    );
  }

  // 種類が分からなければ選んでもらう（プロフィール未登録のときだけ）
  if (!role && !me) {
    return (
      <main className="min-h-dvh pb-10"><Header />
        <div className="mx-auto max-w-3xl px-4 pt-8">
          <p className="hud hud-accent">welcome</p>
          <h1 className="mt-1 text-[22px] font-bold">はじめまして。どちらで使いますか？</h1>
          <p className="mb-5 mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>あとから両方使うこともできます。</p>
          <RoleCards onPick={(r) => { setSignupRole(r); setRole(r); }} />
        </div>
      </main>
    );
  }

  const isTeam = role === "team";
  const teamDone = myTeams.length > 0;
  // いま何段目か
  const stage: "profile" | "team" | "done" =
    !me ? "profile" : isTeam && !teamDone && !done ? "team" : "done";

  const finish = (to: string) => { clearSignupRole(); router.replace(to); };

  return (
    <main className="min-h-dvh pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="hud" style={{ color: isTeam ? "var(--match)" : "var(--helper)" }}>
          {isTeam ? "team // 募集する側" : "player // エントリーする側"}
        </p>
        <ol className="mb-5 mt-2 flex flex-wrap gap-x-6 gap-y-2">
          <Step n={1} label="ログイン方法を選ぶ" state="done" />
          <Step n={2} label={isTeam ? "代表者のプロフィール" : "プロフィールを登録"} state={stage === "profile" ? "now" : "done"} />
          {isTeam && <Step n={3} label="チームを登録" state={stage === "team" ? "now" : stage === "done" ? "done" : "todo"} />}
          <Step n={isTeam ? 4 : 3} label="完了" state={stage === "done" ? "now" : "todo"} />
        </ol>

        {stage === "profile" && (
          <>
            <h1 className="text-[22px] font-bold">{isTeam ? "まず代表者のプロフィール" : "はじめまして"}</h1>
            <p className="mb-4 mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
              {isTeam
                ? "チームを運営するあなた自身の情報です。対戦相手やエントリーした人に、チーム名と一緒に表示されます。"
                : "募集チームに見える情報です。ポジションと活動エリアで、声がかかりやすくなります。"}
            </p>
            <ProfileForm id={sid} defaultName={getAuthMeta()?.name} onDone={() => router.replace(isTeam ? "/welcome/" : "/welcome/?done=1")} />
          </>
        )}

        {stage === "team" && me && (
          <>
            <h1 className="text-[22px] font-bold">チームを登録</h1>
            <p className="mb-4 mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
              {me.displayName} さんがオーナーになります。募集を出す・エントリーを承認するのはオーナーと運営者だけです。
            </p>
            <TeamForm ownerId={me.id} onDone={() => router.replace("/welcome/?done=1")} />
            <p className="mt-4 text-center text-[13.5px]">
              <button type="button" className="underline" style={{ color: "var(--text-sub)" }} onClick={() => { setSignupRole("player"); setRole("player"); router.replace("/welcome/?done=1"); }}>
                チームはあとで作る（個人として始める）
              </button>
            </p>
          </>
        )}

        {stage === "done" && me && (
          <div className="card p-6 text-center">
            <p className="hud hud-accent">registration complete</p>
            <p className="mt-1 text-[20px] font-bold">登録が完了しました</p>
            {isTeam && teamDone ? (
              <>
                <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>
                  <b style={{ color: "var(--text)" }}>{myTeams[0].name}</b> のオーナーとして登録しました。さっそく募集を出せます。
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button type="button" className="btn btn-primary" onClick={() => finish("/post/new/")}>募集を出す</button>
                  <button type="button" className="btn btn-ghost" onClick={() => finish("/team/")}>チーム管理へ</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>
                  {me.displayName} さん、ようこそ。募集を探して助っ人にエントリーできます。
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button type="button" className="btn btn-primary" onClick={() => finish("/")}>募集を探す</button>
                  <button type="button" className="btn btn-ghost" onClick={() => finish("/me/")}>マイページへ</button>
                </div>
                <p className="mt-4 text-[13px]" style={{ color: "var(--text-sub)" }}>
                  チームを運営する方は <Link href="/team/new/" className="font-bold" style={{ color: "var(--primary)" }} onClick={clearSignupRole}>チームを作る</Link>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
