"use client";

/**
 * データ層。いまはブラウザ内（localStorage）で完結する。
 * Supabase に移すときは、このファイルの関数の中身だけを差し替える。
 * 画面側は useDB() と mutate 系の関数だけを使い、localStorage を直接触らない。
 */

import { useSyncExternalStore } from "react";
import type {
  Application, ApplicationStatus, Level, Post, PostKind, Position, Profile, Rating, RatingTarget,
  Team, TeamMember, Venue,
} from "@/types";
import { APPLICATIONS, MEMBERS, POSTS, PROFILES, RATINGS, TEAMS, VENUES } from "./mock";

const KEY = "pitchmate-db-v1";
const SESSION_KEY = "pitchmate-session-v1";

export type DB = {
  venues: Venue[];
  profiles: Profile[];
  teams: Team[];
  members: TeamMember[];
  posts: Post[];
  applications: Application[];
  ratings: Rating[];
};

/** 画面で使う、参照を解決した募集 */
export type PostView = Post & { team: Team; venue: Venue };

// ---------- 読み書きの土台 ----------

let cache: DB | null = null;
const listeners = new Set<() => void>();

function seed(): DB {
  return {
    venues: VENUES, profiles: PROFILES, teams: TEAMS, members: MEMBERS,
    posts: POSTS, applications: APPLICATIONS, ratings: RATINGS,
  };
}

function read(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { cache = JSON.parse(raw) as DB; return cache; }
  } catch { /* 壊れていたら初期値に戻す */ }
  cache = seed();
  return cache;
}

function write(next: DB) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* 容量超過などは無視 */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

const EMPTY: DB = { venues: [], profiles: [], teams: [], members: [], posts: [], applications: [], ratings: [] };

/** 画面から呼ぶ。サーバー描画中は空、クライアントでは現在のデータ */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** 仮データに戻す（デモ用） */
export function resetDB() {
  write(seed());
}

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

// ---------- セッション（ログインの代わり） ----------

function readSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
const sessionListeners = new Set<() => void>();
export function useSessionId(): string | null {
  return useSyncExternalStore(
    (l) => { sessionListeners.add(l); return () => { sessionListeners.delete(l); }; },
    readSession,
    () => null,
  );
}
export function setSession(profileId: string | null) {
  try {
    if (profileId) localStorage.setItem(SESSION_KEY, profileId);
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
  sessionListeners.forEach((l) => l());
}

// ---------- 参照 ----------

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

export function getProfile(db: DB, id: string) {
  return db.profiles.find((p) => p.id === id) ?? null;
}
export function getTeam(db: DB, id: string) {
  return db.teams.find((t) => t.id === id) ?? null;
}

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
  return p.date < today();
}

/**
 * 評価できる組み合わせを列挙する。
 * 条件: エントリー完了 かつ 試合日が過ぎている かつ まだ評価していない。
 * 募集主チーム → エントリー者、エントリー者 → 募集主チーム の両方向。
 */
export type PendingRating = {
  post: PostView;
  application: Application;
  from: RatingTarget;
  to: RatingTarget;
  toName: string;
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

    // 自分が募集主チームの運営なら、エントリー者を評価できる
    if (myTeams.includes(post.teamId) && !done(host, guest, a.id)) {
      out.push({ post, application: a, from: host, to: guest, toName: applicantName(db, a) });
    }
    // 自分がエントリー者（本人 or 運営チーム）なら、募集主チームを評価できる
    const iAmGuest = guest.kind === "profile" ? guest.id === profileId : myTeams.includes(guest.id);
    if (iAmGuest && !done(guest, host, a.id)) {
      out.push({ post, application: a, from: guest, to: host, toName: post.team.name });
    }
  }
  return out.sort((x, y) => y.post.date.localeCompare(x.post.date));
}

// ---------- 更新 ----------

export function createTeam(input: { name: string; city: string; level: Level; note?: string; ownerId: string }) {
  const db = read();
  const team: Team = { id: "t" + uid(), ...input };
  write({
    ...db,
    teams: [...db.teams, team],
    members: [...db.members, { teamId: team.id, profileId: input.ownerId, role: "owner" }],
  });
  return team;
}

export function createPost(input: {
  kind: PostKind; teamId: string; venueId: string; date: string; startTime: string; endTime: string;
  level: Level; positions?: Position[]; needed?: number; fee?: number; body: string;
}) {
  const db = read();
  const post: Post = { id: "p" + uid(), status: "open", createdAt: today(), ...input };
  write({ ...db, posts: [post, ...db.posts] });
  return post;
}

export function closePost(postId: string) {
  const db = read();
  write({ ...db, posts: db.posts.map((p) => (p.id === postId ? { ...p, status: "closed" } : p)) });
}

export function apply(input: { postId: string; applicantTeamId?: string; applicantProfileId?: string; message?: string }) {
  const db = read();
  const a: Application = { id: "a" + uid(), status: "pending", createdAt: today(), ...input };
  write({ ...db, applications: [...db.applications, a] });
  return a;
}

export function cancelApplication(id: string) {
  const db = read();
  write({ ...db, applications: db.applications.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)) });
}

/** 募集主が承認 or 見送り。承認で「エントリー完了」。助っ人は人数が揃ったら成立にする */
export function decide(id: string, status: Extract<ApplicationStatus, "approved" | "rejected">) {
  const db = read();
  const apps = db.applications.map((a) => (a.id === id ? { ...a, status, decidedAt: today() } : a));
  const target = apps.find((a) => a.id === id);
  let posts = db.posts;
  if (target && status === "approved") {
    const post = db.posts.find((p) => p.id === target.postId);
    if (post) {
      const approved = apps.filter((a) => a.postId === post.id && a.status === "approved").length;
      const filled = post.kind === "training_match" ? approved >= 1 : approved >= (post.needed ?? 1);
      if (filled) posts = db.posts.map((p) => (p.id === post.id ? { ...p, status: "filled" } : p));
    }
  }
  write({ ...db, applications: apps, posts });
}

export function addRating(input: {
  postId: string; applicationId: string; from: RatingTarget; to: RatingTarget; stars: 1 | 2 | 3 | 4 | 5; comment?: string;
}) {
  const db = read();
  const r: Rating = { id: "r" + uid(), createdAt: today(), ...input };
  write({ ...db, ratings: [...db.ratings, r] });
  return r;
}
