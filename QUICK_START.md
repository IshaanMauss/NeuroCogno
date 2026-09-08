# QUICK START GUIDE

## Getting Started with Your Secured Backend

### Prerequisites
- Node.js 16+ installed
- MongoDB running (local or Atlas)
- Git (optional)

---

## Development Setup (5 minutes)

### 1. Install Dependencies
```bash
cd C:/Users/ishaa/Desktop/NEUROCOGNO
npm install
```

### 2. Configure Environment
Your `.env` file is already configured for local development. No changes needed for testing.

**Current Settings:**
- Backend: `http://127.0.0.1:8080`
- Frontend: `http://127.0.0.1:5173`
- Database: Local MongoDB at `mongodb://127.0.0.1:27017/neurocogno`

### 3. Start Development Server
```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

### 4. Test the Backend
```bash
# Health check
curl http://127.0.0.1:8080/api/health

# Expected response:
# {"ok":true,"uptime":123,"timestamp":"2026-06-13T...","database":"connected"}
```

### 5. Login to Admin Dashboard
- URL: `http://127.0.0.1:5173/admin`
- **Username**: `ishaan` / **Password**: `555879`
- Or: `ceo` / `555879`
- Or: `coo` / `555879`

---

## Testing Security Features

### Test Login Attempt Lockout
```bash
# Try 6 failed logins (should lock after 5)
for i in {1..6}; do
  curl -X POST http://127.0.0.1:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"test","password":"wrong"}'
  echo ""
done

# Expected: Account lockout message after 5 attempts
```

### Test Rate Limiting
```bash
# Send 11 login requests quickly (limit is 10)
for i in {1..11}; do
  curl -X POST http://127.0.0.1:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"test","password":"wrong"}'
  echo "Request $i"
done

# Expected: 429 Too Many Requests after 10 attempts
```

### Test Audit Logging
1. Login to admin dashboard
2. Edit a lead
3. Check audit trail: `GET /api/admin/leads/:id/audit`
4. You'll see your changes logged with timestamp, IP, user info

### Test Pattern Detection
```bash
# Try SQL injection (will be blocked)
curl -X POST http://127.0.0.1:8080/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"test@test.com","phone":"123","reason":"SELECT * FROM users"}'

# Expected: 403 Request blocked
```

---

## Production Deployment

### Step 1: Update Environment Variables

Create a `.env.production` file:

```env
NODE_ENV=production
PORT=8080
CLIENT_ORIGIN=https://your-domain.com
PUBLIC_BASE_URL=https://your-domain.com

# Generate new secrets!
JWT_ACCESS_SECRET=<run-command-below>
JWT_REFRESH_SECRET=<run-command-below>
COOKIE_SECRET=<run-command-below>

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:NEW_PASSWORD@cluster.mongodb.net/neurocogno

# Live Razorpay Keys
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=ZZZZZZZZZZZZZZZZZZZZ
BOOKING_AMOUNT_INR=499

# Real Business Info
CEO_PHONE=+91XXXXXXXXXX
BUSINESS_EMAIL=hello@yourdomain.com
INFO_EMAIL=info@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
BUSINESS_ADDRESS=Your Real Address Here
```

### Generate Secrets:
```bash
# JWT Access Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Cookie Secret
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 2: Update Admin Passwords

Edit `ADMIN_USERS_JSON` in `.env.production`:
```json
[
  {
    "name":"Your Name",
    "username":"yourname",
    "email":"you@yourdomain.com",
    "password":"Strong_Password_123!",
    "role":"developer"
  }
]
```

### Step 3: Database Security

**MongoDB Atlas:**
1. Login to MongoDB Atlas
2. Go to Network Access
3. Remove `0.0.0.0/0` entry
4. Add your production server IP only
5. Database Access → Change password
6. Update `MONGODB_URI` in `.env.production`

### Step 4: Payment Gateway Setup

**Razorpay Dashboard:**
1. Go to https://dashboard.razorpay.com/
2. Settings → API Keys → Generate Live Keys
3. Copy Key ID and Key Secret to `.env.production`
4. Settings → Webhooks → Create Webhook
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: Select all payment events
   - Copy webhook secret to `.env.production`

### Step 5: Build Frontend
```bash
npm run build
```

This creates `server/public/` with your production frontend.

### Step 6: Start Production Server
```bash
# Use production env file
NODE_ENV=production npm start

