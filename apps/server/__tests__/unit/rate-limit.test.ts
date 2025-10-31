import { describe, it, expect, beforeEach } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import {
  rateLimit,
  emailKeyGenerator,
  clearRateLimitStore,
  rateLimiters,
} from "../../middleware/rate-limit";

// Mock Express request/response
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    ip: "127.0.0.1",
    path: "/test",
    body: {},
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides,
  } as Request;
}

interface MockResponse {
  headers: Record<string, string>;
  statusCode: number;
  body?: any;
  setHeader: (name: string, value: string) => MockResponse;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    setHeader: function (name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe("Rate Limiting Middleware", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  describe("rateLimit", () => {
    it("should allow requests within the limit", () => {
      const middleware = rateLimit({ limit: 5, windowMs: 60000 });
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.headers["X-RateLimit-Limit"]).toBe("5");
      expect(res.headers["X-RateLimit-Remaining"]).toBe("4");
      expect(res.headers["X-RateLimit-Reset"]).toBeDefined();
    });

    it("should block requests exceeding the limit", () => {
      const middleware = rateLimit({ limit: 3, windowMs: 60000 });
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      // Make 3 requests (at the limit)
      for (let i = 0; i < 3; i++) {
        middleware(req, res as any, next);
      }

      expect(next).toHaveBeenCalledTimes(3);

      // 4th request should be blocked
      const blockedRes = createMockResponse();
      middleware(req, blockedRes as any, next);

      expect(next).toHaveBeenCalledTimes(3); // Still 3, not called for 4th
      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body).toMatchObject({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
      });
      expect(blockedRes.headers["X-RateLimit-Remaining"]).toBe("0");
    });

    it("should include retry-after header when rate limited", () => {
      const middleware = rateLimit({ limit: 1, windowMs: 60000 });
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      // First request succeeds
      middleware(req, res as any, next);

      // Second request is blocked
      const blockedRes = createMockResponse();
      middleware(req, blockedRes as any, next);

      expect(blockedRes.headers["Retry-After"]).toBeDefined();
      expect(blockedRes.body.retryAfter).toBeGreaterThan(0);
    });

    it("should use custom key generator", () => {
      const customKeyGen = (req: Request) => `custom:${req.body.userId}`;
      const middleware = rateLimit({
        limit: 2,
        windowMs: 60000,
        keyGenerator: customKeyGen,
      });

      const req1 = createMockRequest({ body: { userId: "user1" } });
      const req2 = createMockRequest({ body: { userId: "user2" } });
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const next = jest.fn();

      // Different users should have separate limits
      middleware(req1, res1 as any, next);
      middleware(req1, res1 as any, next);
      middleware(req2, res2 as any, next);

      expect(next).toHaveBeenCalledTimes(3);

      // Third request from user1 should be blocked
      const blockedRes = createMockResponse();
      middleware(req1, blockedRes as any, next);

      expect(next).toHaveBeenCalledTimes(3);
      expect(blockedRes.statusCode).toBe(429);
    });

    it("should use custom error message", () => {
      const customMessage = "Custom rate limit message";
      const middleware = rateLimit({
        limit: 1,
        windowMs: 60000,
        message: customMessage,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res as any, next);

      const blockedRes = createMockResponse();
      middleware(req, blockedRes as any, next);

      expect(blockedRes.body.message).toBe(customMessage);
    });
  });

  describe("emailKeyGenerator", () => {
    it("should use email from request body", () => {
      const req = createMockRequest({ body: { email: "test@example.com" } });
      const key = emailKeyGenerator(req);

      expect(key).toBe("email:test@example.com");
    });

    it("should fall back to IP when no email", () => {
      const req = createMockRequest({ ip: "192.168.1.1" });
      const key = emailKeyGenerator(req);

      expect(key).toBe("192.168.1.1");
    });
  });

  describe("Pre-configured rate limiters", () => {
    it("should have registration rate limiter", () => {
      expect(rateLimiters.registration).toBeDefined();
      expect(typeof rateLimiters.registration).toBe("function");
    });

    it("should have resend verification rate limiter", () => {
      expect(rateLimiters.resendVerification).toBeDefined();
      expect(typeof rateLimiters.resendVerification).toBe("function");
    });

    it("should have support rate limiter", () => {
      expect(rateLimiters.support).toBeDefined();
      expect(typeof rateLimiters.support).toBe("function");
    });

    it("should have sales rate limiter", () => {
      expect(rateLimiters.sales).toBeDefined();
      expect(typeof rateLimiters.sales).toBe("function");
    });

    it("registration limiter should enforce 5 requests per hour", () => {
      const req = createMockRequest();
      const next = jest.fn();

      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        const res = createMockResponse();
        rateLimiters.registration(req, res as any, next);
      }

      expect(next).toHaveBeenCalledTimes(5);

      // 6th request should be blocked
      const blockedRes = createMockResponse();
      rateLimiters.registration(req, blockedRes as any, next);

      expect(next).toHaveBeenCalledTimes(5);
      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body.message).toContain("registration");
    });

    it("resend verification limiter should use email-based limiting", () => {
      const next = jest.fn();

      // Make 3 requests with same email (at the limit)
      for (let i = 0; i < 3; i++) {
        const req = createMockRequest({ body: { email: "test@example.com" } });
        const res = createMockResponse();
        rateLimiters.resendVerification(req, res as any, next);
      }

      expect(next).toHaveBeenCalledTimes(3);

      // 4th request with same email should be blocked
      const req = createMockRequest({ body: { email: "test@example.com" } });
      const blockedRes = createMockResponse();
      rateLimiters.resendVerification(req, blockedRes as any, next);

      expect(next).toHaveBeenCalledTimes(3);
      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body.message).toContain("verification");
    });
  });

  describe("Rate limit headers", () => {
    it("should set all required rate limit headers", () => {
      const middleware = rateLimit({ limit: 5, windowMs: 60000 });
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res as any, next);

      expect(res.headers["X-RateLimit-Limit"]).toBeDefined();
      expect(res.headers["X-RateLimit-Remaining"]).toBeDefined();
      expect(res.headers["X-RateLimit-Reset"]).toBeDefined();
    });

    it("should decrement remaining count on each request", () => {
      const middleware = rateLimit({ limit: 5, windowMs: 60000 });
      const req = createMockRequest();
      const next = jest.fn();

      for (let i = 0; i < 5; i++) {
        const res = createMockResponse();
        middleware(req, res as any, next);
        expect(res.headers["X-RateLimit-Remaining"]).toBe(String(4 - i));
      }
    });
  });
});
