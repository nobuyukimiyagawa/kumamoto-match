"use client";

import { useState } from "react";
import Link from "next/link";
import { PLAN } from "@/config/plan";
import { AUTH_MODE, isTeamPlanActive, openBillingPortal, startCheckout } from "@/lib/store";
import type { Team } from "@/types";

/** 「9月30日まで」の形 */
function fmtUntil(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * チーム管理に出す、チームプランの状態と加入・管理ボタン。
 * 支払いは Stripe の画面で行い、カード情報はサイトを通らない。
 */
export default function PlanCard({ team, justPaid }: { team: Team; justPaid?: "1" | "0" | null }) {
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = isTeamPlanActive(team);
  const until = fmtUntil(team.planUntil);

  const go = async (kind: "checkout" | "portal") => {
    setBusy(kind); setError(null);
    const r = kind === "checkout" ? await startCheckout(team.id) : await openBillingPortal(team.id);
    if (r.error) { setError(r.error); setBusy(null); }
    // 成功時は Stripe の画面へ移動するので、ここには戻らない
  };

  return (
    <div className="card mt-3 p-4" style={{ borderColor: active ? "var(--primary)" : "var(--line)" }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="hud" style={{ color: active ? "var(--primary)" : "var(--text-sub)" }}>plan</p>
          <p className="text-[16px] font-bold">
            {active ? PLAN.name : "無料プラン"}
            {active && until && (
              <span className="ml-2 text-[13px] font-normal" style={{ color: "var(--text-sub)" }}>
                {team.plan === "team" ? `次回更新 ${until}` : `${until}まで有効`}
              </span>
            )}
          </p>
          {justPaid === "1" && (
            <p className="mt-1 text-[14px] font-bold" style={{ color: "var(--primary)" }} role="status">
              お支払いありがとうございます。反映まで数秒かかることがあります。
            </p>
          )}
          {justPaid === "0" && (
            <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }} role="status">
              お支払いは行われませんでした。
            </p>
          )}
        </div>

        {active ? (
          <button type="button" className="btn btn-ghost" disabled={busy !== null} onClick={() => go("portal")} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>
            {busy === "portal" ? "開いています…" : "お支払いの管理・解約"}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => go("checkout")} style={{ minHeight: 44, padding: "0 16px" }}>
            {busy === "checkout" ? "開いています…" : `${PLAN.name}に加入する（月額${PLAN.priceYen.toLocaleString()}円）`}
          </button>
        )}
      </div>

      {!active && (
        <ul className="mt-3 flex flex-col gap-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
          {PLAN.benefits.map((b) => (
            <li key={b} className="flex gap-2"><span aria-hidden style={{ color: "var(--primary)" }}>▸</span>{b}</li>
          ))}
          <li className="mt-1 text-[12.5px]">お支払いはクレジットカード・Apple Pay・Google Pay。カード情報はこのサイトを通らず、Stripe の画面で入力します。いつでも解約できます。<Link href="/legal/tokushoho/" className="ml-1 underline">特定商取引法に基づく表記</Link></li>
        </ul>
      )}
      {AUTH_MODE === "local" && (
        <p className="hint">デモモードでは支払いは使えません。</p>
      )}
      {error && <p className="mt-2 text-[14px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
