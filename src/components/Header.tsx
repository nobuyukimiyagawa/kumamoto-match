"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/config/site";
import { getProfile, setSession, teamsRunBy, useDB, useSessionId } from "@/lib/store";

/**
 * 共通ヘッダー。
 * ログイン機能はまだ無いので、右端の「アカウント」で誰として使うかを切り替える（デモ）。
 */
export default function Header({ subtitle }: { subtitle?: string }) {
  const db = useDB();
  const sid = useSessionId();
  const path = usePathname();
  const me = sid ? getProfile(db, sid) : null;
  const myTeams = sid ? teamsRunBy(db, sid) : [];

  const nav = [
    { href: "/", label: "探す" },
    { href: "/me/", label: "マイページ" },
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header
      className="flex items-center gap-2 px-4 py-2"
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
    >
      <Link href="/" className="min-w-0 no-underline" style={{ color: "var(--text)" }}>
        <p className="whitespace-nowrap text-[17px] font-bold leading-tight">{SITE.name}</p>
        {subtitle && (
          <p className="hidden truncate text-[12.5px] sm:block" style={{ color: "var(--text-sub)" }}>{subtitle}</p>
        )}
      </Link>

      <nav className="ml-3 hidden items-center gap-1 sm:flex" aria-label="主要ナビゲーション">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-[8px] px-3 py-2 text-[14px] font-bold"
            style={{
              color: isActive(n.href) ? "var(--primary)" : "var(--text-sub)",
              background: isActive(n.href) ? "var(--primary-bg)" : "transparent",
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* デモ用アカウント切替。ログイン実装後はこの select がプロフィールメニューになる */}
        <label className="flex items-center gap-1 text-[12.5px]" style={{ color: "var(--text-sub)" }}>
          <span className="hidden sm:inline">アカウント</span>
          <select
            className="field"
            style={{ minHeight: 40, padding: "0 6px", fontSize: 14, width: "auto", maxWidth: "min(170px, 42vw)" }}
            value={sid ?? ""}
            onChange={(e) => setSession(e.target.value || null)}
            aria-label="使うアカウント（デモ）"
          >
            <option value="">未ログイン</option>
            {db.profiles.map((p) => {
              const teams = teamsRunBy(db, p.id);
              return (
                <option key={p.id} value={p.id}>
                  {p.displayName}{teams.length ? `（${teams[0].name}${teams.length > 1 ? " ほか" : ""}）` : "（個人）"}
                </option>
              );
            })}
          </select>
        </label>
        {myTeams.length > 0 && (
          <Link href="/post/new/" className="btn btn-primary hidden shrink-0 sm:inline-flex" style={{ minHeight: 40, padding: "0 14px" }}>
            ＋ 募集する
          </Link>
        )}
      </div>
    </header>
  );
}