# Or with PM2 (recommended)
npm install -g pm2
pm2 start server/src/server.js --name neurocogno
pm2 save
pm2 startup
```

### Step 7: Verify Deployment
```bash
# Health check
curl https://your-domain.com/api/health

# Security headers check
curl -I https://your-domain.com/api/health

# Should see:
# - Strict-Transport-Security
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
```

---

## Monitoring Setup

### 1. Check Audit Logs
```bash
# View recent security events
curl https://your-domain.com/api/admin/issues \
  -H "Cookie: nc_access=<your-token>"
```

### 2. Monitor System Health
```bash
# Automated health check (every 5 minutes)
*/5 * * * * curl -f https://your-domain.com/api/health || echo "Server down!"
```

### 3. Set Up Alerts

**UptimeRobot** (Free):
1. Go to uptimerobot.com
2. Add monitor: `https://your-domain.com/api/health`
3. Set alert contacts

**Sentry** (Error Tracking):
```bash
npm install @sentry/node
```

Add to `server/src/server.js`:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Common Tasks

### View Audit Logs
```javascript
// In admin dashboard or API call
fetch('/api/admin/leads/LEAD_ID/audit')
  .then(r => r.json())
  .then(logs => console.log(logs));
```

### Revoke All User Sessions
```bash
# Force logout from all devices
curl -X POST https://your-domain.com/api/auth/revoke-all \
  -H "Cookie: nc_access=<token>"
```

### Check Active Sessions
```bash
# After login, check activeSessionCount
curl https://your-domain.com/api/auth/me \
  -H "Cookie: nc_access=<token>"
```

### Blacklist an IP
```javascript
// Add to server code or admin endpoint
import { addToBlacklist } from './middleware/security.js';
addToBlacklist('192.168.1.100');
```

### View System Issues
```bash
# Check security violations and errors
curl https://your-domain.com/api/admin/issues \
  -H "Cookie: nc_access=<token>"
```

---

## Troubleshooting

### "Authentication required" on every request
**Cause**: Cookies not being sent
**Solution**: Ensure `credentials: 'include'` in fetch requests

```javascript
// ❌ Wrong
fetch('/api/admin/metrics')

// ✅ Correct
fetch('/api/admin/metrics', { credentials: 'include' })
```

### "CSRF token validation failed"
**Cause**: Missing CSRF token in POST/PATCH/DELETE
**Solution**: Include X-CSRF-Token header

```javascript
const csrfToken = localStorage.getItem('csrfToken');

fetch('/api/admin/leads/123', {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ name: 'Updated' })
});
```

### "Rate limit exceeded"
**Cause**: Too many requests
**Solution**: Check rate limit headers and implement backoff

```javascript
const response = await fetch('/api/auth/login', { ... });

if (response.status === 429) {
  const resetTime = response.headers.get('RateLimit-Reset');
  const retryAfter = new Date(resetTime) - new Date();
  console.log(`Retry after ${retryAfter}ms`);
}
```

### Payment signature verification failed
**Cause**: Wrong Razorpay secret or webhook secret
**Solution**: 
1. Check `RAZORPAY_KEY_SECRET` matches dashboard
2. Check `RAZORPAY_WEBHOOK_SECRET` matches webhook settings
3. Verify webhook URL is correct

### Database connection error
**Cause**: MongoDB not reachable or wrong credentials
**Solution**:
1. Check MongoDB is running
2. Verify `MONGODB_URI` is correct
3. Check IP whitelist (MongoDB Atlas)
4. Test connection: `mongosh "your-connection-string"`

