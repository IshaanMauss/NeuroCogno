# NeuroCogno Hardening Pass — Claude Log (2026-09-07)

Scope of this pass: backend security/scalability/DB, verified against `CLAUDE_REVIEW_BRIEF_2026-09-06.md`,
`PRE_HANDOVER_DEEP_AUDIT_2026-09-06.md`, and `PROJECT_STATUS_AND_PRODUCTION_NOTES.md`, then double-checked
directly against the actual source (not just the MD claims). No pipeline/orchestration behavior was changed.
Razorpay live/webhook verification is intentionally deferred to last, per instruction.

## Verified TRUE against code (no action needed)
- Admin router applies `requireAuth` + `requireRole('ceo','coo','developer')` globally
  (`server/src/routes/adminRoutes.js:118`), not per-route — RBAC cannot be bypassed by adding a new admin route.
- `/api/dev` is only mounted when `NODE_ENV !== 'production'` (`server.js`).
- Cookies (`nc_access`, `nc_refresh`, `csrf_token`) are `httpOnly`, `sameSite: 'strict'`, `secure` in production,
  and signed. Refresh cookie is scoped to `/api/auth` only.
- Razorpay webhook: signature verified before any state change, `WebhookEvent` unique-index insert acts as a
  distributed lock (duplicate key -> early 200 OK without reprocessing), captured-state transition uses a guarded
  `findOneAndUpdate({status:{$ne:'captured'}})`, and lead payment flip is itself guarded
  (`paymentStatus:{$ne:'paid'}`). This is race-safe under concurrent/duplicate webhook delivery.
- CMS (`SiteContent`) already has the compound unique index on `slotKey` and on
  `{section,type,placement,order}`, plus non-unique indexes for the common read patterns and a text index.
  The "add compound unique index" P1 item from the audit docs is already done in code.
- `Lead` and `Payment`/`WebhookEvent` models already carry the indexes the audit docs asked for
  (status/date, phone/email/name, source/status, provider order/payment IDs, event id).
- Upload pipeline: magic-byte detection (`file-type`) restricted to PNG/JPEG/WebP, SVG rejected, re-encoded via
  Sharp to `.webp`, server-generated filename via `crypto.randomUUID()` (client filename never trusted), output
  capped at 2MB, served from `/uploads` via `express.static` with `fallthrough:false` (no traversal, no execution).
- `env.js` blocks production boot if default/dev JWT/cookie secrets or weak/`.local`/short admin passwords are
  present in `ADMIN_USERS_JSON` — a real production guardrail, not just documentation.

## Gap found and FIXED in this pass
- **Public lead-generation endpoints had no dedicated rate limiting.** `formLimiter` existed in
  `middleware/rateLimiter.js` (5 requests/hour/IP) but was never wired into `publicRoutes.js`. Only the generic
  500-req/15-min global limiter covered `/api/public/appointments`, `/api/public/survey-callbacks`,
  `/api/public/collaboration-inquiries`, and `/api/public/lead-drafts` — enough to let a scripted flood fill the
  Leads collection with junk long before the global limiter would trip. Added `formLimiter` to all four
  submission routes in `server/src/routes/publicRoutes.js`. Verified with `node --check`.

## Confirmed but NOT code bugs — flagged as scale/production-config risk (documented, not silently changed)
- `loginAttempts` (lockout tracking, `middleware/security.js`) and `refreshTokenStore`
  (`services/tokenManager.js`) are in-process `Map`s. This is fine for a single Node instance (the likely
  deployment for this client), but breaks (resets lockouts / loses revocation state) if the app ever runs with
  more than one instance/process or behind a restart-happy platform. Comment in the code already says "use Redis
  in production for distributed systems" — leaving as-is per "don't change orchestration," flagging for the
  client's deploy decision.
- `csrfProtection()` middleware exists in `middleware/security.js` and a CSRF token is issued at login, but the
  middleware is never mounted anywhere. Because auth cookies are `sameSite: strict`, practical CSRF exposure is
  low for same-site admin usage, but the token is currently decorative. Left unmounted rather than wiring it in
  blind, since doing so changes every admin POST/PATCH/DELETE contract (frontend would need to start sending
  `X-CSRF-Token`) — this needs a coordinated frontend change, listed below as a follow-up rather than a silent
  backend-only edit.

