"use client";

import type { PostKind, Level } from "@/types";

export type FilterState = {
  kind: PostKind | "all";
  level: Level | "all";
  within: 7 | 14 | 30 | 0;
};

function Seg<T extends string | number>({
  items, value, onPick,
}: { items: readonly (readonly [T, string])[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="flex" style={{ border: "1px solid var(--chalk-16)" }}>
      {items.map(([v, label], i) => {
        const on = v === value;
        return (
          <button
            key={String(v)}
            onClick={() => onPick(v)}
            className="sign whitespace-nowrap px-2.5 py-1.5 text-[10px] transition-colors"
            style={{
              background: on ? "var(--chalk)" : "transparent",
              color: on ? "var(--night)" : "var(--chalk-60)",
              borderLeft: i ? "1px solid var(--chalk-16)" : "none",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Filters({
  value, onChange, count,
}: { value: FilterState; onChange: (v: FilterState) => void; count: number }) {
  const set = (p: Partial<FilterState>) => onChange({ ...value, ...p });
  return (
    <div className="rule-b no-bar flex items-center gap-3 overflow-x-auto px-4 py-2.5">
      <Seg
        items={[["all", "すべて"], ["training_match", "TM"], ["helper", "助っ人"]] as const}
        value={value.kind} onPick={(v) => set({ kind: v })}
      />
      <Seg
        items={[[7, "今週"], [14, "2週"], [30, "1ヶ月"], [0, "全部"]] as const}
        value={value.within} onPick={(v) => set({ within: v })}
      />
      <Seg
        items={[["all", "レベル不問"], ["beginner", "初心者"], ["casual", "エンジョイ"], ["competitive", "本格"]] as const}
        value={value.level} onPick={(v) => set({ level: v })}
      />
      <p className="dsp ml-auto shrink-0 text-[13px]" style={{ color: "var(--chalk-60)" }}>
        {count}<span className="ml-1 text-[10px]">件</span>
      </p>
    </div>
  );
}
