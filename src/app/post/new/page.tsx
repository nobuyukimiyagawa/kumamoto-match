"use client";

import { useState } from "react";
import Link from "next/link";
import { VENUES, TEAMS } from "@/lib/mock";
import { KIND_LABEL, LEVEL_LABEL, type PostKind, type Level, type Position } from "@/types";
import { SITE } from "@/config/site";

const POSITIONS: { v: Position; label: string }[] = [
  { v: "GK", label: "GK" }, { v: "DF", label: "DF" }, { v: "MF", label: "MF" }, { v: "FW", label: "FW" },
  { v: "ANY", label: "どこでも" },
];

export default function NewPostPage() {
  const [kind, setKind] = useState<PostKind>("training_match");
  const [positions, setPositions] = useState<Position[]>([]);
  const [sent, setSent] = useState(false);
  const helper = kind === "helper";

  return (
    <main className="min-h-dvh">
      <header
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <Link href="/" className="btn btn-ghost" style={{ minHeight: 40, padding: "0 12px" }}>
          ← 探すに戻る
        </Link>
        <p className="ml-auto text-[15px] font-bold">{SITE.name}</p>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-5">
        <h1 className="text-[22px] font-bold">募集する</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>
          {SITE.area}内の会場が対象です。地図に出るのは会場だけで、個人の住所は表示しません。
        </p>

        {sent && (
          <p
            className="mt-5 rounded-[10px] px-4 py-3 text-[14px] font-bold"
            style={{ background: "var(--primary-bg)", color: "var(--primary)" }}
          >
            入力内容を確認しました。保存はデータベース接続後に有効になります。
          </p>
        )}

        <form
          className="card mt-5 flex flex-col gap-5 p-5"
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        >
          <fieldset>
            <legend className="label">何を募集しますか</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["training_match", "helper"] as PostKind[]).map((k) => {
                const on = kind === k;
                return (
                  <button
                    key={k} type="button" onClick={() => setKind(k)}
                    aria-pressed={on}
                    className="rounded-[10px] px-2.5 py-3 text-left transition-colors"
                    style={{
                      border: `2px solid ${on ? "var(--primary)" : "var(--line)"}`,
                      background: on ? "var(--primary-bg)" : "var(--surface)",
                    }}
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
            <select id="team" className="field" required>
              {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="label" htmlFor="date">日付</label>
              <input id="date" type="date" className="field" required />
            </div>
            <div>
              <label className="label" htmlFor="start">開始</label>
              <input id="start" type="time" className="field" defaultValue="19:00" required />
            </div>
            <div>
              <label className="label" htmlFor="end">終了</label>
              <input id="end" type="time" className="field" defaultValue="21:00" required />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="venue">会場</label>
            <select id="venue" className="field" required>
              {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}（{v.city}）</option>)}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="level">想定レベル</label>
            <select id="level" className="field" required>
              {(["beginner", "casual", "competitive"] as Level[]).map((l) => (
                <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
              ))}
            </select>
          </div>

          {helper && (
            <div
              className="flex flex-col gap-4 rounded-[10px] p-4"
              style={{ background: "var(--helper-bg)", border: "1px solid #f3c9b0" }}
            >
              <fieldset>
                <legend className="label">募集するポジション（複数可）</legend>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(({ v, label }) => {
                    const on = positions.includes(v);
                    return (
                      <button
                        key={v} type="button" className="chip" aria-pressed={on}
                        onClick={() => setPositions(on ? positions.filter((x) => x !== v) : [...positions, v])}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="max-w-[10rem]">
                <label className="label" htmlFor="needed">必要人数</label>
                <input id="needed" type="number" min={1} max={20} defaultValue={1} className="field" required />
              </div>
            </div>
          )}

          <div className="max-w-[14rem]">
            <label className="label" htmlFor="fee">参加費（1人あたり・円）</label>
            <input id="fee" type="number" min={0} step={100} defaultValue={0} className="field" />
            <p className="hint">無料なら 0 のままにしてください。</p>
          </div>

          <div>
            <label className="label" htmlFor="body">本文</label>
            <textarea
              id="body" rows={5} className="field" required
              placeholder="人数、形式、審判の分担など、相手が判断に必要なことを書いてください。"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ minHeight: 50, fontSize: 16 }}>
            この内容で募集する
          </button>
        </form>
      </div>
    </main>
  );
}
