"use client";

import { useCallback, useEffect, useRef } from "react";
import PostCard from "@/components/PostCard";
import type { PostView } from "@/lib/store";

/**
 * 地図のピンを押したときに、画面の下から出てくるカード（ボトムシート）。
 * 画面の横幅いっぱいに出し、地図の上にも重なる。
 * カードは横に並んでいて、**スワイプ（横スクロール）で次の募集へ流れる**。中央に来たカードが選択中になり、地図もそこへ寄る。
 * PC ではトラックパッドの横スクロール、マウスのドラッグ、← → キーでも動く。
 * × か背景を押すか、Esc か下スワイプで閉じる。
 */
export default function PostSheet({
  open, posts, activeId, onActive, onClose, cardProps,
}: {
  open: boolean;
  posts: PostView[];
  activeId: string | null;
  onActive: (id: string) => void;
  onClose: () => void;
  cardProps: (post: PostView) => { distanceKm: number | null; rating: { avg: number; count: number }; entries: number };
}) {
  const track = useRef<HTMLDivElement>(null);
  const items = useRef<Map<string, HTMLDivElement>>(new Map());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const programmatic = useRef(false);
  const settle = useRef<number | null>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const index = Math.max(0, posts.findIndex((p) => p.id === activeId));

  // 選択が変わったら、そのカードを中央へ送る（自分のスクロールで変わったときは動かさない）
  const scrollTo = useCallback((id: string, smooth: boolean) => {
    const t = track.current, el = items.current.get(id);
    if (!t || !el) return;
    programmatic.current = true;
    const left = el.offsetLeft - (t.clientWidth - el.clientWidth) / 2;
    t.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    window.setTimeout(() => { programmatic.current = false; }, smooth ? 450 : 50);
  }, []);
  useEffect(() => {
    if (!open || !activeId) return;
    scrollTo(activeId, true);
  }, [open, activeId, scrollTo]);
  // 開いた瞬間は、アニメーション無しで位置合わせ
  useEffect(() => {
    if (open && activeId) scrollTo(activeId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // スクロールが止まったら、中央にいちばん近いカードを選択中にする
  const onScroll = () => {
    if (programmatic.current) return;
    if (settle.current) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const t = track.current;
      if (!t) return;
      const center = t.scrollLeft + t.clientWidth / 2;
      let best: string | null = null, bestD = Infinity;
      items.current.forEach((el, id) => {
        const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - center);
        if (d < bestD) { bestD = d; best = id; }
      });
      if (best && best !== activeId) onActive(best);
    }, 120);
  };

  // Esc で閉じる。← → で前後へ
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && posts[index - 1]) onActive(posts[index - 1].id);
      else if (e.key === "ArrowRight" && posts[index + 1]) onActive(posts[index + 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onActive, posts, index]);

  return (
    <>
      {/* 背景。押すと閉じる */}
      <div className="sheet-backdrop" data-open={open} onClick={onClose} aria-hidden />
      <section
        className="sheet"
        data-open={open}
        role="dialog"
        aria-modal="false"
        aria-label="募集のカード"
        aria-hidden={!open}
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          // 縦に 60px 以上、かつ横にあまり動いていなければ閉じる（横スワイプはカード送り）
          const s = touch.current; touch.current = null;
          if (!s) return;
          const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
          if (dy > 60 && Math.abs(dx) < 40) onClose();
        }}
      >
        <div className="sheet-inner">
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="sheet-handle" aria-hidden />
            <p className="hud hud-accent">
              target <b style={{ color: "var(--text)", fontWeight: 400 }}>{String(index + 1).padStart(2, "0")}</b> / {String(posts.length).padStart(2, "0")}
              <span className="ml-3 hidden sm:inline" style={{ color: "var(--text-sub)" }}>← → で送る</span>
              <span className="ml-3 sm:hidden" style={{ color: "var(--text-sub)" }}>横にスワイプ</span>
            </p>
            <button type="button" className="btn btn-ghost ml-auto" style={{ minHeight: 36, padding: "0 12px" }} onClick={onClose} aria-label="閉じる">✕ 閉じる</button>
          </div>

          {/* 横に並ぶカード。スクロールスナップで1枚ずつ止まる */}
          <div
            ref={track}
            className="sheet-track no-bar"
            onScroll={onScroll}
            // PC のマウスでもドラッグで送れるように
            onMouseDown={(e) => {
              const t = track.current; if (!t || e.button !== 0) return;
              drag.current = { x: e.clientX, left: t.scrollLeft, moved: false };
            }}
            onMouseMove={(e) => {
              const d = drag.current, t = track.current; if (!d || !t) return;
              const dx = e.clientX - d.x;
              if (Math.abs(dx) > 4) d.moved = true;
              if (d.moved) { t.scrollLeft = d.left - dx; e.preventDefault(); }
            }}
            onMouseUp={() => { drag.current = null; }}
            onMouseLeave={() => { drag.current = null; }}
            onClickCapture={(e) => { if (drag.current?.moved) { e.stopPropagation(); e.preventDefault(); } }}
          >
            {posts.map((p, i) => {
              const cp = cardProps(p);
              return (
                <div
                  key={p.id}
                  ref={(el) => { if (el) items.current.set(p.id, el); else items.current.delete(p.id); }}
                  className="sheet-item"
                  data-active={p.id === activeId}
                  aria-hidden={p.id !== activeId}
                >
                  <PostCard post={p} active={p.id === activeId} onSelect={() => onActive(p.id)} index={i + 1} {...cp} />
                </div>
              );
            })}
          </div>

          {/* いま何枚目かの点 */}
          {posts.length > 1 && posts.length <= 20 && (
            <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
              {posts.map((p) => (
                <span key={p.id} className="sheet-dot" data-on={p.id === activeId} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
