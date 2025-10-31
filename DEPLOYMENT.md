# Deployment Guide

This guide covers deployment configuration and environment setup for the THRIVE Assessment Platform.

## Environment Variables

### Required Variables

#### Database Configuration

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

PostgreSQL connection string. Required for all environments.

#### OpenAI Configuration

```bash
OPENAI_API_KEY=your-openai-api-key
```

OpenAI API key for AI-powered report generation. Required for all environments.

#### Session Configuration

```bash
SESSION_SECRET=your-random-session-secret
```

Secret key for session encryption. Generate a strong random string (minimum 32 characters).

**Generate a secure session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Email Configuration

#### SendGrid Setup

```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@thriveiep.com
```

- **SENDGRID_API_KEY**: Your SendGrid API key for sending emails
- **SENDGRID_FROM_EMAIL**: The "from" email address for all outgoing emails

**Setup Instructions:**

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with "Mail Send" permissions
3. Verify your sender email address in SendGrid
4. Add the API key and verified email to your environment

#### Email Verification Settings

```bash
EMAIL_VERIFICATION_EXPIRY_HOURS=24
EMAIL_VERIFICATION_BASE_URL=https://your-domain.com
```

- **EMAIL_VERIFICATION_EXPIRY_HOURS**: Hours until verification links expire (default: 24)
- **EMAIL_VERIFICATION_BASE_URL**: Base URL for verification links (must match your deployment URL)

**Environment-Specific Values:**

- Development: `http://localhost:5001`
- Staging: `https://staging.thriveiep.com`
- Production: `https://thriveiep.com`

### Rate Limiting Configuration

```bash
REGISTRATION_RATE_LIMIT=5
RESEND_VERIFICATION_RATE_LIMIT=3
SUPPORT_SALES_RATE_LIMIT=10
```

- **REGISTRATION_RATE_LIMIT**: Maximum registration attempts per IP per hour (default: 5)
- **RESEND_VERIFICATION_RATE_LIMIT**: Maximum resend verification requests per email per hour (default: 3)
- **SUPPORT_SALES_RATE_LIMIT**: Maximum support/sales requests per IP per hour (default: 10)

**Recommended Values by Environment:**

- Development: Higher limits for testing (10, 5, 20)
- Staging: Production-like limits (5, 3, 10)
- Production: Conservative limits (5, 3, 10)

**Adjusting Rate Limits:**

- Increase limits if legitimate users are being blocked
- Decrease limits if experiencing abuse or spam
- Monitor logs for rate limit violations

### Admin Notification Settings

```bash
ADMIN_NOTIFICATION_ENABLED=true
```

- **ADMIN_NOTIFICATION_ENABLED**: Enable/disable admin email notifications (default: true)

**When to Disable:**

- Development environments (to avoid spam during testing)
- Staging environments (unless testing notification flow)
- Maintenance windows

**When to Enable:**

- Production environments (always)
- Staging environments (when testing notification features)

### Optional Variables

#### Redis Configuration

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password-if-needed
```

Required if using background job processing for emails. Optional if sending emails synchronously.

#### PI Redactor Configuration

```bash
VITE_PI_REDACTOR_URL=https://your-pi-redactor-url.com/
```

URL to the PI (Personally Identifiable Information) Redactor tool for document de-identification.

#### Environment Selection

```bash
APP_ENVIRONMENT=production
NODE_ENV=production
PORT=5001
```

- **APP_ENVIRONMENT**: Application environment mode (development, production, k12-demo, etc.)
- **NODE_ENV**: Node.js environment (development, production)
- **PORT**: Server port (default: 5001)

## Deployment Checklist

### Pre-Deployment

- [ ] Set all required environment variables
- [ ] Generate secure SESSION_SECRET
- [ ] Configure SendGrid account and verify sender email
- [ ] Set correct EMAIL_VERIFICATION_BASE_URL for your domain
- [ ] Configure rate limits appropriate for your environment
- [ ] Enable ADMIN_NOTIFICATION_ENABLED for production
- [ ] Test email delivery in staging environment
- [ ] Verify database connection and run migrations
- [ ] Set up Redis if using background job processing

### Database Setup

```bash
# Push database schema
npm run db:push

