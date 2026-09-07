"use client";

import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { MAP_DEFAULT } from "@/config/site";
import type { Post } from "@/types";
import { useEffect } from "react";

/** 地図の表示範囲を、出ている募集に合わせる */
function FitBounds({ posts }: { posts: Post[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || posts.length === 0) return;
    const b = new google.maps.LatLngBounds();
    posts.forEach((p) => b.extend({ lat: p.venue.lat, lng: p.venue.lng }));
    map.fitBounds(b, 64);
  }, [map, posts]);
  return null;
}

/** 選ばれた募集の会場へ寄せる */
function PanTo({ post }: { post: Post | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !post) return;
    map.panTo({ lat: post.venue.lat, lng: post.venue.lng });
  }, [map, post]);
  return null;
}

type Props = {
  posts: Post[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function SearchMap({ posts, activeId, onSelect }: Props) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // キーが無くても画面が壊れないようにする
  if (!key) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-6">
        {/* 地図の代わりに、ピッチの白線だけを引いておく */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <rect x="6%" y="8%" width="88%" height="84%" fill="none" stroke="var(--chalk-08)" />
          <line x1="50%" y1="8%" x2="50%" y2="92%" stroke="var(--chalk-08)" />
          <circle cx="50%" cy="50%" r="52" fill="none" stroke="var(--chalk-08)" />
        </svg>
        <p className="sign relative text-[10px]" style={{ color: "var(--flood)" }}>MAP OFFLINE</p>
        <p className="relative max-w-xs text-center text-[11px] leading-relaxed" style={{ color: "var(--chalk-sub)" }}>
          地図の鍵が未設定です。会場を一覧で表示しています。
        </p>
        <ul className="relative w-full max-w-sm">
          {posts.map((p, i) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors"
                style={{
                  borderTop: i ? "1px solid var(--chalk-08)" : "1px solid var(--chalk-16)",
                  borderBottom: i === posts.length - 1 ? "1px solid var(--chalk-16)" : "none",
                  background: activeId === p.id ? "var(--night-3)" : "transparent",
                  color: activeId === p.id ? "var(--chalk)" : "var(--chalk-60)",
                }}
              >
                <span className="sign text-[9px]"
                      style={{ color: p.kind === "helper" ? "var(--cone)" : "var(--turf)" }}>
                  {p.kind === "helper" ? "H" : "TM"}
                </span>
                {p.venue.name}
                <span className="ml-auto" style={{ color: "var(--chalk-sub)" }}>{p.venue.city}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const active = posts.find((p) => p.id === activeId) ?? null;

  return (
    <APIProvider apiKey={key}>
      <Map
        mapId="pitchmate"
        defaultCenter={MAP_DEFAULT.center}
        defaultZoom={MAP_DEFAULT.zoom}
        colorScheme="DARK"
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        className="h-full w-full"
      >
        <FitBounds posts={posts} />
        <PanTo post={active} />
        {posts.map((p) => (
          <AdvancedMarker
            key={p.id}
            position={{ lat: p.venue.lat, lng: p.venue.lng }}
            onClick={() => onSelect(p.id)}
            zIndex={activeId === p.id ? 10 : 1}
          >
            <span
              className="sign px-2 py-1 text-[10px]"
              style={{
                background: activeId === p.id ? "var(--flood)" : "var(--night-2)",
                color: activeId === p.id ? "var(--night)"
                  : p.kind === "helper" ? "var(--cone)" : "var(--chalk)",
                border: `1px solid ${activeId === p.id ? "var(--flood)"
                  : p.kind === "helper" ? "var(--cone)" : "var(--chalk-38)"}`,
                boxShadow: activeId === p.id ? "0 0 22px rgba(231,209,94,.5)" : "none",
                transform: activeId === p.id ? "scale(1.08)" : "none",
                display: "block",
              }}
            >
              {p.kind === "helper" ? "助っ人" : "TM"}
            </span>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
