# SECURITY CONFIGURATION GUIDE

## Backend Security Implementation

This document outlines all security measures implemented in the NeuroCogno backend.

## 1. Authentication & Session Management

### JWT Token System
- **Access Tokens**: Short-lived (20 minutes), used for API authentication
- **Refresh Tokens**: Long-lived (7 days), used to obtain new access tokens
- **Token Rotation**: Old refresh tokens are revoked when new ones are issued
- **Token Revocation**: Users can revoke all active sessions

### Session Security
- HttpOnly cookies prevent XSS attacks
- Signed cookies prevent tampering
- Secure flag enabled in production (HTTPS only)
- SameSite=strict prevents CSRF attacks

### Login Protection
- **Account Lockout**: 5 failed attempts locks account for 15 minutes
- **Rate Limiting**: 10 login attempts per 15 minutes per IP
- **Audit Logging**: All login attempts (successful and failed) are logged

## 2. Rate Limiting

Different rate limits for different endpoint types:

- **General API**: 500 requests per 15 minutes per IP
- **Authentication**: 10 attempts per 15 minutes per IP
- **Payment Operations**: 20 requests per 10 minutes per user/IP
- **Form Submissions**: 5 submissions per hour per IP
- **Admin Operations**: 200 requests per 5 minutes per user
- **Webhooks**: 100 calls per minute per IP

## 3. Input Validation & Sanitization

### MongoDB Injection Prevention
- `express-mongo-sanitize` removes `$` and `.` from user input
- All queries use parameterized operations
- Schema validation on all models

### XSS Protection
- Helmet security headers
- Content Security Policy (CSP) configured
- Input sanitization on all public endpoints
- Output escaping in responses

### HTTP Parameter Pollution (HPP)
- `hpp` middleware prevents duplicate parameters
- Query parameters validated and sanitized

## 4. Payment Security

### Razorpay Integration
- **Signature Verification**: All payment callbacks verified server-side
- **Webhook Security**: Webhook signatures validated
- **Replay Attack Prevention**: Webhook IDs tracked, duplicates rejected
- **Idempotency**: Idempotency keys required for payment operations
- **Amount Verification**: Payment amounts verified server-side (never trust client)

### PCI Compliance
- **No Card Data Storage**: Card details never touch our servers
- **Audit Logging**: All payment operations logged
- **Secure Transmission**: HTTPS required in production

## 5. Database Security

### Connection Security
- Connection string stored in environment variables
- MongoDB Atlas IP whitelist (restrict in production)
- Database user with least privilege permissions

### Query Security
- Mongoose schema validation
- Query timeouts prevent resource exhaustion
- Indexes for performance and security

### Data Protection
- Passwords hashed with bcrypt (cost factor: 12)
- Sensitive fields excluded from API responses
- Audit logs for all data changes

## 6. API Security

### CORS Configuration
- Strict origin whitelist
- Credentials enabled only for trusted origins
- Preflight requests cached for 24 hours

### Security Headers (Helmet)
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Browser XSS filter
- **Referrer-Policy**: Controls referrer information

### Request Security
- Request size limited to 1MB
- Request IDs for tracing
- User agent logging
- IP address logging

## 7. Intrusion Detection & Prevention

### Pattern Detection
Automatic blocking of suspicious patterns:
- Path traversal attempts (`../`, `/etc/`)
- SQL injection attempts (`UNION SELECT`, `DROP TABLE`)
- XSS attempts (`<script>`, `javascript:`, `onerror=`)
- Code injection attempts (`exec(`, `eval(`, `system(`)

### IP Blacklisting
- Automatic blacklisting on security violations
- Manual blacklist management available
- Whitelist option for restricted access

### Security Event Logging
All security events logged with:
- Event type (login_failed, security_violation, etc.)
- User ID (if authenticated)
- IP address
- User agent
- Timestamp
- Severity level

## 8. Audit Logging

### What We Log
- All authentication events (login, logout, token refresh)
- All data changes (create, update, delete)
- Payment operations (created, verified, failed)
- Security violations
- Admin operations

