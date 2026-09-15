import type {
  Application, Post, Profile, Rating, Team, TeamMember, Venue,
} from "@/types";

/**
 * 仮データ。Supabase 接続までの間、ブラウザ内ストア（store.ts）の初期値になる。
 * 日付は「今日」基準で作るので、いつ開いても募集が今週〜来月に並ぶ。
 */

/** 熊本県内の実在する会場。座標は公開情報から */
export const VENUES: Venue[] = [
  { id: "v1", name: "益城町総合運動公園", city: "上益城郡益城町", address: "熊本県上益城郡益城町広崎1655-1", lat: 32.7899, lng: 130.8203 },
  { id: "v2", name: "熊本県民総合運動公園", city: "熊本市東区", address: "熊本県熊本市東区平山町2776", lat: 32.7856, lng: 130.7898 },
  { id: "v3", name: "フットボールパーク御代志", city: "合志市", address: "熊本県合志市御代志1661", lat: 32.8869, lng: 130.7524 },
  { id: "v4", name: "熊本市総合屋内プール前グラウンド", city: "熊本市中央区", address: "熊本県熊本市中央区水前寺5-23-15", lat: 32.7897, lng: 130.7315 },
  { id: "v5", name: "八代市球磨川河川敷グラウンド", city: "八代市", address: "熊本県八代市萩原町", lat: 32.5069, lng: 130.6019 },
  { id: "v6", name: "菊池市総合体育館グラウンド", city: "菊池市", address: "熊本県菊池市隈府1600", lat: 32.9781, lng: 130.8135 },
  { id: "v7", name: "宇土市民グラウンド", city: "宇土市", address: "熊本県宇土市古城町", lat: 32.6885, lng: 130.6588 },
  { id: "v8", name: "天草市民スポーツ広場", city: "天草市", address: "熊本県天草市亀場町", lat: 32.4581, lng: 130.1936 },
];

/** 個人。デモでは「アカウント切替」で誰にでもなれる */
export const PROFILES: Profile[] = [
  { id: "u1", displayName: "田中 健太", city: "熊本市中央区", positions: ["MF"], years: 12, note: "FC VALIANT の代表。平日夜と土曜に活動。" },
  { id: "u2", displayName: "佐藤 大輔", city: "菊池郡菊陽町", positions: ["DF"], years: 8, note: "菊陽キャロッツの運営担当。" },
  { id: "u3", displayName: "鈴木 翔", city: "熊本市東区", positions: ["GK"], years: 10, note: "高校までGK。社会人になってからは助っ人中心。土日どちらも動けます。" },
  { id: "u4", displayName: "高橋 玲", city: "合志市", positions: ["FW", "MF"], years: 5, note: "エンジョイ寄り。走るのは得意です。" },
  { id: "u5", displayName: "山本 誠", city: "熊本市東区", positions: ["DF"], years: 15, note: "熊本SSS のキャプテン。" },
];

export const TEAMS: Team[] = [
  { id: "t1", name: "FC VALIANT",     city: "熊本市中央区", level: "casual",      ownerId: "u1", note: "20〜40代中心。月2回の練習と月1回の対外試合。" },
  { id: "t2", name: "菊陽キャロッツ",  city: "菊池郡菊陽町", level: "casual",      ownerId: "u2", note: "菊陽町のエンジョイチーム。初心者も歓迎。" },
  { id: "t3", name: "熊本SSS",        city: "熊本市東区",   level: "competitive", ownerId: "u5", note: "県リーグ2部。上を目指しています。" },
  { id: "t4", name: "スティンガー熊本", city: "合志市",      level: "casual",      ownerId: "u2" },
  { id: "t5", name: "八代フェニックス", city: "八代市",      level: "beginner",    ownerId: "u5" },
  { id: "t6", name: "天草マリナーズ",  city: "天草市",       level: "casual",      ownerId: "u5" },
];

export const MEMBERS: TeamMember[] = [
  { teamId: "t1", profileId: "u1", role: "owner" },
  { teamId: "t2", profileId: "u2", role: "owner" },
  { teamId: "t3", profileId: "u5", role: "owner" },
  { teamId: "t4", profileId: "u2", role: "owner" },
  { teamId: "t5", profileId: "u5", role: "owner" },
  { teamId: "t6", profileId: "u5", role: "owner" },
];

