# API DOCUMENTATION

## Base URL

- **Development**: `http://127.0.0.1:8080/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT-based authentication with both access and refresh tokens.

### Cookies Used
- `nc_access`: Short-lived access token (20 minutes)
- `nc_refresh`: Long-lived refresh token (7 days)
- `csrf_token`: CSRF protection token

### Headers

For authenticated requests, include one of:
- Cookie-based (automatic from browser)
- Header-based: `Authorization: Bearer <access_token>`

For state-changing operations (POST, PATCH, DELETE):
- `X-CSRF-Token`: CSRF token received from login

For payment operations:
- `Idempotency-Key`: Unique key to prevent duplicate operations

## Rate Limits

Different endpoints have different rate limits:

- **Auth endpoints**: 10 requests per 15 minutes
- **Payment endpoints**: 20 requests per 10 minutes
- **Form submissions**: 5 requests per hour
- **Admin endpoints**: 200 requests per 5 minutes
- **General API**: 500 requests per 15 minutes

Rate limit headers returned in response:
- `RateLimit-Limit`: Request limit
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets

## Response Format

### Success Response
```json
{
  "user": { ... },
  "items": [ ... ],
  "item": { ... }
}
```

### Error Response
```json
{
  "message": "Error description"
}
```

## Authentication Endpoints

### POST /api/auth/login

Login with username/email and password.

**Request:**
```json
{
  "identifier": "username or email",
  "password": "password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "username": "username",
    "email": "email@example.com",
    "role": "ceo|coo|developer",
    "lastLoginAt": "2026-06-13T10:00:00.000Z"
  },
  "csrfToken": "csrf_token_here",
  "activeSessionCount": 2
}
```

**Errors:**
- `401`: Invalid credentials
- `429`: Too many login attempts (account locked)

**Notes:**
- Sets `nc_access`, `nc_refresh`, and `csrf_token` cookies
- Account locks after 5 failed attempts for 15 minutes

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:** No body (uses `nc_refresh` cookie)

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "username": "username",
    "email": "email@example.com",
    "role": "ceo|coo|developer"
  }
}
```

**Errors:**
- `401`: Invalid or expired refresh token

**Notes:**
- Old refresh token is revoked
- New access and refresh tokens issued

---

### POST /api/auth/logout

Logout and revoke all tokens.

**Request:** No body

**Response (200):**
```json
{
  "ok": true
}
```

**Notes:**
- Requires authentication
- Revokes all user's refresh tokens
- Clears all auth cookies

---

### GET /api/auth/me

Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "username": "username",
    "email": "email@example.com",
    "role": "ceo|coo|developer",
    "lastLoginAt": "2026-06-13T10:00:00.000Z"
  },
  "activeSessionCount": 2
}
```

**Errors:**
- `401`: Not authenticated

---

### POST /api/auth/revoke-all

Logout from all devices (revoke all sessions).

**Response (200):**
```json
{
  "ok": true,
  "revokedSessions": 3
}
```

**Notes:**
- Requires authentication
- Revokes all refresh tokens across all devices

---

## Public Endpoints

### POST /api/public/leads

Create a new lead (form submission).

**Rate Limit**: 5 per hour per IP

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "preferredDate": "2026-06-20",
  "preferredTime": "10:00 AM",
  "reason": "Anxiety counselling",
  "source": "appointment_form|survey_popup|collaboration_inquiry",
  "status": "submitted|draft"
}
```

**Response (201):**
```json
{
  "id": "lead_id"
}
```

**Errors:**
- `400`: Invalid input data
- `429`: Rate limit exceeded

**Notes:**
- Email and phone formats validated server-side
- All input sanitized
- IP address and user agent logged for security

---

### POST /api/public/visitor-events

Track visitor events (analytics).

