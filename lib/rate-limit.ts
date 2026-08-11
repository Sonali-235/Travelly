// Basic per-IP rate limiting to slow down abuse of paid-per-call endpoints
// (mainly the Claude API call in generate-itinerary).
//
// HONEST LIMITATION: this stores counts in memory, inside one serverless
// function instance. On Vercel, different requests can land on different
// instances, so this won't perfectly enforce a global limit — but it still
// meaningfully slows down a single bad actor hammering one instance, and
// costs nothing. If this ever becomes a real problem, swap this for a free
// Upstash Redis instance (a few lines of change, same function signature).

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}