---

## Performance Tips

### Enable Compression
Already enabled! Responses are gzipped automatically.

### Use HTTP/2
Configure your reverse proxy (nginx/Apache) for HTTP/2.

### Enable Caching
Add caching headers for static assets in your reverse proxy.

### Database Indexes
Already configured! Audit logs and all models have indexes.

### Connection Pooling
MongoDB connection pooling is automatic with Mongoose.

---

## Security Maintenance

### Monthly Tasks
- [ ] Update npm dependencies
- [ ] Review audit logs for suspicious activity
- [ ] Check system issues dashboard
- [ ] Review rate limit violations

### Quarterly Tasks
- [ ] Rotate JWT secrets
- [ ] Rotate cookie secret
- [ ] Rotate MongoDB password
- [ ] Review and update admin accounts

### Annual Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review and update security policies

---

## Useful Commands

```bash
# Check syntax
npm run check

# View logs (with PM2)
pm2 logs neurocogno

# Restart server (with PM2)
pm2 restart neurocogno

# Monitor server
pm2 monit

# Database backup (MongoDB)
mongodump --uri="your-connection-string" --out=./backup

# Database restore
mongorestore --uri="your-connection-string" ./backup

# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test webhook signature (local)
curl -X POST http://127.0.0.1:8080/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test" \
  -d '{"event":"payment.captured"}'
```

---

## Support & Documentation

- **Security Guide**: `SECURITY_GUIDE.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Project Status**: `PROJECT_STATUS_AND_PRODUCTION_NOTES.md`

---

## Need Help?

1. Check documentation files above
2. Review audit logs: `/api/admin/issues`
3. Check system health: `/api/health`
4. Review error logs in console

---

**You're all set! Your backend is secure and production-ready.** 🎉

Change your frontend anytime - the backend will keep working without any modifications!

## 2026-08-27 Progress Update

This dated note is appended for product lifecycle continuity. No previous documentation content was removed or rewritten.

Recent product updates completed during the current development cycle:
- Public website routing is now treated as separate page-level views for About Us, NeuroCogno Insight, Workshops & Events, Collaboration, and Services.
- The visual direction was iterated across multiple palettes and is currently being stabilized around a warm slate blue / muted terracotta system with rounded cards, softer page backgrounds, and less isolated white space.
- The NeuroCogno Insight, Workshops & Events, Collaboration, and Services pages were moved toward open-canvas layouts so content feels connected to the page background instead of trapped inside one large inner panel.
- Survey popup content was revised into a clinically useful 10-question triage flow for concern type, support need, person seeking support, duration, mode, therapy history, callback time, and optional notes.
- Development-only survey controls were added so the popup can be manually triggered and stepped through during testing. These controls must be removed or disabled before production deployment.
- Service cards now open theme-matched detail modals first, and appointment navigation happens only after the visitor chooses to proceed.
- Website media/content management was expanded so editable public content such as hero images, insight visuals, videos, captions, redirects, and variable text can be controlled from the admin side.
- Admin dashboard work now includes CRM-oriented thinking: direct leads, survey leads, saved/incomplete leads, collaboration requests, confirmed/paid clients, archived records, website media/text, health/traffic, and server/payment logs.
- Image upload handling has been discussed and partially implemented with automatic compression expectations, CMS previews, content keys, section placement, and public rendering sync.
- WhatsApp help redirect is intended to use a backend-controlled redirect path so the public UI does not hardcode the final phone number directly.
- Production notes remain open for Razorpay live credentials, MongoDB Atlas production IP/access rules, secure backups, environment hardening, rate limits, real monitoring, and deployment configuration.

Current development reminder:
- This project is still in development/testing mode. Any test-only UI, local database settings, permissive CORS/IP rules, demo admin credentials, and temporary media defaults must be reviewed before launch.

