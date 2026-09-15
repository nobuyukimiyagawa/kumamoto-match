"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { teamsRunBy, useDB, useSessionId } from "@/lib/store";

/** スマホ用の下タブ。親指で届く位置に主要な移動先を置く */
export default function BottomNav() {
  const db = useDB();
  const sid = useSessionId();
  const path = usePathname();
  const canPost = sid ? teamsRunBy(db, sid).length > 0 : false;

  // アイコンは絵文字でなく線画。レーダー／プラス／人
  const items = [
    { href: "/", label: "探す", icon: <IconRadar /> },
    ...(canPost ? [{ href: "/post/new/", label: "募集する", icon: <IconPlus /> }] : []),
    { href: "/me/", label: "マイページ", icon: <IconUser /> },
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex sm:hidden"
      style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="下部ナビゲーション"
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[12px] font-bold"
          style={{ minHeight: 56, color: isActive(it.href) ? "var(--primary)" : "var(--text-sub)" }}
          aria-current={isActive(it.href) ? "page" : undefined}
        >
          <span aria-hidden className="inline-flex" style={{ width: 20, height: 20 }}>{it.icon}</span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconRadar() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 L19 6" /><circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function IconPlus() {
  return <svg {...svg}><path d="M12 5v14M5 12h14" /></svg>;
}
function IconUser() {
  return <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
}
