export type PostKind = "training_match" | "helper";
export type PostStatus = "open" | "closed" | "filled";
export type Level = "beginner" | "casual" | "competitive";
export type Position = "GK" | "DF" | "MF" | "FW" | "ANY";

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
};

/** 募集。チーム間・助っ人の両方をこの1つで表す */
export type Post = {
  id: string;
  kind: PostKind;
  status: PostStatus;
  team: Team;
  venue: Venue;
  /** 試合日（YYYY-MM-DD） */
  date: string;
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  level: Level;
  /** helper のときのみ使う */
  positions?: Position[];
  needed?: number;
  fee?: number;        // 1人あたりの参加費（円）。0 は無料
  body: string;
  createdAt: string;
};

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "初心者歓迎",
  casual: "エンジョイ",
  competitive: "本格志向",
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
