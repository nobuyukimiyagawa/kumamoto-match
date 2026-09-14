"use client";

import { useState } from "react";
import { upsertProfile } from "@/lib/store";
import CityInput from "@/components/CityInput";
import { POSITION_LABEL, type Position, type Profile } from "@/types";

const POSITIONS: Position[] = ["GK", "DF", "MF", "FW", "ANY"];

/** 個人プロフィールの登録・編集。住所は市区町村まで */
export default function ProfileForm({
  id, initial, defaultName, onDone, onCancel,
}: { id: string; initial?: Profile | null; defaultName?: string; onDone: () => void; onCancel?: () => void }) {
  const [name, setName] = useState(initial?.displayName ?? defaultName ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [positions, setPositions] = useState<Position[]>(initial?.positions ?? []);
  const [years, setYears] = useState<string>(initial?.years != null ? String(initial.years) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card flex flex-col gap-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (positions.length === 0) { setError("ポジションを1つ以上選んでください。"); return; }
        setBusy(true); setError(null);
        try {
          await upsertProfile(id, {
            displayName: name.trim(), city: city.trim(), positions,
            years: years ? Number(years) : undefined, note: note.trim() || undefined,
          });
          onDone();
        } catch (err) {
          setError("保存できませんでした。" + (err instanceof Error ? err.message : ""));
        } finally { setBusy(false); }
      }}
    >
      <h2 className="text-[16px] font-bold">{initial ? "プロフィールを編集" : "プロフィールを登録"}</h2>
      <div>
        <label className="label" htmlFor="pf-name">表示名</label>
        <input id="pf-name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} placeholder="例: 田中 健太 / ケンタ" />
        <p className="hint">募集チームや対戦相手に見える名前です。本名でなくても構いません。</p>
      </div>
      <CityInput id="pf-city" value={city} onChange={setCity} />
      <fieldset>
        <legend className="label">ポジション（複数可）</legend>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((p) => {
            const on = positions.includes(p);
            return (
              <button key={p} type="button" className="chip" aria-pressed={on}
                onClick={() => setPositions(on ? positions.filter((x) => x !== p) : [...positions, p])}>
                {POSITION_LABEL[p]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="max-w-[10rem]">
        <label className="label" htmlFor="pf-years">経験年数（任意）</label>
        <input id="pf-years" type="number" min={0} max={60} className="field" value={years} onChange={(e) => setYears(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pf-note">ひとこと（任意）</label>
        <textarea id="pf-note" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="動ける曜日、プレースタイル、経歴など" />
      </div>
      {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1" disabled={busy} style={{ minHeight: 48, opacity: busy ? 0.6 : 1 }}>
          {busy ? "保存中…" : "保存する"}
        </button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>やめる</button>}
      </div>
    </form>
  );
}
