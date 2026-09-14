"use client";

/** localStorage で完結するデモ用バックエンド。Supabase のキーが無いときに使う */
import type { Application, Post, Rating, Team } from "@/types";
import { APPLICATIONS, MEMBERS, POSTS, PROFILES, RATINGS, TEAMS, VENUES } from "./mock";
import { EMPTY_DB, isFilled, today, uid, type Backend, type DB } from "./backend";

const KEY = "pitchmate-db-v1";
const SESSION_KEY = "pitchmate-session-v1";

let cache: DB | null = null;
const dbListeners = new Set<() => void>();
const sessionListeners = new Set<() => void>();

function seed(): DB {
  return {
    venues: VENUES, profiles: PROFILES, teams: TEAMS, members: MEMBERS,
    posts: POSTS, applications: APPLICATIONS, ratings: RATINGS, ready: true,
  };
}
function read(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY_DB;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { cache = { ...(JSON.parse(raw) as DB), ready: true }; return cache; }
  } catch { /* 壊れていたら初期値に戻す */ }
  cache = seed();
  return cache;
}
function write(next: DB) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* 容量超過などは無視 */ }
  dbListeners.forEach((l) => l());
}

export const localBackend: Backend = {
  mode: "local",

  subscribeDB(l) { dbListeners.add(l); return () => { dbListeners.delete(l); }; },
  getDB: read,
  subscribeSession(l) { sessionListeners.add(l); return () => { sessionListeners.delete(l); }; },
  getSessionId() {
    try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
  },

  setSession(profileId) {
    try {
      if (profileId) localStorage.setItem(SESSION_KEY, profileId);
      else localStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
    sessionListeners.forEach((l) => l());
  },
  async signOut() { this.setSession!(null); },

  async upsertProfile(id, input) {
    const db = read();
    const exists = db.profiles.some((p) => p.id === id);
    const profiles = exists
      ? db.profiles.map((p) => (p.id === id ? { ...p, ...input } : p))
      : [...db.profiles, { id, ...input }];
    write({ ...db, profiles });
  },
  async createTeam(input) {
    const db = read();
    const team: Team = { id: "t" + uid(), ...input };
    write({
      ...db,
      teams: [...db.teams, team],
      members: [...db.members, { teamId: team.id, profileId: input.ownerId, role: "owner" }],
    });
    return team;
  },
  async updateTeam(id, patch) {
    const db = read();
    write({ ...db, teams: db.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  },
  async createPost(input) {
    const db = read();
    const post: Post = { id: "p" + uid(), status: "open", createdAt: today(), ...input };
    write({ ...db, posts: [post, ...db.posts] });
    return post;
  },
  async closePost(postId) {
    const db = read();
    write({ ...db, posts: db.posts.map((p) => (p.id === postId ? { ...p, status: "closed" } : p)) });
  },
  async apply(input) {
    const db = read();
    const a: Application = { id: "a" + uid(), status: "pending", createdAt: today(), ...input };
    write({ ...db, applications: [...db.applications, a] });
    return a;
  },
  async cancelApplication(id) {
    const db = read();
    write({ ...db, applications: db.applications.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)) });
  },
  async decide(id, status) {
    const db = read();
    const apps = db.applications.map((a) => (a.id === id ? { ...a, status, decidedAt: today() } : a));
    const target = apps.find((a) => a.id === id);
    let posts = db.posts;
    if (target && status === "approved") {
      const post = db.posts.find((p) => p.id === target.postId);
      if (post) {
        const approved = apps.filter((a) => a.postId === post.id && a.status === "approved").length;
        if (isFilled(post, approved)) posts = db.posts.map((p) => (p.id === post.id ? { ...p, status: "filled" } : p));
      }
    }
    write({ ...db, applications: apps, posts });
  },
  async addRating(input) {
    const db = read();
    const r: Rating = { id: "r" + uid(), createdAt: today(), ...input };
    write({ ...db, ratings: [...db.ratings, r] });
    return r;
  },
  reset() { write(seed()); },
};
