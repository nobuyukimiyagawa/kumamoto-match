"use client";

import { Stars } from "@/components/Stars";
import { applicantName, applicantTarget, decide, getProfile, ratingSummary, type DB } from "@/lib/store";
import { APP_STATUS_LABEL, POSITION_LABEL, type Application } from "@/types";

/** エントリーした人（チーム）の1行。募集主から見た情報と、承認／見送りのボタン */
export default function ApplicantRow({ a, canDecide, db }: { a: Application; canDecide: boolean; db: DB }) {
  const target = applicantTarget(a);
  const r = ratingSummary(db, target);
  const profile = target.kind === "profile" ? getProfile(db, target.id) : null;
  const s = a.status;
  return (
    <li className="rounded-[10px] p-3" style={{ border: "1px solid var(--line)" }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[15px] font-bold">{applicantName(db, a)}</span>
        <Stars value={r.avg} count={r.count} size={14} />
        <span
          className="badge ml-auto"
          style={{
            background: s === "approved" ? "var(--primary-bg)" : s === "pending" ? "var(--helper-bg)" : "#eef1f4",
            color: s === "approved" ? "var(--primary)" : s === "pending" ? "var(--helper)" : "var(--text-sub)",
          }}
        >
          {APP_STATUS_LABEL[s]}
        </span>
      </div>
      {profile && (
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--text-sub)" }}>
          {profile.positions.map((p) => POSITION_LABEL[p]).join("・")}
          {profile.years != null && `・経験${profile.years}年`}・{profile.city}
          {profile.note && <span className="block">{profile.note}</span>}
        </p>
      )}
      {a.message && <p className="mt-1.5 text-[14px]">「{a.message}」</p>}
      {r.recent[0]?.comment && (
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-sub)" }}>最近の評価: 「{r.recent[0].comment}」</p>
      )}
      {s === "pending" && canDecide && (
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn btn-primary flex-1" onClick={() => decide(a.id, "approved")}>
            承認する
          </button>
          <button type="button" className="btn btn-ghost flex-1" onClick={() => decide(a.id, "rejected")}>
            見送る
          </button>
        </div>
      )}
    </li>
  );
}
