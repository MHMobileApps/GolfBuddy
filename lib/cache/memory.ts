const cache = new Map<string, { expiresAt: number; value: unknown }>();

export function getCached<T>(key: string): T | null {
  const found = cache.get(key);
  if (!found) return null;
  if (Date.now() > found.expiresAt) {
    cache.delete(key);
    return null;
  }
  return found.value as T;
}

export function setCached(key: string, value: unknown, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