## Still to verify/fix in this pass (in progress, not yet done)
- Full route-by-route re-check of `paymentRoutes.js` order-creation amount trust, `profileRoutes.js`, and
  `devRoutes.js` contents beyond the production gate.
- Frontend/CSS: mobile-only layer vs desktop selector conflicts, workshops broken image fallback, admin
  client-side role trust vs backend enforcement, horizontal scroll, modal close reliability.
- SEO: verify `client/index.html`, `sitemap.xml`, `robots.txt`, and per-route JSON-LD in `main.jsx` actually match
  current routes/content (claims in the MD files, not yet independently re-checked).
- CMS/audit: confirm `auditLog.js` is actually invoked from every admin mutation route (create/update/delete/
  hide/publish), not just leads.
- `.env` / `PROJECT_STATUS_AND_PRODUCTION_NOTES.md` document multiple sets of dev credentials (`ishaan/555879`,
  `ceo/555879`, `coo/555879`, plus a `test@neurocogno.com` preview admin). None of these are production-blocking
  by themselves (the prod boot guard rejects them going live), but they should be rotated before real client data
  ever touches this instance even in "preview" mode. Not changed automatically — this is a credential-ownership
  decision, not a code bug.

This log will be updated as the remaining areas (frontend/CSS, SEO, audit-log coverage, admin panel client/server
role parity) are worked through.

## Update — mobile redesign (client/public site only) + CORS hardening

### Mobile redesign, public site only (admin intentionally untouched)
Per instruction, the admin panel stays desktop-only — no mobile CSS effort was spent there, and the
admin-specific rules (`.adminShell`, `.adminSidebar`, `.adminTable`, etc.) that used to live inside the old
"2026-09-06" mobile block were removed rather than maintained.

Found while reviewing the old mobile layer: several of its selectors did not match any real class name in
`client/src/main.jsx` (`.brandLockup`, `.workshopGrid`, `.collabBuildGrid`, `.floatingWhatsApp` do not exist in
the markup) — those rules were silently dead. Meanwhile several real public-page regions had **no** mobile
treatment at all: booking section image/copy/self-check block, the whole Collaborations page (hero actions,
details grid, event grid), Workshops header/polaroid cards, the founder story block, and the footer.

Replaced `client/src/styles.css`'s old mobile block with a corrected/expanded one (dated 2026-09-07) built
against the actual class names in `main.jsx` (verified by grep, not assumed), covering: sticky compact header
and horizontally-scrollable pill nav, hero (grid stack, heading clamp, full-width CTA stack, CMS image aspect
ratio, trust strip grid), about section, all card grids (help/services/insight/testimonials/metrics), workshops
(polaroid cards to single column, photo slot sizing), collaborations (hero actions, details grid, event grid,
enquiry form field pairs), booking (image reordered above copy on mobile, self-check block, form), founder
story (portrait reordered above copy), survey/self-check/service-info/help-detail modals (scrollable, capped
height, readable option buttons), Insight Hub's sticky floating rail and overlay boards, the WhatsApp/call
floating button (fixed 56px tap target, kept clear of thumb reach), and the footer (single column, tappable
links). A backup of the pre-change file was kept at `client/src/styles.css.bak-20260907`.

Verified, not just asserted: `npm run build` (Vite) transforms all 1606 modules cleanly with the new CSS
(confirms no syntax errors and every rule parses); the only build-step failure is an unrelated sandbox
file-deletion permission wall on `server/public/.gitkeep`, not a code issue.

### CORS / origin hardening
`CLIENT_ORIGIN` was a single required URL used directly as the CORS/Socket.IO/CSP origin — this breaks the
common real-world case of serving both `https://neurocogno.com` and `https://www.neurocogno.com` (or a staging
+ production domain) from one deploy, since only one exact origin could ever be allowed. Added
`allowedClientOrigins()` in `config/env.js` (comma-separated list, defaults to the existing single-origin
behavior so nothing changes for the current single-domain setup) and wired it into Express CORS (origin
allowlist callback), Socket.IO CORS, and the production CSP `connectSrc`. Verified by loading the env module
directly with both a single origin and a comma-separated multi-origin value — both parse correctly — and by
re-running the build.

