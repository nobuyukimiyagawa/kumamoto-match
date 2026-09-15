"use client";

import { useState } from "react";
import Link from "next/link";
import ApplicantRow from "@/components/ApplicantRow";
import { fmtDate, VenueStatusBadge } from "@/components/PostCard";
import { StarInput, Stars } from "@/components/Stars";
import {
  addRating, applicationsForPost, cancelApplication, closePost, isPast, ratingSummary, useDB,
  type PendingRating, type PostView,
} from "@/lib/store";
import { APP_STATUS_LABEL, KIND_LABEL, type Application } from "@/types";

/** マイページ（個人）とチーム管理で共用する部品 */

export function StatusBadge({ s }: { s: Application["status"] }) {
  return (
    <span
      className="badge"
      style={{
        background: s === "approved" ? "var(--primary-bg)" : s === "pending" ? "var(--helper-bg)" : "var(--surface-2)",
        color: s === "approved" ? "var(--primary)" : s === "pending" ? "var(--helper)" : "var(--text-sub)",
      }}
    >
      {APP_STATUS_LABEL[s]}
    </span>
  );
}


export function PostHead({ post }: { post: PostView }) {
  const helper = post.kind === "helper";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`badge ${helper ? "badge-helper" : "badge-match"}`}>{KIND_LABEL[post.kind]}</span>
      <span className="num text-[15px] font-bold">{fmtDate(post.date)} {post.startTime}〜</span>
      <span className="text-[13.5px]" style={{ color: "var(--text-sub)" }}>{post.venue.name}</span>
      <VenueStatusBadge post={post} />
      {isPast(post) && <span className="badge badge-gray">終了</span>}
      {post.status === "filled" && !isPast(post) && <span className="badge badge-gray">成立</span>}
    </div>
  );
}


