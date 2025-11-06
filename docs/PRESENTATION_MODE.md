# Presentation Mode Documentation

## Overview

Presentation Mode provides a secure way to demonstrate the K12 assessment system without requiring user authentication. It uses a secret token-based authentication system that grants temporary read-only access to the application.

**Purpose**: Enable demonstrations, presentations, and previews without exposing login credentials or requiring account creation.

**Key Benefits**:

- No login required for demos
- Read-only access prevents accidental changes
- Secret URL keeps feature hidden from general users
- Automatic session cleanup
- Full audit trail for security

**Use Cases**:

- Sales demonstrations
- Conference presentations
- Client previews
- Training sessions
- System showcases

## Security Features

- **Token-based Access**: Uses a 64-character cryptographically secure token
- **Read-only Mode**: Presentation sessions cannot modify any data
- **URL Sanitization**: Token is automatically removed from URL after processing
- **Session Storage**: Token is stored in session storage (not localStorage) for security
- **Audit Logging**: All access attempts are logged with IP address and timestamp
- **Silent Failure**: Invalid token attempts are logged but don't reveal the feature exists

## Setup

### 1. Generate Presentation Token

Generate a cryptographically secure 64-character token using one of these methods:

**Method A: Node.js (Recommended)**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Method B: OpenSSL**

```bash
openssl rand -hex 32
```

**Method C: Python**

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Example Output:**

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

⚠️ **Important**: Save this token securely - you'll need it for environment configuration and URL access.

### 2. Environment Configuration

Add the token to your environment variables in the appropriate file for your environment:

**Development (.env.local)**

```env
# Presentation Mode Configuration
# Generated: 2024-01-15
# Purpose: Demo access for sales presentations
PRESENTATION_MODE_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Production (Railway/Vercel/etc.)**

1. Navigate to your hosting platform's environment variables section
2. Add new variable:
   - **Name**: `PRESENTATION_MODE_TOKEN`
   - **Value**: Your generated 64-character token
3. Save and redeploy if necessary

**Docker (.env or docker-compose.yml)**

```yaml
environment:
  - PRESENTATION_MODE_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. Verify Configuration

After setting the environment variable, verify it's loaded correctly:

```bash
# Check if variable is set (development)
echo $PRESENTATION_MODE_TOKEN

# Or check in Node.js
node -e "console.log(process.env.PRESENTATION_MODE_TOKEN ? 'Token is set' : 'Token is NOT set')"
```

**Important**: Restart your server after adding the environment variable!

```bash
# Development
npm run dev

# Production
pm2 restart app  # or your process manager command
```

### 4. Token Validation

The system validates tokens through the following process:

1. **Request Inspection**: Checks if the `p` query parameter exists in the URL
2. **Token Comparison**: Compares the provided token against `PRESENTATION_MODE_TOKEN` environment variable
3. **Session Creation**: Creates a temporary read-only session for valid tokens with:
   - User ID: -1 (special presentation user)
   - Role: DEMO
   - Modules: K12 and POST_SECONDARY
   - Read-only permissions
4. **Logging**: Records access attempt with IP, timestamp, and user agent
5. **Silent Failure**: Invalid tokens redirect to login without revealing the feature

**Security Flow:**

```
URL with ?p=token
    ↓
presentationModeAuth middleware
    ↓
Token validation
    ↓
├─ Valid → Create session → Grant access → Log success
└─ Invalid → Log attempt → Continue to normal auth → Redirect to login
```

## Usage

### Accessing Presentation Mode

Add the presentation token as a query parameter to any URL in your application:

**Basic Format:**

```
https://your-app.com/?p=YOUR_TOKEN_HERE
```

**Specific Pages:**

```
# K-12 Reports
https://your-app.com/k12-reports?p=YOUR_TOKEN_HERE

# Post-Secondary Reports
https://your-app.com/post-secondary-reports?p=YOUR_TOKEN_HERE

# Dashboard
https://your-app.com/dashboard?p=YOUR_TOKEN_HERE

# Any route works!
https://your-app.com/any-route?p=YOUR_TOKEN_HERE
```

**Development Example:**

```
http://localhost:5001/?p=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Production Example:**

```
https://thrive-assessment.com/?p=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Automatic Behavior

The system handles presentation mode automatically through the following sequence:

1. **Token Detection** (Frontend)

   - React app detects the `p` query parameter on initial page load
   - Validates token format (non-empty string)
   - Stores token in session storage for subsequent requests

2. **URL Sanitization** (Frontend)

   - Token is automatically removed from the URL bar
   - User sees clean URL: `https://your-app.com/k12-reports`
   - Token remains in session storage for API calls

