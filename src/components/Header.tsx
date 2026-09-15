"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/config/site";
import { AUTH_MODE, getProfile, setSession, signOut, teamsRunBy, useDB, useSessionId } from "@/lib/store";

/**
 * 共通ヘッダー。
 * Supabase 接続時はログイン／ログアウト、キーが無いデモ時は「アカウント」切替を出す。
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
      <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline" style={{ color: "var(--text)" }}>
        <span className="blink shrink-0" aria-hidden />
        <span className="min-w-0">
          <span className="display block whitespace-nowrap text-[16px] font-bold leading-none" style={{ color: "var(--primary)" }}>
            {SITE.nameEn}
          </span>
          <span className="block truncate text-[12px] leading-tight" style={{ color: "var(--text-sub)" }}>
            {SITE.name}{subtitle && <span className="hidden sm:inline">｜{subtitle}</span>}
          </span>
        </span>
      </Link>

      <nav className="ml-3 hidden items-center gap-1 sm:flex" aria-label="主要ナビゲーション">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-[4px] px-3 py-2 text-[14px] font-bold"
            style={{
              color: isActive(n.href) ? "var(--primary)" : "var(--text-sub)",
              background: isActive(n.href) ? "var(--primary-bg)" : "transparent",
              boxShadow: isActive(n.href) ? "inset 0 -2px 0 var(--primary)" : "none",
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {AUTH_MODE === "local" ? (
          // デモ用アカウント切替
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
        ) : sid ? (
          <>
            <Link href="/me/" className="max-w-[40vw] truncate text-[14px] font-bold sm:max-w-none" style={{ color: "var(--text)" }}>
              {me?.displayName ?? "プロフィール未登録"}
            </Link>
            <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: "0 12px", fontSize: 13.5 }} onClick={() => signOut()}>
              ログアウト
            </button>
          </>
        ) : (
          <>
            <Link href="/login/" className="btn btn-ghost" style={{ minHeight: 40, padding: "0 12px" }}>
              ログイン
            </Link>
            <Link href="/signup/" className="btn btn-primary" style={{ minHeight: 40, padding: "0 12px" }}>
              新規登録
            </Link>
          </>
        )}
        {myTeams.length > 0 && (
          <Link href="/post/new/" className="btn btn-primary hidden shrink-0 sm:inline-flex" style={{ minHeight: 40, padding: "0 14px" }}>
            ＋ 募集する
          </Link>
        )}
      </div>
    </header>
  );
}
