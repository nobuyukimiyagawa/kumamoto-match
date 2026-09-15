"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SearchMap from "@/components/SearchMap";
import PostCard from "@/components/PostCard";
import Filters, { type FilterState } from "@/components/Filters";
import { SITE } from "@/config/site";
import { distanceKm } from "@/lib/geo";
import { applicationsForPost, listPosts, ratingSummary, useDB } from "@/lib/store";

export type LatLng = { lat: number; lng: number };

export default function SearchPage() {
  const db = useDB();
  const [filter, setFilter] = useState<FilterState>({ kind: "all", level: "all", within: 30, radiusKm: 0 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // 現在地。距離で絞るときと、地図の現在地ボタンを押したときだけ入る
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const posts = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return listPosts(db).filter((p) => {
      if (p.status === "closed") return false;
      if (filter.kind !== "all" && p.kind !== filter.kind) return false;
      if (filter.level !== "all" && p.level !== filter.level) return false;
      const diff = (new Date(p.date + "T00:00:00").getTime() - today.getTime()) / 86400000;
      if (diff < 0) return false;                       // 過ぎた募集は出さない
      if (filter.within && diff > filter.within) return false;
      if (filter.radiusKm && origin) {
        if (distanceKm(origin, p.venue) > filter.radiusKm) return false;
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [db, filter, origin]);

  // 距離の絞り込みを選んだら、その場で現在地を取りに行く
  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocError("この端末では位置情報が使えません。");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setFilter((f) => ({ ...f, radiusKm: 0 }));
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません。ブラウザの設定で許可してから、もう一度お試しください。"
            : "現在地を取得できませんでした。電波の良い場所でもう一度お試しください。",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // 絞り込みが変わったら選択を外す（勝手に先頭へ飛ばない）
  const changeFilter = useCallback((v: FilterState) => {
    setFilter(v);
    setActiveId(null);
    if (v.radiusKm && !origin) locate();
    if (!v.radiusKm) setLocError(null);
  }, [origin, locate]);

  // 地図の現在地ボタンで取れた位置も、距離の基準に使う
  const onLocate = useCallback((p: LatLng) => { setOrigin(p); setLocError(null); }, []);

  // ピンを押したら、そのカードまでリストを送る
  const selectFromMap = useCallback((id: string) => {
    setActiveId(id);
    cardRefs.current[id]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <main className="flex h-dvh flex-col">
      <Header subtitle={`${SITE.area}のトレーニングマッチと助っ人を探す`} />

      {/* スマホは 上=地図 / 下=リスト。PC は 左=リスト / 右=地図 */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section
          className="relative h-[36vh] shrink-0 md:order-2 md:h-auto md:flex-1"
          style={{ borderBottom: "1px solid var(--line)", background: "var(--bg)" }}
          aria-label="地図"
        >
          <SearchMap
            posts={posts} activeId={activeId} onSelect={selectFromMap}
            origin={origin} radiusKm={filter.radiusKm} onLocate={onLocate}
          />
        </section>

        <section
          className="flex min-h-0 flex-1 flex-col md:order-1 md:w-[30rem] md:flex-none"
          style={{ background: "var(--bg-2)", borderRight: "1px solid var(--line)" }}
          aria-label="募集一覧"
        >
          <div className="px-4 py-2.5 md:pb-3 md:pt-3" style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
            <p className="hud mb-2 hidden md:block">filter</p>
            <Filters value={filter} onChange={changeFilter} locating={locating} locError={locError} />
          </div>
          <div className="ticks" aria-hidden />

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-3 md:pb-6">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="hud hud-accent">scan result</span>
              <p className="text-[13.5px] font-bold" style={{ color: "var(--text-sub)" }}>
                <span className="num text-[16px]" style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>{posts.length}</span>件の募集
                <span className="ml-2 font-normal">
                  日付の近い順{filter.radiusKm && origin ? `・現在地から${filter.radiusKm}km以内` : ""}
                </span>
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-[15px] font-bold">条件に合う募集がありません</p>
                <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
                  期間や種別を広げてみてください。
                </p>
                <button
                  type="button"
                  className="btn btn-ghost mt-4"
                  onClick={() => changeFilter({ kind: "all", level: "all", within: 0, radiusKm: 0 })}
                >
                  絞り込みをすべて外す
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {posts.map((p, i) => (
                  <div key={p.id} ref={(el) => { cardRefs.current[p.id] = el; }}>
                    <PostCard
                      post={p} active={activeId === p.id} onSelect={() => setActiveId(p.id)} index={i + 1}
                      distanceKm={origin ? distanceKm(origin, p.venue) : null}
                      rating={ratingSummary(db, { kind: "team", id: p.teamId })}
                      entries={applicationsForPost(db, p.id).filter((a) => a.status !== "rejected").length}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
