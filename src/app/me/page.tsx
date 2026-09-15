"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Stars } from "@/components/Stars";
import ProfileForm from "@/components/ProfileForm";
import { MyEntriesPanel, RatePanel } from "@/components/ManagePanels";
import {
  AUTH_MODE, getPost, getProfile, pendingRatingsFor, ratingSummary, resetDB, teamsRunBy, useDB, useSessionId,
} from "@/lib/store";
import { POSITION_LABEL } from "@/types";

type Tab = "entries" | "rate";

/** マイページ＝個人（助っ人）としての画面。チームの運営は /team/ に分けてある */
export default function MyPage() {
  const db = useDB();
  const sid = useSessionId();
  const me = sid ? getProfile(db, sid) : null;
  const myTeams = sid ? teamsRunBy(db, sid) : [];
  const [tab, setTab] = useState<Tab>("entries");
  const [editing, setEditing] = useState(false);

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;

  if (!sid) {
    return (
      <main className="min-h-dvh pb-24 sm:pb-10">
        <Header />
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center">
          <p className="text-[16px] font-bold">マイページを見るにはログインが必要です</p>
          {AUTH_MODE === "local" ? (
            <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
              いまはデモ中です。右上の「アカウント」から誰として使うかを選んでください。
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/signup/" className="btn btn-primary">新規登録（無料）</Link>
              <Link href="/login/" className="btn btn-ghost">ログイン</Link>
            </div>
          )}
        </div>
        <BottomNav />
      </main>
    );
  }

  // ログインはしているがプロフィールが無い（初回）→ ようこそ画面で登録してもらう
  if (!me) {
    return (
      <main className="min-h-dvh pb-24 sm:pb-10">
        <Header />
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center">
          <p className="text-[16px] font-bold">初めてのようです</p>
          <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>プロフィールを登録すると、募集やエントリーができるようになります。</p>
          <Link href="/welcome/" className="btn btn-primary mt-4">登録を続ける</Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  // 個人としての評価だけ（チームとしての評価はチーム管理側）
  const pendingRatings = pendingRatingsFor(db, me.id).filter((r) => r.from.kind === "profile");
  const myRating = ratingSummary(db, { kind: "profile", id: me.id });

  // 自分（個人）のエントリー
  const myApps = db.applications
    .filter((a) => a.applicantProfileId === me.id && a.status !== "cancelled")
    .map((a) => ({ a, post: getPost(db, a.postId)! }))
    .filter((x) => x.post)
    .sort((x, y) => y.post.date.localeCompare(x.post.date));

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "entries", label: "助っ人エントリー", badge: myApps.filter((x) => x.a.status === "pending").length },
    { id: "rate", label: "評価する", badge: pendingRatings.length },
  ];

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <p className="hud mb-2" style={{ color: "var(--helper)" }}>player // マイページ</p>

        {/* 自分のプロフィール */}
        {editing ? (
          <ProfileForm id={me.id} initial={me} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
        ) : (
        <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
          <div>
            <p className="text-[18px] font-bold">{me.displayName}</p>
            <p className="text-[13.5px]" style={{ color: "var(--text-sub)" }}>
              {me.city}・{me.positions.map((p) => POSITION_LABEL[p]).join("・")}
              {me.years != null && `・経験${me.years}年`}
            </p>
          </div>
          <div className="text-[13.5px]">
            <span style={{ color: "var(--text-sub)" }}>助っ人としての評価 </span>
            <Stars value={myRating.avg} count={myRating.count} />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 12px", fontSize: 13.5 }} onClick={() => setEditing(true)}>
              プロフィールを編集
            </button>
          </div>
        </div>
        )}

        {/* チーム運営への入口 */}
        <div className="card mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 p-4" style={{ borderColor: "rgba(125,211,252,.35)" }}>
          <p className="hud" style={{ color: "var(--match)" }}>team</p>
          {myTeams.length > 0 ? (
            <>
              <p className="text-[14px]">
                運営中: {myTeams.map((t) => <b key={t.id} className="mr-2">{t.name}</b>)}
              </p>
              <Link href="/team/" className="btn btn-ghost ml-auto" style={{ minHeight: 36, padding: "0 12px", fontSize: 13.5 }}>
                チーム管理へ →
              </Link>
            </>
          ) : (
            <>
              <p className="text-[14px]" style={{ color: "var(--text-sub)" }}>チームを運営する方は、チームを作ると募集を出せます。</p>
              <Link href="/team/new/" className="btn btn-ghost ml-auto" style={{ minHeight: 36, padding: "0 12px", fontSize: 13.5 }}>
                ＋ チームを作る
              </Link>
            </>
          )}
        </div>

        {/* タブ */}
        <div className="no-bar mt-4 flex gap-2 overflow-x-auto" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="chip" data-on={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {t.badge ? (
                <span className="num ml-1.5 rounded-full px-1.5 text-[12px]"
                  style={{ background: tab === t.id ? "#061008" : "var(--helper)", color: tab === t.id ? "var(--primary)" : "#061008" }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === "entries" && <MyEntriesPanel items={myApps} />}
        {tab === "rate" && <RatePanel items={pendingRatings} />}

        {AUTH_MODE === "local" && (
          <p className="mt-10 text-center text-[12.5px]" style={{ color: "var(--text-sub)" }}>
            デモ中のデータはこのブラウザにだけ保存されています。
            <button type="button" className="ml-2 underline" onClick={() => { if (confirm("仮データに戻します。よろしいですか？")) resetDB(); }}>
              仮データに戻す
            </button>
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
