"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_DEFAULT } from "@/config/site";
import type { PostView as Post } from "@/lib/store";
import { circlePolygon } from "@/lib/geo";

/** OpenFreeMap の黒地図。鍵も登録も要らず、費用もかからない。 */
const STYLE = "https://tiles.openfreemap.org/styles/dark";

/**
 * Worker の場所を明示する。
 * Turbopack は import.meta.url を file:// にするため、MapLibre 任せだと Worker の URL が
 * 空になり、タイルが永遠に読み込み中のまま地図が描かれない。
 * 実体は scripts/copy-maplibre-worker.mjs が public/maplibre/ へ複製する。
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
maplibregl.setWorkerUrl(`${BASE}/maplibre/maplibre-gl-worker.mjs`);

type LatLng = { lat: number; lng: number };

type Props = {
  posts: Post[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** 現在地。距離で絞るときの基準 */
  origin?: LatLng | null;
  /** 絞り込みの半径(km)。0 なら円を描かない */
  radiusKm?: number;
  /** 地図の現在地ボタンで位置が取れたとき */
  onLocate?: (p: LatLng) => void;
};

const RADIUS_SRC = "radius";

/** 募集のピン。種別を文字で書き、選択中は塗る */
function pin(post: Post, active: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `pin ${active ? "pin-active" : post.kind === "helper" ? "pin-helper" : "pin-match"}`;
  el.textContent = post.kind === "helper" ? "助っ人" : "トレマ";
  el.setAttribute("aria-label", `${post.team.name} ${post.venue.name}`);
  return el;
}

/** 地名を日本語優先にする。OpenMapTiles は name:ja を持っている */
function applyJapaneseLabels(m: maplibregl.Map) {
  for (const layer of m.getStyle().layers ?? []) {
    if (layer.type !== "symbol") continue;
    const field = m.getLayoutProperty(layer.id, "text-field");
    if (!field) continue;
    m.setLayoutProperty(layer.id, "text-field", [
      "coalesce", ["get", "name:ja"], ["get", "name"],
    ]);
  }
}

