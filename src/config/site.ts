// サービス名はここ1か所で変える
export const SITE = {
  name: "ピッチメイト",
  nameEn: "PITCHMATE",
  tagline: "熊本のチームと選手をつなぐ",
  area: "熊本県",
} as const;

// 熊本県のおおよその中心（地図の初期表示）
export const MAP_DEFAULT = {
  center: { lat: 32.7898, lng: 130.7417 }, // 熊本市中央区あたり
  zoom: 10,
} as const;

// 県外の座標が紛れ込まないようにする範囲
export const KUMAMOTO_BOUNDS = {
  north: 33.21, south: 32.09, west: 129.99, east: 131.34,
} as const;
