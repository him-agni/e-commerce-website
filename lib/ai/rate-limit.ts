import "server-only";

type Options = { limit: number; windowMs: number };

const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter kept in memory. It protects the shared free Gemini quota from one
 * visitor burning it. Each server instance counts separately, which is fine for a small site;
 * a deployment with many instances would need a shared store.
 */
export function checkRateLimit(key: string, { limit, windowMs }: Options) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    const retryAfterSeconds = Math.ceil((recent[0] + windowMs - now) / 1000);
    return { ok: false as const, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return { ok: true as const };
}
