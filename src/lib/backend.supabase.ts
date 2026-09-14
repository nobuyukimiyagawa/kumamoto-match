"use client";

/**
 * Supabase バックエンド。
 * データ量は県内の募集程度なので、必要なテーブルを丸ごと読んでメモリに持ち、
 * 書き込みのたびに読み直す。画面側は localStorage 版と同じ DB 形を見る。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Application, ApplicationStatus, Level, Position, Post, PostKind, Profile, Rating, RatingTarget,
  Team, TeamMember, Venue,
} from "@/types";
import { EMPTY_DB, isFilled, type Backend, type DB } from "./backend";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabase = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) client = createClient(URL, KEY);
  return client;
}

// ---------- 行 ↔ 型 の変換（DB は snake_case、画面は camelCase） ----------

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? undefined : String(v));
const hhmm = (v: unknown) => String(v ?? "").slice(0, 5);
const ymd = (v: unknown) => String(v ?? "").slice(0, 10);

const toVenue = (r: Row): Venue => ({
  id: String(r.id), name: String(r.name), city: String(r.city), address: String(r.address),
  lat: Number(r.lat), lng: Number(r.lng),
});
const toProfile = (r: Row): Profile => ({
  id: String(r.id), displayName: String(r.display_name), city: String(r.city ?? ""),
  positions: (r.positions as Position[]) ?? [], years: r.years == null ? undefined : Number(r.years), note: s(r.note),
});
const toTeam = (r: Row): Team => ({
  id: String(r.id), name: String(r.name), city: String(r.city ?? ""), level: r.level as Level,
  note: s(r.note), ownerId: String(r.owner_id),
});
const toMember = (r: Row): TeamMember => ({
  teamId: String(r.team_id), profileId: String(r.profile_id), role: r.role as TeamMember["role"],
});
const toPost = (r: Row): Post => ({
  id: String(r.id), kind: r.kind as PostKind, status: r.status as Post["status"],
  teamId: String(r.team_id), venueId: String(r.venue_id),
  date: ymd(r.match_date), startTime: hhmm(r.start_time), endTime: hhmm(r.end_time),
  level: r.level as Level, positions: (r.positions as Position[] | null) ?? undefined,
  needed: r.needed == null ? undefined : Number(r.needed), fee: r.fee == null ? 0 : Number(r.fee),
  body: String(r.body ?? ""), createdAt: ymd(r.created_at),
});
const toApplication = (r: Row): Application => ({
  id: String(r.id), postId: String(r.post_id),
  applicantTeamId: s(r.applicant_team_id), applicantProfileId: s(r.applicant_profile_id),
  status: r.status as ApplicationStatus, message: s(r.message),
  createdAt: ymd(r.created_at), decidedAt: r.decided_at ? ymd(r.decided_at) : undefined,
});
const toRating = (r: Row): Rating => ({
  id: String(r.id), postId: String(r.post_id), applicationId: String(r.application_id),
  from: { kind: r.from_kind as RatingTarget["kind"], id: String(r.from_id) },
  to: { kind: r.to_kind as RatingTarget["kind"], id: String(r.to_id) },
  stars: Number(r.stars) as Rating["stars"], comment: s(r.comment), createdAt: ymd(r.created_at),
});

// ---------- 読み込みと購読 ----------

let db: DB = EMPTY_DB;
let sessionId: string | null = null;
let authMeta: { name?: string; email?: string } | null = null;
const dbListeners = new Set<() => void>();
const sessionListeners = new Set<() => void>();
let started = false;
let loading: Promise<void> | null = null;

async function reload() {
  if (loading) return loading;
  loading = (async () => {
    const c = sb();
    const [venues, profiles, teams, members, posts, applications, ratings] = await Promise.all([
      c.from("venues").select("*"),
      c.from("profiles").select("*"),
      c.from("teams").select("*"),
      c.from("team_members").select("*"),
      c.from("posts").select("*").order("match_date"),
      c.from("applications").select("*"),
      c.from("ratings").select("*"),
    ]);
    const err = [venues, profiles, teams, members, posts, applications, ratings].find((r) => r.error)?.error;
    if (err) console.error("Supabase 読み込みエラー:", err.message);
    db = {
      venues: (venues.data ?? []).map(toVenue),
      profiles: (profiles.data ?? []).map(toProfile),
      teams: (teams.data ?? []).map(toTeam),
      members: (members.data ?? []).map(toMember),
      posts: (posts.data ?? []).map(toPost),
      applications: (applications.data ?? []).map(toApplication),
      ratings: (ratings.data ?? []).map(toRating),
      ready: true,
    };
    dbListeners.forEach((l) => l());
  })().finally(() => { loading = null; });
  return loading;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const c = sb();
  const pickMeta = (u: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) => {
    if (!u) return null;
    const m = u.user_metadata ?? {};
    const name = (m.full_name ?? m.name ?? m.display_name) as string | undefined;
    return { name, email: u.email };
  };
  c.auth.getSession().then(({ data }) => {
    sessionId = data.session?.user.id ?? null;
    authMeta = pickMeta(data.session?.user);
    sessionListeners.forEach((l) => l());
  });
  c.auth.onAuthStateChange((_e, session) => {
    const next = session?.user.id ?? null;
    authMeta = pickMeta(session?.user);
    if (next !== sessionId) {
      sessionId = next;
      sessionListeners.forEach((l) => l());
      // ログイン状態で見える行（自分のエントリー等）が変わるので読み直す
      reload();
    }
  });
  reload();
}

function fail(e: { message: string } | null): never | void {
  if (e) throw new Error(e.message);
}

/** サイトのトップ（basePath 込み、末尾スラッシュあり）。ログイン後の戻り先に使う */
function siteUrl() {
  return window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/";
}

