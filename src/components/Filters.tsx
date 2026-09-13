"use client";

import type { PostKind, Level } from "@/types";

export type RadiusKm = 0 | 10 | 20 | 30 | 50;

export type FilterState = {
  kind: PostKind | "all";
  level: Level | "all";
  within: 7 | 14 | 30 | 0;
  /** 現在地からの距離。0 は指定なし */
  radiusKm: RadiusKm;
};

/** 見出し付きのチップ列。スマホでは群を1行に並べて横スクロール、PCでは段組み */
function Row<T extends string | number>({
  title, items, value, onPick, busy,
}: {
  title: string;
  items: readonly (readonly [T, string])[];
  value: T;
  onPick: (v: T) => void;
  busy?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 md:items-start">
      <span className="shrink-0 text-[13px] font-bold md:w-[4.6rem] md:pt-2.5" style={{ color: "var(--text-sub)" }}>
        {title}
      </span>
      <div className="flex gap-2 py-0.5 md:flex-wrap" role="group" aria-label={title}>
        {items.map(([v, label]) => (
          <button
            key={String(v)}
            type="button"
            className="chip"
            aria-pressed={v === value}
            disabled={busy}
            onClick={() => onPick(v)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Filters({
  value, onChange, locating, locError,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  /** 現在地を取得中 */
  locating?: boolean;
  /** 現在地が取れなかったときの説明 */
  locError?: string | null;
}) {
  const set = (p: Partial<FilterState>) => onChange({ ...value, ...p });
  return (
    <div className="flex flex-col gap-2">
      {/* スマホでは右端をぼかして「まだ右にある」ことを示す */}
      <div className="scroll-hint -mx-4 md:mx-0">
      <div className="no-bar flex gap-4 overflow-x-auto px-4 md:flex-col md:gap-2 md:overflow-visible md:px-0">
        <Row
          title="種別"
          items={[["all", "すべて"], ["training_match", "トレーニングマッチ"], ["helper", "助っ人募集"]] as const}
          value={value.kind} onPick={(v) => set({ kind: v })}
        />
        <Row
          title="いつ"
          items={[[7, "1週間以内"], [14, "2週間以内"], [30, "1ヶ月以内"], [0, "すべて"]] as const}
          value={value.within} onPick={(v) => set({ within: v })}
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
      {locating && (
        <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>現在地を取得しています…</p>
      )}
      {locError && (
        <p className="text-[13px] font-bold" style={{ color: "var(--danger)" }}>{locError}</p>
      )}
    </div>
  );
}
