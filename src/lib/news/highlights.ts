import type { NewsItem, NewsCategory } from "./types";

/**
 * カテゴリごとの「インパクト」重み。
 * 世界の動きとして目を引くもの（政治・科学・環境・健康など）を上位に、
 * 日常寄りの話題（食・芸術・スポーツなど）を下位に置く。
 */
const IMPACT: Record<NewsCategory, number> = {
  Politics: 100,
  Science: 95,
  Environment: 92,
  Health: 90,
  Technology: 85,
  Business: 80,
  Nature: 74,
  Ocean: 70,
  Weather: 66,
  Education: 60,
  Transport: 56,
  History: 50,
  Culture: 46,
  Media: 42,
  Sports: 38,
  Art: 34,
  Food: 30,
  Other: 20,
};

/** 表示するバブルの数（インパクト重視で絞り込む） */
export const HIGHLIGHT_COUNT = 6;

/**
 * ニュースを「インパクトのある数件」に絞る。
 *
 * - カテゴリ重みで並べ替え、上位 `count` 件を採用する
 * - 同点は `hour` を混ぜた決定的な値で崩すので、時間帯ごとに顔ぶれが変わる
 * - 同じ都市が重複しないようにする
 * - 乱数を使わないため SSR と CSR で結果が一致する（hydration不一致を避ける）
 */
export function pickHighlights(
  items: NewsItem[],
  hour: number,
  count: number = HIGHLIGHT_COUNT
): NewsItem[] {
  if (items.length <= count) return items;

  const scored = items.map((item, index) => {
    const base = IMPACT[item.category] ?? IMPACT.Other;
    // 0〜9 の決定的なゆらぎ。時間ごとに並びが変わり、同カテゴリでも固定化しない。
    const rotation = (index * 7 + hour * 13) % 10;
    return { item, index, score: base + rotation };
  });

  scored.sort((a, b) => (b.score - a.score) || (a.index - b.index));

  const picked: NewsItem[] = [];
  const seenCities = new Set<string>();
  for (const s of scored) {
    if (seenCities.has(s.item.city)) continue;
    seenCities.add(s.item.city);
    picked.push(s.item);
    if (picked.length >= count) break;
  }
  // 都市重複で足りなくなった場合はスコア順で補充する
  if (picked.length < count) {
    for (const s of scored) {
      if (picked.includes(s.item)) continue;
      picked.push(s.item);
      if (picked.length >= count) break;
    }
  }
  return picked;
}
