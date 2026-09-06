"use client";

import type { PostKind, Level } from "@/types";

export type FilterState = {
  kind: PostKind | "all";
  level: Level | "all";
  within: 7 | 14 | 30 | 0; // 0 = すべて
};

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-bold transition ${
    on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
  }`;

export default function Filters({
  value, onChange, count,
}: { value: FilterState; onChange: (v: FilterState) => void; count: number }) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex gap-1.5">
        {([["all","すべて"],["training_match","トレーニングマッチ"],["helper","助っ人"]] as const).map(([k, label]) => (
          <button key={k} className={chip(value.kind === k)} onClick={() => set({ kind: k as FilterState["kind"] })}>
            {label}
          </button>
        ))}
      </div>

      <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden />

      <div className="flex gap-1.5">
        {([[7,"今週"],[14,"2週間"],[30,"1ヶ月"],[0,"すべて"]] as const).map(([d, label]) => (
          <button key={d} className={chip(value.within === d)} onClick={() => set({ within: d as FilterState["within"] })}>
            {label}
          </button>
        ))}
      </div>

      <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden />

      <div className="flex gap-1.5">
        {([["all","レベル不問"],["beginner","初心者歓迎"],["casual","エンジョイ"],["competitive","本格志向"]] as const).map(([l, label]) => (
          <button key={l} className={chip(value.level === l)} onClick={() => set({ level: l as FilterState["level"] })}>
            {label}
          </button>
        ))}
      </div>

      <p className="ml-auto text-xs font-bold text-slate-500">{count} 件</p>
    </div>
  );
}
