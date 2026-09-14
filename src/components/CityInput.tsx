"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 活動エリアの入力。郵便番号7桁を入れると、郵便番号 API で「市区町村＋町名」に変換する。
 * 保存するのは変換後の文字列（例: 熊本市中央区水前寺）だけで、郵便番号と番地は保存しない。
 * 地図に出るのは会場だけ、という方針はそのまま。
 */
export default function CityInput({
  value, onChange, id = "city", label = "活動しているエリア（町名まで）",
}: { value: string; onChange: (city: string) => void; id?: string; label?: string }) {
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const digits = zip.replace(/[^0-9]/g, "");
    if (digits.length !== 7) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setBusy(true); setMsg(null);
      try {
        const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
        const j = await r.json() as { results: { address1: string; address2: string; address3: string; prefcode: string }[] | null };
        const hit = j.results?.[0];
        if (!hit) { setMsg("この郵便番号は見つかりませんでした。"); return; }
        if (hit.prefcode !== "43") { setMsg(`${hit.address1}の郵便番号です。熊本県内の郵便番号を入れてください。`); return; }
        onChange(hit.address2 + hit.address3);
        setMsg(null);
      } catch {
        setMsg("郵便番号を調べられませんでした。下の欄に直接入力してください。");
      } finally { setBusy(false); }
    }, 250);
  }, [zip, onChange]);

  return (
    <div>
      <label className="label" htmlFor={`${id}-zip`}>{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={`${id}-zip`} className="field" style={{ width: "10rem" }}
          inputMode="numeric" autoComplete="postal-code" placeholder="郵便番号 8620950"
          value={zip} onChange={(e) => setZip(e.target.value)} maxLength={8}
          aria-describedby={`${id}-hint`}
        />
        <span className="text-[14px]" style={{ color: "var(--text-sub)" }}>→</span>
        <input
          id={id} className="field" style={{ flex: 1, minWidth: "12rem" }}
          value={value} onChange={(e) => onChange(e.target.value)} required
          placeholder="例: 熊本市中央区水前寺" aria-label="市区町村と町名"
        />
      </div>
      <p id={`${id}-hint`} className="hint" style={msg ? { color: "var(--danger)", fontWeight: 700 } : undefined}>
        {busy ? "郵便番号を調べています…" : msg ?? "郵便番号を入れると町名まで自動で入ります。番地と郵便番号は保存しません。"}
      </p>
    </div>
  );
}
