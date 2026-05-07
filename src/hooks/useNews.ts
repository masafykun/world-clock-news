"use client";

import { useState, useEffect, useCallback } from "react";
import type { NewsItem, NewsApiResponse } from "@/lib/news/types";
import { sampleNews } from "@/lib/news/sampleNews";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1時間

interface UseNewsReturn {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  source: NewsApiResponse["source"] | null;
  refresh: () => void;
}

export function useNews(): UseNewsReturn {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<NewsApiResponse["source"] | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsApiResponse = await res.json();
      setItems(data.items);
      setSource(data.source);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "取得エラー";
      setError(msg);
      setItems(sampleNews);
      setSource("sample");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNews]);

  return { items, loading, error, source, refresh: fetchNews };
}
