"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import SearchMap from "@/components/SearchMap";
import PitchLines from "@/components/PitchLines";
import PostCard from "@/components/PostCard";
import Filters, { type FilterState } from "@/components/Filters";
import { POSTS } from "@/lib/mock";
import { SITE } from "@/config/site";

export default function SearchPage() {
  const [filter, setFilter] = useState<FilterState>({ kind: "all", level: "all", within: 7 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // カード送りでピンを追う処理を、ピン押下の自動スクロール中は止める
  const syncing = useRef(false);

  const posts = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return POSTS.filter((p) => {
      if (p.status !== "open") return false;
      if (filter.kind !== "all" && p.kind !== filter.kind) return false;
      if (filter.level !== "all" && p.level !== filter.level) return false;
      if (filter.within) {
        const diff = (new Date(p.date + "T00:00:00").getTime() - today.getTime()) / 86400000;
        if (diff < 0 || diff > filter.within) return false;
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [filter]);

  // 絞り込みが変わったら先頭を選び直す
  useEffect(() => {
    setActiveId(posts[0]?.id ?? null);
  }, [posts]);

  // ピンを押したらカードをそこへ送る
  function selectFromMap(id: string) {
    setActiveId(id);
    const el = cardRefs.current[id];
    if (el && railRef.current) {
      syncing.current = true;
      railRef.current.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
      setTimeout(() => { syncing.current = false; }, 500);
    }
  }

  // カードを送ったら、中央にあるものをピンとして強調する
  function onRailScroll() {
    if (syncing.current || !railRef.current) return;
    const rail = railRef.current;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let best: string | null = null; let bestD = Infinity;
    for (const p of posts) {
      const el = cardRefs.current[p.id];
      if (!el) continue;
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (d < bestD) { bestD = d; best = p.id; }
    }
    if (best && best !== activeId) setActiveId(best);
  }

  return (
    <main className="relative isolate flex h-dvh flex-col">
      {/* 地の模様。必ず背面に置く */}
      <PitchLines className="-z-10 opacity-70" />
      {/* ヘッダー。ハーフウェイラインを1本引く */}
      <header className="panel rule-b relative flex items-center gap-3 px-4 py-3">
        <p className="relative text-[15px] font-bold tracking-tight">{SITE.name}</p>
        <p className="sign relative hidden text-[10px] sm:block" style={{ color: "var(--chalk-sub)" }}>
          {SITE.area}
        </p>
        <Link
          href="/post/new"
          className="sign relative ml-auto px-3.5 py-2 text-[10px] transition-colors"
          style={{ background: "var(--flood)", color: "var(--night)" }}
        >
          募集する
        </Link>
      </header>

      <Filters value={filter} onChange={setFilter} count={posts.length} />

      <div className="relative min-h-0 flex-1">
        <SearchMap posts={posts} activeId={activeId} onSelect={selectFromMap} />
      </div>

      <div className="rule-t">
        {posts.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12px]" style={{ color: "var(--chalk-sub)" }}>
            条件に合う募集がありません。期間や種別を広げてください。
          </p>
        ) : (
          <div
            ref={railRef}
            onScroll={onRailScroll}
            className="no-bar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 py-3.5"
          >
            {posts.map((p, i) => (
              <div
                key={p.id}
                ref={(el) => { cardRefs.current[p.id] = el; }}
                onClick={() => setActiveId(p.id)}
                className="rise cursor-pointer"
                style={{ animationDelay: `${Math.min(i, 6) * 55}ms` }}
              >
                <PostCard post={p} active={activeId === p.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