### Still pending from the original scope
Full pass on `paymentRoutes.js`/`profileRoutes.js`/`devRoutes.js` line-by-line, admin CMS audit-log coverage
check, SEO file re-verification, and the .mmd DFD cross-check are not done yet and continue next.

## Update — profile IDOR fix, admin audit-log coverage, SEO polish

### Critical: unauthenticated client-data endpoint (fixed)
`server/src/routes/profileRoutes.js` (`/api/profile/*`) had no real access control. Every route except one
looked a profile up purely by attacker-suppliable `phone`, `email`, or `profileId` in the query/body — no
ownership or session check at all — and returned medical history, payment history, session history, and
contact details. `notifications/:id/read`, `notifications/read-all`, and `/me/preferences` accepted arbitrary
IDs in the body with zero auth. This is a live, publicly-reachable route (mounted unconditionally in
`server.js`) on a mental-health site; severity is critical by nature even though I verified the current public
frontend never calls it (`grep -rn "api/profile" client/src` returns nothing) — an unauthenticated IDOR that is
simply unused today is still one `curl` away from a client's therapy record. Fixed by requiring the same staff
`requireAuth` used by the admin API on the whole router, and removing the no-op `optionalAuth` on `/me`. Zero
behavior change for real users because nothing currently calls these routes; closes the hole for when this
becomes a live client-portal feature. `node --check` passes.

### Admin CMS/lead audit-log coverage (fixed)
Confirmed the gap the project's own notes had flagged since 2026-08-27 ("Add audit logs for CMS create/update/
delete/hide/publish operations, not only lead operations") was still real: only 2 of 8 mutating admin routes had
`auditMiddleware` wired in. Added it to the other 6: `POST /site-content` (create), `PATCH /site-content/:id`
(update), `DELETE /site-content/:id` (delete), `POST /site-media` (upload), `POST /leads/:id/confirm`, and
`POST /leads/:id/archive`. Every admin mutation now has a queryable audit trail via the existing
`getResourceAuditTrail` service — no new logging system introduced, just consistent use of the one already
built. `node --check` passes.

### Payment routes re-verified (no change needed)
Re-read `/orders` and `/verify` end to end: order amount is computed server-side from `env.BOOKING_AMOUNT_INR`
and compared before persisting (client cannot influence price), `/verify` checks `payment.status === 'captured'`
before re-processing, and both routes require an `Idempotency-Key` header via `idempotencyMiddleware`. Noted (not
changed): the idempotency store and login/session stores are in-process `Map`s — fine for one Node instance,
listed under the earlier scalability note for a multi-instance deploy decision.

### Dev routes re-verified (no change needed)
`devRoutes.js` is double-gated: `requireAuth` + `requireRole('developer')` on every route, and the whole router
is only mounted when `NODE_ENV !== 'production'`. No issue.

### SEO re-verification
Cross-checked `client/index.html`, `robots.txt`, `sitemap.xml`, and the per-route `seoByRoute` config in
`main.jsx` against the actual client-side route table (`/`, `/about-us`, `/neurocogno-insight`,
`/workshops-events`, `/collaborations`, `/services`) — all six match exactly, canonical/OG/JSON-LD are set per
route via `useSeo`, and `robots.txt` correctly blocks `/admin` and `/api`. Added missing `<lastmod>` dates to
`sitemap.xml` (Google guidance) and kept `client/public/sitemap.xml` and `server/public/sitemap.xml` in sync.
Not changed (asset/content decision, not a code bug): OG/Twitter image still points at the plain logo rather
than a dedicated 1200x630 branded preview image — this needs a designed asset from the client, already flagged
in the prior audit docs.

### Full verification
`npm run check` (all route/server syntax checks) passes. `npm run build` transforms all 1606 modules cleanly;
the only build-step failure remains the unrelated sandbox file-deletion permission wall on
`server/public/.gitkeep`, not a code issue.

