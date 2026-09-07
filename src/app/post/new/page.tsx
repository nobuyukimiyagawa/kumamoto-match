"use client";

import { useState } from "react";
import Link from "next/link";
import { VENUES, TEAMS } from "@/lib/mock";
import { KIND_LABEL, LEVEL_LABEL, type PostKind, type Level, type Position } from "@/types";
import { SITE } from "@/config/site";

const POSITIONS: Position[] = ["GK", "DF", "MF", "FW", "ANY"];
const label = "sign block text-[10px]";
const input =
  "w-full border px-3 py-2 text-[13px] outline-none transition-colors " +
  "border-[color:var(--chalk-16)] bg-[color:var(--night-2)] text-[color:var(--chalk)] " +
  "focus:border-[color:var(--flood)]";

export default function NewPostPage() {
  const [kind, setKind] = useState<PostKind>("training_match");
  const [positions, setPositions] = useState<Position[]>([]);
  const [sent, setSent] = useState(false);

  const helper = kind === "helper";

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-16">
      <header className="flex items-center gap-3 py-4">
        <Link href="/" className="sign text-[10px]" style={{ color: "var(--chalk-sub)" }}>← 探すに戻る</Link>
        <p className="ml-auto text-[13px] font-bold">{SITE.name}</p>
      </header>

      <h1 className="mb-1 text-[22px] font-bold">募集する</h1>
      <p className="mb-6 text-[11px]" style={{ color: "var(--chalk-sub)" }}>{SITE.area}内の会場が対象です。</p>

      {sent && (
        <p className="mb-6 px-4 py-3 text-[12px]" style={{ border: "1px solid var(--flood)", color: "var(--flood)" }}>
          入力内容を確認しました。保存はデータベース接続後に有効になります。
        </p>
      )}

      <form
        className="space-y-5 p-5" style={{ border: "1px solid var(--chalk-16)", background: "var(--night-2)" }}
        onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      >
        <fieldset>
          <legend className={label}>種別</legend>
          <div className="mt-2 flex gap-2">
            {(["training_match", "helper"] as PostKind[]).map((k) => (
              <button
                key={k} type="button" onClick={() => setKind(k)}
                className="flex-1 px-3 py-3 text-[13px] font-bold transition-colors"
                style={{ border: `1px solid ${kind === k ? "var(--flood)" : "var(--chalk-16)"}`,
                         background: kind === k ? "var(--night-3)" : "transparent",
                         color: kind === k ? "var(--flood)" : "var(--chalk-60)" }}
              >
                {KIND_LABEL[k]}
                <span className="mt-0.5 block text-[10px] font-normal" style={{ color: "var(--chalk-sub)" }}>
                  {k === "helper" ? "個人に来てもらう" : "チームと試合する"}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className={label} htmlFor="team">募集するチーム</label>
          <select id="team" className={`${input} mt-1`} required>
            {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label className={label} htmlFor="date">日付</label>
            <input id="date" type="date" className={`${input} mt-1`} required />
          </div>
          <div><label className={label} htmlFor="start">開始</label>
            <input id="start" type="time" className={`${input} mt-1`} defaultValue="19:00" required /></div>
          <div><label className={label} htmlFor="end">終了</label>
            <input id="end" type="time" className={`${input} mt-1`} defaultValue="21:00" required /></div>
        </div>

        <div>
          <label className={label} htmlFor="venue">会場</label>
          <select id="venue" className={`${input} mt-1`} required>
            {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}（{v.city}）</option>)}
          </select>
          <p className="mt-1 text-[10px]" style={{ color: "var(--chalk-sub)" }}>地図に出るのは会場だけです。個人の住所は表示しません。</p>
        </div>

        <div>
          <label className={label} htmlFor="level">想定レベル</label>
          <select id="level" className={`${input} mt-1`} required>
            {(["beginner", "casual", "competitive"] as Level[]).map((l) => (
              <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
            ))}
          </select>
        </div>

        {helper && (
          <div className="space-y-4 p-4" style={{ border: "1px solid var(--cone)", background: "var(--night-3)" }}>
            <fieldset>
              <legend className={label}>募集ポジション</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {POSITIONS.map((p) => {
                  const on = positions.includes(p);
                  return (
                    <button
                      key={p} type="button"
                      onClick={() => setPositions(on ? positions.filter((x) => x !== p) : [...positions, p])}
                      className="sign px-2.5 py-1.5 text-[10px] transition-colors"
                      style={{ border: "1px solid var(--cone)",
                               background: on ? "var(--cone)" : "transparent",
                               color: on ? "var(--night)" : "var(--cone)" }}
                    >{p === "ANY" ? "どこでも" : p}</button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label className={label} htmlFor="needed">必要人数</label>
              <input id="needed" type="number" min={1} max={20} defaultValue={1} className={`${input} mt-1`} required />
            </div>
          </div>
        )}

        <div>
          <label className={label} htmlFor="fee">参加費（円・無料なら 0）</label>
          <input id="fee" type="number" min={0} step={100} defaultValue={0} className={`${input} mt-1`} />
        </div>

        <div>
          <label className={label} htmlFor="body">本文</label>
          <textarea id="body" rows={5} className={`${input} mt-1`} required
            placeholder="人数、形式、審判の分担など、相手が判断に必要なことを書いてください。" />
        </div>

        <button type="submit" className="sign w-full py-3.5 text-[11px]" style={{ background: "var(--flood)", color: "var(--night)" }}>
          この内容で募集する
        </button>
      </form>
    </main>
  );
}
