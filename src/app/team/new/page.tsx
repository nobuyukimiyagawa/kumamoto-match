"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { createTeam, useSessionId } from "@/lib/store";
import { LEVEL_LABEL, type Level } from "@/types";

export default function NewTeamPage() {
  const sid = useSessionId();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState<Level>("casual");
  const [note, setNote] = useState("");

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
            <p className="font-bold">先に右上の「アカウント」を選んでください</p>
          </div>
        ) : (
          <form
            className="card mt-5 flex flex-col gap-5 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              createTeam({ name: name.trim(), city: city.trim(), level, note: note.trim() || undefined, ownerId: sid });
              router.push("/me/");
            }}
          >
            <div>
              <label className="label" htmlFor="name">チーム名</label>
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
            </div>
            <div>
              <label className="label" htmlFor="city">活動している市区町村</label>
              <input id="city" className="field" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="例: 熊本市東区" />
              <p className="hint">番地は書かないでください。地図に出るのは会場だけです。</p>
            </div>
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
            <button type="submit" className="btn btn-primary w-full" style={{ minHeight: 50, fontSize: 16 }}>チームを作る</button>
          </form>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
