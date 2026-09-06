import type { Post, Team, Venue } from "@/types";

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

export const TEAMS: Team[] = [
  { id: "t1", name: "FC VALIANT",    city: "熊本市中央区", level: "casual" },
  { id: "t2", name: "菊陽キャロッツ", city: "菊池郡菊陽町", level: "casual" },
  { id: "t3", name: "熊本SSS",       city: "熊本市東区",   level: "competitive" },
  { id: "t4", name: "スティンガー熊本", city: "合志市",     level: "casual" },
  { id: "t5", name: "八代フェニックス", city: "八代市",     level: "beginner" },
  { id: "t6", name: "天草マリナーズ", city: "天草市",      level: "casual" },
];

const d = (offset: number) => {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  return t.toISOString().slice(0, 10);
};

export const POSTS: Post[] = [
  { id: "p1", kind: "training_match", status: "open", team: TEAMS[0], venue: VENUES[0],
    date: d(3), startTime: "19:00", endTime: "21:00", level: "casual", fee: 0,
    body: "45分×2本でお願いします。審判は分担で。人数は11人制、少なければ8人制でも構いません。",
    createdAt: d(-2) },
  { id: "p2", kind: "helper", status: "open", team: TEAMS[1], venue: VENUES[2],
    date: d(5), startTime: "18:00", endTime: "20:00", level: "casual",
    positions: ["GK", "DF"], needed: 3, fee: 500,
    body: "リーグ戦の助っ人を探しています。GK1名、DF2名。経験は問いません。参加費500円（グラウンド代）。",
    createdAt: d(-1) },
  { id: "p3", kind: "training_match", status: "open", team: TEAMS[2], venue: VENUES[1],
    date: d(6), startTime: "10:00", endTime: "12:00", level: "competitive",
    fee: 0, body: "県リーグ上位を目指すチームを希望します。強度高めでお願いします。",
    createdAt: d(-4) },
  { id: "p4", kind: "helper", status: "open", team: TEAMS[3], venue: VENUES[3],
    date: d(8), startTime: "20:00", endTime: "22:00", level: "beginner",
    positions: ["ANY"], needed: 5, fee: 0,
    body: "ナイター練習。ブランクのある方、初心者の方も歓迎です。まずは見学だけでも。",
    createdAt: d(-1) },
  { id: "p5", kind: "training_match", status: "open", team: TEAMS[4], venue: VENUES[4],
    date: d(10), startTime: "14:00", endTime: "16:00", level: "beginner",
    fee: 0, body: "八代周辺のチーム募集。和やかにやりたいので、初心者中心のチームだと助かります。",
    createdAt: d(-3) },
  { id: "p6", kind: "helper", status: "open", team: TEAMS[5], venue: VENUES[7],
    date: d(12), startTime: "13:00", endTime: "15:00", level: "casual",
    positions: ["FW", "MF"], needed: 2, fee: 300,
    body: "天草での試合です。前線が薄いのでFW・MFを2名。移動が遠いので昼開催にしています。",
    createdAt: d(-2) },
  { id: "p7", kind: "training_match", status: "open", team: TEAMS[1], venue: VENUES[5],
    date: d(14), startTime: "09:00", endTime: "11:00", level: "casual",
    fee: 0, body: "菊池での練習試合。8人制でも11人制でも合わせられます。",
    createdAt: d(-5) },
  { id: "p8", kind: "helper", status: "open", team: TEAMS[0], venue: VENUES[6],
    date: d(16), startTime: "18:30", endTime: "20:30", level: "casual",
    positions: ["DF"], needed: 1, fee: 0,
    body: "急な欠員でDFを1名探しています。宇土市民グラウンド、平日夜です。",
    createdAt: d(0) },
];
