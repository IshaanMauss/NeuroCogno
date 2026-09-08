# NeuroCogno Project Status And Production Notes

Last updated: 2026-06-09

## Current Mode

This project is currently in development/testing mode.

For current local testing, the backend is pointed to local MongoDB at `mongodb://127.0.0.1:27017/neurocogno` so the database can be inspected in MongoDB Compass.

Earlier Atlas testing was verified successfully, but production deployment should move back to a secured cloud MongoDB Atlas database or another managed production database.

## Current Local URLs

- Public website: `http://127.0.0.1:5173/`
- Admin dashboard: `http://127.0.0.1:5173/admin`
- Backend API: `http://127.0.0.1:8080`
- Backend health: `http://127.0.0.1:8080/api/health`

## Current Admin Users

Temporary admin users are seeded into MongoDB:

- Developer: `ishaan` / `555879`
- CEO: `ceo` / `555879`
- COO: `coo` / `555879`

Production change required:

- Replace all temporary passwords.
- Use strong password rules.
- Add password reset/change flow.
- Add login attempt tracking and account lockout.
- Prefer proper email IDs for CEO/COO/developer accounts.

## Database

Only one MongoDB database is needed right now:

```txt
Database name: neurocogno
```

The backend reads and writes to this database.

Current local testing connection:

```txt
mongodb://127.0.0.1:27017/neurocogno
```

Open the same database in MongoDB Compass using:

```txt
mongodb://127.0.0.1:27017
```

Admin dashboard flow:

```txt
Admin Dashboard -> Express API -> MongoDB neurocogno database
```

## MongoDB Collections

### `users`

Stores admin users:

- CEO
- COO
- Developer

### `leads`

Stores all customer/contact data:

- Survey popup callback leads
- Direct appointment form leads
- Incomplete leads who typed name + phone/email but did not submit
- Manual edits by CEO/COO/developer
- Confirmed client state
- Archived state
- Internal remarks
- Alternate phone/email
- Payment status linked to the customer

### `payments`

Stores payment records:

- Razorpay order ID
- Razorpay payment ID
- Payment amount
- Payment status
- Signature verification status
- Failure reason if payment fails

### `visitorevents`

Stores real visitor/traffic events:

- Page view
- Section view
- Navbar click
- CTA click
- Form focus
- Payment opened

### `systemissues`

Stores real system/payment/server problems:

- Payment gateway not configured
- Payment signature verification failed
- Payment webhook signature failed
- Server/API error
- Database problem
- Security/problem events added later

## Admin Dashboard Status

Admin dashboard is not dummy. It reads real MongoDB records from the backend API.

Current lead tabs:

- Survey Bookings
- Direct Bookings
- Collaboration Enquiries
- Incomplete Leads
- Confirmed Clients
- Archived Leads
- Website Health
- Server & Payment Issues

Current CRM features:

- Search by name, phone, email, alternate phone/email, reason, and remarks
- Edit lead details
- Add alternate phone/email
- Add internal remarks
- Confirm a lead
- Archive a lead with reason
- Paid leads automatically appear in Confirmed Clients
- Archived leads are hidden from active lead tabs
- Admin updates emit real-time refresh events

## Product Lifecycle Notes

This file is the running product lifecycle note for the project. Keep it updated whenever a real feature, production dependency, security decision, database change, SEO change, or deployment assumption changes.

Current lifecycle state:

- Public website, admin dashboard, local MongoDB testing, lead CRM, collaboration enquiries, SEO base layer, and Razorpay structure are implemented in development mode.
- Production deployment is not complete yet because final hosting, production database access rules, live Razorpay keys, legal pages, email domain setup, backup policy, and external monitoring still need client approval.
- Local development runs through Vite/backend processes. A production website must run through a deployed server or managed hosting platform so it remains available 24/7.

Lifecycle rule for future changes:

- Every client-facing feature should be connected to real backend/database behavior before being treated as complete.
- Any temporary test value, local URL, relaxed IP rule, password, placeholder media, or dummy content must be documented here until replaced.
- Admin dashboard changes must include how data is stored, searched, edited, confirmed, archived, and recovered.
- Payment, security, backup, and SEO changes should be tested and then recorded here.

## Current Payment Gateway Design

Payment provider planned/currently wired:

```txt
Razorpay
```

Current status:

- Razorpay integration structure exists.
- Order creation route exists.
- Client payment verification route exists.
- Webhook verification route exists.
- Payment gateway keys are not filled yet.

