"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SearchMap from "@/components/SearchMap";
import PostCard from "@/components/PostCard";
import PostSheet from "@/components/PostSheet";
import Filters, { defaultFilter, type FilterState } from "@/components/Filters";
import { fmtDateJa } from "@/components/Calendar";
import { SITE } from "@/config/site";
import { distanceKm } from "@/lib/geo";
import { applicationsForPost, listPosts, ratingSummary, useDB } from "@/lib/store";

export type LatLng = { lat: number; lng: number };

export default function SearchPage() {
  const db = useDB();
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [activeId, setActiveId] = useState<string | null>(null);
  // 地図のピンを押したときだけ、下からカードを出す
  const [sheetOpen, setSheetOpen] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // 現在地。距離で絞るときと、地図の現在地ボタンを押したときだけ入る
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // 日付・場所以外の条件で絞った「これからの募集」。カレンダーの件数と場所の件数はここから数える
  const base = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return listPosts(db).filter((p) => {
      if (p.status === "closed") return false;
      if (filter.kind !== "all" && p.kind !== filter.kind) return false;
      if (filter.level !== "all" && p.level !== filter.level) return false;
      if (new Date(p.date + "T00:00:00").getTime() < today.getTime()) return false; // 過ぎた募集は出さない
      if (filter.radiusKm && origin) {
        if (distanceKm(origin, p.venue) > filter.radiusKm) return false;
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [db, filter.kind, filter.level, filter.radiusKm, origin]);

  const byCity = useMemo(() => base.filter((p) => filter.city === "all" || p.venue.city === filter.city), [base, filter.city]);

  // 日付ごとの件数（場所まで絞ったあと）。カレンダーに出す
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    byCity.forEach((p) => { c[p.date] = (c[p.date] ?? 0) + 1; });
    return c;
  }, [byCity]);
  // 場所ごとの件数は日付に関係なく「これからの募集」全体で数える（場所→日付の順に探せるように）
  const cities = useMemo(() => {
    const c = new Map<string, number>();
    base.forEach((p) => c.set(p.venue.city, (c.get(p.venue.city) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"));
  }, [base]);

  const posts = useMemo(() => byCity.filter((p) => !filter.date || p.date === filter.date), [byCity, filter.date]);

  // 選んだ日に募集が無いとき、次に募集がある日を案内する
  const nextDate = useMemo(() => {
    if (!filter.date || posts.length > 0) return null;
    return byCity.find((p) => p.date > filter.date!)?.date ?? null;
  }, [byCity, filter.date, posts.length]);

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
    setSheetOpen(false);
    if (v.radiusKm && !origin) locate();
    if (!v.radiusKm) setLocError(null);
  }, [origin, locate]);

  // 地図の現在地ボタンで取れた位置も、距離の基準に使う
  const onLocate = useCallback((p: LatLng) => { setOrigin(p); setLocError(null); }, []);

  // ピンを押したら、そのカードを下から出し、リストも送っておく
  const selectFromMap = useCallback((id: string) => {
    setActiveId(id);
    setSheetOpen(true);
    cardRefs.current[id]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  // シートでスワイプして選択が変わったら、地図とリストも追従させる
  const activateFromSheet = useCallback((id: string) => {
    setActiveId(id);
    cardRefs.current[id]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const cardProps = useCallback((p: typeof posts[number]) => ({
    distanceKm: origin ? distanceKm(origin, p.venue) : null,
    rating: ratingSummary(db, { kind: "team", id: p.teamId }),
    entries: applicationsForPost(db, p.id).filter((a) => a.status !== "rejected").length,
  }), [db, origin]);

  return (
    <main className="flex h-dvh flex-col">
      <Header subtitle={`${SITE.area}のトレーニングマッチと助っ人を探す`} />

      {/* 条件バー。食べログ風に上部へ横並び、各項目はドロップダウン */}
      <div className="relative z-30 shrink-0" style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <Filters value={filter} onChange={changeFilter} locating={locating} locError={locError} counts={counts} cities={cities} />
        <div className="ticks" aria-hidden />
      </div>

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

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-3 md:pb-6">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
              <span className="hud hud-accent">scan result</span>
              <p className="text-[13.5px] font-bold" style={{ color: "var(--text-sub)" }}>
                {filter.date && <span style={{ color: "var(--text)" }}>{fmtDateJa(filter.date)} </span>}
                <span className="num text-[16px]" style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>{posts.length}</span>件の募集
                <span className="ml-2 font-normal">
                  {filter.date ? "時間の早い順" : "日付の近い順"}
                  {filter.city !== "all" ? `・${filter.city}` : ""}
                  {filter.radiusKm && origin ? `・現在地から${filter.radiusKm}km以内` : ""}
                </span>
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-[15px] font-bold">
                  {filter.date ? `${fmtDateJa(filter.date)}の募集はありません` : "条件に合う募集がありません"}
                </p>
                {nextDate ? (
                  <>
                    <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
                      次に募集があるのは <b style={{ color: "var(--text)" }}>{fmtDateJa(nextDate)}</b>（{counts[nextDate]}件）です。
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <button type="button" className="btn btn-primary" onClick={() => changeFilter({ ...filter, date: nextDate })}>
                        {fmtDateJa(nextDate)}を見る
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => changeFilter({ ...filter, date: null })}>
                        すべての日程を見る
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
                      日付や種別、場所を広げてみてください。
                    </p>
                    <button type="button" className="btn btn-ghost mt-4" onClick={() => changeFilter({ ...defaultFilter(), date: null })}>
                      絞り込みをすべて外す
                    </button>
                  </>
                )}
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
      <PostSheet
        open={sheetOpen && !!activeId && posts.some((p) => p.id === activeId)}
        posts={posts}
        activeId={activeId}
        onActive={activateFromSheet}
        onClose={closeSheet}
        cardProps={cardProps}
      />
    </main>
  );
}
