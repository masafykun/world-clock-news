interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// サーバーサイドのインメモリキャッシュ（プロセスメモリ）
const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = Number(process.env.NEWS_CACHE_TTL_MS ?? 3_600_000);

export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  store.set(key, { data, expiresAt: Date.now() + ttl });
}

export function invalidateCache(key: string): void {
  store.delete(key);
}
