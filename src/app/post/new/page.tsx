"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { createPost, teamsRunBy, useDB, useSessionId } from "@/lib/store";
import { KIND_LABEL, LEVEL_LABEL, POSITION_LABEL, type PostKind, type Level, type Position } from "@/types";
import { SITE } from "@/config/site";

const POSITIONS: Position[] = ["GK", "DF", "MF", "FW", "ANY"];

export default function NewPostPage() {
  const db = useDB();
  const sid = useSessionId();
  const router = useRouter();
  const myTeams = sid ? teamsRunBy(db, sid) : [];

  const [kind, setKind] = useState<PostKind>("training_match");
  const [teamId, setTeamId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");
  const [level, setLevel] = useState<Level>("casual");
  const [positions, setPositions] = useState<Position[]>([]);
  const [needed, setNeeded] = useState(1);
  const [fee, setFee] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const helper = kind === "helper";

  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-5">
        <Link href="/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← 探すに戻る</Link>
        <h1 className="mt-3 text-[22px] font-bold">募集する</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          {SITE.area}内の会場が対象です。地図に出るのは会場だけで、個人の住所は表示しません。
        </p>

        {!db.ready ? null : !sid ? (
          <div className="card mt-5 p-5 text-center">
            <p className="font-bold">募集するにはログインが必要です</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/signup/" className="btn btn-primary">新規登録（無料）</Link>
              <Link href="/login/" className="btn btn-ghost">ログイン</Link>
            </div>
          </div>
        ) : myTeams.length === 0 ? (
          <div className="card mt-5 p-5 text-center">
            <p className="font-bold">募集はチームの運営者が出せます</p>
            <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>まだチームがありません。先にチームを作ってください。</p>
            <Link href="/team/new/" className="btn btn-primary mt-4">チームを作る</Link>
          </div>
        ) : (
          <form
            className="card mt-5 flex flex-col gap-5 p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (helper && positions.length === 0) { setError("募集するポジションを1つ以上選んでください。"); return; }
              if (start >= end) { setError("終了時刻は開始時刻より後にしてください。"); return; }
              setBusy(true); setError(null);
              try {
                const post = await createPost({
                  kind, teamId: teamId || myTeams[0].id, venueId: venueId || db.venues[0].id,
                  date, startTime: start, endTime: end, level, fee,
                  ...(helper ? { positions, needed } : {}),
                  body: body.trim(),
                });
                router.push(`/post/?id=${post.id}`);
              } catch (err) { setError("保存できませんでした。" + (err instanceof Error ? err.message : "")); setBusy(false); }
            }}
          >
            <fieldset>
              <legend className="label">何を募集しますか</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["training_match", "helper"] as PostKind[]).map((k) => {
                  const on = kind === k;
                  return (
                    <button
                      key={k} type="button" onClick={() => setKind(k)} aria-pressed={on}
                      className="rounded-[10px] px-2.5 py-3 text-left transition-colors"
                      style={{ border: `2px solid ${on ? "var(--primary)" : "var(--line)"}`, background: on ? "var(--primary-bg)" : "var(--surface)" }}
                    >
                      <span className="block text-[14.5px] font-bold leading-snug">{KIND_LABEL[k]}</span>
                      <span className="mt-0.5 block text-[13px]" style={{ color: "var(--text-sub)" }}>
                        {k === "helper" ? "個人に来てもらう" : "チームと試合する"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="label" htmlFor="team">募集するチーム</label>
              <select id="team" className="field" value={teamId || myTeams[0].id} onChange={(e) => setTeamId(e.target.value)} required>
                {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className="label" htmlFor="date">日付</label>
                <input id="date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="start">開始</label>
                <input id="start" type="time" className="field" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="end">終了</label>
                <input id="end" type="time" className="field" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="venue">会場</label>
              <select id="venue" className="field" value={venueId || db.venues[0]?.id} onChange={(e) => setVenueId(e.target.value)} required>
                {db.venues.map((v) => <option key={v.id} value={v.id}>{v.name}（{v.city}）</option>)}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="level">想定レベル</label>
              <select id="level" className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)} required>
                {(["beginner", "casual", "competitive"] as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
              </select>
            </div>

            {helper && (
              <div className="flex flex-col gap-4 rounded-[10px] p-4" style={{ background: "var(--helper-bg)", border: "1px solid rgba(251,191,36,.35)" }}>
                <fieldset>
                  <legend className="label">募集するポジション（複数可）</legend>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map((v) => {
                      const on = positions.includes(v);
                      return (
                        <button
                          key={v} type="button" className="chip" aria-pressed={on}
                          onClick={() => setPositions(on ? positions.filter((x) => x !== v) : [...positions, v])}
                        >
                          {POSITION_LABEL[v]}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="max-w-[10rem]">
                  <label className="label" htmlFor="needed">必要人数</label>
                  <input id="needed" type="number" min={1} max={20} value={needed} onChange={(e) => setNeeded(Number(e.target.value))} className="field" required />
                </div>
              </div>
            )}

            <div className="max-w-[14rem]">
              <label className="label" htmlFor="fee">参加費（1人あたり・円）</label>
              <input id="fee" type="number" min={0} step={100} value={fee} onChange={(e) => setFee(Number(e.target.value))} className="field" />
              <p className="hint">無料なら 0 のままにしてください。</p>
            </div>

            <div>
              <label className="label" htmlFor="body">本文</label>
              <textarea
                id="body" rows={5} className="field" required value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="人数、形式、審判の分担など、相手が判断に必要なことを書いてください。"
              />
            </div>

            {error && <p className="text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}

            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ minHeight: 50, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "保存中…" : "この内容で募集する"}
            </button>
          </form>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
