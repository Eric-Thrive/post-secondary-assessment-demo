# Rate Limiting Middleware

This directory contains middleware for the email-verified registration system.

## Rate Limiting

The rate limiting middleware (`rate-limit.ts`) provides protection against abuse by limiting the number of requests from a single source within a time window.

### Features

- **Flexible Configuration**: Customize limits, time windows, and key generators
- **Multiple Strategies**: IP-based or email-based rate limiting
- **Standard Headers**: Returns `X-RateLimit-*` headers per RFC 6585
- **Retry Information**: Includes `Retry-After` header when rate limited
- **Pre-configured Limiters**: Ready-to-use limiters for common endpoints

### Usage

#### Basic Usage

```typescript
import { rateLimit } from "../middleware/rate-limit";

// Apply rate limiting to an endpoint
app.post(
  "/api/endpoint",
  rateLimit({ limit: 10, windowMs: 60 * 60 * 1000 }),
  handler
);
```

#### Using Pre-configured Limiters

```typescript
import { rateLimiters } from "../middleware/rate-limit";

// Registration: 5 requests per hour per IP
app.post("/api/auth/register", rateLimiters.registration, handler);

// Resend verification: 3 requests per hour per email
app.post(
  "/api/auth/resend-verification",
  rateLimiters.resendVerification,
  handler
);

// Support requests: 10 requests per hour per IP
app.post("/api/support/request", rateLimiters.support, handler);

// Sales inquiries: 10 requests per hour per IP
app.post("/api/sales/inquiry", rateLimiters.sales, handler);
```

#### Custom Key Generator

```typescript
import { rateLimit, emailKeyGenerator } from "../middleware/rate-limit";

// Use email-based rate limiting
app.post(
  "/api/endpoint",
  rateLimit({
    limit: 3,
    windowMs: 60 * 60 * 1000,
    keyGenerator: emailKeyGenerator,
  }),
  handler
);
```

### Configuration

#### Rate Limit Options

- `limit` (required): Maximum number of requests allowed in the time window
- `windowMs` (required): Time window in milliseconds
- `keyGenerator` (optional): Function to generate unique keys for rate limiting
- `message` (optional): Custom error message when rate limit is exceeded

#### Default Limits

| Endpoint            | Limit | Window | Key           |
| ------------------- | ----- | ------ | ------------- |
| Registration        | 5     | 1 hour | IP address    |
| Resend Verification | 3     | 1 hour | Email address |
| Support Requests    | 10    | 1 hour | IP address    |
| Sales Inquiries     | 10    | 1 hour | IP address    |

### Response Headers

When rate limiting is active, the following headers are included in responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: ISO 8601 timestamp when the rate limit resets
- `Retry-After`: Seconds until the rate limit resets (only when limit exceeded)

### Error Response

When the rate limit is exceeded, a 429 status code is returned with:

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Custom error message",
  "retryAfter": 3600,
  "resetTime": "2025-10-30T12:00:00.000Z"
}
```

### Testing

For testing purposes, you can clear the rate limit store:

```typescript
import { clearRateLimitStore } from "../middleware/rate-limit";

beforeEach(() => {
  clearRateLimitStore();
});
```

### Production Considerations

The current implementation uses in-memory storage, which works well for single-server deployments. For production environments with multiple servers, consider:

1. **Redis-based rate limiting**: Use a shared Redis instance for distributed rate limiting
2. **Database-backed storage**: Store rate limit data in the database
3. **Third-party services**: Use services like Redis Cloud or AWS ElastiCache

### Security Notes

- Rate limits are enforced per IP address by default
- Email-based rate limiting is used for endpoints that require email verification
- Rate limit data is automatically cleaned up when time windows expire
- All rate limit violations are logged for monitoring and security analysis
