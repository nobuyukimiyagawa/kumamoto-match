"use client";

import { useEffect, useRef, useState } from "react";
import type { PostKind, Level } from "@/types";
import { KIND_LABEL, LEVEL_LABEL } from "@/types";
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

type Key = "date" | "kind" | "city" | "radius" | "level";

/**
 * 画面上部の条件バー（食べログの「エリア／ジャンル／日付」の並びと同じ）。
 * 各条件はドロップダウン。PC では下に開き、スマホでは画面下からシートで開く。
 * 選ぶと即座に絞り込む（検索ボタンは無い）。
 */
export default function Filters({
  value, onChange, locating, locError, counts, cities,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  locating?: boolean;
  locError?: string | null;
  /** 日付ごとの募集数（日付以外の条件を適用したあと） */
  counts: Record<string, number>;
  /** 会場の市区町村と件数 */
  cities: [string, number][];
}) {
  const [open, setOpen] = useState<Key | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const set = (p: Partial<FilterState>) => { onChange({ ...value, ...p }); setOpen(null); };

  // 外側を押すか Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (bar.current && !bar.current.contains(e.target as Node)) setOpen(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const dateText = value.date === null ? "すべての日程" : value.date === today ? `今日 ${fmtDateJa(today)}` : value.date === tomorrow ? `明日 ${fmtDateJa(tomorrow)}` : fmtDateJa(value.date);
  const isDefault = value.kind === "all" && value.level === "all" && value.city === "all" && value.radiusKm === 0 && value.date === today;

  const toggle = (k: Key) => setOpen((o) => (o === k ? null : k));

  return (
    <div ref={bar} className="relative">
      <div className="no-bar flex items-stretch gap-1 overflow-x-auto px-3 py-2 md:px-4" role="toolbar" aria-label="絞り込み">
        <Trigger label="日付" value={dateText} open={open === "date"} onClick={() => toggle("date")} accent />
        <Trigger label="マッチタイプ" value={value.kind === "all" ? "すべて" : value.kind === "training_match" ? "トレマ" : "助っ人"} open={open === "kind"} onClick={() => toggle("kind")} />
        <Trigger label="場所" value={value.city === "all" ? "すべて" : value.city} open={open === "city"} onClick={() => toggle("city")} />
        <Trigger label="現在地から" value={value.radiusKm ? `${value.radiusKm}km以内` : "指定なし"} open={open === "radius"} onClick={() => toggle("radius")} busy={locating} />
        <Trigger label="レベル" value={value.level === "all" ? "問わない" : LEVEL_LABEL[value.level]} open={open === "level"} onClick={() => toggle("level")} />
        {!isDefault && (
          <button
            type="button" className="hud ml-auto shrink-0 self-center px-2 py-2 underline"
            style={{ color: "var(--text-sub)" }}
            onClick={() => { onChange(defaultFilter()); setOpen(null); }}
          >
            条件をリセット
          </button>
        )}
      </div>

      {open && <div className="dd-backdrop" onClick={() => setOpen(null)} aria-hidden />}

      {open === "date" && (
        <Panel title="日付" onClose={() => setOpen(null)} wide>
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={value.date === today} onClick={() => set({ date: today })}>今日 <span className="num ml-1 opacity-80">{counts[today] ?? 0}</span></button>
            <button type="button" className="chip" aria-pressed={value.date === tomorrow} onClick={() => set({ date: tomorrow })}>明日 <span className="num ml-1 opacity-80">{counts[tomorrow] ?? 0}</span></button>
            <button type="button" className="chip" aria-pressed={value.date === null} onClick={() => set({ date: null })}>すべての日程</button>
          </div>
          <Calendar value={value.date} counts={counts} onChange={(iso) => set({ date: iso })} />
        </Panel>
      )}
      {open === "kind" && (
        <Panel title="マッチタイプ" onClose={() => setOpen(null)}>
          <Options
            items={[["all", "すべて"], ["training_match", KIND_LABEL.training_match + "（対戦相手を探す）"], ["helper", KIND_LABEL.helper + "（助っ人を探す）"]] as const}
            value={value.kind} onPick={(v) => set({ kind: v })}
          />
        </Panel>
      )}
      {open === "city" && (
        <Panel title="場所（会場の市区町村）" onClose={() => setOpen(null)}>
          <Options
            items={[["all", "すべて", cities.reduce((s, [, n]) => s + n, 0)] as const, ...cities.map(([c, n]) => [c, c, n] as const)]}
            value={value.city} onPick={(v) => set({ city: v })}
          />
        </Panel>
      )}
      {open === "radius" && (
        <Panel title="現在地からの距離" onClose={() => setOpen(null)}>
          <Options
            items={[[0, "指定なし"], [10, "10km以内"], [20, "20km以内"], [30, "30km以内"], [50, "50km以内"]] as const}
            value={value.radiusKm} onPick={(v) => set({ radiusKm: v })}
          />
          <p className="hint">選ぶと、この端末の位置情報を使います。地図には会場だけが表示され、あなたの位置は保存されません。</p>
          {locating && <p className="mt-1 text-[13px]" style={{ color: "var(--text-sub)" }}>現在地を取得しています…</p>}
          {locError && <p className="mt-1 text-[13px] font-bold" style={{ color: "var(--danger)" }}>{locError}</p>}
        </Panel>
      )}
      {open === "level" && (
        <Panel title="レベル" onClose={() => setOpen(null)}>
          <Options
            items={[["all", "問わない"], ["beginner", LEVEL_LABEL.beginner], ["casual", LEVEL_LABEL.casual], ["competitive", LEVEL_LABEL.competitive]] as const}
            value={value.level} onPick={(v) => set({ level: v })}
          />
        </Panel>
      )}
      {locError && !open && (
        <p className="px-4 pb-2 text-[13px] font-bold" style={{ color: "var(--danger)" }}>{locError}</p>
      )}
    </div>
  );
}