3. **Authentication** (Backend)

   - `presentationModeAuth` middleware intercepts all requests
   - Checks for `p` parameter in query string
   - Validates against environment variable
   - Creates temporary session if valid

4. **Session Creation** (Backend)

   - Special user ID: -1
   - Role: DEMO
   - Permissions: Read-only
   - Modules: K12 and POST_SECONDARY
   - Organization: "Presentation Mode"

5. **API Requests** (Frontend)
   - All subsequent API calls include token from session storage
   - Backend validates token on each request
   - Read-only operations allowed
   - Write operations blocked

### User Experience

**What Users See:**

- ✅ Full application interface
- ✅ All reports and data (demo data)
- ✅ Navigation and features
- ✅ Professional, production-like experience

**What Users Cannot Do:**

- ❌ Create new reports
- ❌ Edit existing data
- ❌ Delete content
- ❌ Change settings
- ❌ Access admin features

**Session Behavior:**

- Session persists during browser session
- Closes when browser/tab is closed
- No persistent login
- No cookies stored long-term
- Automatic cleanup

### Best Practices for Presentations

**Before the Demo:**

1. Test the presentation URL in a private/incognito window
2. Bookmark the URL for quick access
3. Prepare demo data in advance
4. Clear browser cache if needed
5. Have backup authentication ready

**During the Demo:**

1. Open presentation URL in new incognito window
2. Verify you're in presentation mode (check console logs if needed)
3. Navigate through features naturally
4. Avoid showing the URL bar if token is visible
5. Close window when done

**After the Demo:**

1. Close all presentation mode windows
2. Clear session storage if on shared computer
3. Rotate token if it may have been exposed
4. Review access logs for security audit

**URL Sharing Tips:**

- Use URL shorteners for cleaner links (bit.ly, tinyurl.com)
- Share via secure channels (encrypted email, Slack DM)
- Set expiration dates for shared links
- Rotate tokens after major presentations
- Never post publicly or in screenshots

## Security Considerations

### Token Management

**Generation Best Practices:**

- ✅ Use cryptographically secure random generation (crypto.randomBytes)
- ✅ Minimum 64 characters (32 bytes hex-encoded)
- ✅ Use different tokens for different environments (dev, staging, prod)
- ❌ Never use predictable patterns or dictionary words
- ❌ Never reuse tokens across applications

**Storage Best Practices:**

- ✅ Store in environment variables only
- ✅ Use secret management systems (AWS Secrets Manager, HashiCorp Vault)
- ✅ Encrypt environment files if stored in version control
- ❌ Never commit tokens to Git repositories
- ❌ Never hardcode tokens in source code
- ❌ Never store in client-side code or localStorage

**Rotation Policy:**

```bash
# Recommended rotation schedule:
# - After major presentations: Immediately
# - Routine rotation: Every 90 days
# - Security incident: Immediately
# - Employee departure: Within 24 hours
# - Token exposure: Immediately

# Rotation process:
1. Generate new token
2. Update environment variable
3. Restart server
4. Test new token
5. Invalidate old token
6. Update documentation
7. Notify authorized users
```

**Distribution Guidelines:**

- ✅ Share via encrypted channels (Signal, encrypted email)
- ✅ Use password-protected documents
- ✅ Share only with authorized personnel
- ✅ Set expiration dates for shared links
- ✅ Track who has access
- ❌ Never share via unencrypted email
- ❌ Never post in public channels (Slack, Teams)
- ❌ Never include in screenshots or recordings
- ❌ Never share via SMS or unencrypted messaging

### Access Control

**Read-only Enforcement:**

```typescript
// Backend enforces read-only at multiple levels:

// 1. User role check
if (req.user?.role === UserRole.DEMO) {
  // Block write operations
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return res.status(403).json({ error: "Read-only access" });
  }
}

// 2. Database permissions
// Presentation user has SELECT-only permissions

// 3. API route guards
// Write endpoints check for non-demo users
```

**Session Characteristics:**

- **Temporary**: No persistent storage
- **Browser-bound**: Tied to browser session
- **Auto-expire**: Closes with browser
- **No cookies**: Uses session storage only
- **Isolated**: Cannot access real user data

**Data Isolation:**

```typescript
// Presentation mode sees only demo data:
const userId = req.session.userId;

if (userId === -1) {
  // Return demo/sample data only
  return getDemoData();
} else {
  // Return real user data
  return getUserData(userId);
}
```

### Monitoring and Auditing

**Logged Events:**

1. **Successful Access:**

```json
{
  "event": "presentation_mode_access",
  "status": "granted",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "url": "/k12-reports",
  "method": "GET",
  "sessionId": "abc123...",
  "geolocation": "San Francisco, CA"
}
```

