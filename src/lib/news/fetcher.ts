/**
 * ニュース取得ロジック
 *
 * 優先順位:
 *   1. NewsAPI (NEWS_API_KEY が設定されている場合)
 *   2. Guardian API (GUARDIAN_API_KEY が設定されている場合。"test" でも動作)
 *   3. サンプルデータへのフォールバック
 *
 * 新しいAPIを追加するには、このファイルに fetchFrom<ApiName> 関数を追加し、
 * api/news/route.ts の INTEGRATION POINT コメント箇所で呼び出してください。
 */

import type { NewsItem, NewsCategory } from "./types";
import {
  guardianSectionToCategory,
  categoryGradients,
  categoryGlyphs,
} from "./categoryMeta";

// 都市・タイムゾーンプール（地理的バランスのために使用）
const LOCATION_POOL: Array<{
  city: string;
  country: string;
  timeZone: string;
}> = [
  { city: "ロンドン", country: "イギリス", timeZone: "Europe/London" },
  { city: "ニューヨーク", country: "アメリカ", timeZone: "America/New_York" },
  { city: "東京", country: "日本", timeZone: "Asia/Tokyo" },
  { city: "シドニー", country: "オーストラリア", timeZone: "Australia/Sydney" },
  { city: "パリ", country: "フランス", timeZone: "Europe/Paris" },
  { city: "ソウル", country: "韓国", timeZone: "Asia/Seoul" },
  { city: "ドバイ", country: "UAE", timeZone: "Asia/Dubai" },
  { city: "シンガポール", country: "シンガポール", timeZone: "Asia/Singapore" },
  { city: "ナイロビ", country: "ケニア", timeZone: "Africa/Nairobi" },
  { city: "サンパウロ", country: "ブラジル", timeZone: "America/Sao_Paulo" },
  { city: "ムンバイ", country: "インド", timeZone: "Asia/Kolkata" },
  { city: "カイロ", country: "エジプト", timeZone: "Africa/Cairo" },
  { city: "メキシコシティ", country: "メキシコ", timeZone: "America/Mexico_City" },
  { city: "バンクーバー", country: "カナダ", timeZone: "America/Vancouver" },
  { city: "ベルリン", country: "ドイツ", timeZone: "Europe/Berlin" },
  { city: "ケープタウン", country: "南アフリカ", timeZone: "Africa/Johannesburg" },
];

// ============================================================
// INTEGRATION POINT: NewsAPI
// NEWS_API_KEY を .env.local に設定すると有効になります
// ============================================================
export async function fetchFromNewsApi(apiKey: string): Promise<NewsItem[]> {
  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`);

  const data = await res.json();
  const articles: Array<{
    title?: string;
    description?: string;
    url?: string;
    urlToImage?: string;
    publishedAt?: string;
  }> = data.articles ?? [];

  return articles
    .filter((a) => a.title && a.description)
    .slice(0, 16)
    .map((a, i) => {
      const loc = LOCATION_POOL[i % LOCATION_POOL.length];
      const category: NewsCategory = "Other";
      return {
        id: `newsapi-${i}`,
        city: loc.city,
        country: loc.country,
        timeZone: loc.timeZone,
        category,
        title: a.title!,
        summary: a.description!,
        url: a.url,
        imageUrl: a.urlToImage ?? undefined,
        publishedAt: a.publishedAt,
        gradient: categoryGradients[category],
        glyph: categoryGlyphs[category],
      };
    });
}

// ============================================================
// INTEGRATION POINT: Guardian API
// GUARDIAN_API_KEY を .env.local に設定（"test" でも動作）
// ============================================================
export async function fetchFromGuardian(apiKey: string): Promise<NewsItem[]> {
  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("show-fields", "trailText,thumbnail");
  url.searchParams.set("page-size", "20");
  url.searchParams.set("order-by", "newest");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Guardian API HTTP ${res.status}`);

  const data = await res.json();
  const results: Array<{
    id: string;
    webTitle?: string;
    sectionId?: string;
    webUrl?: string;
    webPublicationDate?: string;
    fields?: { trailText?: string; thumbnail?: string };
  }> = data.response?.results ?? [];

  return results
    .filter((r) => r.webTitle && r.fields?.trailText)
    .slice(0, 16)
    .map((r, i) => {
      const loc = LOCATION_POOL[i % LOCATION_POOL.length];
      const category: NewsCategory =
        guardianSectionToCategory[r.sectionId ?? ""] ?? "Other";
      return {
        id: `guardian-${r.id.replace(/\//g, "-")}`,
        city: loc.city,
        country: loc.country,
        timeZone: loc.timeZone,
        category,
        title: r.webTitle!,
        summary: r.fields?.trailText ?? "",
        url: r.webUrl,
        imageUrl: r.fields?.thumbnail,
        publishedAt: r.webPublicationDate,
        gradient: categoryGradients[category],
        glyph: categoryGlyphs[category],
      };
    });
}

// ============================================================
// INTEGRATION POINT: New York Times API
// NYT_API_KEY を .env.local に設定すると有効になります
// ============================================================
export async function fetchFromNyt(apiKey: string): Promise<NewsItem[]> {
  const url = new URL(
    "https://api.nytimes.com/svc/topstories/v2/world.json"
  );
  url.searchParams.set("api-key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`NYT API HTTP ${res.status}`);

  const data = await res.json();
  const articles: Array<{
    title?: string;
    abstract?: string;
    url?: string;
    multimedia?: Array<{ url: string; format: string }>;
    published_date?: string;
    section?: string;
  }> = data.results ?? [];

  return articles
    .filter((a) => a.title && a.abstract)
    .slice(0, 16)
    .map((a, i) => {
      const loc = LOCATION_POOL[i % LOCATION_POOL.length];
      const category: NewsCategory = "Politics";
      const thumb = a.multimedia?.find((m) => m.format === "threeByTwoSmallAt2X");
      return {
        id: `nyt-${i}`,
        city: loc.city,
        country: loc.country,
        timeZone: loc.timeZone,
        category,
        title: a.title!,
        summary: a.abstract!,
        url: a.url,
        imageUrl: thumb?.url,
        publishedAt: a.published_date,
        gradient: categoryGradients[category],
        glyph: categoryGlyphs[category],
      };
    });
}