Required `.env` values:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
BOOKING_AMOUNT_INR=499
```

Payment flow:

```txt
Customer submits appointment/survey
Backend creates lead in MongoDB
Customer clicks Pay Securely
Backend creates Razorpay order
Razorpay checkout opens in browser
Customer pays using Razorpay
Razorpay collects money into the merchant Razorpay account
Razorpay sends payment result
Backend verifies payment signature
Backend marks lead/payment as paid if verification succeeds
Razorpay settles money to the merchant bank account configured in Razorpay
Admin dashboard shows paid/confirmed client
```

Important:

- Our website/server does not receive card/UPI/bank details.
- Our server should never store card details.
- Money goes first to the Razorpay merchant account.
- Razorpay settles the money to the bank account configured in Razorpay.
- The receiving bank account is controlled inside the Razorpay dashboard, not in this codebase.

## Current Development/Test Settings That Must Change For Production

### MongoDB Atlas IP Access

Current/testing when using Atlas:

```txt
0.0.0.0/0
```

This allows any IP address to attempt connection if credentials are known.

Production required:

- Restrict Atlas IP access to the deployed backend server IP.
- If using Render/Railway/VPS, use the correct static outbound IP if available.
- If static IP is not available, use provider-specific secure networking where possible.

Current local MongoDB testing does not use Atlas IP access because the database runs on this machine.

### MongoDB Credentials

Current:

- Real MongoDB URI is stored in local `.env`.
- The password was shared during development.

Production required:

- Rotate MongoDB database user password before deployment.
- Do not commit `.env`.
- Store secrets only in deployment provider environment variables.
- Use a database user with least required permissions.

### JWT And Cookie Secrets

Current:

- Development placeholder secrets are used.

Production required:

- Generate long random secrets.
- Use different secrets for access token, refresh token, and cookie signing.
- Never expose these in frontend code.

### Admin Passwords

Current:

- Temporary password `555879`.

Production required:

- Replace with strong passwords.
- Add regex/password policy.
- Add forced password change on first login.
- Add forgot password/reset flow later.

### Environment Mode

Current:

```env
NODE_ENV=development
```

Production required:

```env
NODE_ENV=production
```

Production mode should enable stricter cookies, security headers, and deployment behavior.

### Client And Server URLs

Current:

```env
CLIENT_ORIGIN=http://127.0.0.1:5173
PUBLIC_BASE_URL=http://127.0.0.1:5173
```

Production required:

```env
CLIENT_ORIGIN=https://your-production-domain.com
PUBLIC_BASE_URL=https://your-production-domain.com
```

### Payment Gateway

Current:

- Razorpay keys are empty.

Production required:

- Add live Razorpay keys only in production environment variables.
- Add webhook URL in Razorpay dashboard.
- Verify webhook secret.
- Test payment success, failure, cancel, duplicate callback, and webhook retry.

### Consent, Privacy, And Legal Text

Current:

- Basic consent text exists.

Production required:

- Add proper privacy policy.
- Add terms and conditions.
- Add counselling/mental-health disclaimer.
- Make incomplete-lead capture legally clear and approved by the client.

### Monitoring And Issue Logging

Current:

- Server errors can be stored in `systemissues`.
- Payment signature/webhook problems are stored.
- Health endpoint exists.

Production required:

- Add database disconnect logging.
- Add request timeout logging.
- Add failed login logging.
- Add rate-limit/security event logging.
- Add admin issue resolve/unresolve action.
- Add email/SMS alert for critical issues.
- Add uptime monitoring from outside the server.

### Logs

Current:

- Backend logger exists.
- Some problems are stored in MongoDB.

Production required:

- Centralized logs or deployment logs should be retained.
- Logs should not expose secrets, passwords, full tokens, or payment secrets.
- Admin dashboard should show human-readable issue messages.

## Known Next Improvements

- Replace browser prompt boxes for Confirm/Archive with polished modals.
- Add audit history for every admin edit.
- Add role-specific permissions if CEO/COO/developer should have different access levels.
- Add CSV export for leads/payments.
- Add date filters.
- Add payment retry flow.
- Add proper production Razorpay testing.
- Add automated tests for auth, lead edit, archive, confirm, payment verification, and webhook verification.

## SEO Status

Current SEO work added:

- Base title and meta description.
- Niche-focused keywords for counselling, mental wellness, anxiety support, stress management, relationship counselling, child/teen/adult/senior counselling, parent guidance and collaborations.
- Open Graph tags for social sharing.
- Twitter card tags.
- Canonical URLs.
- Route-specific SEO for home and collaboration page.
- JSON-LD structured data for Organization, WebSite, ProfessionalService, WebPage and Service.
- `robots.txt`.
- `sitemap.xml`.
- `site.webmanifest`.
- Admin and API routes blocked in `robots.txt`.
- Dedicated SEO implementation notes added in `SEO_IMPLEMENTATION_NOTES.md`.

Production SEO tasks still required:

- Confirm final domain. Current SEO files assume `https://neurocogno.com/`.
- Add Google Search Console.
- Add Bing Webmaster Tools if needed.
- Submit sitemap after deployment.
- Add real OG/social preview image, ideally a polished 1200x630 brand image.
- Add location pages later for city/local SEO.
- Add real blog pages with unique URLs, not only moving preview cards.
- Add real collaboration detail pages if collaborations become public case studies.
- Add privacy policy, terms, and mental-health disclaimer pages.
- Add analytics only after privacy/consent decision is approved.