# Verify migrations
npm run db:studio
```

### Email Testing

Before deploying to production, test email functionality:

1. **Test Verification Emails:**

   ```bash
   # Register a test user and verify email is received
   curl -X POST https://your-domain.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'
   ```

2. **Test Admin Notifications:**

   - Ensure system_admin users exist in database
   - Register a test user and verify admins receive notification
   - Submit a support request and verify admin notification

3. **Test Rate Limiting:**
   - Attempt multiple registrations to verify rate limits work
   - Check that appropriate error messages are returned

### Post-Deployment

- [ ] Verify application starts successfully
- [ ] Test user registration flow end-to-end
- [ ] Confirm verification emails are delivered
- [ ] Verify admin notifications are received
- [ ] Test rate limiting is working
- [ ] Monitor error logs for issues
- [ ] Set up monitoring and alerting

## Environment-Specific Configurations

### Development

```bash
# .env.development
DATABASE_URL=postgresql://localhost:5432/assessment_app
OPENAI_API_KEY=your-dev-api-key
SESSION_SECRET=dev-session-secret-change-in-production
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=dev@thriveiep.com
EMAIL_VERIFICATION_EXPIRY_HOURS=24
EMAIL_VERIFICATION_BASE_URL=http://localhost:5001
REGISTRATION_RATE_LIMIT=10
RESEND_VERIFICATION_RATE_LIMIT=5
SUPPORT_SALES_RATE_LIMIT=20
ADMIN_NOTIFICATION_ENABLED=false
APP_ENVIRONMENT=development
NODE_ENV=development
PORT=5001
```

### Staging

```bash
# .env.staging
DATABASE_URL=postgresql://user:password@staging-host:5432/database
OPENAI_API_KEY=your-staging-api-key
SESSION_SECRET=staging-session-secret-32-chars-minimum
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=staging@thriveiep.com
EMAIL_VERIFICATION_EXPIRY_HOURS=24
EMAIL_VERIFICATION_BASE_URL=https://staging.thriveiep.com
REGISTRATION_RATE_LIMIT=5
RESEND_VERIFICATION_RATE_LIMIT=3
SUPPORT_SALES_RATE_LIMIT=10
ADMIN_NOTIFICATION_ENABLED=true
APP_ENVIRONMENT=production
NODE_ENV=production
PORT=5001
```

### Production

```bash
# .env.production
DATABASE_URL=postgresql://user:password@prod-host:5432/database
OPENAI_API_KEY=your-production-api-key
SESSION_SECRET=production-session-secret-32-chars-minimum
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@thriveiep.com
EMAIL_VERIFICATION_EXPIRY_HOURS=24
EMAIL_VERIFICATION_BASE_URL=https://thriveiep.com
REGISTRATION_RATE_LIMIT=5
RESEND_VERIFICATION_RATE_LIMIT=3
SUPPORT_SALES_RATE_LIMIT=10
ADMIN_NOTIFICATION_ENABLED=true
APP_ENVIRONMENT=production
NODE_ENV=production
PORT=5001
```

## Troubleshooting

### Email Delivery Issues

**Verification emails not being received:**

1. Check SendGrid API key is valid
2. Verify sender email is verified in SendGrid
3. Check spam/junk folders
4. Review SendGrid activity logs
5. Verify EMAIL_VERIFICATION_BASE_URL is correct

**Admin notifications not being sent:**

1. Verify ADMIN_NOTIFICATION_ENABLED=true
2. Check that system_admin users exist in database
3. Review application logs for email sending errors
4. Verify SendGrid API key has correct permissions

### Rate Limiting Issues

**Users being blocked unexpectedly:**

1. Review rate limit values - may be too restrictive
2. Check if legitimate users are behind shared IPs (corporate networks)
3. Consider implementing user-based rate limiting instead of IP-based
4. Monitor rate limit logs to identify patterns

**Rate limiting not working:**

1. Verify rate limit middleware is properly configured
2. Check that rate limit values are being read from environment
3. Ensure Redis is running if using Redis-based rate limiting
4. Review application logs for rate limiting errors

### Environment Variable Issues

**Variables not being loaded:**

1. Verify .env file exists and is in correct location
2. Check file permissions on .env file
3. Ensure dotenv is configured in application entry point
4. Verify variable names match exactly (case-sensitive)

**Wrong environment values:**

1. Check which .env file is being loaded
2. Verify NODE_ENV is set correctly
3. Ensure deployment platform environment variables override .env file
4. Review application startup logs for loaded configuration

## Security Best Practices

### Session Secrets

- Use cryptographically secure random strings (minimum 32 characters)
- Never commit session secrets to version control
- Rotate session secrets periodically
- Use different secrets for each environment

### API Keys

- Store API keys in environment variables, never in code
- Use different API keys for each environment
- Rotate API keys periodically
- Restrict API key permissions to minimum required

### Rate Limiting

- Implement rate limiting on all public endpoints
- Use conservative limits to prevent abuse
- Monitor for rate limit violations
- Consider implementing CAPTCHA for repeated violations

### Email Security

- Verify sender email addresses in SendGrid
- Use SPF, DKIM, and DMARC records for email authentication
- Monitor email bounce rates and spam complaints
- Implement email validation to prevent invalid addresses

## Monitoring and Logging

### Key Metrics to Monitor

- Email delivery success rate
- Email bounce rate
- Rate limit violations
- Registration completion rate
- Verification link click rate
- Admin notification delivery rate

### Recommended Logging

- All email sending attempts (success and failure)
- Rate limit violations with IP addresses
- Registration attempts and outcomes
- Verification link clicks and outcomes
- Admin notification delivery status

### Alerting

- Alert on high email failure rates (>5%)
- Alert on high rate limit violation rates
- Alert on admin notification failures
- Alert on database connection issues

## Support

For deployment support or questions:

- Review application logs for error details
- Check SendGrid activity logs for email issues
- Consult the development team for configuration assistance
- Create an issue in the repository for bugs or feature requests
