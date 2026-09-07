import type { Post } from "@/types";
import { LEVEL_LABEL } from "@/types";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

export default function PostCard({ post, active }: { post: Post; active: boolean }) {
  const helper = post.kind === "helper";
  const d = new Date(post.date + "T00:00:00");
  const accent = helper ? "var(--cone)" : "var(--turf)";

  return (
    <article
      className="corner-arc relative flex h-full w-[17.5rem] shrink-0 snap-start flex-col"
      style={{
        background: active ? "var(--night-3)" : "var(--night-2)",
        border: `1px solid ${active ? "var(--flood)" : "var(--chalk-16)"}`,
        boxShadow: active ? "0 -18px 40px -18px rgba(231,209,94,.55) inset" : "none",
        transition: "border-color .25s, background .25s",
      }}
    >
      {/* 種別は色ではなく標識で示す */}
      <div
        className="sign flex items-center justify-between px-3 py-1.5 text-[10px]"
        style={{ background: accent, color: "var(--night)" }}
      >
        <span>{helper ? "HELPER" : "TRAINING MATCH"}</span>
        <span style={{ opacity: 0.75 }}>{LEVEL_LABEL[post.level]}</span>
      </div>

      <div className="flex flex-col gap-2.5 p-3.5">
        {/* 日付と時刻。スコアボードの並び */}
        <div className="flex items-end gap-2.5">
          <p className="dsp leading-none" style={{ fontSize: "2.6rem", fontWeight: 700 }}>
            {String(d.getMonth() + 1).padStart(2, "0")}
            <span style={{ color: "var(--chalk-sub)" }}>.</span>
            {String(d.getDate()).padStart(2, "0")}
          </p>
          <div className="pb-1">
            <p className="sign text-[10px]" style={{ color: "var(--flood)" }}>{WD[d.getDay()]}</p>
            <p className="dsp text-[15px] leading-none" style={{ fontWeight: 600 }}>
              {post.startTime}–{post.endTime}
            </p>
          </div>
        </div>

        <div className="h-px" style={{ background: "var(--chalk-16)" }} />

        <p className="text-[13px] font-bold leading-tight">{post.team.name}</p>

        <p className="text-[11px] leading-snug" style={{ color: "var(--chalk-60)" }}>
          {post.venue.name}
          <span className="ml-1" style={{ color: "var(--chalk-sub)" }}>{post.venue.city}</span>
        </p>

        {/* 判断に使う標識だけを出す */}
        <ul className="flex flex-wrap gap-1">
          {helper && (
            <li className="sign px-1.5 py-0.5 text-[10px]"
                style={{ border: "1px solid var(--cone)", color: "var(--cone)" }}>
              {post.positions?.join("/")} あと{post.needed}
            </li>
          )}
          <li className="sign px-1.5 py-0.5 text-[10px]"
              style={{ border: "1px solid var(--chalk-16)", color: "var(--chalk-60)" }}>
            {post.fee ? `¥${post.fee}` : "参加費なし"}
          </li>
        </ul>

        <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: "var(--chalk-sub)" }}>
          {post.body}
        </p>
      </div>
    </article>
  );
}
