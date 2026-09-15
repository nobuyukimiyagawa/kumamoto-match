"use client";

import Link from "next/link";
import { LEVEL_LABEL, KIND_LABEL, POSITION_LABEL } from "@/types";
import { fmtKm } from "@/lib/geo";
import { Stars } from "@/components/Stars";
import type { PostView } from "@/lib/store";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/** 日付を「9月14日（月）」の形にする */
export function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`;
}

export default function PostCard({
  post, active, onSelect, distanceKm, rating, entries, index,
}: {
  post: PostView;
  /** 一覧での通し番号。計器の「TGT 01」表示用 */
  index?: number;
  active: boolean;
  onSelect: () => void;
  distanceKm?: number | null;
  /** 募集主チームの評価 */
  rating: { avg: number; count: number };
  /** 承認待ち＋完了のエントリー数 */
  entries: number;
}) {
  const helper = post.kind === "helper";

  return (
    <article
      className={`card p-4 transition-shadow ${active ? "card-active" : ""}`}
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
    >
      {/* 1行目: 種別とレベル。色だけに頼らず文字で示す */}
      <div className="flex flex-wrap items-center gap-2">
        {index != null && (
          <span className="hud" aria-hidden>tgt {String(index).padStart(2, "0")}</span>
        )}
        <span className={`badge ${helper ? "badge-helper" : "badge-match"}`}>{KIND_LABEL[post.kind]}</span>
        <span className="badge badge-gray">{LEVEL_LABEL[post.level]}</span>
        {post.status === "filled" && <span className="badge badge-gray">成立</span>}
        {active && (
          <span className="hud hud-accent ml-auto" style={{ fontWeight: 700 }}>
            ● lock
          </span>
        )}
      </div>

      {/* 2行目: いつ。いちばん最初に知りたい情報を最も大きく */}
      <p className="num mt-2.5 text-[18px] font-bold leading-tight">
        {fmtDate(post.date)}
        <span className="ml-2" style={{ fontFamily: "var(--font-mono)", fontWeight: 400, letterSpacing: ".04em" }}>
          {post.startTime}–{post.endTime}
        </span>
      </p>

      {/* 3行目: 誰が（評価つき）、どこで */}
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[16px] font-bold">
        {post.team.name}
        <Stars value={rating.avg} count={rating.count} size={14} />
      </p>
      <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-sub)" }}>
        <span aria-hidden style={{ color: "var(--primary)" }}>◎ </span>{post.venue.name}
        <span className="ml-1">（{post.venue.city}）</span>
        {distanceKm != null && (
          <span className="num ml-2 inline-block whitespace-nowrap font-bold" style={{ color: "var(--primary)" }}>
            現在地から{fmtKm(distanceKm)}
          </span>
        )}
      </p>

      {/* 4行目: 条件 */}
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
        {helper && (
          <p className="font-bold" style={{ color: "var(--helper)" }}>
            {post.positions?.map((p) => POSITION_LABEL[p]).join("・")} あと{post.needed}名
          </p>
        )}
        <p>
          <span style={{ color: "var(--text-sub)" }}>参加費 </span>
          <span className="num font-bold">{post.fee ? `${post.fee.toLocaleString()}円` : "無料"}</span>
        </p>
        {entries > 0 && (
          <p className="num" style={{ color: "var(--text-sub)" }}>エントリー{entries}件</p>
        )}
      </div>

      <p className="mt-2.5 line-clamp-2 text-[14px] leading-relaxed" style={{ color: "var(--text-sub)" }}>
        {post.body}
      </p>

      <Link
        href={`/post/?id=${post.id}`}
        className="btn btn-ghost mt-3 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        詳しく見る・エントリー
      </Link>
    </article>
  );
}