Important SEO files:

- `client/index.html` for base HTML SEO, social tags, favicon/logo links, and Organization JSON-LD.
- `client/src/main.jsx` for route-specific React SEO updates for `/` and `/collaborations`.
- `client/public/robots.txt` for crawler allow/block rules.
- `client/public/sitemap.xml` for submitted public URLs.
- `client/public/site.webmanifest` for install/browser metadata.
- `SEO_IMPLEMENTATION_NOTES.md` for exact SEO implementation details and remaining work.

## Production Deployment Checklist

Before real client launch:

- Rotate MongoDB password.
- Restrict MongoDB IP access.
- Set `NODE_ENV=production`.
- Replace all JWT/cookie secrets.
- Replace temporary admin passwords.
- Fill real business phone/email/address.
- Add real Razorpay live keys.
- Configure Razorpay webhook URL.
- Add privacy policy, terms, and disclaimer.
- Test user form submission.
- Test incomplete lead capture.
- Test survey popup lead capture.
- Test admin search/edit/confirm/archive.
- Test payment success/failure.
- Test webhook success/failure.
- Test server health dashboard.
- Test mobile and desktop UI.
- Enable deployment logs and external uptime monitoring.

## 2026-08-27 Product Lifecycle Update

This entry records the latest implementation direction without replacing prior notes.

### Current Product Shape
- Public website: separate routed pages for About Us, NeuroCogno Insight, Workshops & Events, Collaboration, and Services.
- Admin panel: CRM + CMS dashboard for lead operations, website content/media, health/traffic, and operational logs.
- Database target: MongoDB remains the main application database. Local MongoDB/Compass is used for development testing; Atlas is the production target when deployment configuration is finalized.
- CMS goal: client/admin should be able to replace photos, captions, video links, contact redirect values, hero media, insight cards, event cards, and collaboration content without code edits.

### Lead And CRM Rules
- Survey popup leads must save all answered questions and callback details.
- Appointment/direct leads must save all submitted fields.
- Incomplete draft leads should capture usable partial data when name plus phone/email exists, even if the final submit action is not completed.
- Admin users should be able to search by name, number, email, reason, status, payment state, or remarks.
- Admin users should be able to update missing fields manually, confirm clients, archive records, and add remarks.
- Confirmed/Paid and Archived records should reflect real state transitions, not duplicate dummy counters.

### CMS And Media Rules
- Every editable visual canvas should be independent unless explicitly linked.
- Insight photo wall cards, insight visual canvas cards, workshop cards, collaboration cards, homepage hero image, founder/CEO image, YouTube/video links, and WhatsApp redirect values should each have clear CMS placement options.
- CMS forms should show only the fields required for the selected placement, with required fields marked clearly.
- Images should be compressed automatically during upload for production usability, with sensible maximum limits and helpful warnings.

### Production Checklist Still Pending
- Replace development credentials and hardcoded fallback values.
- Configure Razorpay live keys, webhook secret, signature verification, and payment reconciliation.
- Finalize MongoDB Atlas IP/access list, users, least-privilege permissions, and backup plan.
- Remove development-only survey trigger controls before final client delivery.
- Add production logging/alerting for server errors, payment failures, upload failures, and suspicious request patterns.
- Run full responsive QA on common laptop, desktop, tablet, and mobile viewport sizes.


## 2026-08-27 Admin Panel UI/UX Update

This dated note records admin-side improvements after the public page canvas refinements.

