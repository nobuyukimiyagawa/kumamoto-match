"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { createTeam, useSessionId } from "@/lib/store";
import { LEVEL_LABEL, type Level } from "@/types";
import CityInput from "@/components/CityInput";

export default function NewTeamPage() {
  const sid = useSessionId();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState<Level>("casual");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <Link href="/me/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← マイページに戻る</Link>
        <h1 className="mt-3 text-[22px] font-bold">チームを作る</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          作った人がオーナーになります。募集と対戦エントリーはチームの運営者だけができます。
        </p>
        {!sid ? (
          <div className="card mt-5 p-5 text-center">
            <p className="font-bold">チームを作るにはログインが必要です</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/signup/" className="btn btn-primary">新規登録（無料）</Link>
              <Link href="/login/" className="btn btn-ghost">ログイン</Link>
            </div>
          </div>
        ) : (
          <form
            className="card mt-5 flex flex-col gap-5 p-5"
            onSubmit={async (e) => {
              e.preventDefault(); setBusy(true); setError(null);
              try {
                await createTeam({ name: name.trim(), city: city.trim(), level, note: note.trim() || undefined, ownerId: sid });
                router.push("/me/");
              } catch (err) { setError("作成できませんでした。" + (err instanceof Error ? err.message : "")); }
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
              <textarea id="note" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="活動日、年齢層、雰囲気など" />
            </div>
            {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "作成中…" : "チームを作る"}
            </button>
          </form>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
