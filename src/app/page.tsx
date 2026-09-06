"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import SearchMap from "@/components/SearchMap";
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
    <main className="flex h-dvh flex-col bg-slate-50">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-base font-bold tracking-tight text-slate-900">{SITE.name}</p>
        <p className="hidden text-xs text-slate-500 sm:block">{SITE.tagline}</p>
        <Link
          href="/post/new"
          className="ml-auto rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
        >
          募集する
        </Link>
      </header>

      <Filters value={filter} onChange={setFilter} count={posts.length} />

      <div className="relative min-h-0 flex-1">
        <SearchMap posts={posts} activeId={activeId} onSelect={selectFromMap} />
      </div>

      <div className="border-t border-slate-200 bg-slate-100">
        {posts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            条件に合う募集がありません。期間や種別を広げてみてください。
          </p>
        ) : (
          <div
            ref={railRef}
            onScroll={onRailScroll}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4"
          >
            {posts.map((p) => (
              <div
                key={p.id}
                ref={(el) => { cardRefs.current[p.id] = el; }}
                onClick={() => setActiveId(p.id)}
                className="cursor-pointer"
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
