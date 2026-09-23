import { createHash, randomBytes } from 'node:crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export class RateLimiter {
  private readonly requests = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number = Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
    private readonly maxRequests: number = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? '60'),
  ) {}

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const bucket = this.requests.get(identifier) ?? [];
    const active = bucket.filter((timestamp) => now - timestamp < this.windowMs);

    if (active.length >= this.maxRequests) {
      const oldest = active[0];
      const retryAfterMs = Math.max(0, this.windowMs - (now - oldest));
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldest + this.windowMs,
        retryAfterMs,
      };
    }

    active.push(now);
    this.requests.set(identifier, active);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - active.length),
      resetAt: now + this.windowMs,
      retryAfterMs: 0,
    };
  }

  hashIdentifier(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

export const rateLimiter = new RateLimiter();

export function createRateLimiter(windowMs?: number, maxRequests?: number): RateLimiter {
  return new RateLimiter(windowMs, maxRequests);
}