- Admin shell now follows the same warm slate blue / muted terracotta visual language as the public website.
- Sidebar, user profile card, active tab states, search toolbar, metric cards, tables, CMS library, content groups, editor modals, form fields, previews, and toast surfaces were polished with rounded corners, softer contrast, and clearer spacing.
- Website Media & Text remains compact by default: items are grouped by website area, cards expand on click, and actions remain visible only when needed.
- CMS controls continue to support add/replace, hide/publish, delete permanently, image preview, required-field guidance, placement keys, and automatic upload/compression workflow.
- Dark mode admin readability was refined so text, table rows, modals, inputs, and cards remain visible.
- This was a UI refinement pass only. Existing admin data flow, RBAC, lead syncing, CMS API wiring, upload pipeline, and public rendering logic were not intentionally changed.


## 2026-08-27 Admin Open-Canvas UI Decision

After reviewing the admin visual structure, the large central white workspace was reduced. The admin now follows an open-canvas pattern closer to the public Insight, Collaboration, Workshops, and Services pages.

Decision:
- Keep the sidebar, metric cards, CMS groups, tables, editor modals, and action surfaces as readable glass/card elements.
- Remove the unnecessary giant central white board behind the entire admin content area.
- Let the admin workspace connect directly with the page background while preserving clarity for high-density CRM and CMS work.

Reason:
- Admin users need structure, but not an extra white frame around every tab.
- Functional blocks such as tables, CMS cards, and forms still need visible surfaces for scanning, editing, and scalability.
- This gives a more premium product feel without reducing admin productivity.


## 2026-08-27 Admin Server / Payment Log Pagination Update

Server / Payment Logs were updated for operational scalability.

- Log records now render inside an admin data panel with its own internal scroll area.
- Pagination was added so large log history does not force the full browser page to become excessively long.
- The table header remains sticky inside the scrollable panel.
- Severity values now display as compact status pills for faster scanning.
- This change is frontend/admin usability only; server logging and payment issue pipelines were not changed.


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


## 2026-08-27 About Section UI Alignment

The homepage About section was updated to match the newer public-page visual direction.

- Reworked the About block from a plain two-column strip into an open-canvas section.
- Added a compact supporting care-notes panel for confidentiality, matching support, and gentle follow-up.
- Matched the rounded, warm slate blue / muted terracotta theme used on Insight, Workshops, Collaboration, Services, and admin surfaces.
- Added dark-mode-specific styling so the section remains readable.
- This was a frontend UI-only change; backend, CMS, payment, routing, and admin data flow were not changed.


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


## 2026-08-30 Therapy Comfort UI Refinement

A no-redesign UI refinement pass was added across the public website and admin panel.

Scope:
- Kept the existing color palette, theme direction, button identity, routing, backend, payment, CMS, and admin orchestration unchanged.
- Added smoother hover, active, focus-visible, modal-entry, image-hover, and card feedback states.
- Improved spacing rhythm, scroll margins, internal text wrapping, table hover readability, dense admin surfaces, and mobile comfort behavior.
- Added reduced-motion handling so users who prefer less animation are respected.
- Rechecked core orchestration references during the pass: CMS realtime listeners, `slotKey`, admin auth/RBAC, CMS upload route, payment status flow, and webhook event model references remain present.

Reason:
- The website is for therapy/counselling users, so interactions should feel calm, understandable, and reassuring without changing the approved visual identity.


## 2026-08-30 P0 Upload And Payment Hardening

Implemented the next production-risk hardening items after the security review.

Completed:
- CMS media uploads now reject SVG by validator allowlist and no longer trust the browser-declared MIME type.
- Server now decodes the submitted image payload, detects the real file type with `file-type`, accepts only PNG/JPEG/WebP bytes, re-encodes accepted images through `sharp`, and stores generated `.webp` filenames using `crypto.randomUUID()` instead of client filenames.
- CMS upload output is capped to 2 MB after server-side normalization/compression; oversized or unsupported payloads return generic client-safe errors.
- Razorpay webhook processing keeps DB-backed idempotency and now uses conditional atomic payment update logic for the captured transition before moving the lead to paid/confirmed.
- Dependency audit was run and `npm audit fix` reduced reported vulnerabilities to zero.

Verification:
- `npm run check` passed.
- `npm run build` passed.
- `npm audit --audit-level=high` initially found high/critical dependency issues; after non-force audit fix, `npm audit` reported zero vulnerabilities.

Still deploy-time/config items:
- Production admin credentials and secrets must be set in the deployment secret manager.
- Production TLS/HTTPS, Cloudflare/WAF, and MongoDB Atlas IP allowlist must be configured during deployment.

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
