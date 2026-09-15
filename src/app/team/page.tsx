"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PlanCard from "@/components/PlanCard";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { RatePanel, TeamPanel } from "@/components/ManagePanels";
import {
  applicationsForPost, getPost, getProfile, listPosts, pendingRatingsFor, ratingSummary, teamsRunBy, useDB, useSessionId,
} from "@/lib/store";
import { LEVEL_LABEL } from "@/types";

type Tab = "posts" | "rate";

/** チーム管理＝募集を出す側の画面。個人（助っ人）としての画面は /me/ */
export default function TeamManagePage() {
  return <Suspense fallback={null}><TeamManage /></Suspense>;
}

function TeamManage() {
  const params = useSearchParams();
  const justPaid = params.get("paid") as "1" | "0" | null;
  const db = useDB();
  const sid = useSessionId();
  const me = sid ? getProfile(db, sid) : null;
  const myTeams = sid ? teamsRunBy(db, sid) : [];
  const [teamId, setTeamId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("posts");

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;

  if (!sid || !me) {
    return (
      <main className="min-h-dvh pb-24 sm:pb-10">
        <Header />
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center">
          <p className="hud" style={{ color: "var(--match)" }}>team</p>
          <p className="mt-1 text-[16px] font-bold">チーム管理を使うには{sid ? "登録の続き" : "ログイン"}が必要です</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {sid ? (
              <Link href="/welcome/" className="btn btn-primary">登録を続ける</Link>
            ) : (
              <>
                <Link href="/signup/team/" className="btn btn-primary">チームとして登録（無料）</Link>
                <Link href="/login/" className="btn btn-ghost">ログイン</Link>
              </>
            )}
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (myTeams.length === 0) {
    return (
      <main className="min-h-dvh pb-24 sm:pb-10">
        <Header />
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center">
          <p className="hud" style={{ color: "var(--match)" }}>team</p>
          <p className="mt-1 text-[16px] font-bold">まだチームがありません</p>
          <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>チームを作ると、トレーニングマッチの相手や助っ人を募集できます。</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/team/new/" className="btn btn-primary">＋ チームを作る</Link>
            <Link href="/me/" className="btn btn-ghost">マイページ（個人）へ</Link>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  const team = myTeams.find((t) => t.id === teamId) ?? myTeams[0];
  const rating = ratingSummary(db, { kind: "team", id: team.id });

  // このチームの募集と、このチームが出した対戦エントリー
  const teamPosts = listPosts(db).filter((p) => p.teamId === team.id).sort((a, b) => b.date.localeCompare(a.date));
  const teamApps = db.applications
    .filter((a) => a.applicantTeamId === team.id && a.status !== "cancelled")
    .map((a) => ({ a, post: getPost(db, a.postId)! }))
    .filter((x) => x.post)
    .sort((x, y) => y.post.date.localeCompare(x.post.date));
  const pendingCount = teamPosts.reduce((n, p) => n + applicationsForPost(db, p.id).filter((a) => a.status === "pending").length, 0);
  // チームとしての評価だけ（個人としての評価はマイページ側）
  const pendingRatings = pendingRatingsFor(db, me.id).filter((r) => r.from.kind === "team" && r.from.id === team.id);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "posts", label: "募集とエントリー", badge: pendingCount },
    { id: "rate", label: "評価する", badge: pendingRatings.length },
  ];

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <p className="hud mb-2" style={{ color: "var(--match)" }}>team // チーム管理</p>

        {/* チームの切り替え（複数運営しているときだけ） */}
        {myTeams.length > 1 && (
          <div className="no-bar mb-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="運営チーム">
            {myTeams.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={team.id === t.id} className="chip" data-on={team.id === t.id} onClick={() => setTeamId(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* チームの概要 */}
        <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
          <div>
            <p className="text-[18px] font-bold">{team.name}</p>
            <p className="text-[13.5px]" style={{ color: "var(--text-sub)" }}>
              {team.city}・{LEVEL_LABEL[team.level]}・オーナー {getProfile(db, team.ownerId)?.displayName ?? "—"}
            </p>
          </div>
          <div className="text-[13.5px]">
            <span style={{ color: "var(--text-sub)" }}>チームの評価 </span>
            <Stars value={rating.avg} count={rating.count} />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link href={`/team/edit/?id=${team.id}`} className="btn btn-ghost" style={{ minHeight: 36, padding: "0 12px", fontSize: 13.5 }}>チームを編集</Link>
            <Link href="/team/new/" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 12px", fontSize: 13.5 }}>＋ 別のチーム</Link>
            <Link href="/post/new/" className="btn btn-primary" style={{ minHeight: 36, padding: "0 12px", fontSize: 13.5 }}>＋ 募集する</Link>
          </div>
        </div>

        {/* チームプラン */}
        <PlanCard team={team} justPaid={justPaid} />

        {/* 個人としての画面への入口 */}
        <p className="mt-2 text-right text-[13px]" style={{ color: "var(--text-sub)" }}>
          助っ人としてのエントリーや評価は <Link href="/me/" className="font-bold" style={{ color: "var(--primary)" }}>マイページ（個人）</Link>
        </p>

        {/* タブ */}
        <div className="no-bar mt-3 flex gap-2 overflow-x-auto" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="chip" data-on={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {t.badge ? (
                <span className="num ml-1.5 rounded-full px-1.5 text-[12px]"
                  style={{ background: tab === t.id ? "var(--on-primary)" : "var(--helper)", color: tab === t.id ? "var(--primary)" : "var(--on-primary)" }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === "posts" && <TeamPanel posts={teamPosts} apps={teamApps} db={db} />}
        {tab === "rate" && <RatePanel items={pendingRatings} />}
      </div>
      <Footer />
      <BottomNav />
    </main>
  );
}
