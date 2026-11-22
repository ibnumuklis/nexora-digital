/**
 * In-process sliding-window limiter (first line of defence per server instance).
 * The authoritative limits live in Postgres (private.hit_rate_limit) so they hold across
 * serverless instances and against direct API callers. Replace/augment with Redis if needed.
 */
type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > now - windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now) / 1000)) };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (!b.hits.some((t) => t > now - windowMs)) buckets.delete(k);
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function _resetRateLimits() {
  buckets.clear();
}
