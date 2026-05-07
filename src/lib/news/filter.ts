import type { NewsItem } from "./types";

const DEFAULT_BLOCKED_KEYWORDS = [
  "massacre",
  "beheading",
  "graphic",
  "explicit",
  "pornograph",
];

function getBlockedKeywords(): string[] {
  const env = process.env.FILTER_KEYWORDS;
  if (!env) return DEFAULT_BLOCKED_KEYWORDS;
  return [
    ...DEFAULT_BLOCKED_KEYWORDS,
    ...env.split(",").map((k) => k.trim().toLowerCase()),
  ];
}

function isBlocked(item: NewsItem, blocked: string[]): boolean {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return blocked.some((kw) => text.includes(kw));
}

export function filterNews(items: NewsItem[]): NewsItem[] {
  const blocked = getBlockedKeywords();
  const seen = new Set<string>();

  return items.filter((item) => {
    if (isBlocked(item, blocked)) return false;

    // タイトルで重複除去
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}