export default function SearchMap({
  posts, activeId, onSelect, origin = null, radiusKm = 0, onLocate,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marks = useRef<Map<string, maplibregl.Marker>>(new Map());
  const originMark = useRef<maplibregl.Marker | null>(null);
  const styleReady = useRef(false);
  const onLocateRef = useRef(onLocate);
  useEffect(() => { onLocateRef.current = onLocate; }, [onLocate]);
  // 掃引の中心（画面上の座標）。現在地があればそこ、無ければ画面の中心
  const radar = useRef<HTMLDivElement>(null);
  const originRef = useRef<LatLng | null>(origin);
  useEffect(() => { originRef.current = origin; }, [origin]);
  // 隅の計器に出す値
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: MAP_DEFAULT.center.lat, lng: MAP_DEFAULT.center.lng, zoom: MAP_DEFAULT.zoom,
  });

  // 地図はいちど作ったら使い回す
  useEffect(() => {
    if (!holder.current || map.current) return;
    const m = new maplibregl.Map({
      container: holder.current,
      style: STYLE,
      center: [MAP_DEFAULT.center.lng, MAP_DEFAULT.center.lat],
      zoom: MAP_DEFAULT.zoom,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    // 現在地。押したときだけ位置情報を使う。取れた位置は距離の絞り込みにも使う
    const geo = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: false },
      showUserLocation: false, // 現在地は自前のマーカーで描く
    });
    geo.on("geolocate", (e) => {
      onLocateRef.current?.({ lat: e.coords.latitude, lng: e.coords.longitude });
    });
    m.addControl(geo, "top-right");
    // 掃引の中心を地図の動きに合わせる
    const placeRadar = () => {
      const el = radar.current;
      if (!el) return;
      const o = originRef.current;
      if (o) {
        const p = m.project([o.lng, o.lat]);
        el.style.setProperty("--cx", `${p.x}px`);
        el.style.setProperty("--cy", `${p.y}px`);
      } else {
        el.style.setProperty("--cx", "50%");
        el.style.setProperty("--cy", "50%");
      }
      const c = m.getCenter();
      setCenter({ lat: c.lat, lng: c.lng, zoom: m.getZoom() });
    };
    m.on("move", placeRadar);
    m.on("resize", placeRadar);
    m.on("load", () => {
      applyJapaneseLabels(m);
      placeRadar();
      // 距離の円。中身は後から差し替える
      m.addSource(RADIUS_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "radius-fill", type: "fill", source: RADIUS_SRC,
        paint: { "fill-color": "#5df08a", "fill-opacity": 0.06 },
      });
      m.addLayer({
        id: "radius-line", type: "line", source: RADIUS_SRC,
        paint: { "line-color": "#5df08a", "line-width": 1.5, "line-dasharray": [3, 3] },
      });
      styleReady.current = true;
    });
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // 募集が変わったらピンを置き直し、表示範囲を合わせる
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    marks.current.forEach((mk) => mk.remove());
    marks.current.clear();

    posts.forEach((p) => {
      const mk = new maplibregl.Marker({ element: pin(p, false), anchor: "bottom", offset: [0, -6] })
        .setLngLat([p.venue.lng, p.venue.lat])
        .addTo(m);
      mk.getElement().addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        onSelect(p.id);
      });
      marks.current.set(p.id, mk);
    });

    if (posts.length === 0) return;
    const b = new maplibregl.LngLatBounds();
    posts.forEach((p) => b.extend([p.venue.lng, p.venue.lat]));
    m.resize();
    m.fitBounds(b, { padding: { top: 56, bottom: 40, left: 48, right: 48 }, maxZoom: 12, duration: 600 });
  }, [posts, onSelect]);

  // 現在地の点と、半径の円
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    originMark.current?.remove();
    originMark.current = null;
    if (origin) {
      const el = document.createElement("div");
      el.className = "me";
      el.setAttribute("aria-label", "現在地");
      originMark.current = new maplibregl.Marker({ element: el })
        .setLngLat([origin.lng, origin.lat])
        .addTo(m);
    }

    const draw = () => {
      const src = m.getSource(RADIUS_SRC) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(
        origin && radiusKm
          ? { type: "FeatureCollection", features: [circlePolygon(origin, radiusKm)] }
          : { type: "FeatureCollection", features: [] },
      );
      if (origin && radiusKm) {
        // 円が丸ごと見える範囲に寄せる
        const ring = circlePolygon(origin, radiusKm).geometry.coordinates[0];
        const b = new maplibregl.LngLatBounds();
        ring.forEach((c) => b.extend(c));
        m.fitBounds(b, { padding: 32, duration: 600 });
      }
    };
    // 初期化の load ハンドラ（ソース追加）が先に登録されているので、この once はその後に走る
    if (styleReady.current) draw();
    else m.once("load", draw);
    // 掃引の中心を現在地へ
    m.fire("move");
  }, [origin, radiusKm]);

  // 選択が変わったらピンの見た目だけ差し替え、会場が画面外なら寄せる
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marks.current.forEach((mk, id) => {
      const p = posts.find((x) => x.id === id);
      if (!p) return;
      const active = id === activeId;
      mk.getElement().className =
        `pin ${active ? "pin-active" : p.kind === "helper" ? "pin-helper" : "pin-match"}`;
    });
    const p = posts.find((x) => x.id === activeId);
    if (!p) return;
    const target = new maplibregl.LngLat(p.venue.lng, p.venue.lat);
    if (!m.getBounds().contains(target)) {
      m.easeTo({ center: target, duration: 500 });
    }
  }, [activeId, posts]);

  const helpers = posts.filter((p) => p.kind === "helper").length;
  return (
    <div className="relative h-full w-full" aria-label="募集の会場地図">
      <div ref={holder} className="h-full w-full" />
      {/* レーダーの飾り。すべて pointer-events: none */}
      <div ref={radar} className="radar radar-frame" aria-hidden>
        <div className="radar-vignette" />
        <div className="radar-cross" />
        <div className="radar-rings"><i /><i /><i /><i /></div>
        <div className="radar-sweep" />
        <i className="tl" /><i className="br" />
      </div>
      {/* 隅の計器。件数と中心座標 */}
      <div className="readout left-2 top-2 hidden sm:block" aria-hidden>
        <span className="blink" style={{ width: 6, height: 6, marginRight: 6, verticalAlign: "middle" }} />
        scan <b>{posts.length.toString().padStart(2, "0")}</b> targets
        <span className="ml-2">trm <b>{(posts.length - helpers).toString().padStart(2, "0")}</b></span>
        <span className="ml-2">hlp <b>{helpers.toString().padStart(2, "0")}</b></span>
        {radiusKm > 0 && <span className="ml-2">rng <b>{radiusKm}km</b></span>}
        <br />
        <b>{center.lat.toFixed(4)}N {center.lng.toFixed(4)}E</b> z{center.zoom.toFixed(1)}
      </div>
    </div>
  );
}
