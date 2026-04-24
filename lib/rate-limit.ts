type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type Bucket = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, Bucket>();
let operations = 0;

function cleanupExpiredBuckets(now: number, windowMs: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStartedAt > windowMs * 2) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now - current.windowStartedAt >= config.windowMs) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - current.windowStartedAt);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;

  operations += 1;
  if (operations % 200 === 0) {
    cleanupExpiredBuckets(now, config.windowMs);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
