"use client";

import { useEffect, useRef } from "react";
import PostCard from "@/components/PostCard";
import type { PostView } from "@/lib/store";

/**
 * 地図のピンを押したときに、画面の下から出てくるカード（ボトムシート）。
 * 画面の横幅いっぱいに出し、地図の上にも重なる。× か背景を押すか、Esc か下スワイプで閉じる。
 * 「‹ ›」で前後の反応点へ移れる。
 */
export default function PostSheet({
  open, post, index, total, onClose, onPrev, onNext, distanceKm, rating, entries,
}: {
  open: boolean;
  post: PostView | null;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  distanceKm: number | null;
  rating: { avg: number; count: number };
  entries: number;
}) {
  const startY = useRef<number | null>(null);

  // Esc で閉じる。← → で前後へ
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  return (
    <>
      {/* 背景。押すと閉じる。地図の操作は一旦止める */}
      <div
        className="sheet-backdrop"
        data-open={open}
        onClick={onClose}
        aria-hidden
      />
      <section
        className="sheet"
        data-open={open}
        role="dialog"
        aria-modal="false"
        aria-label={post ? `${post.team.name} の募集` : "募集"}
        aria-hidden={!open}
        onTouchStart={(e) => { startY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          // 下に 60px 以上スワイプしたら閉じる
          if (startY.current != null && e.changedTouches[0].clientY - startY.current > 60) onClose();
          startY.current = null;
        }}
      >
        <div className="sheet-inner">
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="sheet-handle" aria-hidden />
            <p className="hud hud-accent">
              target <b style={{ color: "var(--text)", fontWeight: 400 }}>{String(index + 1).padStart(2, "0")}</b> / {String(total).padStart(2, "0")}
            </p>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 12px" }} onClick={onPrev} disabled={total < 2} aria-label="前の募集">‹</button>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 12px" }} onClick={onNext} disabled={total < 2} aria-label="次の募集">›</button>
              <button type="button" className="btn btn-ghost ml-1" style={{ minHeight: 36, padding: "0 12px" }} onClick={onClose} aria-label="閉じる">✕ 閉じる</button>
            </div>
          </div>
          {post && (
            <PostCard
              post={post} active onSelect={() => {}} index={index + 1}
              distanceKm={distanceKm} rating={rating} entries={entries}
            />
          )}
        </div>
      </section>
    </>
  );
}
