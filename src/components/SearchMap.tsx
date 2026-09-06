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
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
        <p className="text-sm font-bold text-slate-700">地図は準備中です</p>
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
          Google Maps のキーが未設定のため、地図の代わりに一覧を表示しています。
          <code className="mx-1 rounded bg-slate-200 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
          を設定すると地図に切り替わります。
        </p>
        <ul className="mt-2 w-full max-w-sm space-y-1 text-left">
          {posts.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className={`w-full rounded border px-3 py-2 text-left text-xs transition ${
                  activeId === p.id
                    ? "border-emerald-500 bg-emerald-50 font-bold"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                {p.venue.name}
                <span className="ml-2 text-slate-500">{p.venue.city}</span>
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
              className={`block rounded-full border-2 px-3 py-1 text-xs font-bold shadow transition ${
                activeId === p.id
                  ? "scale-110 border-emerald-600 bg-emerald-600 text-white"
                  : "border-white bg-slate-900 text-white"
              }`}
            >
              {p.kind === "helper" ? "助っ人" : "TM"}
            </span>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
