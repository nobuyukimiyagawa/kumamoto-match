"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { fmtDate } from "@/components/PostCard";
import { Stars } from "@/components/Stars";
import VenueMap from "@/components/VenueMap";
import ApplicantRow from "@/components/ApplicantRow";
import {
  apply, applicationsForPost, cancelApplication,
  getPost, getProfile, isPast, myApplication, ratingSummary, teamsRunBy, useDB, useSessionId,
} from "@/lib/store";
import { APP_STATUS_LABEL, KIND_LABEL, LEVEL_LABEL, POSITION_LABEL } from "@/types";
import type { Application } from "@/types";

export default function PostDetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const db = useDB();
  const sid = useSessionId();
  const post = getPost(db, id);

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;
  if (!post) {
    return (
      <main className="min-h-dvh">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-[16px] font-bold">この募集は見つかりませんでした</p>
          <Link href="/" className="btn btn-ghost mt-4">探すに戻る</Link>
        </div>
      </main>
    );
  }

  const helper = post.kind === "helper";
  const me = sid ? getProfile(db, sid) : null;
  const myTeams = sid ? teamsRunBy(db, sid) : [];
  const iHost = myTeams.some((t) => t.id === post.teamId);
  const mine = sid ? myApplication(db, post.id, sid) : null;
  const apps = applicationsForPost(db, post.id);
  const approved = apps.filter((a) => a.status === "approved");
  const hostRating = ratingSummary(db, { kind: "team", id: post.teamId });
  const past = isPast(post);
  const open = post.status === "open" && !past;

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← 探すに戻る</Link>

        {/* 見出し */}
        <div className="card mt-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${helper ? "badge-helper" : "badge-match"}`}>{KIND_LABEL[post.kind]}</span>
            <span className="badge badge-gray">{LEVEL_LABEL[post.level]}</span>
            {post.status === "filled" && <span className="badge badge-gray">成立</span>}
            {(post.status === "closed" || past) && <span className="badge badge-gray">終了</span>}
          </div>
          <h1 className="num mt-3 text-[22px] font-bold leading-tight">
            {fmtDate(post.date)} {post.startTime}〜{post.endTime}
          </h1>

          <dl className="mt-4 grid grid-cols-[5.5em_1fr] gap-y-2 text-[15px]">
            <dt style={{ color: "var(--text-sub)" }}>募集チーム</dt>
            <dd>
              <span className="font-bold">{post.team.name}</span>
              <span className="ml-2 text-[13.5px]" style={{ color: "var(--text-sub)" }}>{post.team.city}</span>
              <div className="mt-0.5"><Stars value={hostRating.avg} count={hostRating.count} /></div>
              {post.team.note && <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>{post.team.note}</p>}
            </dd>
            <dt style={{ color: "var(--text-sub)" }}>会場</dt>
            <dd>
              <span className="font-bold">{post.venue.name}</span>
              <p className="text-[13.5px]" style={{ color: "var(--text-sub)" }}>{post.venue.address}</p>
            </dd>
            {helper && (
              <>
                <dt style={{ color: "var(--text-sub)" }}>募集</dt>
                <dd className="font-bold" style={{ color: "var(--helper)" }}>
                  {post.positions?.map((p) => POSITION_LABEL[p]).join("・")}
                  <span className="num ml-2">あと{Math.max(0, (post.needed ?? 0) - approved.length)}名</span>
                  <span className="ml-1 text-[13px] font-normal" style={{ color: "var(--text-sub)" }}>
                    （定員{post.needed}名・完了{approved.length}名）
                  </span>
                </dd>
              </>
            )}
            <dt style={{ color: "var(--text-sub)" }}>参加費</dt>
            <dd className="num font-bold">{post.fee ? `${post.fee.toLocaleString()}円` : "無料"}</dd>
          </dl>

          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>
        </div>

        {/* 会場地図 */}
        <div className="card mt-3 overflow-hidden" style={{ height: 220 }}>
          <VenueMap venue={post.venue} />
        </div>

        {/* 募集チームへの最近の評価 */}
        {hostRating.recent.length > 0 && (
          <div className="card mt-3 p-5">
            <h2 className="text-[15px] font-bold">{post.team.name} への評価</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {hostRating.recent.map((r) => (
                <li key={r.id} className="text-[14px]">
                  <Stars value={r.stars} showNumber={false} size={14} />
                  {r.comment && <span className="ml-2">{r.comment}</span>}
                  <span className="ml-2 text-[12.5px]" style={{ color: "var(--text-sub)" }}>{r.createdAt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 行動: 立場ごとに出し分ける */}
        {iHost ? (
          <HostPanel apps={apps} post={{ id: post.id, kind: post.kind }} open={open} />
        ) : (
          <EntryPanel
            postId={post.id} helper={helper} open={open} meId={me?.id ?? null}
            myTeams={myTeams.map((t) => ({ id: t.id, name: t.name }))}
            mine={mine}
          />
        )}
      </div>
      <BottomNav />
    </main>
  );
}

/** エントリーする側（個人 or 他チーム） */
function EntryPanel({
  postId, helper, open, meId, myTeams, mine,
}: {
  postId: string; helper: boolean; open: boolean; meId: string | null;
  myTeams: { id: string; name: string }[];
  mine: Application | null;
}) {
  const [msg, setMsg] = useState("");
  const [teamId, setTeamId] = useState(myTeams[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!meId) {
    return (
      <div className="card mt-3 p-5 text-center">
        <p className="text-[15px] font-bold">エントリーするには登録が必要です</p>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>無料で、Google・LINE・メールアドレスのどれでも登録できます。</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/signup/" className="btn btn-primary">新規登録（無料）</Link>
          <Link href="/login/" className="btn btn-ghost">ログイン</Link>
        </div>
      </div>
    );
  }

  if (mine) {
    const s = mine.status;
    return (
      <div className="card mt-3 p-5">
        <p className="text-[13.5px] font-bold" style={{ color: "var(--text-sub)" }}>あなたのエントリー</p>
        <p className="mt-1 text-[18px] font-bold" style={{ color: s === "approved" ? "var(--primary)" : s === "rejected" ? "var(--text-sub)" : "var(--helper)" }}>
          {APP_STATUS_LABEL[s]}
        </p>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          {s === "pending" && "募集チームが承認すると「エントリー完了」になります。"}
          {s === "approved" && "当日は会場でお願いします。試合後にお互いを評価できます。"}
          {s === "rejected" && "今回は見送りになりました。他の募集もぜひ。"}
        </p>
        {mine.message && <p className="mt-2 text-[14px]">送ったメッセージ: {mine.message}</p>}
        {s === "pending" && (
          <button type="button" className="btn btn-ghost mt-3" onClick={() => cancelApplication(mine.id)}>
            エントリーを取り消す
          </button>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="card mt-3 p-5 text-center">
        <p className="text-[15px] font-bold">この募集は受付を終了しています</p>
      </div>
    );
  }

  // 助っ人募集は個人が、トレーニングマッチはチーム（運営者）がエントリーする
  if (!helper && myTeams.length === 0) {
    return (
      <div className="card mt-3 p-5 text-center">
        <p className="text-[15px] font-bold">トレーニングマッチにはチームとしてエントリーします</p>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>チームを作ると、このチームと対戦のエントリーができます。</p>
        <Link href="/team/new/" className="btn btn-primary mt-4">チームを作る</Link>
      </div>
    );
  }

  return (
    <form
      className="card mt-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError(null);
        try {
          await apply({
            postId,
            message: msg.trim() || undefined,
            ...(helper ? { applicantProfileId: meId } : { applicantTeamId: teamId }),
          });
        } catch (err) { setError("送信できませんでした。" + (err instanceof Error ? err.message : "")); }
        finally { setBusy(false); }
      }}
    >
      <h2 className="text-[16px] font-bold">{helper ? "助っ人としてエントリーする" : "対戦のエントリーをする"}</h2>
      {!helper && myTeams.length > 1 && (
        <div className="mt-3">
          <label className="label" htmlFor="team">エントリーするチーム</label>
          <select id="team" className="field" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      {!helper && myTeams.length === 1 && (
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>チーム: <b>{myTeams[0].name}</b></p>
      )}
      <div className="mt-3">
        <label className="label" htmlFor="msg">メッセージ（任意）</label>
        <textarea
          id="msg" rows={3} className="field" value={msg} onChange={(e) => setMsg(e.target.value)}
          placeholder={helper ? "入れるポジションや経験を一言。例: GKで入れます。社会人3年目です。" : "人数や希望する形式を一言。"}
        />
      </div>
      {error && <p className="mt-3 text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
      <button type="submit" className="btn btn-primary mt-4 w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
        {busy ? "送信中…" : "エントリーを送る"}
      </button>
      <p className="hint text-center">募集チームが承認すると「エントリー完了」になります。</p>
    </form>
  );
}

/** 募集した側: エントリーの一覧と承認 */
function HostPanel({ apps, post, open }: { apps: Application[]; post: { id: string; kind: string }; open: boolean }) {
  const db = useDB();
  const pending = apps.filter((a) => a.status === "pending");
  const others = apps.filter((a) => a.status !== "pending");
  return (
    <div className="card mt-3 p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-[16px] font-bold">エントリー</h2>
        <span className="num text-[13.5px]" style={{ color: "var(--text-sub)" }}>
          承認待ち{pending.length}件・完了{apps.filter((a) => a.status === "approved").length}件
        </span>
        <Link href="/me/" className="ml-auto text-[13.5px] font-bold" style={{ color: "var(--primary)" }}>マイページで管理</Link>
      </div>
      {apps.length === 0 && (
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>まだエントリーはありません。</p>
      )}
      <ul className="mt-3 flex flex-col gap-3">
        {[...pending, ...others].map((a) => <ApplicantRow key={a.id} a={a} canDecide={open || post.kind === "helper"} db={db} />)}
      </ul>
    </div>
  );
}
