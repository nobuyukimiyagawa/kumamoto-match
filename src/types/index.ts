export type PostKind = "training_match" | "helper";
export type PostStatus = "open" | "closed" | "filled";
export type Level = "beginner" | "casual" | "competitive";
export type Position = "GK" | "DF" | "MF" | "FW" | "ANY";
export type MemberRole = "owner" | "admin" | "member";
/** トレーニングマッチの会場の予約状況。相手が決まってから予約するチームもある */
export type VenueStatus = "reserved" | "planned";

export type Venue = {
  id: string;
  name: string;
  city: string;      // 市区町村
  address: string;
  lat: number;
  lng: number;
};

export type Team = {
  id: string;
  name: string;
  city: string;
  level: Level;
  note?: string;
  ownerId: string;
};

/** 個人。住所は持たない（市区町村まで） */
export type Profile = {
  id: string;
  displayName: string;
  city: string;
  positions: Position[];
  years?: number;
  note?: string;
};

export type TeamMember = {
  teamId: string;
  profileId: string;
  role: MemberRole;
};

/** 募集。チーム間・助っ人の両方をこの1つで表す */
export type Post = {
  id: string;
  kind: PostKind;
  status: PostStatus;
  teamId: string;
  venueId: string;
  /** 試合日（YYYY-MM-DD） */
  date: string;
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  level: Level;
  /** helper のときのみ使う */
  positions?: Position[];
  needed?: number;
  /** training_match のときのみ。会場が予約済みか、相手が決まってから予約するか */
  venueStatus?: VenueStatus;
  /**
   * 金額（円）。0 は無料。
   *   helper         … 1人あたりの参加費
   *   training_match … 相手チームの負担額（会場費の折半など）。venueStatus が planned なら目安
   */
  fee?: number;
  body: string;
  createdAt: string;
};

/** 募集に対するエントリー。承認されると「エントリー完了」 */
export type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

export type Application = {
  id: string;
  postId: string;
  /** チーム間なら applicantTeamId、助っ人なら applicantProfileId のどちらか一方 */
  applicantTeamId?: string;
  applicantProfileId?: string;
  status: ApplicationStatus;
  message?: string;
  createdAt: string;
  decidedAt?: string;
};

/** 五つ星評価。試合が終わった相手にだけ付けられる */
export type RatingTarget = { kind: "team"; id: string } | { kind: "profile"; id: string };

export type Rating = {
  id: string;
  postId: string;
  applicationId: string;
  from: RatingTarget;
  to: RatingTarget;
  stars: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
};

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "初心者歓迎",
  casual: "エンジョイ",
  competitive: "本格志向",
};

export const VENUE_STATUS_LABEL: Record<VenueStatus, string> = {
  reserved: "予約確定",
  planned: "予約予定",
};

export const KIND_LABEL: Record<PostKind, string> = {
  training_match: "トレーニングマッチ",
  helper: "助っ人募集",
};

export const STATUS_LABEL: Record<PostStatus, string> = {
  open: "募集中",
  closed: "締切",
  filled: "成立",
};

export const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "承認待ち",
  approved: "エントリー完了",
  rejected: "見送り",
  cancelled: "取り消し",
};

export const POSITION_LABEL: Record<Position, string> = {
  GK: "GK", DF: "DF", MF: "MF", FW: "FW", ANY: "どこでも",
};