### Audit Log Fields
- Action (create, read, update, delete, etc.)
- Resource (user, lead, payment, system)
- Resource ID
- User ID and role
- IP address and user agent
- Changes (before/after)
- Success/failure
- Error message
- Severity level

### Retention Policy
- Audit logs retained for 365 days
- Critical severity logs retained indefinitely
- Automatic cleanup of old logs

## 9. Error Handling

### Error Responses
- Generic error messages to clients (no stack traces in production)
- Detailed errors logged server-side
- Consistent error format across all endpoints

### Error Logging
- All errors logged with context
- Critical errors create system issues
- Sensitive data redacted from logs

## 10. Environment Configuration

### Required Environment Variables

```env
# Environment
NODE_ENV=production

# Server
PORT=8080
CLIENT_ORIGIN=https://your-production-domain.com
PUBLIC_BASE_URL=https://your-production-domain.com

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/neurocogno
MONGODB_DB_NAME=neurocogno

# Secrets (Generate strong random values)
JWT_ACCESS_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<64-char-random-hex>
COOKIE_SECRET=<32-char-random-hex>

# Payment Gateway
RAZORPAY_KEY_ID=<live-key-id>
RAZORPAY_KEY_SECRET=<live-key-secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
BOOKING_AMOUNT_INR=499

# Admin Users (Change passwords immediately)
ADMIN_USERS_JSON=[{"name":"Admin","username":"admin","email":"admin@yourdomain.com","password":"CHANGE-ME","role":"developer"}]
```

### Generating Secrets

