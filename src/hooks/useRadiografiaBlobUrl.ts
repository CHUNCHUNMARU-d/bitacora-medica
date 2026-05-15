import { useEffect, useState } from "react";
import { fetchRadiografiaBytes } from "@/lib/radiografias";

interface CacheEntry {
  url: string;
  refs: number;
  lastUsed: number;
}

const CACHE_LIMIT = 20;
const cache = new Map<string, CacheEntry>();

function cacheKey(id: number, mimeType: string): string {
  return `${id}:${mimeType}`;
}

function evictIfNeeded(): void {
  if (cache.size <= CACHE_LIMIT) return;
  const idle = [...cache.entries()].filter(([, e]) => e.refs === 0);
  idle.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
  const toEvict = idle.slice(0, cache.size - CACHE_LIMIT);
  for (const [key, entry] of toEvict) {
    URL.revokeObjectURL(entry.url);
    cache.delete(key);
  }
}

export function useRadiografiaBlobUrl(
  id: number,
  mimeType: string,
): { url: string | null; loading: boolean; error: string | null } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = cacheKey(id, mimeType);
    const controller = new AbortController();
    let released = false;

    const release = () => {
      if (released) return;
      released = true;
      const entry = cache.get(key);
      if (!entry) return;
      entry.refs = Math.max(0, entry.refs - 1);
      entry.lastUsed = Date.now();
      evictIfNeeded();
    };

    const cached = cache.get(key);
    if (cached) {
      cached.refs += 1;
      cached.lastUsed = Date.now();
      setUrl(cached.url);
      setLoading(false);
      return () => release();
    }

    setLoading(true);
    setError(null);
    setUrl(null);
    void (async () => {
      try {
        const bytes = await fetchRadiografiaBytes(id, controller.signal);
        if (controller.signal.aborted) return;
        const blob = new Blob([bytes], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        const existing = cache.get(key);
        if (existing) {
          URL.revokeObjectURL(objectUrl);
          existing.refs += 1;
          existing.lastUsed = Date.now();
          setUrl(existing.url);
        } else {
          cache.set(key, { url: objectUrl, refs: 1, lastUsed: Date.now() });
          setUrl(objectUrl);
          evictIfNeeded();
        }
        setLoading(false);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(String(e));
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      release();
    };
  }, [id, mimeType]);

  return { url, loading, error };
}
