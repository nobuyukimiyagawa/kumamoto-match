"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_DEFAULT } from "@/config/site";
import type { Post } from "@/types";

/** OpenFreeMap の暗色スタイル。鍵も登録も要らず、費用もかからない。 */
const STYLE = "https://tiles.openfreemap.org/styles/dark";

/**
 * Worker の場所を明示する。
 * Turbopack は import.meta.url を file:// にするため、MapLibre 任せだと Worker の URL が
 * 空になり、タイルが永遠に読み込み中のまま地図が真っ黒になる。
 * 実体は scripts/copy-maplibre-worker.mjs が public/maplibre/ へ複製する。
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
maplibregl.setWorkerUrl(`${BASE}/maplibre/maplibre-gl-worker.mjs`);

type Props = {
  posts: Post[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

/** 募集のピン。見た目はカードの種別バッジとそろえる */
function pin(post: Post, active: boolean) {
  const el = document.createElement("span");
  el.className = "sign px-2 py-1 text-[10px]";
  el.textContent = post.kind === "helper" ? "助っ人" : "TM";
  Object.assign(el.style, {
    display: "block",
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: active ? "var(--flood)" : "var(--night-2)",
    color: active ? "var(--night)"
      : post.kind === "helper" ? "var(--cone)" : "var(--chalk)",
    border: `1px solid ${active ? "var(--flood)"
      : post.kind === "helper" ? "var(--cone)" : "var(--chalk-38)"}`,
    boxShadow: active ? "0 0 22px rgba(231,209,94,.5)" : "none",
    transform: active ? "scale(1.08)" : "none",
    transition: "transform .2s, box-shadow .2s",
  } as CSSStyleDeclaration);
  return el;
}

export default function SearchMap({ posts, activeId, onSelect }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marks = useRef<Map<string, maplibregl.Marker>>(new Map());
  const ready = useRef(false);

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
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    m.on("load", () => { ready.current = true; });
    map.current = m;
    return () => { m.remove(); map.current = null; ready.current = false; };
  }, []);

  // 募集が変わったらピンを置き直し、表示範囲を合わせる
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    marks.current.forEach((mk) => mk.remove());
    marks.current.clear();

    posts.forEach((p) => {
      const mk = new maplibregl.Marker({ element: pin(p, p.id === activeId) })
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
    m.fitBounds(b, { padding: 72, maxZoom: 13, duration: 600 });
  }, [posts, activeId, onSelect]);

  // 選ばれた募集の会場へ寄せる
  useEffect(() => {
    const m = map.current;
    const p = posts.find((x) => x.id === activeId);
    if (!m || !p) return;
    m.easeTo({ center: [p.venue.lng, p.venue.lat], duration: 600 });
  }, [activeId, posts]);

  return <div ref={holder} className="h-full w-full" />;
}