```bash
# Generate JWT secrets (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate cookie secret (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 11. Production Deployment Checklist

### Before Deployment
- [ ] Rotate all secrets (JWT, cookie, database password)
- [ ] Change default admin passwords
- [ ] Set NODE_ENV=production
- [ ] Update CLIENT_ORIGIN and PUBLIC_BASE_URL
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Add live Razorpay keys
- [ ] Configure Razorpay webhook URL
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Review audit log retention

### After Deployment
- [ ] Test authentication flow
- [ ] Test payment flow (both success and failure)
- [ ] Test webhook delivery
- [ ] Verify rate limiting works
- [ ] Check audit logs are being created
- [ ] Test admin dashboard access
- [ ] Verify HTTPS is enforced
- [ ] Check security headers
- [ ] Run security scan (OWASP ZAP, etc.)

## 12. Monitoring & Alerts

### What to Monitor
- Failed login attempts (alert after 10 in 5 minutes)
- Payment failures (alert on signature verification failures)
- Security violations (alert on any occurrence)
- Rate limit violations (alert after 100 in 1 hour)
- Database connection errors
- High error rates (>5% of requests)
- Unusual traffic patterns

### Recommended Tools
- **Application Monitoring**: New Relic, Datadog
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Log Aggregation**: LogDNA, Papertrail
- **Error Tracking**: Sentry
- **Security Scanning**: Snyk, OWASP Dependency-Check

## 13. Security Best Practices

### Regular Maintenance
- Update dependencies monthly
- Review audit logs weekly
- Rotate secrets quarterly
- Review access logs for suspicious activity
- Test backup and recovery procedures

### Incident Response
1. Detect: Monitor logs and alerts
2. Contain: Block malicious IPs, revoke compromised tokens
3. Investigate: Review audit logs, identify attack vector
4. Remediate: Patch vulnerabilities, update security measures
5. Document: Record incident details and lessons learned

### Code Review Checklist
- [ ] No secrets in code
- [ ] All inputs validated
- [ ] Authentication required for protected routes
- [ ] Authorization checks for role-based access
- [ ] Sensitive data not logged
- [ ] Error messages don't leak information
- [ ] Rate limiting applied appropriately
- [ ] Audit logging in place for critical operations

## 14. API Versioning

All API endpoints are under `/api/` prefix. Future versions will use `/api/v2/`, etc.

This ensures frontend changes don't break backend functionality.

## 15. Contact & Support

For security issues or questions:
- **Security Email**: security@neurocogno.com (create this)
- **Development Team**: developer@neurocogno.com

---

**Last Updated**: 2026-06-13
**Version**: 1.0.0

## 2026-08-27 Security And Production Hardening Update

This entry records current security-sensitive development notes without removing earlier security documentation.

### Development Mode Items To Review Before Launch
- Demo/admin credentials must be replaced with environment-managed credentials and stronger password policy.
- Development-only survey testing controls must not be visible in production.
- Local MongoDB/Compass use is for testing only; production should use hardened MongoDB Atlas configuration.
- Atlas access list should not remain broadly open unless there is a documented operational reason and compensating controls.
- CMS upload endpoints must enforce authentication, authorization, file type checks, file size limits, compression, safe filenames, and static serving rules.
- WhatsApp/contact redirect values should be controlled from the backend/CMS and audited when changed.
- Payment flow must use Razorpay server-side order creation, signature verification, webhook validation, idempotent updates, and reconciliation logging.

### Backup Direction
- Client-owned cloud backups are preferred over storing sensitive project backups on the developer machine.
- Final backup design should include encrypted exports, restricted access, restore testing, and documented recovery steps.


## 2026-08-27 Claude Architecture Review Follow-Up

Claude reviewed the DFD/spec and identified the highest-risk areas as route-level authorization, CMS content collisions, payment verification/idempotency, production credentials, upload validation, and audit trails.

### What Was Verified In Code
- Admin APIs are protected server-side with `requireAuth` and `requireRole('ceo', 'coo', 'developer')` in `server/src/routes/adminRoutes.js`.
- Admin uploads are protected because `/api/admin/site-media` sits behind the admin router authentication and role middleware.
- Payment order creation uses the server-side configured amount instead of trusting a frontend amount.
- Payment verification updates paid/confirmed state only after Razorpay signature verification succeeds.
- Payment signature failures create system issues and audit logs.
- Basic idempotency middleware exists for payment order and verification routes.
- Login attempt protection, audit logging, suspicious-pattern detection, and response sanitization utilities exist in server security middleware.

### What Was Improved After Review
- CMS create/replace behavior was hardened in `server/src/routes/adminRoutes.js`.
- New CMS writes now resolve a scoped slot using `section + type + placement + order` when those fields are available.
- This reduces the risk that carousel/photo-wall/content uploads append to the wrong visual area or replace the wrong section.
- The generated `key` remains useful, but slot replacement no longer depends only on a timestamp-style key.

### Remaining Production Risks
- CMS model still has only a unique `key` at schema level. A future migration should add a formal `slotKey` or compound unique index after existing data is cleaned.
- Razorpay webhook idempotency is currently memory-based. Production should persist processed webhook event IDs in MongoDB to survive server restarts.
- Payment model indexes should be reviewed for uniqueness/sparse behavior around provider order/payment IDs.
- Client-side image compression is helpful, but server-side image transformation and MIME sniffing should be added before production.
- Development admin credentials must be replaced before launch.
- Development-only survey controls must be disabled before launch.
- Media storage can launch locally only if backed up, but S3/Cloudinary/R2 is recommended before scale.

### Immediate Next Best Actions
- Add persistent webhook event storage.
- Add a CMS `slotKey` field and migration/cleanup script.
- Add server-side image compression and MIME validation.
- Confirm no frontend/admin route can directly mark payment as paid except verified server/payment flow.
- Add audit logs for CMS create/update/delete/hide/publish operations, not only lead operations.


## 2026-08-27 Critical Payment Webhook Idempotency Fix

Claude correctly escalated the Razorpay webhook idempotency issue from important to critical. The previous implementation used process-local memory for replay prevention, which is not safe across deploys, crashes, restarts, or multiple server instances.

### Completed Fix
- Added `server/src/models/WebhookEvent.js`.
- Razorpay webhook processing now creates a MongoDB-backed webhook event record before processing a valid webhook.
- `eventId` is unique, so duplicate Razorpay webhook deliveries are acknowledged without reprocessing payment state.
- Invalid webhook signatures are still rejected and logged as critical payment issues.
- Existing captured payments are reconciled without repeating the one-shot lead paid/confirmed transition.
- Failed webhook processing marks the webhook event as failed for later inspection.
- Old memory-only webhook replay tracking was removed from `server/src/routes/paymentRoutes.js`.

### Why This Matters
- Razorpay can retry webhook events normally.
- A server restart or rolling deploy must not allow the same payment event to mutate records twice.
- Payment-state transitions affect money and client trust, so this is now treated as launch-critical infrastructure rather than a nice-to-have.

### Remaining Payment Hardening
- Add an admin table/view for persisted webhook events if operational visibility is required.
- Consider a cleanup/retention policy for old webhook events after audit requirements are decided.
- Review payment indexes for provider order/payment uniqueness once Razorpay live mode is connected.


## 2026-08-27 Production Hardening Follow-Up After Claude Priority Reorder

Claude's priority order was accepted. Two high-value hardening tasks were completed immediately.

### Completed: Production Credential Guardrails
- Development seed admins may still exist for local development.
- Production startup now blocks default weak/local admin credentials.
- Production startup also blocks default development JWT/cookie secrets.
- `ADMIN_USERS_JSON` must contain final CEO, COO, and developer accounts with real emails and strong passwords before production can start.

### Completed: CMS Slot Identity Hardening
- Added `slotKey` to `SiteContent`.
- `slotKey` is generated from `section + type + placement + order`.
- Added unique indexes for scoped CMS placement identity.
- Admin CMS upsert logic now targets `slotKey` where possible, matching the backend route behavior to the database invariant.
- This hardens carousel/card/media replacement so each editable website canvas behaves independently unless intentionally linked.

### Verified
- `node --check server/src/config/env.js` passed.
- `node --check server/src/models/SiteContent.js` passed.
- `node --check server/src/routes/adminRoutes.js` passed.
- Client `npm run build` passed.

### Next Remaining Items
- CMS audit logs for create/update/delete/hide/publish.
- Server-side MIME sniffing and image validation beyond client-side compression.
- Final production admin credentials still need to be supplied by the client/team.


## 2026-08-30 Atlas Production User And IP Allowlist Plan

Added `ATLAS_PRODUCTION_SETUP.md` for production MongoDB Atlas hardening.

Important:
- The application already uses `MONGODB_URI` and `MONGODB_DB_NAME`, so production database routing is controlled by deployment secrets.
- Production should use one dedicated database: `neurocogno_prod`.
- Production should use a dedicated least-privilege app DB user, for example `neurocogno_app_prod`, with `readWrite` only on `neurocogno_prod`.
- Atlas Network Access should allow only the backend deployment static outbound IP or a private endpoint/VPC connection.
- Temporary `0.0.0.0/0` access must be removed before handover unless explicitly documented as a temporary deploy window.

Blocked until deploy-time details exist:
- Final Atlas project access or Atlas CLI/API credentials.
- Final deployment host/static outbound IP.
- Production secret manager values.

## 2026-09-06 Pre-Handover Audit, Mobile, SEO, And Security Update

- Added route-specific SEO metadata and structured data for Insight Hub, Workshops & Events, and Services so those public routes no longer inherit homepage SEO.
- Updated sitemap coverage for all public routes: home, about, services, insight, workshops, and collaborations.
- Added a mobile-only UI refinement layer for small screens covering header/nav, hero, grids, cards, forms, popups, admin tables, and footer behavior without changing backend orchestration.
- Gated `/api/dev` so developer routes are not registered when `NODE_ENV=production`.
- Added a temporary local/client-preview admin seed account through `.env` only; this must be removed or disabled before final public launch.
- Resolved dependency audit findings by forcing `qs@6.16.0`; `npm audit --audit-level=high` now reports zero vulnerabilities.
- Verification completed: `npm run check`, `npm run build`, and `npm audit --audit-level=high` all pass.
- Created `PRE_HANDOVER_DEEP_AUDIT_2026-09-06.md` with the current SEO/security/payment/database/mobile readiness status and remaining deploy-time checklist.
