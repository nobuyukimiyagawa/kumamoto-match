/** 2点間の距離（km）。地球を球として近似する（県内なら誤差は無視できる） */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 距離の表示。1km未満は m、それ以上は小数1桁の km */
export function fmtKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/** 中心と半径(km)から、地図に描く円のポリゴン（GeoJSON）を作る */
export function circlePolygon(center: { lat: number; lng: number }, km: number, steps = 64) {
  const coords: [number, number][] = [];
  const latR = km / 110.574;
  const lngR = km / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    coords.push([center.lng + lngR * Math.cos(t), center.lat + latR * Math.sin(t)]);
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coords] },
  };
}