2. **Failed Attempts:**

```json
{
  "event": "presentation_mode_attempt",
  "status": "denied",
  "reason": "invalid_token",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "tokenLength": 32,
  "severity": "warning"
}
```

3. **API Requests:**

```json
{
  "event": "presentation_api_request",
  "userId": -1,
  "endpoint": "/api/reports/123",
  "method": "GET",
  "timestamp": "2024-01-15T10:30:15.000Z",
  "responseTime": "45ms",
  "status": 200
}
```

**Monitoring Dashboard:**

- Track presentation mode usage patterns
- Alert on suspicious activity (multiple failed attempts)
- Monitor geographic distribution of access
- Track session duration and page views
- Generate usage reports

**Security Alerts:**

```bash
# Alert conditions:
- 5+ failed token attempts from same IP in 1 hour
- Token access from unexpected geographic location
- Unusual access patterns (rapid requests, automated behavior)
- Access outside business hours (configurable)
- Token used from multiple IPs simultaneously
```

### Threat Model

**Potential Threats:**

1. **Token Exposure**

   - Risk: Token shared publicly or leaked
   - Mitigation: Regular rotation, monitoring, quick revocation

2. **Brute Force Attacks**

   - Risk: Attacker tries to guess token
   - Mitigation: 64-character token = 2^256 possibilities (infeasible)

3. **Man-in-the-Middle**

   - Risk: Token intercepted during transmission
   - Mitigation: HTTPS required, token removed from URL

4. **Session Hijacking**

   - Risk: Attacker steals session
   - Mitigation: Session storage only, no persistent cookies

5. **Data Exfiltration**
   - Risk: Unauthorized data access via presentation mode
   - Mitigation: Demo data only, read-only access, monitoring

**Security Layers:**

```
Layer 1: HTTPS encryption (transport security)
Layer 2: Token validation (authentication)
Layer 3: Session management (authorization)
Layer 4: Read-only enforcement (access control)
Layer 5: Demo data isolation (data security)
Layer 6: Audit logging (monitoring)
Layer 7: Rate limiting (abuse prevention)
```

### Compliance Considerations

**GDPR Compliance:**

- Presentation mode uses demo data only
- No real personal data exposed
- Access logged for audit trail
- Right to access: Logs available on request

**SOC 2 Compliance:**

- Access controls documented
- Audit trail maintained
- Security monitoring in place
- Incident response procedures defined

**HIPAA Compliance (if applicable):**

- No PHI in presentation mode
- Demo data only
- Access logged and monitored
- Encryption in transit (HTTPS)

## Implementation Details

### Backend Components

1. **Middleware**: `presentationModeAuth` in `apps/server/auth.ts`
2. **Session Management**: Creates temporary user session
3. **Logging**: Security audit trail for all access attempts

### Frontend Components

1. **Token Detection**: URL parameter parsing in `App.tsx`
2. **Storage**: Session storage management
3. **API Integration**: Token inclusion in API requests via `apiClient.ts`

### Database Impact

- No database writes in presentation mode
- Uses temporary in-memory user object
- No persistent session storage

## Testing

### Valid Token Test

```bash
# Test with valid token
curl "http://localhost:5001/api/auth/me?p=your-valid-token"
```

### Invalid Token Test

```bash
# Test with invalid token (should fail silently)
curl "http://localhost:5001/api/auth/me?p=invalid-token"
```

### Frontend Test

1. Navigate to: `http://localhost:5001/?p=your-valid-token`
2. Verify token is removed from URL
3. Verify application loads without login
4. Verify read-only access to data

## Troubleshooting

### Common Issues

#### 1. Token Not Working

**Symptoms:**

- Redirected to login page
- "Unauthorized" errors
- Token appears in URL but no access granted

**Solutions:**

**Check Environment Variable:**

```bash
# Verify token is set
echo $PRESENTATION_MODE_TOKEN

# Should output your 64-character token
# If empty, token is not set
```

**Verify Token Format:**

- Must be exactly 64 characters
- Hexadecimal characters only (0-9, a-f)
- No spaces, quotes, or special characters
- Case-sensitive

**Restart Server:**

```bash
# Development
npm run dev

# Production
pm2 restart app
# or
systemctl restart your-service
```

**Check Token Match:**

```bash
# Compare tokens
echo "URL token: YOUR_URL_TOKEN"
echo "ENV token: $PRESENTATION_MODE_TOKEN"
# They must match exactly
```

#### 2. URL Not Cleaning

**Symptoms:**

- Token remains visible in URL bar
- URL shows `?p=token` after page load
- Token not removed automatically

**Solutions:**

**Check Browser Console:**

