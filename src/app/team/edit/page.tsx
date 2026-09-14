"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { getTeam, teamsRunBy, updateTeam, useDB, useSessionId } from "@/lib/store";
import { LEVEL_LABEL, type Level } from "@/types";
import CityInput from "@/components/CityInput";

export default function EditTeamPage() {
  return <Suspense fallback={null}><Edit /></Suspense>;
}

function Edit() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const db = useDB();
  const sid = useSessionId();
  const router = useRouter();
  const team = getTeam(db, id);
  const canEdit = !!sid && teamsRunBy(db, sid).some((t) => t.id === id);

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;
  if (!team || !canEdit) {
    return (
      <main className="min-h-dvh"><Header />
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="font-bold">このチームは編集できません</p>
          <Link href="/me/" className="btn btn-ghost mt-4">マイページに戻る</Link>
        </div>
      </main>
    );
  }
  return <Form key={team.id} id={team.id} initial={team} onDone={() => router.push("/me/")} />;
}

function Form({ id, initial, onDone }: { id: string; initial: { name: string; city: string; level: Level; note?: string }; onDone: () => void }) {
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city);
  const [level, setLevel] = useState<Level>(initial.level);
  const [note, setNote] = useState(initial.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <Link href="/me/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← マイページに戻る</Link>
        <h1 className="mt-3 text-[22px] font-bold">チームを編集</h1>
        <form
          className="card mt-5 flex flex-col gap-5 p-5"
          onSubmit={async (e) => {
            e.preventDefault(); setBusy(true); setError(null);
            try {
              await updateTeam(id, { name: name.trim(), city: city.trim(), level, note: note.trim() || undefined });
              onDone();
            } catch (err) { setError("保存できませんでした。" + (err instanceof Error ? err.message : "")); }
            finally { setBusy(false); }
          }}
        >
          <div>
            <label className="label" htmlFor="name">チーム名</label>
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
          </div>
          <CityInput id="city" value={city} onChange={setCity} />
          <div>
            <label className="label" htmlFor="level">レベル帯</label>
            <select id="level" className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {(["beginner", "casual", "competitive"] as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="note">紹介（任意）</label>
            <textarea id="note" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
            {busy ? "保存中…" : "保存する"}
          </button>
        </form>
      </div>
      <BottomNav />
    </main>
  );
}