### Still open from the original scope
Razorpay live-key/webhook end-to-end test (deferred to last per instruction), legal/privacy/consent pages, and
a decision on Redis-backed session/rate-limit stores if this ever runs multi-instance.

## Update — Cloudinary image storage wired in (permanent CMS image URLs)

Added real cloud image storage so CMS-uploaded photos survive redeploys/restarts on any host
(Render, Vercel, Railway — see the deployment discussion this same day). Implementation:

- `npm install cloudinary` (added to `package.json`).
- `config/env.js`: added optional `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
  `CLOUDINARY_API_SECRET` env vars and a `cloudinaryConfigured()` helper. All three are optional at
  the schema level so the app boots fine with none set.
- `services/cloudinaryStorage.js` (new): `uploadImageBuffer()`, `deleteImageByPublicId()`, and
  `publicIdFromUrl()` — a thin wrapper around the official `cloudinary` SDK.
- `routes/adminRoutes.js` `POST /site-media`: now uploads the already-validated, already-compressed
  image buffer (same file-type + Sharp pipeline as before — unchanged) to Cloudinary **when
  configured**, and falls back to the original local-disk write when it isn't. Response now also
  reports `storage: 'cloudinary' | 'local-disk'` so the admin UI/logs can tell which path was used.
- `POST /site-content` and `DELETE /site-content/:id`: when a CMS slot's image is replaced or the
  record is deleted, the previous Cloudinary asset is now deleted (best-effort, never blocks the
  actual save/delete that already succeeded) so replaced photos don't pile up in the Cloudinary
  account indefinitely.
- `.env` / `.env.example`: added `CLOUDINARY_*` keys. User supplied API key + secret directly in chat;
  **cloud name is still blank pending the user sending it** — until all three are set,
  `cloudinaryConfigured()` returns false and every upload silently keeps using local disk exactly as
  before (verified: flips to `true` only once all three are present, tested with env vars injected at
  process level without touching the committed code).

This directly answers "how will the image thing work when I deploy": once the cloud name is added,
every CMS image upload returns a Cloudinary CDN URL instead of a local file path, so it does not
matter whether the host wipes its disk on redeploy — the same fix removes the local-disk dependency
regardless of whether the final host ends up being Render, Vercel-for-something-else, or a VPS.

Verified: `npm run check` passes, `node --check` on every touched file passes, `npm run build`
transforms all 1606 modules cleanly (same pre-existing unrelated sandbox file-delete permission wall
on `server/public/.gitkeep`, not a code issue).

### Still needed from the user
- The Cloudinary **Cloud Name** (third credential, shown on the same dashboard page as the key/secret).
- Once that's in, a real end-to-end test: upload one photo through the admin CMS and confirm it comes
  back as a `res.cloudinary.com` URL and renders on the public site.

## Update — live-caught bugs from real testing: broken realtime notifications + CMS duplicate-key crash

The user tested the live app after today's changes and hit a real 500 on every CMS save, plus noticed
the "Server & Payment Issues" tab never showed it. Root-caused and fixed both — these are pre-existing
bugs, not caused by anything in this session's earlier edits.

### Bug 1: admin dashboard's real-time refresh has never actually worked
`services/realtime.js`'s `emitAdminUpdate(event, payload)` always emitted the socket event under one
generic name, `'admin:update'`, with the real event type nested inside the payload as `data.type`. But
every listener in the admin dashboard (`client/src/main.jsx`) listens for the literal event name
directly — `socket.on('lead:created', ...)`, `socket.on('system:issue', ...)`, etc. Those literal names
were never sent, so **every live-refresh listener has been dead since day one**; the dashboard only ever
looked live because it fetches everything once on mount. Separately, `'system:issue'` was never emitted
from anywhere at all, even before this bug. Fixed:
- `emitAdminUpdate` now emits both the literal event name (to the `admins` room) and the generic wrapper.
- Added a new `emitPublicUpdate(event, payload)` for broadcasts to *all* connected sockets — used only for
  CMS content events (already public data via the unauthenticated `/api/public/site-content` endpoint),
  never for lead/payment/system-issue data. This also fixes the public site's own dead
  `socket.on('site-content:updated', ...)` listener, which could never have fired before: it was only ever
  sent to the `admins` room, which anonymous public visitors are never part of.
- Wired `emitAdminUpdate('system:issue', ...)` into every place the app already creates a `SystemIssue`
  record: `middleware/errorHandler.js` (server 500s), `middleware/rateLimiter.js` (auth brute-force,
  webhook flood), `middleware/security.js` (account lockout, suspicious-pattern detection),
  `routes/paymentRoutes.js` (signature failures ×2), `services/paymentGateway.js` (gateway not configured).
- Wired `emitPublicUpdate('site-content:updated'/'site-content:media-uploaded', ...)` into the CMS
  create/update/delete/upload routes in `routes/adminRoutes.js`.

### Bug 2: `require()` inside an ES module, silently swallowed
`services/errorTracking.js`'s `alertCriticalError()` used `const { SystemIssue } = require('../models/SystemIssue.js')` inside a codebase that is ES modules throughout (`import`/`export`). This throws
`ReferenceError: require is not defined` every single time a *critical*-severity error occurs — caught by
the caller's try/catch, so it never crashed a request, but it meant the detailed `ErrorLog` record for the
most severe errors silently failed to save, and `logError()` returned `undefined` for those cases. Also
found and fixed in the same function: it was creating the SystemIssue with `type: 'system'`, which is not
a valid value in `SystemIssue`'s `type` enum (`['server','payment','database','api','security']`) — would
have thrown a Mongoose `ValidationError` on its own even with `require()` fixed. Replaced with a proper
top-level `import`, `type: 'server'`, and wired in `emitAdminUpdate('system:issue', ...)` here too.

### Bug 3 (the one causing the actual 500s the user hit): CMS duplicate-key crash
`models/SiteContent.js`'s `key` field still carried `unique: true` from before `slotKey` was introduced
as the real per-slot identity (`slotKey` plus a compound unique index on
`{section,type,placement,order}` is what CMS saves actually match against, per `cmsSlotFilter()` in
`routes/adminRoutes.js`). A save that correctly matches an existing document by `slotKey` still writes a
`key` value in the same `$set` — and if a leftover document from before the `slotKey` migration still
holds that same descriptive `key` text (e.g. `"homepage.hero.image"`), MongoDB's old `key_1` unique index
rejects the write with `E11000 duplicate key error ... key_1 dup key: { key: "homepage.hero.image" }`.
This exactly matches a risk the project's own Aug 27 notes had already flagged as needing cleanup and
never did. Fixed:
- Removed `unique: true` from `key` in `models/SiteContent.js` (kept indexed, non-unique, for lookups —
  `slotKey` + the compound index are the real identity now).
- Schema changes alone don't drop an already-existing physical MongoDB index, and `autoIndex` is
  intentionally disabled in production for performance, so a code-only fix would leave the live database's
  stale `key_1` index in place. Added `reconcileSiteContentIndexes()` to `server.js`'s `bootstrap()`,
  called right after `connectDb()`: it calls `SiteContent.syncIndexes()`, which reconciles MongoDB's actual
  indexes against the current schema (drops the stale unique `key_1`, ensures `slotKey`'s unique index and
  the compound unique index exist) on every server start, in every environment, and never blocks startup
  if it fails (wrapped in try/catch, logged only). This is a permanent, self-healing fix — no manual
  database console/Compass surgery required from the user.

### Verification
`npm run check` and `node --check` on every touched file pass. `npm run build` transforms all 1606
modules cleanly (same pre-existing unrelated sandbox file-delete permission wall on
`server/public/.gitkeep`). Could not execute a live Node process against MongoDB from either sandbox to
prove runtime behavior end-to-end (this session's own cloud container blocks egress to
`api.cloudinary.com` by policy, and a bare `import('mongoose')` hangs indefinitely inside the device_bash
Linux VM even with no other code involved — both are sandbox limitations, not application bugs). The
user must restart their actual backend process (not just refresh the browser) to load this code, then
retest the CMS save and confirm the Server & Payment Issues tab updates live.
