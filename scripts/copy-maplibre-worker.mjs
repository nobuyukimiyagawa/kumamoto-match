// MapLibre の Worker を public/ へ複製する。npm run build / dev の前に自動で走る。
//
// なぜ要るか:
//   Turbopack は import.meta.url を file:///ROOT/... に置き換える。
//   MapLibre は import.meta.url が http(s) でないと Worker の URL を空文字にし、
//   Worker が黙って死ぬ（タイルが永遠に loading のまま、地図が真っ黒）。
//   そこで Worker 本体と、その相対 import 先 (shared) を同じ場所に置き、
//   SearchMap.tsx から setWorkerUrl で明示する。
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/maplibre-gl/dist");
const dst = join(root, "public/maplibre");

mkdirSync(dst, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(src, f), join(dst, f));
}
console.log("maplibre worker を public/maplibre/ へ複製しました");