/** バーの1項目。小さな見出しと、いま選んでいる値 */
function Trigger({
  label, value, open, onClick, accent, busy,
}: { label: string; value: string; open: boolean; onClick: () => void; accent?: boolean; busy?: boolean }) {
  return (
    <button type="button" className="dd-btn" data-open={open} onClick={onClick} aria-expanded={open} aria-haspopup="dialog">
      <span className="hud" style={{ color: accent ? "var(--primary)" : "var(--text-sub)" }}>{label}</span>
      <span className="dd-val">
        {busy ? "取得中…" : value}
        <span className="dd-caret" aria-hidden>▾</span>
      </span>
    </button>
  );
}

/** 開いたパネル。PC ではバーの下、スマホでは画面下のシート */
function Panel({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="dd-panel" data-wide={wide} role="dialog" aria-label={title}>
      <div className="mb-2 flex items-center">
        <p className="hud hud-accent">{title}</p>
        <button type="button" className="btn btn-ghost ml-auto sm:hidden" style={{ minHeight: 36, padding: "0 12px" }} onClick={onClose}>閉じる</button>
      </div>
      {children}
    </div>
  );
}

/** 選択肢の縦並び。件数があれば右に出す */
function Options<T extends string | number>({
  items, value, onPick,
}: { items: readonly (readonly [T, string, number?])[]; value: T; onPick: (v: T) => void }) {
  return (
    <ul className="flex flex-col" role="listbox">
      {items.map(([v, label, n]) => {
        const on = v === value;
        return (
          <li key={String(v)}>
            <button
              type="button" role="option" aria-selected={on}
              className="flex w-full items-center gap-3 rounded-[4px] px-3 text-left text-[15px]"
              style={{ minHeight: 46, background: on ? "var(--primary-bg)" : "transparent", color: on ? "var(--primary)" : "var(--text)", fontWeight: on ? 700 : 400 }}
              onClick={() => onPick(v)}
            >
              <span className="w-4 text-center" aria-hidden>{on ? "●" : ""}</span>
              <span className="flex-1">{label}</span>
              {n != null && <span className="num text-[13px]" style={{ color: "var(--text-sub)" }}>{n}件</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
