import type { NewsItem } from "./news/types";

export interface BubbleItem extends NewsItem {
  x: number;
  y: number;
  size: number;
  delay: number;
}

export function buildBubbleLayout(
  items: NewsItem[],
  width: number,
  height: number
): BubbleItem[] {
  if (!items.length) return [];

  const cx = width / 2;
  const cy = height / 2;
  const count = items.length;
  const minDim = Math.min(width, height);

  return items.map((item, index) => {
    const ring = index % 3;
    const baseAngle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const jitter = Math.sin(index * 2.17) * 0.22;
    const angle = baseAngle + jitter;
    const radius = minDim * (0.28 + ring * 0.1 + (index % 2) * 0.035);
    const size = 76 + ((index * 19) % 52);

    return {
      ...item,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      size,
      delay: index * 0.045,
    };
  });
}

export function rotateNewsByHour(items: NewsItem[], hour: number): NewsItem[] {
  if (!items.length) return [];
  const shift = hour % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}