```javascript
// Open browser console (F12)
// Look for errors related to:
// - React rendering
// - useEffect hooks
// - Session storage
```

**Verify Session Storage:**

```javascript
// In browser console:
console.log(sessionStorage.getItem("presentationToken"));
// Should show your token if stored correctly
```

**Clear Cache and Reload:**

```bash
# Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Check React App:**

- Ensure React app is running
- Verify no JavaScript errors
- Check that useEffect is executing

#### 3. API Requests Failing

**Symptoms:**

- 401 Unauthorized errors
- Data not loading
- "Authentication required" messages

**Solutions:**

**Check Network Tab:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for API requests
4. Check if `p` parameter is included in requests
5. Verify token value matches environment variable

**Verify Middleware Registration:**

```typescript
// In apps/server/routes/index.ts
// Ensure presentationModeAuth is registered:
app.use(presentationModeAuth);
```

**Check Request Headers:**

```javascript
// In browser console:
fetch("/api/auth/me?p=YOUR_TOKEN")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

#### 4. Session Expires Immediately

**Symptoms:**

- Access granted then immediately lost
- Repeated redirects to login
- Session doesn't persist

**Solutions:**

**Check Session Configuration:**

```typescript
// Verify session settings in apps/server/auth.ts
// Session should have:
// - cookie.maxAge set appropriately
// - resave: false
// - saveUninitialized: false
```

**Verify Session Store:**

- Check if session store is configured
- Ensure Redis/database is running (if used)
- Check session middleware is registered

#### 5. Token Exposed in Logs

**Symptoms:**

- Token visible in server logs
- Token in error messages
- Security concern about token exposure

**Solutions:**

**Sanitize Logs:**

```typescript
// Mask token in logs
const maskedToken = token ? `${token.substring(0, 8)}...` : "none";
console.log(`Token: ${maskedToken}`);
```

**Review Logging Configuration:**

- Ensure tokens are not logged in production
- Use log levels appropriately
- Implement log sanitization

### Debug Logging

Enable and interpret debug logging:

**Success Indicators:**

```bash
# Server console should show:
🎭 PRESENTATION MODE ACCESS GRANTED {
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2024-01-15T10:30:00.000Z',
  url: '/k12-reports',
  method: 'GET',
  sessionId: 'abc123...',
  securityNote: 'Read-only presentation access granted via secret token'
}
```

**Failure Indicators:**

```bash
# Invalid token attempt:
🚨 INVALID PRESENTATION TOKEN ATTEMPT {
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2024-01-15T10:30:00.000Z',
  url: '/k12-reports',
  method: 'GET',
  tokenLength: 32,
  securityNote: 'Invalid presentation token - possible attack or misconfiguration'
}
```

**Enable Verbose Logging:**

```bash
# Set environment variable for detailed logs
DEBUG=presentation:* npm run dev
```

### Testing Checklist

Use this checklist to verify presentation mode is working:

- [ ] Environment variable `PRESENTATION_MODE_TOKEN` is set
- [ ] Server has been restarted after setting variable
- [ ] Token is exactly 64 characters
- [ ] URL with token loads without login
- [ ] Token is removed from URL bar after load
- [ ] Token is stored in session storage
- [ ] API requests include token parameter
- [ ] Server logs show "PRESENTATION MODE ACCESS GRANTED"
- [ ] Application displays correctly
- [ ] Read-only restrictions are enforced
- [ ] Session persists during browser session
- [ ] Session clears when browser closes

### Getting Help

If issues persist after troubleshooting:

1. **Check Server Logs:**

   - Look for error messages
   - Check for middleware registration
   - Verify token validation logic

2. **Review Code:**

   - `apps/server/auth.ts` - Middleware implementation
   - `apps/server/routes/index.ts` - Middleware registration
   - Frontend token detection code

3. **Test in Isolation:**

   ```bash
   # Test token validation directly
   curl "http://localhost:5001/api/auth/me?p=YOUR_TOKEN"
   ```

4. **Contact Support:**
   - Provide server logs
   - Include browser console output
   - Share network tab screenshots
   - Describe exact steps to reproduce

## Best Practices

1. **Token Security**

   - Use different tokens for different environments
   - Rotate tokens regularly
   - Never commit tokens to version control

2. **Access Management**

   - Limit token distribution to authorized personnel
   - Monitor access logs regularly
   - Revoke tokens when no longer needed

3. **Demo Preparation**
   - Test presentation mode before demos
   - Prepare clean demo data
   - Have backup authentication method ready

## Related Documentation

- [Authentication System](./AUTHENTICATION.md)
- [Security Guidelines](./SECURITY.md)
- [Environment Configuration](./ENVIRONMENT.md)