/** チーム運営: 自分の募集とエントリー、対戦エントリー */
export function TeamPanel({ posts, apps, db }: {
  posts: PostView[];
  apps: { a: Application; post: PostView }[];
  db: ReturnType<typeof useDB>;
}) {
  const upcoming = posts.filter((p) => !isPast(p));
  const done = posts.filter((p) => isPast(p));
  return (
    <div className="mt-4 flex flex-col gap-6">
      <section>
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-bold">出している募集</h2>
          <Link href="/post/new/" className="btn btn-primary ml-auto" style={{ minHeight: 38, padding: "0 12px", fontSize: 14 }}>＋ 募集する</Link>
        </div>
        {upcoming.length === 0 && <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>いま出している募集はありません。</p>}
        <ul className="mt-2 flex flex-col gap-3">
          {upcoming.map((p) => {
            const list = applicationsForPost(db, p.id);
            const pending = list.filter((a) => a.status === "pending");
            return (
              <li key={p.id} className="card p-4">
                <PostHead post={p} />
                <p className="mt-1 text-[14px] font-bold">{p.team.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
                  <span className="num">承認待ち <b style={{ color: pending.length ? "var(--helper)" : "inherit" }}>{pending.length}</b>件</span>
                  <span className="num">完了 <b>{list.filter((a) => a.status === "approved").length}</b>件</span>
                  <Link href={`/post/?id=${p.id}`} className="font-bold" style={{ color: "var(--primary)" }}>募集ページ</Link>
                  {p.status === "open" && (
                    <button type="button" className="ml-auto underline" onClick={() => { if (confirm("この募集を締め切りますか？")) closePost(p.id); }}>
                      締め切る
                    </button>
                  )}
                </div>
                {list.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {[...pending, ...list.filter((a) => a.status !== "pending")].map((a) => (
                      <ApplicantRow key={a.id} a={a} canDecide db={db} />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-[16px] font-bold">対戦エントリー（自チームから他チームへ）</h2>
        {apps.length === 0 && <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>まだありません。「探す」からトレーニングマッチにエントリーできます。</p>}
        <ul className="mt-2 flex flex-col gap-3">
          {apps.map(({ a, post }) => (
            <li key={a.id} className="card p-4">
              <PostHead post={post} />
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[14px]">相手: <b>{post.team.name}</b></span>
                <Stars value={ratingSummary(db, { kind: "team", id: post.teamId }).avg} count={ratingSummary(db, { kind: "team", id: post.teamId }).count} size={13} />
                <StatusBadge s={a.status} />
                <Link href={`/post/?id=${post.id}`} className="ml-auto text-[13.5px] font-bold" style={{ color: "var(--primary)" }}>募集ページ</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-[16px] font-bold">終わった募集</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {done.map((p) => (
              <li key={p.id} className="card p-3">
                <PostHead post={p} />
                <p className="num mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
                  完了 {applicationsForPost(db, p.id).filter((a) => a.status === "approved").length}件
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}


/** 個人: 自分が助っ人としてエントリーしたもの */
export function MyEntriesPanel({ items }: { items: { a: Application; post: PostView }[] }) {
  const db = useDB();
  return (
    <div className="mt-4">
      <h2 className="text-[16px] font-bold">助っ人エントリー</h2>
      {items.length === 0 && (
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-sub)" }}>
          まだありません。<Link href="/" className="font-bold" style={{ color: "var(--primary)" }}>探す</Link>から助っ人募集にエントリーできます。
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-3">
        {items.map(({ a, post }) => {
          const r = ratingSummary(db, { kind: "team", id: post.teamId });
          return (
            <li key={a.id} className="card p-4">
              <PostHead post={post} />
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[14px]"><b>{post.team.name}</b></span>
                <Stars value={r.avg} count={r.count} size={13} />
                <StatusBadge s={a.status} />
                <Link href={`/post/?id=${post.id}`} className="ml-auto text-[13.5px] font-bold" style={{ color: "var(--primary)" }}>募集ページ</Link>
              </div>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
                {a.status === "pending" && "募集チームが承認すると「エントリー完了」になります。"}
                {a.status === "approved" && !isPast(post) && "当日は会場でお願いします。"}
                {a.status === "approved" && isPast(post) && "試合おつかれさまでした。「評価する」からチームを評価できます。"}
              </p>
              {a.status === "pending" && (
                <button type="button" className="mt-2 text-[13.5px] underline" style={{ color: "var(--text-sub)" }} onClick={() => cancelApplication(a.id)}>
                  エントリーを取り消す
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}


/** 終わった試合の相手を評価する */
export function RatePanel({ items }: { items: PendingRating[] }) {
  const [thanks, setThanks] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <h2 className="text-[16px] font-bold">評価する</h2>
      <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
        エントリー完了して試合日を過ぎた相手を評価できます。評価は相手のページに表示され、次に募集する人の判断材料になります。
      </p>
      {thanks && (
        <p className="mt-3 rounded-[10px] px-4 py-3 text-[14px] font-bold" style={{ background: "var(--primary-bg)", color: "var(--primary)" }} role="status">
          {thanks} を評価しました。ありがとうございます。
        </p>
      )}
      {items.length === 0 && <p className="mt-3 text-[14px]" style={{ color: "var(--text-sub)" }}>いま評価できる相手はいません。</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((it) => (
          <RateCard key={`${it.application.id}-${it.from.kind}-${it.from.id}`} it={it} onDone={() => setThanks(it.toName)} />
        ))}
      </ul>
    </div>
  );
}

function RateCard({ it, onDone }: { it: PendingRating; onDone: () => void }) {
  const [stars, setStars] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [comment, setComment] = useState("");
  return (
    <li className="card p-4">
      <PostHead post={it.post} />
      <p className="mt-2 text-[15px]">
        <b>{it.toName}</b> はどうでしたか？
        <span className="ml-2 text-[13px]" style={{ color: "var(--text-sub)" }}>
          {it.from.kind === "team" ? `（${it.post.team.id === it.from.id ? it.post.team.name : "自チーム"}として）` : "（個人として）"}
        </span>
      </p>
      <div className="mt-2">
        <StarInput value={stars} onChange={setStars} />
      </div>
      <textarea
        className="field mt-1" rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="一言あれば（任意）。例: 時間どおりで気持ちよく試合ができました。"
      />
      <button
        type="button" className="btn btn-primary mt-3" disabled={stars === 0}
        style={{ opacity: stars === 0 ? 0.5 : 1 }}
        onClick={() => {
          if (stars === 0) return;
          addRating({ postId: it.post.id, applicationId: it.application.id, from: it.from, to: it.to, stars, comment: comment.trim() || undefined });
          onDone();
        }}
      >
        この評価を送る
      </button>
    </li>
  );
}
