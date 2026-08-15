type Bucket = { startedAt: number; count: number };

const buckets = new Map<string, Bucket>();

export function allowGuestTestCreation(key: string, now = Date.now()) {
  const windowMs = 60 * 60 * 1000;
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    return { allowed: true, remaining: 19 };
  }
  if (current.count >= 20) return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((windowMs - (now - current.startedAt)) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: Math.max(0, 20 - current.count) };
}
