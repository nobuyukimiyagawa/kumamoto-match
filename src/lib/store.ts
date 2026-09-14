"use client";

/**
 * データ層の入口。画面はここだけを使う。
 * Supabase のキーがあれば Supabase、無ければ localStorage のデモ用に切り替わる。
 */

import { useSyncExternalStore } from "react";
import type { Application, Post, RatingTarget, Team } from "@/types";
import { EMPTY_DB, type Backend, type DB } from "./backend";
import { localBackend } from "./backend.local";
import { hasSupabase, supabaseBackend } from "./backend.supabase";

export type { DB } from "./backend";

const backend: Backend = hasSupabase ? supabaseBackend : localBackend;

/** ログイン方式。画面の出し分けに使う */
export const AUTH_MODE = backend.mode;

/** 画面で使う、参照を解決した募集 */
export type PostView = Post & { team: Team; venue: import("@/types").Venue };

// ---------- 購読 ----------

export function useDB(): DB {
  return useSyncExternalStore(backend.subscribeDB, backend.getDB, () => EMPTY_DB);
}
export function useSessionId(): string | null {
  return useSyncExternalStore(backend.subscribeSession, backend.getSessionId, () => null);
}

// ---------- 認証 ----------

export function setSession(profileId: string | null) { backend.setSession?.(profileId); }
export function signInWithEmail(email: string) {
  return backend.signInWithEmail ? backend.signInWithEmail(email) : Promise.resolve({ error: "このモードではメールログインは使えません" });
}
export function signInWithGoogle() {
  return backend.signInWithGoogle ? backend.signInWithGoogle() : Promise.resolve({ error: "このモードでは使えません" });
}
export function signInWithLine() { backend.signInWithLine?.(); }
export function finishLineLogin(tokenHash: string) {
  return backend.finishLineLogin ? backend.finishLineLogin(tokenHash) : Promise.resolve({ error: "このモードでは使えません" });
}
export function getAuthMeta() { return backend.getAuthMeta(); }
export function signOut() { return backend.signOut(); }
export function resetDB() { backend.reset?.(); }

// ---------- 更新（すべて Promise） ----------

export const upsertProfile = backend.upsertProfile.bind(backend);
export const createTeam = backend.createTeam.bind(backend);
export const updateTeam = backend.updateTeam.bind(backend);
export const createPost = backend.createPost.bind(backend);
export const closePost = backend.closePost.bind(backend);
export const apply = backend.apply.bind(backend);
export const cancelApplication = backend.cancelApplication.bind(backend);
export const decide = backend.decide.bind(backend);
export const addRating = backend.addRating.bind(backend);

// ---------- 参照（純粋関数。どちらのバックエンドでも同じ） ----------

export function toView(db: DB, p: Post): PostView | null {
  const team = db.teams.find((t) => t.id === p.teamId);
  const venue = db.venues.find((v) => v.id === p.venueId);
  return team && venue ? { ...p, team, venue } : null;
}
export function listPosts(db: DB): PostView[] {
  return db.posts.map((p) => toView(db, p)).filter((x): x is PostView => !!x);
}
export function getPost(db: DB, id: string): PostView | null {
  const p = db.posts.find((x) => x.id === id);
  return p ? toView(db, p) : null;
}
export function getProfile(db: DB, id: string) { return db.profiles.find((p) => p.id === id) ?? null; }
export function getTeam(db: DB, id: string) { return db.teams.find((t) => t.id === id) ?? null; }

/** その人が運営（owner/admin）しているチーム */
export function teamsRunBy(db: DB, profileId: string): Team[] {
  const ids = db.members
    .filter((m) => m.profileId === profileId && (m.role === "owner" || m.role === "admin"))
    .map((m) => m.teamId);
  return db.teams.filter((t) => ids.includes(t.id));
}
export function applicationsForPost(db: DB, postId: string): Application[] {
  return db.applications.filter((a) => a.postId === postId && a.status !== "cancelled");
}
/** 募集に対する、この人（または運営チーム）のエントリー */
export function myApplication(db: DB, postId: string, profileId: string): Application | null {
  const teamIds = teamsRunBy(db, profileId).map((t) => t.id);
  return (
    db.applications.find(
      (a) => a.postId === postId && a.status !== "cancelled" &&
        (a.applicantProfileId === profileId || (a.applicantTeamId && teamIds.includes(a.applicantTeamId))),
    ) ?? null
  );
}
export function applicantName(db: DB, a: Application): string {
  if (a.applicantTeamId) return getTeam(db, a.applicantTeamId)?.name ?? "不明なチーム";
  if (a.applicantProfileId) return getProfile(db, a.applicantProfileId)?.displayName ?? "不明なユーザー";
  return "不明";
}
export function applicantTarget(a: Application): RatingTarget {
  return a.applicantTeamId
    ? { kind: "team", id: a.applicantTeamId }
    : { kind: "profile", id: a.applicantProfileId! };
}
/** 評価のまとめ。平均と件数と、新しい順のコメント */
export function ratingSummary(db: DB, target: RatingTarget) {
  const rs = db.ratings.filter((r) => r.to.kind === target.kind && r.to.id === target.id);
  const count = rs.length;
  const avg = count ? rs.reduce((s, r) => s + r.stars, 0) / count : 0;
  const recent = [...rs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  return { avg, count, recent };
}
export function isPast(p: Post) {
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return p.date < today;
}

/**
 * 評価できる組み合わせを列挙する。
 * 条件: エントリー完了 かつ 試合日が過ぎている かつ まだ評価していない。
 * 募集主チーム → エントリー者、エントリー者 → 募集主チーム の両方向。
 */
export type PendingRating = {
  post: PostView; application: Application; from: RatingTarget; to: RatingTarget; toName: string;
};
export function pendingRatingsFor(db: DB, profileId: string): PendingRating[] {
  const myTeams = teamsRunBy(db, profileId).map((t) => t.id);
  const out: PendingRating[] = [];
  const done = (from: RatingTarget, to: RatingTarget, appId: string) =>
    db.ratings.some((r) => r.applicationId === appId &&
      r.from.kind === from.kind && r.from.id === from.id && r.to.kind === to.kind && r.to.id === to.id);

  for (const a of db.applications) {
    if (a.status !== "approved") continue;
    const post = getPost(db, a.postId);
    if (!post || !isPast(post)) continue;
    const host: RatingTarget = { kind: "team", id: post.teamId };
    const guest = applicantTarget(a);
    if (myTeams.includes(post.teamId) && !done(host, guest, a.id)) {
      out.push({ post, application: a, from: host, to: guest, toName: applicantName(db, a) });
    }
    const iAmGuest = guest.kind === "profile" ? guest.id === profileId : myTeams.includes(guest.id);
    if (iAmGuest && !done(guest, host, a.id)) {
      out.push({ post, application: a, from: guest, to: host, toName: post.team.name });
    }
  }
  return out.sort((x, y) => y.post.date.localeCompare(x.post.date));
}
