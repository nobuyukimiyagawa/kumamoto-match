"use client";

import { useState } from "react";
import type { Post } from "@/types";
import { LEVEL_LABEL, KIND_LABEL } from "@/types";
import { fmtKm } from "@/lib/geo";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/** 日付を「9月14日（月）」の形にする */
export function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`;
}

export default function PostCard({
  post, active, onSelect, distanceKm,
}: { post: Post; active: boolean; onSelect: () => void; distanceKm?: number | null }) {
  const helper = post.kind === "helper";
  const [open, setOpen] = useState(false);

  return (
    <article
      className={`card p-4 transition-shadow ${active ? "card-active" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      aria-pressed={active}
    >
      {/* 1行目: 種別とレベル。色だけに頼らず文字で示す */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${helper ? "badge-helper" : "badge-match"}`}>{KIND_LABEL[post.kind]}</span>
        <span className="badge badge-gray">{LEVEL_LABEL[post.level]}</span>
        {active && (
          <span className="ml-auto text-[12.5px] font-bold" style={{ color: "var(--primary)" }}>
            地図に表示中
          </span>
        )}
      </div>

      {/* 2行目: いつ。いちばん最初に知りたい情報を最も大きく */}
      <p className="num mt-2.5 text-[18px] font-bold leading-tight">
        {fmtDate(post.date)}
        <span className="ml-2">{post.startTime}〜{post.endTime}</span>
      </p>

      {/* 3行目: 誰が、どこで */}
      <p className="mt-1.5 text-[16px] font-bold">{post.team.name}</p>
      <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-sub)" }}>
        <span aria-hidden>📍 </span>{post.venue.name}
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
            {post.positions?.map((p) => (p === "ANY" ? "ポジション不問" : p)).join("・")} あと{post.needed}名
          </p>
        )}
        <p>
          <span style={{ color: "var(--text-sub)" }}>参加費 </span>
          <span className="num font-bold">{post.fee ? `${post.fee.toLocaleString()}円` : "無料"}</span>
        </p>
      </div>

      {/* 本文。長いときは畳んで、ボタンで開く */}
      <p
        className={`mt-2.5 text-[14px] leading-relaxed ${open ? "" : "line-clamp-2"}`}
        style={{ color: "var(--text-sub)" }}
      >
        {post.body}
      </p>
      {post.body.length > 40 && (
        <button
          type="button"
          className="mt-1 text-[13.5px] font-bold underline-offset-2 hover:underline"
          style={{ color: "var(--primary)" }}
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        >
          {open ? "閉じる" : "続きを読む"}
        </button>
      )}
    </article>
  );
}