const d = (offset: number) => {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  const y = t.getFullYear(), m = String(t.getMonth() + 1).padStart(2, "0"), dd = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export const POSTS: Post[] = [
  // これから
  { id: "p1", kind: "training_match", status: "open", teamId: "t1", venueId: "v1",
    date: d(3), startTime: "19:00", endTime: "21:00", level: "casual", venueStatus: "reserved", fee: 3000,
    body: "45分×2本でお願いします。審判は分担で。人数は11人制、少なければ8人制でも構いません。",
    createdAt: d(-2) },
  { id: "p2", kind: "helper", status: "open", teamId: "t2", venueId: "v3",
    date: d(5), startTime: "18:00", endTime: "20:00", level: "casual",
    positions: ["GK", "DF"], needed: 3, fee: 500,
    body: "リーグ戦の助っ人を探しています。GK1名、DF2名。経験は問いません。参加費500円（グラウンド代）。",
    createdAt: d(-1) },
  { id: "p3", kind: "training_match", status: "open", teamId: "t3", venueId: "v2",
    date: d(6), startTime: "10:00", endTime: "12:00", level: "competitive", venueStatus: "planned", fee: 2500,
    body: "県リーグ上位を目指すチームを希望します。強度高めでお願いします。",
    createdAt: d(-3) },
  { id: "p4", kind: "helper", status: "open", teamId: "t4", venueId: "v3",
    date: d(9), startTime: "19:30", endTime: "21:30", level: "casual",
    positions: ["ANY"], needed: 2, fee: 0,
    body: "人数が足りません。ポジションはどこでも。楽しくやりたい方歓迎。",
    createdAt: d(-1) },
  { id: "p5", kind: "training_match", status: "open", teamId: "t5", venueId: "v5",
    date: d(12), startTime: "09:00", endTime: "11:00", level: "beginner", venueStatus: "reserved", fee: 0,
    body: "初心者中心のチームです。同じくらいのレベルのチームと練習試合をしたいです。",
    createdAt: d(-4) },
  { id: "p6", kind: "helper", status: "open", teamId: "t1", venueId: "v4",
    date: d(14), startTime: "20:00", endTime: "22:00", level: "casual",
    positions: ["FW", "MF"], needed: 2, fee: 300,
    body: "ナイター練習試合。前線が足りません。走れる方だと助かります。",
    createdAt: d(0) },
  { id: "p7", kind: "training_match", status: "open", teamId: "t6", venueId: "v8",
    date: d(20), startTime: "14:00", endTime: "16:00", level: "casual", fee: 0,
    body: "天草まで来ていただけるチームを探しています。交通費は出せませんが、試合後の食事はご馳走します。",
    createdAt: d(-2) },
  { id: "p8", kind: "helper", status: "open", teamId: "t3", venueId: "v6",
    date: d(25), startTime: "13:00", endTime: "15:00", level: "competitive",
    positions: ["GK"], needed: 1, fee: 1000,
    body: "GKの怪我でリーグ戦に穴が空きました。経験者のみ。",
    createdAt: d(-1) },
  // 終わった試合（評価のデモ用）
  { id: "p9", kind: "training_match", status: "closed", teamId: "t1", venueId: "v2",
    date: d(-10), startTime: "19:00", endTime: "21:00", level: "casual", fee: 0,
    body: "（終了）45分×2本。", createdAt: d(-20) },
  { id: "p10", kind: "helper", status: "closed", teamId: "t2", venueId: "v3",
    date: d(-6), startTime: "18:00", endTime: "20:00", level: "casual",
    positions: ["GK"], needed: 1, fee: 500,
    body: "（終了）GK1名。", createdAt: d(-15) },
  { id: "p11", kind: "helper", status: "closed", teamId: "t1", venueId: "v1",
    date: d(-3), startTime: "19:00", endTime: "21:00", level: "casual",
    positions: ["DF"], needed: 1, fee: 0,
    body: "（終了）DF1名。", createdAt: d(-9) },
];

export const APPLICATIONS: Application[] = [
  // これから: p1（VALIANT のトレマ）に菊陽キャロッツが承認待ち
  { id: "a1", postId: "p1", applicantTeamId: "t2", status: "pending", message: "11人制で大丈夫です。よろしくお願いします。", createdAt: d(-1) },
  // これから: p2（菊陽の助っ人）に鈴木がエントリー完了、高橋が承認待ち
  { id: "a2", postId: "p2", applicantProfileId: "u3", status: "approved", message: "GKで入れます。", createdAt: d(-1), decidedAt: d(0) },
  { id: "a3", postId: "p2", applicantProfileId: "u4", status: "pending", message: "DFでも大丈夫です。", createdAt: d(0) },
  // 終了: p9（VALIANT vs 菊陽）
  { id: "a4", postId: "p9", applicantTeamId: "t2", status: "approved", createdAt: d(-15), decidedAt: d(-14) },
  // 終了: p10（菊陽の助っ人に鈴木）
  { id: "a5", postId: "p10", applicantProfileId: "u3", status: "approved", createdAt: d(-12), decidedAt: d(-11) },
  // 終了: p11（VALIANT の助っ人に高橋）
  { id: "a6", postId: "p11", applicantProfileId: "u4", status: "approved", createdAt: d(-8), decidedAt: d(-7) },
];

export const RATINGS: Rating[] = [
  // p9: 菊陽 → VALIANT はもう評価済み。VALIANT → 菊陽 は未評価（デモで付ける）
  { id: "r1", postId: "p9", applicationId: "a4", from: { kind: "team", id: "t2" }, to: { kind: "team", id: "t1" },
    stars: 5, comment: "時間どおりで審判の分担もスムーズでした。", createdAt: d(-9) },
  // p10: 双方評価済み
  { id: "r2", postId: "p10", applicationId: "a5", from: { kind: "team", id: "t2" }, to: { kind: "profile", id: "u3" },
    stars: 5, comment: "安定したGK。また来てほしい。", createdAt: d(-5) },
  { id: "r3", postId: "p10", applicationId: "a5", from: { kind: "profile", id: "u3" }, to: { kind: "team", id: "t2" },
    stars: 4, comment: "雰囲気が良かったです。", createdAt: d(-5) },
  // p11: 高橋 → VALIANT は評価済み。VALIANT → 高橋 は未評価
  { id: "r4", postId: "p11", applicationId: "a6", from: { kind: "profile", id: "u4" }, to: { kind: "team", id: "t1" },
    stars: 4, createdAt: d(-2) },
];
