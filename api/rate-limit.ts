import type { MiddlewareHandler } from 'hono';

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimit(opts: { windowMs: number; max: number }): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();

  return async (c, next) => {
    const now = Date.now();
    const key = c.req.header('x-real-ip') ?? 'unknown';

    // lazy prune so the map cannot grow unbounded
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (bucket.count >= opts.max) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    bucket.count++;
    return next();
  };
}