export const supabaseBackend: Backend = {
  mode: "supabase",

  subscribeDB(l) { start(); dbListeners.add(l); return () => { dbListeners.delete(l); }; },
  getDB: () => db,
  subscribeSession(l) { start(); sessionListeners.add(l); return () => { sessionListeners.delete(l); }; },
  getSessionId: () => sessionId,

  async signInWithEmail(email) {
    const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: siteUrl() + "auth/done/" } });
    return error ? { error: error.message } : {};
  },
  async signInWithGoogle() {
    const { error } = await sb().auth.signInWithOAuth({ provider: "google", options: { redirectTo: siteUrl() + "auth/done/" } });
    return error ? { error: error.message } : {};
  },
  signInWithLine() {
    // Edge Function が LINE の認可画面へ飛ばし、戻りは /auth/line/?token_hash=... に来る
    const back = siteUrl() + "auth/line/";
    // 外部（Supabase の Edge Function）へ移動する。Next のページ遷移ではない
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${URL}/functions/v1/line-auth/start?return=${encodeURIComponent(back)}`);
  },
  async finishLineLogin(tokenHash) {
    const { error } = await sb().auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    return error ? { error: error.message } : {};
  },
  getAuthMeta() { return authMeta; },
  async signOut() { await sb().auth.signOut(); },

  async upsertProfile(id, input) {
    const { error } = await sb().from("profiles").upsert({
      id, display_name: input.displayName, city: input.city, positions: input.positions,
      years: input.years ?? null, note: input.note ?? null,
    });
    fail(error);
    await reload();
  },
  async createTeam(input) {
    const { data, error } = await sb().from("teams")
      .insert({ name: input.name, city: input.city, level: input.level, note: input.note ?? null, owner_id: input.ownerId })
      .select().single();
    fail(error);
    await reload();
    return toTeam(data as Row);
  },
  async updateTeam(id, patch) {
    const { error } = await sb().from("teams").update({
      ...(patch.name != null ? { name: patch.name } : {}),
      ...(patch.city != null ? { city: patch.city } : {}),
      ...(patch.level != null ? { level: patch.level } : {}),
      ...(patch.note !== undefined ? { note: patch.note ?? null } : {}),
    }).eq("id", id);
    fail(error);
    await reload();
  },
  async createPost(input) {
    const { data, error } = await sb().from("posts").insert({
      kind: input.kind, team_id: input.teamId, venue_id: input.venueId,
      match_date: input.date, start_time: input.startTime, end_time: input.endTime,
      level: input.level, positions: input.positions ?? null, needed: input.needed ?? null,
      fee: input.fee ?? 0, body: input.body,
    }).select().single();
    fail(error);
    await reload();
    return toPost(data as Row);
  },
  async closePost(postId) {
    const { error } = await sb().from("posts").update({ status: "closed" }).eq("id", postId);
    fail(error);
    await reload();
  },
  async apply(input) {
    const { data, error } = await sb().from("applications").insert({
      post_id: input.postId, applicant_team_id: input.applicantTeamId ?? null,
      applicant_profile_id: input.applicantProfileId ?? null, message: input.message ?? null,
    }).select().single();
    fail(error);
    await reload();
    return toApplication(data as Row);
  },
  async cancelApplication(id) {
    const { error } = await sb().from("applications").update({ status: "cancelled" }).eq("id", id);
    fail(error);
    await reload();
  },
  async decide(id, status) {
    const c = sb();
    const { data, error } = await c.from("applications")
      .update({ status, decided_at: new Date().toISOString() }).eq("id", id).select().single();
    fail(error);
    if (status === "approved" && data) {
      const app = toApplication(data as Row);
      const post = db.posts.find((p) => p.id === app.postId);
      if (post) {
        const { count } = await c.from("applications")
          .select("id", { count: "exact", head: true }).eq("post_id", post.id).eq("status", "approved");
        if (isFilled(post, count ?? 0)) await c.from("posts").update({ status: "filled" }).eq("id", post.id);
      }
    }
    await reload();
  },
  async addRating(input) {
    const { data, error } = await sb().from("ratings").insert({
      post_id: input.postId, application_id: input.applicationId,
      from_kind: input.from.kind, from_id: input.from.id, to_kind: input.to.kind, to_id: input.to.id,
      stars: input.stars, comment: input.comment ?? null,
    }).select().single();
    fail(error);
    await reload();
    return toRating(data as Row);
  },
};