**Request:**
```json
{
  "eventType": "page_view|section_view|cta_click|form_focus",
  "page": "/",
  "section": "hero",
  "metadata": {
    "additional": "data"
  }
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

## Payment Endpoints

### GET /api/payments/config

Get payment gateway configuration.

**Response (200):**
```json
{
  "configured": true,
  "keyId": "rzp_live_XXXXXXXXXXXX",
  "amount": 49900,
  "currency": "INR"
}
```

---

### POST /api/payments/orders

Create a payment order.

**Rate Limit**: 20 per 10 minutes

**Headers Required:**
- `Idempotency-Key`: Unique key (e.g., UUID)

**Request:**
```json
{
  "leadId": "lead_id"
}
```

**Response (201):**
```json
{
  "orderId": "order_XXXXXXXXXXXX",
  "amount": 49900,
  "currency": "INR",
  "keyId": "rzp_live_XXXXXXXXXXXX",
  "leadId": "lead_id"
}
```

**Errors:**
- `400`: Missing idempotency key or amount mismatch
- `404`: Lead not found
- `409`: Request already processing
- `429`: Rate limit exceeded
- `503`: Payment gateway not configured

**Notes:**
- Amount verified server-side (never trust client)
- Idempotent operation (same key returns same response)

---

### POST /api/payments/verify

Verify payment after Razorpay callback.

**Headers Required:**
- `Idempotency-Key`: Unique key (e.g., UUID)

**Request:**
```json
{
  "leadId": "lead_id",
  "razorpay_order_id": "order_XXXXXXXXXXXX",
  "razorpay_payment_id": "pay_XXXXXXXXXXXX",
  "razorpay_signature": "signature_here"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: Signature verification failed
- `404`: Payment record not found

**Notes:**
- Signature verified server-side
- Lead automatically marked as confirmed on success

---

### POST /api/payments/webhook

Razorpay webhook endpoint (internal use only).

**Notes:**
- Signature verified
- Replay attacks prevented
- Not for direct frontend use

---

## Admin Endpoints

**All admin endpoints require authentication and appropriate role.**

### GET /api/admin/metrics

Get dashboard metrics.

**Response (200):**
```json
{
  "totalLeads": 150,
  "surveyCallbacks": 50,
  "directBookings": 80,
  "collaborations": 20,
  "incompleteLeads": 30,
  "confirmedClients": 100,
  "archivedLeads": 20,
  "totalPayments": 100,
  "totalRevenue": 4990000,
  "systemIssues": 2
}
```

---

### GET /api/admin/survey-callbacks

Get survey callback leads.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `q` (search query)

**Response (200):**
```json
{
  "items": [
    {
      "_id": "lead_id",
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john@example.com",
      "source": "survey_popup",
      "status": "survey_callback",
      "createdAt": "2026-06-13T10:00:00.000Z",
      ...
    }
  ]
}
```

---

### GET /api/admin/submitted-appointments

Get submitted appointment leads.

**Query Parameters:** Same as survey-callbacks

---

### GET /api/admin/collaboration-inquiries

Get collaboration inquiry leads.

---

### GET /api/admin/incomplete-leads

Get incomplete/draft leads.

---

### GET /api/admin/confirmed-leads

Get confirmed client leads.

---

### GET /api/admin/archived-leads

Get archived leads.

---

### PATCH /api/admin/leads/:id

Update a lead.

**Headers Required:**
- `X-CSRF-Token`: CSRF token from login

**Request:**
```json
{
  "name": "Updated Name",
  "phone": "+919876543210",
  "email": "updated@example.com",
  "alternatePhone": "+919876543211",
  "alternateEmail": "alternate@example.com",
  "internalRemarks": "Internal notes",
  "lifecycleStatus": "active|confirmed|archived"
}
```

**Response (200):**
```json
{
  "item": { updated lead object }
}
```

**Notes:**
- All changes logged in audit trail
- Real-time update sent to other admins

---

### POST /api/admin/leads/:id/confirm

Confirm a lead.

**Headers Required:**
- `X-CSRF-Token`: CSRF token

**Request:**
```json
{
  "remarks": "Optional confirmation note"
}
```

**Response (200):**
```json
{
  "item": { confirmed lead object }
}
```

---

### POST /api/admin/leads/:id/archive

Archive a lead.

**Headers Required:**
- `X-CSRF-Token`: CSRF token

**Request:**
```json
{
  "archiveReason": "Reason for archiving",
  "remarks": "Optional remarks"
}
```

**Response (200):**
```json
{
  "item": { archived lead object }
}
```

---

### GET /api/admin/leads/:id/audit

Get audit trail for a specific lead.

**Response (200):**
```json
{
  "items": [
    {
      "action": "update",
      "userId": {
        "name": "Admin Name",
        "role": "developer"
      },
      "changes": {
        "before": { ... },
        "after": { ... }
      },
      "timestamp": "2026-06-13T10:00:00.000Z",
      "ip": "192.168.1.1"
    }
  ]
}
```

---

### GET /api/admin/payments

Get all payment records.

**Query Parameters:**
- `page`, `limit`

---

### GET /api/admin/traffic

Get visitor event records.

---

### GET /api/admin/issues

Get system issues.

---

## WebSocket Events

**Connection URL**: `ws://your-domain.com` (or wss:// for production)

**Authentication**: Uses `nc_access` cookie

### Server → Client Events

**Event**: `admin:update`

Sent when admin data changes (new lead, payment, etc.)

**Payload:**
```json
{
  "type": "lead:created|lead:updated|payment:created|payment:paid|payment:failed|payment:webhook",
  "data": {
    "leadId": "lead_id",
    "paymentId": "payment_id",
    "action": "edit|confirm|archive"
  }
}
```

**Usage:**
```javascript
socket.on('admin:update', (payload) => {
  // Refresh relevant admin dashboard section
});
```

---

## Error Codes

- `400`: Bad Request (invalid input)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate/already processing)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (payment gateway not configured)

---

## Security Best Practices for Frontend

1. **Never store secrets in frontend code**
   - API keys, secrets belong in backend only

2. **Always use HTTPS in production**
   - Cookies are secure-only in production

3. **Handle 401 responses**
   - Redirect to login on 401
   - Try token refresh before redirecting

4. **Include CSRF token**
   - Get from login response
   - Include in all POST/PATCH/DELETE requests

5. **Handle rate limits**
   - Check rate limit headers
   - Show user-friendly messages
   - Implement client-side throttling

6. **Validate input client-side**
   - But always expect server-side validation
   - Match server validation rules

7. **Don't trust client-side validation alone**
   - Server always validates everything

8. **Use idempotency keys for payments**
   - Generate UUID for each payment operation
   - Prevents duplicate charges

---

## Integration Examples

### Login Flow

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: include cookies
  body: JSON.stringify({
    identifier: 'username',
    password: 'password'
  })
});

