/**
 * データ層の共通インターフェース。
 * - backend.local.ts   … localStorage（キー未設定のときのデモ用）
 * - backend.supabase.ts … Supabase（本番）
 * store.ts がどちらかを選び、画面はその違いを知らない。
 */
import type {
  Application, ApplicationStatus, Level, Post, PostKind, Position, Profile, Rating, RatingTarget,
  Team, TeamMember, Venue,
} from "@/types";

export type DB = {
  venues: Venue[];
  profiles: Profile[];
  teams: Team[];
  members: TeamMember[];
  posts: Post[];
  applications: Application[];
  ratings: Rating[];
  /** 読み込みが一度でも終わったか。false の間は「読み込み中」を出す */
  ready: boolean;
};

export const EMPTY_DB: DB = {
  venues: [], profiles: [], teams: [], members: [], posts: [], applications: [], ratings: [], ready: false,
};

export type NewTeam = { name: string; city: string; level: Level; note?: string; ownerId: string };
export type TeamPatch = { name?: string; city?: string; level?: Level; note?: string };
export type NewPost = {
  kind: PostKind; teamId: string; venueId: string; date: string; startTime: string; endTime: string;
  level: Level; positions?: Position[]; needed?: number; fee?: number; body: string;
};
export type NewApplication = { postId: string; applicantTeamId?: string; applicantProfileId?: string; message?: string };
export type NewRating = {
  postId: string; applicationId: string; from: RatingTarget; to: RatingTarget; stars: 1 | 2 | 3 | 4 | 5; comment?: string;
};
export type ProfileInput = { displayName: string; city: string; positions: Position[]; years?: number; note?: string };

export interface Backend {
  /** ログインの方式。local はデモ用の切替、supabase はメールのマジックリンク */
  mode: "local" | "supabase";

  // 購読（useSyncExternalStore 用）
  subscribeDB(l: () => void): () => void;
  getDB(): DB;
  subscribeSession(l: () => void): () => void;
  getSessionId(): string | null;

  // 認証
  /** local: プロフィールIDを直接指定。supabase: 使わない */
  setSession?(profileId: string | null): void;
  /** supabase: マジックリンクを送る */
  signInWithEmail?(email: string): Promise<{ error?: string }>;
  signOut(): Promise<void>;

  // 更新
  upsertProfile(id: string, input: ProfileInput): Promise<void>;
  createTeam(input: NewTeam): Promise<Team>;
  updateTeam(id: string, patch: TeamPatch): Promise<void>;
  createPost(input: NewPost): Promise<Post>;
  closePost(postId: string): Promise<void>;
  apply(input: NewApplication): Promise<Application>;
  cancelApplication(id: string): Promise<void>;
  decide(id: string, status: Extract<ApplicationStatus, "approved" | "rejected">): Promise<void>;
  addRating(input: NewRating): Promise<Rating>;
  /** local だけ: 仮データに戻す */
  reset?(): void;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

/** 助っ人は定員に達したら、トレーニングマッチは1チーム承認で「成立」 */
export function isFilled(post: Post, approvedCount: number) {
  return post.kind === "training_match" ? approvedCount >= 1 : approvedCount >= (post.needed ?? 1);
}
