"use client";

import { useState } from "react";

/** 読み取り専用の星。平均と件数を添える */
export function Stars({
  value, count, size = 16, showNumber = true,
}: { value: number; count?: number; size?: number; showNumber?: boolean }) {
  const label = count === 0 || value === 0 ? "評価なし" : `${value.toFixed(1)}（${count}件）`;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`評価 ${label}`}>
      <span className="inline-flex" aria-hidden style={{ fontSize: size, lineHeight: 1, letterSpacing: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - (i - 1)));
          return (
            <span key={i} className="relative inline-block" style={{ color: "#d9dde3" }}>
              ★
              <span
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: `${fill * 100}%`, color: "#f5a524", whiteSpace: "nowrap" }}
              >
                ★
              </span>
            </span>
          );
        })}
      </span>
      {showNumber && (
        <span className="num text-[13px]" style={{ color: count ? "var(--text)" : "var(--text-sub)" }}>
          {count === 0 || value === 0 ? "評価なし" : (
            <>
              <b>{value.toFixed(1)}</b>
              {count != null && <span style={{ color: "var(--text-sub)" }}>（{count}件）</span>}
            </>
          )}
        </span>
      )}
    </span>
  );
}

/** 星を押して選ぶ入力。1〜5 */
export function StarInput({
  value, onChange, size = 34,
}: { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ["", "よくなかった", "いまひとつ", "ふつう", "よかった", "とてもよかった"];
  return (
    <div>
      <div className="flex gap-1" role="radiogroup" aria-label="星の数">
        {([1, 2, 3, 4, 5] as const).map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i}つ星 ${words[i]}`}
            className="leading-none"
            style={{
              fontSize: size, width: size + 6, height: size + 6,
              color: i <= shown ? "#f5a524" : "#d9dde3",
              background: "transparent", border: 0, cursor: "pointer",
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)", minHeight: "1.4em" }}>
        {shown ? words[shown] : "星を押して評価してください"}
      </p>
    </div>
  );
}