const { user, csrfToken } = await response.json();
// Store CSRF token for later use
localStorage.setItem('csrfToken', csrfToken);
```

### Authenticated Request

```javascript
const response = await fetch('/api/admin/metrics', {
  method: 'GET',
  credentials: 'include' // Include cookies
});

if (response.status === 401) {
  // Try to refresh token
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  if (refreshResponse.ok) {
    // Retry original request
  } else {
    // Redirect to login
  }
}
```

### Payment Flow

```javascript
// Step 1: Create order
const orderResponse = await fetch('/api/payments/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID() // Generate unique key
  },
  credentials: 'include',
  body: JSON.stringify({ leadId: 'lead_id' })
});

const { orderId, amount, keyId } = await orderResponse.json();

// Step 2: Open Razorpay checkout
const options = {
  key: keyId,
  amount: amount,
  currency: 'INR',
  order_id: orderId,
  handler: async function(response) {
    // Step 3: Verify payment
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID()
      },
      credentials: 'include',
      body: JSON.stringify({
        leadId: 'lead_id',
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      })
    });
    
    if (verifyResponse.ok) {
      // Payment successful
    }
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

---

**Last Updated**: 2026-06-13
**API Version**: 1.0

## 2026-08-27 API And Data Flow Update

This note is appended to keep API documentation aligned with the current product direction.

### Current API Areas Used By The Product
- Authentication and RBAC for admin access.
- Lead capture for survey popup submissions, appointment form submissions, saved/incomplete draft leads, collaboration enquiries, confirmed clients, and archived records.
- Manual admin updates for lead fields, remarks, payment state, confirmation state, and archive state.
- CMS/media management for website content keys, page placement, images, captions, text values, YouTube/video links, redirect values, publish/hide state, and delete/replace operations.
- Visitor event recording for operational visibility and future analytics.
- System issue logging for server errors, payment failures, upload failures, validation errors, and suspicious admin/API behavior.

### API Documentation TODO
- Confirm exact endpoint list from server routes before production handoff.
- Document request/response examples for lead creation, lead update, archive, confirm, CMS item create/update/delete, upload, and payment verification.
- Document authentication headers, token lifetime, role permissions, rate limits, and error response format.


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

