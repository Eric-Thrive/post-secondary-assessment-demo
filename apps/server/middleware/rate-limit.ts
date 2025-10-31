import type { Request, Response, NextFunction } from "express";

/**
 * Rate limit entry structure
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limit storage
 * In production, consider using Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration options
 */
interface RateLimitOptions {
  /** Maximum number of requests allowed in the time window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key generator function to identify unique clients */
  keyGenerator?: (req: Request) => string;
  /** Custom error message */
  message?: string;
}

/**
 * Clear rate limit store (for testing purposes)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit store (for testing purposes)
 */
export function getRateLimitStore(): Map<string, RateLimitEntry> {
  return rateLimitStore;
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Email-based key generator for endpoints that use email in request body
 */
export function emailKeyGenerator(req: Request): string {
  const email = req.body?.email;
  return email ? `email:${email}` : defaultKeyGenerator(req);
}

/**
 * Rate limiting middleware factory
 *
 * @param options Rate limit configuration
 * @returns Express middleware function
 *
 * @example
 * // IP-based rate limiting (5 requests per hour)
 * app.post('/api/auth/register', rateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }), handler);
 *
 * @example
 * // Email-based rate limiting (3 requests per hour)
 * app.post('/api/auth/resend', rateLimit({
 *   limit: 3,
 *   windowMs: 60 * 60 * 1000,
 *   keyGenerator: emailKeyGenerator
 * }), handler);
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    limit,
    windowMs,
    keyGenerator = defaultKeyGenerator,
    message = "Rate limit exceeded. Please try again later.",
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyGenerator(req);
    const key = `${req.path}:${identifier}`;
    const now = Date.now();

    // Clean up expired entries periodically
    for (const [k, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(k);
      }
    }

    const entry = rateLimitStore.get(key);

    // No entry or expired entry - create new one
    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", (limit - 1).toString());
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(now + windowMs).toISOString()
      );

      return next();
    }

    // Rate limit exceeded
    if (entry.count >= limit) {
      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(entry.resetTime).toISOString()
      );

      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds.toString());

      return res.status(429).json({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
        message,
        retryAfter: retryAfterSeconds,
        resetTime: new Date(entry.resetTime).toISOString(),
      });
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", (limit - entry.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetTime).toISOString());

    next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** Registration endpoint: 5 requests per hour per IP */
  registration: rateLimit({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: "Too many registration attempts. Please try again in an hour.",
  }),

  /** Resend verification: 3 requests per hour per email */
  resendVerification: rateLimit({
    limit: 3,
    windowMs: 60 * 60 * 1000,
    keyGenerator: emailKeyGenerator,
    message:
      "Too many verification email requests. Please try again in an hour.",
  }),

  /** Support requests: 10 requests per hour per IP */
  support: rateLimit({
    limit: 10,
    windowMs: 60 * 60 * 1000,
    message: "Too many support requests. Please try again in an hour.",
  }),

  /** Sales inquiries: 10 requests per hour per IP */
  sales: rateLimit({
    limit: 10,
    windowMs: 60 * 60 * 1000,
    message: "Too many sales inquiries. Please try again in an hour.",
  }),
};
