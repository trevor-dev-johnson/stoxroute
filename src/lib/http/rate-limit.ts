type Entry = { count: number; resetAt: number };

const quoteRequests = new Map<string, Entry>();
const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 12;

function requestKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

export function checkQuoteRateLimit(request: Request, now = Date.now()): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const key = requestKey(request);
  const existing = quoteRequests.get(key);
  const entry = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : existing;
  entry.count += 1;
  quoteRequests.set(key, entry);

  if (quoteRequests.size > 1_000) {
    for (const [storedKey, stored] of quoteRequests) if (stored.resetAt <= now) quoteRequests.delete(storedKey);
  }

  return {
    allowed: entry.count <= REQUESTS_PER_WINDOW,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
    remaining: Math.max(0, REQUESTS_PER_WINDOW - entry.count),
  };
}

export function clearQuoteRateLimitForTests(): void { quoteRequests.clear(); }
