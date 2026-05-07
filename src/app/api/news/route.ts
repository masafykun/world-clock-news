/**
 * GET /api/news
 *
 * ニュース取得APIルート。
 *
 * 優先順位:
 *   1. インメモリキャッシュが有効ならキャッシュを返す
 *   2. NEWS_API_KEY があれば NewsAPI を試みる
 *   3. GUARDIAN_API_KEY があれば Guardian API を試みる（"test" も可）
 *   4. NYT_API_KEY があれば New York Times API を試みる
 *   5. すべて失敗したらサンプルデータを返す
 *   6. OPENAI_API_KEY があれば、取得したニュースを日本語に翻訳・要約する
 *
 * 新しいAPIを追加するには:
 *   - src/lib/news/fetcher.ts に fetchFrom<Name> 関数を追加
 *   - 以下の INTEGRATION POINT コメント付近で呼び出す
 */

import { NextResponse } from "next/server";
import type { NewsApiResponse, NewsItem } from "@/lib/news/types";
import { sampleNews } from "@/lib/news/sampleNews";
import { filterNews } from "@/lib/news/filter";
import { getCache, setCache } from "@/lib/news/cache";
import {
  fetchFromNewsApi,
  fetchFromGuardian,
  fetchFromNyt,
} from "@/lib/news/fetcher";
import { translateToJapanese } from "@/lib/news/summarizer";

const CACHE_KEY = "news_v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  // キャッシュヒット（force=1 の場合はスキップして強制再取得）
  if (!force) {
    const cached = getCache<NewsApiResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ ...cached, source: "cache" });
    }
  }

  let items: NewsItem[] = [];
  let source: NewsApiResponse["source"] = "sample";

  // ============================================================
  // INTEGRATION POINT 1: NewsAPI
  // ============================================================
  const newsApiKey = process.env.NEWS_API_KEY;
  if (!items.length && newsApiKey) {
    try {
      items = await fetchFromNewsApi(newsApiKey);
      source = "api";
      console.log(`[news] NewsAPI: ${items.length}件取得`);
    } catch (err) {
      console.warn("[news] NewsAPI 失敗:", err);
    }
  }

  // ============================================================
  // INTEGRATION POINT 2: Guardian API
  // ============================================================
  const guardianKey = process.env.GUARDIAN_API_KEY ?? "test";
  if (!items.length) {
    try {
      items = await fetchFromGuardian(guardianKey);
      source = "api";
      console.log(`[news] Guardian API: ${items.length}件取得`);
    } catch (err) {
      console.warn("[news] Guardian API 失敗:", err);
    }
  }

  // ============================================================
  // INTEGRATION POINT 3: New York Times API
  // ============================================================
  const nytKey = process.env.NYT_API_KEY;
  if (!items.length && nytKey) {
    try {
      items = await fetchFromNyt(nytKey);
      source = "api";
      console.log(`[news] NYT API: ${items.length}件取得`);
    } catch (err) {
      console.warn("[news] NYT API 失敗:", err);
    }
  }

  // フォールバック: サンプルデータ
  if (!items.length) {
    console.log("[news] サンプルデータを使用");
    items = sampleNews;
    source = "sample";
  }

  // フィルタリング・重複除去
  const filtered = filterNews(items);

  // ============================================================
  // INTEGRATION POINT 4: OpenAI 日本語翻訳・要約
  // OPENAI_API_KEY が設定されている場合のみ実行。
  // サンプルデータは既に日本語のためスキップ。
  // ============================================================
  const openAiKey = process.env.OPENAI_API_KEY;
  let translatedItems = filtered;

  if (openAiKey && source !== "sample") {
    try {
      const map = await translateToJapanese(filtered, openAiKey);
      translatedItems = filtered.map((item) => {
        const translated = map.get(item.id);
        if (!translated) return item;
        return { ...item, title: translated.title, summary: translated.summary };
      });
      console.log(`[news] OpenAI 翻訳: ${map.size}件`);
    } catch (err) {
      console.warn("[news] OpenAI 翻訳失敗（元テキストを使用）:", err);
    }
  }

  const response: NewsApiResponse = {
    items: translatedItems,
    source,
    fetchedAt: new Date().toISOString(),
  };

  setCache(CACHE_KEY, response);
  return NextResponse.json(response);
}
