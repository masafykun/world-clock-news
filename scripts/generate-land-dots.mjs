// 陸地ドット座標の事前生成スクリプト
//
// world-atlas の land-110m を緯度経度グリッド（GRID_STEP_DEG 間隔、
// 高緯度は経度間隔を cos(lat) で補正して球面上の密度を均一化）で
// geoContains サンプリングし、陸地に落ちた点だけを
// src/lib/landDots.json に書き出す。
//
// 実行時サンプリングだと初期化に約2秒かかりハイドレーションを
// ブロックするため、ビルド前に一度だけ生成して同梱する。
//
// 再生成: node scripts/generate-land-dots.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { geoContains, geoBounds } from "d3-geo";
import { feature } from "topojson-client";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const topology = require("world-atlas/land-110m.json");

const GRID_STEP_DEG = 1.7;
const DEG = Math.PI / 180;

const land = feature(topology, topology.objects.land);
const geometries =
  land.type === "FeatureCollection"
    ? land.features.map((f) => f.geometry)
    : [land.geometry];
const polygons = geometries.flatMap((g) =>
  g.type === "MultiPolygon" ? g.coordinates : g.type === "Polygon" ? [g.coordinates] : []
);

// ポリゴン単位のバウンディングボックスで geoContains の呼び出しを絞る
const parts = polygons.map((coordinates) => {
  const f = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } };
  return { feature: f, bounds: geoBounds(f) };
});

function contains(lon, lat) {
  for (const { feature: f, bounds } of parts) {
    const [[minLon, minLat], [maxLon, maxLat]] = bounds;
    if (lat < minLat || lat > maxLat) continue;
    // 経度は反対子午線をまたぐ場合 minLon > maxLon になる
    const inLon =
      minLon <= maxLon ? lon >= minLon && lon <= maxLon : lon >= minLon || lon <= maxLon;
    if (!inLon) continue;
    if (geoContains(f, [lon, lat])) return true;
  }
  return false;
}

// [lon*10, lat*10] を整数化したフラット配列（サイズ削減のため）
const flat = [];
for (let lat = -90 + GRID_STEP_DEG / 2; lat < 90; lat += GRID_STEP_DEG) {
  const lonCount = Math.max(1, Math.round((360 / GRID_STEP_DEG) * Math.cos(lat * DEG)));
  const lonStep = 360 / lonCount;
  for (let i = 0; i < lonCount; i++) {
    const lon = -180 + (i + 0.5) * lonStep;
    if (!contains(lon, lat)) continue;
    flat.push(Math.round(lon * 10), Math.round(lat * 10));
  }
}

const outPath = fileURLToPath(new URL("../src/lib/landDots.json", import.meta.url));
writeFileSync(outPath, JSON.stringify(flat));
console.log(`generated ${flat.length / 2} land dots -> ${outPath}`);
