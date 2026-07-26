import type { NewsItem } from "./news/types";

export interface BubbleItem extends NewsItem {
  x: number;
  y: number;
  size: number;
  delay: number;
}

/** バブル同士の最低すき間 */
const GAP = 14;
/** 画面端との最低すき間 */
const EDGE = 12;
/** バブル下に出る都市ラベルの高さ（下端で切れないよう余分に確保） */
const LABEL = 26;
/** 位置を収束させる反復回数 */
const ITERATIONS = 80;

const clamp = (v: number, lo: number, hi: number) =>
  hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));

/**
 * 時計の占有帯を求める。
 * 時計は `top-1/2` に `-translate-y-1/2` で全幅表示され、
 * フォントは `text-[13vw]`〜`text-9xl(128px)`、上下に py-3/py-4 の余白がある。
 */
function clockBand(width: number, height: number) {
  const font = Math.min(128, width * 0.13);
  return {
    cy: height * 0.5,
    half: font * 0.62 + 28,
  };
}

export function buildBubbleLayout(
  items: NewsItem[],
  width: number,
  height: number
): BubbleItem[] {
  if (!items.length || width <= 0 || height <= 0) return [];

  const cx = width / 2;
  const cy = height / 2;
  const count = items.length;
  const minDim = Math.min(width, height);
  const band = clockBand(width, height);

  // ── 1) 初期配置：従来どおりリング状に並べる（決定的＝SSRと一致する） ──
  const nodes = items.map((item, index) => {
    const ring = index % 3;
    const baseAngle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const jitter = Math.sin(index * 2.17) * 0.22;
    const angle = baseAngle + jitter;
    const radius = minDim * (0.28 + ring * 0.1 + (index % 2) * 0.035);
    // 件数を絞っているぶん1つを大きく見せる（少ないほど大きい）。
    // 画面が小さいときは短辺に対する比率で頭打ちにする。
    const scale = count <= 8 ? 1.55 : count <= 12 ? 1.2 : 1;
    const size = Math.min(
      (76 + ((index * 19) % 52)) * scale,
      minDim * 0.28
    );
    return {
      item,
      index,
      size,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  // ── 2) 反復緩和：重なり・時計帯・画面外を解消する ──
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // 2-a) バブル同士の重なりを押し離す
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        const need = (a.size + b.size) / 2 + GAP;
        if (dist >= need) continue;
        // 完全に重なっている場合は決定的な向きへ散らす
        if (dist < 0.01) {
          dx = Math.cos(i * 1.7 + j);
          dy = Math.sin(i * 1.7 + j);
          dist = 1;
        }
        const push = (need - dist) / 2;
        const ux = (dx / dist) * push;
        const uy = (dy / dist) * push;
        a.x -= ux;
        a.y -= uy;
        b.x += ux;
        b.y += uy;
      }
    }

    // 2-b) 時計の帯から追い出す（上下のうち余裕がある側へ）
    for (const n of nodes) {
      const keepOut = band.half + n.size / 2;
      const diff = n.y - band.cy;
      if (Math.abs(diff) >= keepOut) continue;
      const up = band.cy - keepOut;
      const down = band.cy + keepOut;
      const canUp = up - n.size / 2 - EDGE >= 0;
      const canDown = down + n.size / 2 + LABEL <= height;
      if (canUp && canDown) {
        n.y = diff < 0 ? up : down;
      } else if (canUp) {
        n.y = up;
      } else if (canDown) {
        n.y = down;
      }
    }

    // 2-c) 画面内へ収める（はみ出しは常にここで断ち切る）
    for (const n of nodes) {
      const r = n.size / 2;
      n.x = clamp(n.x, r + EDGE, width - r - EDGE);
      n.y = clamp(n.y, r + EDGE, height - r - LABEL);
    }
  }

  return nodes.map((n) => ({
    ...n.item,
    x: n.x,
    y: n.y,
    size: n.size,
    delay: n.index * 0.045,
  }));
}

export function rotateNewsByHour(items: NewsItem[], hour: number): NewsItem[] {
  if (!items.length) return [];
  const shift = hour % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}
