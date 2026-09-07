import type { Post } from "@/types";
import { LEVEL_LABEL } from "@/types";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

export default function PostCard({ post, active }: { post: Post; active: boolean }) {
  const helper = post.kind === "helper";
  const d = new Date(post.date + "T00:00:00");
  const accent = helper ? "var(--cone)" : "var(--turf)";

  return (
    <article
      className={`corner-arc relative flex h-full w-[19.5rem] shrink-0 snap-start flex-col ${
        active ? "panel-on" : "panel"
      }`}
      style={{
        border: `1px solid ${active ? "var(--flood)" : "var(--chalk-16)"}`,
        transition: "border-color .25s",
      }}
    >
      {/* 掲示の見出し。種別は色ではなく標識で示す */}
      <div
        className="sign flex items-center justify-between px-3 py-1.5 text-[10px]"
        style={{ background: accent, color: "var(--night)" }}
      >
        <span>{helper ? "HELPER" : "TRAINING MATCH"}</span>
        <span style={{ opacity: 0.8 }}>{LEVEL_LABEL[post.level]}</span>
      </div>

      <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-3">
        {/* 数字を主役に。日と時刻の桁を揃える */}
        <div className="flex items-end gap-3">
          <p className="dsp" style={{ fontSize: "3rem", fontWeight: 700 }}>
            {String(d.getMonth() + 1).padStart(2, "0")}
            <span style={{ color: "var(--chalk-38)" }}>.</span>
            {String(d.getDate()).padStart(2, "0")}
          </p>
          <div className="pb-0.5">
            <p className="sign text-[10px]" style={{ color: "var(--flood)" }}>{WD[d.getDay()]}</p>
            <p className="dsp mt-1 text-[16px]" style={{ fontWeight: 600 }}>
              {post.startTime}–{post.endTime}
            </p>
          </div>
        </div>

        {/* 選択が移った瞬間だけ白線を引き直す */}
        <div
          key={active ? "on" : "off"}
          className={active ? "chalk-in h-px" : "h-px"}
          style={{ background: active ? "var(--flood)" : "var(--chalk-16)" }}
        />

        {/* 役所の掲示に近い項目立て。項目名の幅を固定して罫線に揃える */}
        <dl className="spec">
          <dt>チーム</dt>
          <dd className="font-bold">{post.team.name}</dd>

          <dt>会場</dt>
          <dd>
            {post.venue.name}
            <span className="ml-1" style={{ color: "var(--chalk-sub)" }}>{post.venue.city}</span>
          </dd>

          {helper && (
            <>
              <dt>募集</dt>
              <dd style={{ color: "var(--cone)" }} className="font-bold">
                {post.positions?.join("・")} あと{post.needed}名
              </dd>
            </>
          )}

          <dt>参加費</dt>
          <dd className="dsp text-[13px]">{post.fee ? `¥${post.fee.toLocaleString()}` : "なし"}</dd>
        </dl>

        <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: "var(--chalk-sub)" }}>
          {post.body}
        </p>
      </div>
    </article>
  );
}
