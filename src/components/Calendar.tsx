"use client";

import { useState } from "react";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/** ローカル日付を YYYY-MM-DD にする（toISOString は UTC になるので使わない） */
export function toISODate(d: Date) {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function todayISO() { return toISODate(new Date()); }
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return toISODate(d);
}
/** 「9月24日（木）」 */
export function fmtDateJa(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`;
}

/**
 * 月ごとのカレンダー。日付ごとの募集数を出し、押すとその日で絞る。
 * 今日より前は押せない。件数 0 の日は薄く出す。
 */
export default function Calendar({
  value, onChange, counts, min = todayISO(),
}: {
  value: string | null;
  onChange: (iso: string) => void;
  /** YYYY-MM-DD → その日の募集数 */
  counts: Record<string, number>;
  /** これより前は選べない */
  min?: string;
}) {
  const base = value ?? min;
  const [ym, setYm] = useState(() => base.slice(0, 7));   // 表示中の月 YYYY-MM
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = first.getDay();                              // 1日の曜日ぶん空ける
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(y, m - 1, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);
  const shift = (n: number) => {
    const d = new Date(y, m - 1 + n, 1);
    setYm(toISODate(d).slice(0, 7));
  };
  const minYm = min.slice(0, 7);
  const monthTotal = cells.reduce((s, iso) => s + (iso ? counts[iso] ?? 0 : 0), 0);

  return (
    <div className="card p-3" role="group" aria-label="日付を選ぶ">
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 10px" }} onClick={() => shift(-1)} disabled={ym <= minYm} aria-label="前の月">‹</button>
        <p className="num flex-1 text-center text-[15px] font-bold">
          {y}年{m}月
          <span className="hud ml-2" style={{ fontSize: 11 }}>{monthTotal} posts</span>
        </p>
        <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 10px" }} onClick={() => shift(1)} aria-label="次の月">›</button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {WD.map((w, i) => (
          <span key={w} className="hud py-1" style={{ color: i === 0 ? "var(--danger)" : i === 6 ? "var(--match)" : "var(--text-sub)", fontSize: 11 }}>{w}</span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />;
          const n = counts[iso] ?? 0;
          const past = iso < min;
          const on = iso === value;
          const today = iso === todayISO();
          const dow = i % 7;
          return (
            <button
              key={iso} type="button"
              className="num relative flex flex-col items-center justify-start rounded-[4px] border px-0 pb-1 pt-1.5 text-[14px] leading-none"
              style={{
                minHeight: 46,
                borderColor: on ? "var(--primary)" : today ? "var(--line-2)" : "transparent",
                background: on ? "var(--primary)" : n > 0 ? "rgba(255,255,255,.04)" : "transparent",
                color: on ? "#061008" : past ? "#4b5561" : dow === 0 ? "var(--danger)" : dow === 6 ? "var(--match)" : "var(--text)",
                cursor: past ? "default" : "pointer",
                boxShadow: on ? "0 0 12px rgba(var(--primary-rgb), .35)" : "none",
                fontWeight: today || on ? 700 : 400,
              }}
              disabled={past}
              aria-pressed={on}
              aria-label={`${fmtDateJa(iso)} 募集${n}件${today ? " 今日" : ""}`}
              onClick={() => onChange(iso)}
            >
              {Number(iso.slice(8))}
              <span
                className="mt-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                style={{
                  background: on ? "#061008" : n > 0 ? "var(--primary-bg)" : "transparent",
                  color: on ? "var(--primary)" : n > 0 ? "var(--primary)" : "transparent",
                }}
                aria-hidden
              >
                {n > 0 ? n : "·"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="hint mt-1 text-center">数字はその日の募集数。今日より前は選べません。</p>
    </div>
  );
}
