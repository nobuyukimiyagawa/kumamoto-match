"use client";

import { useState } from "react";
import type { PostKind, Level } from "@/types";
import Calendar, { addDays, fmtDateJa, todayISO } from "@/components/Calendar";

export type RadiusKm = 0 | 10 | 20 | 30 | 50;

export type FilterState = {
  kind: PostKind | "all";
  level: Level | "all";
  /** 日付（YYYY-MM-DD）。null は「これからの募集すべて」 */
  date: string | null;
  /** 会場の市区町村。"all" は指定なし */
  city: string;
  /** 現在地からの距離。0 は指定なし */
  radiusKm: RadiusKm;
};

/** 最初は「今日」の募集を出す */
export function defaultFilter(): FilterState {
  return { kind: "all", level: "all", date: todayISO(), city: "all", radiusKm: 0 };
}

/** 見出し付きのチップ列。スマホでは群を1行に並べて横スクロール、PCでは段組み */
function Row<T extends string | number>({
  title, items, value, onPick, busy, trailing,
}: {
  title: string;
  items: readonly (readonly [T, string, number?])[];
  value: T;
  onPick: (v: T) => void;
  busy?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 md:items-start">
      <span className="shrink-0 text-[13px] font-bold md:w-[4.6rem] md:pt-2.5" style={{ color: "var(--text-sub)" }}>
        <span aria-hidden style={{ color: "var(--primary)" }}>▸ </span>{title}
      </span>
      <div className="flex gap-2 py-0.5 md:flex-wrap" role="group" aria-label={title}>
        {items.map(([v, label, n]) => (
          <button
            key={String(v)}
            type="button"
            className="chip"
            aria-pressed={v === value}
            disabled={busy}
            onClick={() => onPick(v)}
          >
            {label}
            {n != null && (
              <span className="num ml-1.5 text-[12px]" style={{ opacity: .8 }}>{n}</span>
            )}
          </button>
        ))}
        {trailing}
      </div>
    </div>
  );
}

export default function Filters({
  value, onChange, locating, locError, counts, cities,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  /** 現在地を取得中 */
  locating?: boolean;
  /** 現在地が取れなかったときの説明 */
  locError?: string | null;
  /** 日付ごとの募集数（日付以外の条件を適用したあと） */
  counts: Record<string, number>;
  /** 会場の市区町村と件数（日付・場所以外の条件を適用したあと） */
  cities: [string, number][];
}) {
  const set = (p: Partial<FilterState>) => onChange({ ...value, ...p });
  const [calOpen, setCalOpen] = useState(false);
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const d = value.date;
  // 「今日」「明日」以外の日付が選ばれているときは、カレンダーのチップにその日を出す
  const custom = d && d !== today && d !== tomorrow ? d : null;
  const dateKey = d === null ? "all" : d === today ? "today" : d === tomorrow ? "tomorrow" : "custom";

  return (
    <div className="flex flex-col gap-2">
      {/* スマホでは右端をぼかして「まだ右にある」ことを示す */}
      <div className="scroll-hint -mx-4 md:mx-0">
      <div className="no-bar flex gap-4 overflow-x-auto px-4 md:flex-col md:gap-2 md:overflow-visible md:px-0">
        <Row
          title="日付"
          items={[
            ["today", "今日", counts[today] ?? 0],
            ["tomorrow", "明日", counts[tomorrow] ?? 0],
            ["custom", custom ? fmtDateJa(custom) : "カレンダー", custom ? counts[custom] ?? 0 : undefined],
            ["all", "すべての日程"],
          ] as const}
          value={dateKey}
          onPick={(k) => {
            if (k === "today") { set({ date: today }); setCalOpen(false); }
            else if (k === "tomorrow") { set({ date: tomorrow }); setCalOpen(false); }
            else if (k === "all") { set({ date: null }); setCalOpen(false); }
            else setCalOpen((o) => !o);
          }}
        />
        <Row
          title="種別"
          items={[["all", "すべて"], ["training_match", "トレーニングマッチ"], ["helper", "助っ人募集"]] as const}
          value={value.kind} onPick={(v) => set({ kind: v })}
        />
        <Row
          title="場所"
          items={[["all", "すべて"] as const, ...cities.map(([c, n]) => [c, c, n] as const)]}
          value={value.city} onPick={(v) => set({ city: v })}
        />
        <Row
          title="現在地から"
          items={[[0, "指定なし"], [10, "10km以内"], [20, "20km以内"], [30, "30km以内"], [50, "50km以内"]] as const}
          value={value.radiusKm} onPick={(v) => set({ radiusKm: v })}
          busy={locating}
        />
        <Row
          title="レベル"
          items={[["all", "問わない"], ["beginner", "初心者歓迎"], ["casual", "エンジョイ"], ["competitive", "本格志向"]] as const}
          value={value.level} onPick={(v) => set({ level: v })}
        />
      </div>
      </div>

      {calOpen && (
        <Calendar
          value={value.date}
          counts={counts}
          onChange={(iso) => { set({ date: iso }); setCalOpen(false); }}
        />
      )}

      {locating && (
        <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>現在地を取得しています…</p>
      )}
      {locError && (
        <p className="text-[13px] font-bold" style={{ color: "var(--danger)" }}>{locError}</p>
      )}
    </div>
  );
}
