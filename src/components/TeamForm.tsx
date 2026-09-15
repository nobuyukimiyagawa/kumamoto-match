"use client";

import { useState } from "react";
import { createTeam, updateTeam } from "@/lib/store";
import { LEVEL_LABEL, type Level, type Team } from "@/types";
import CityInput from "@/components/CityInput";

/** チームの作成・編集。作った人がオーナーになる */
export default function TeamForm({
  ownerId, initial, onDone, onCancel, submitLabel,
}: {
  ownerId: string;
  initial?: Team | null;
  onDone: (team: Team) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [level, setLevel] = useState<Level>(initial?.level ?? "casual");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card flex flex-col gap-5 p-5"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError(null);
        try {
          const data = { name: name.trim(), city: city.trim(), level, note: note.trim() || undefined };
          if (initial) {
            await updateTeam(initial.id, data);
            onDone({ ...initial, ...data });
          } else {
            onDone(await createTeam({ ...data, ownerId }));
          }
        } catch (err) {
          setError((initial ? "保存" : "作成") + "できませんでした。" + (err instanceof Error ? err.message : ""));
        } finally { setBusy(false); }
      }}
    >
      <div>
        <label className="label" htmlFor="team-name">チーム名</label>
        <input id="team-name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="例: FC 熊本イレブン" />
      </div>
      <CityInput id="team-city" value={city} onChange={setCity} />
      <div>
        <label className="label" htmlFor="team-level">レベル帯</label>
        <select id="team-level" className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
          {(["beginner", "casual", "competitive"] as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="team-note">紹介（任意）</label>
        <textarea id="team-note" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="活動日、年齢層、雰囲気など" />
      </div>
      {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
          {busy ? (initial ? "保存中…" : "作成中…") : submitLabel ?? (initial ? "保存する" : "チームを作る")}
        </button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>やめる</button>}
      </div>
    </form>
  );
}
