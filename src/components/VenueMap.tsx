"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Venue } from "@/types";

const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
maplibregl.setWorkerUrl(`${BASE}/maplibre/maplibre-gl-worker.mjs`);

/** 会場1つだけを示す小さな地図（募集詳細用） */
export default function VenueMap({ venue }: { venue: Venue }) {
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!holder.current) return;
    const m = new maplibregl.Map({
      container: holder.current, style: STYLE,
      center: [venue.lng, venue.lat], zoom: 13,
      attributionControl: { compact: true }, interactive: false,
    });
    const el = document.createElement("div");
    el.className = "pin pin-match";
    el.textContent = venue.name;
    new maplibregl.Marker({ element: el, anchor: "bottom", offset: [0, -6] }).setLngLat([venue.lng, venue.lat]).addTo(m);
    return () => { m.remove(); };
  }, [venue]);
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
      target="_blank" rel="noreferrer"
      className="relative block h-full w-full"
      aria-label={`${venue.name} を Google マップで開く`}
    >
      <div ref={holder} className="h-full w-full" />
      <span
        className="absolute bottom-2 left-2 rounded-[8px] px-2.5 py-1 text-[12.5px] font-bold"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        Google マップで開く ↗
      </span>
    </a>
  );
}
