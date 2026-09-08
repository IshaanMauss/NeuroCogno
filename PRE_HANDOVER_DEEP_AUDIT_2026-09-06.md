# NeuroCogno Pre-Handover Deep Audit

Date: 2026-09-06
Scope: frontend UX/mobile polish, SEO, security, payment safety, admin access, database readiness, and deploy handover risk.

## Executive Status

NeuroCogno is now in a stronger pre-handover state. The production build passes, server route syntax checks pass, and npm audit reports zero vulnerabilities after dependency remediation. The highest-risk code areas previously identified have been addressed: CMS upload validation uses server-side file-type detection and re-encoding, payment webhook idempotency is DB-backed, payment state transitions are guarded atomically, and developer-only routes are no longer exposed in production.

This is not the same as full production launch completion. Final production readiness still depends on deploy-time configuration: real Razorpay keys/webhook secret, managed HTTPS/TLS, production MongoDB URI with Atlas network allowlisting, platform secrets, Cloudflare or equivalent edge protection, and final smoke testing on the live domain.

## Files Changed In This Pass

- `client/src/main.jsx`
  - Added route-specific SEO metadata and JSON-LD for NeuroCogno Insight Hub, Workshops & Events, and Services.
  - Confirmed those routes no longer fall back to homepage title/description/schema.
- `client/src/styles.css`
  - Added a mobile-only handover refinement layer dated 2026-09-06.
  - The layer focuses on compact mobile header/nav, safer single-column layouts, touch-friendly controls, scrollable modals, reduced heading scale, tighter service grids, booking layout, admin tables, and footer stacking.
- `client/public/sitemap.xml`
  - Updated sitemap to include `/`, `/about-us`, `/services`, `/neurocogno-insight`, `/workshops-events`, and `/collaborations`.
- `server/src/server.js`
  - Gated `/api/dev` behind `!isProduction` so developer routes are not registered in production.
- `.env`
  - Added temporary local test admin user for development/client preview seeding only.
- `package.json` and `package-lock.json`
  - Added a dependency override for `qs@6.16.0` and refreshed dependency resolution.

## Verification Completed

- `npm run check` passed.
- `npm run build` passed.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- Local admin seeding completed and created `test@neurocogno.com` with developer role.
- Server syntax check confirmed after `/api/dev` production gating.

## SEO Status

Implemented SEO improvements:

- Static robots file blocks `/admin` and `/api` and points to the sitemap.
- Sitemap now covers all public SPA routes.
- Route-level title, description, keywords, canonical URL, Open Graph, Twitter card, and JSON-LD are dynamically set for homepage, collaborations, insights, workshops, and services.
- Homepage uses WebSite and ProfessionalService schema.
- Collaboration uses WebPage and Service schema.
- Insight Hub now uses CollectionPage and ItemList schema.
- Workshops now uses CollectionPage and EventSeries schema.
- Services now uses Service schema.

Remaining SEO recommendations:

- Add real domain-verified Google Search Console after deployment.
- Submit `https://neurocogno.com/sitemap.xml` after DNS is live.
- Replace generic OG image with a polished branded preview image before public marketing.
- Add real service-location pages only if NeuroCogno wants location SEO; do not fake location pages.
- Add measurable page content for counselling, anxiety support, stress management, child therapy, homecare support, and parent guidance if organic search becomes a priority.

## Security Status

Already strong or improved:

- Helmet security headers are enabled.
- CORS is explicitly configured.
- Cookie parser and secure cookie behavior are present.
- Express Mongo sanitize and HPP are enabled.
- Request body limits are configured.
- Rate limiting exists for sensitive/public endpoints.
- Admin RBAC is implemented with roles.
- Socket.IO authentication exists.
- Public form validation uses structured schemas.
- File uploads are no longer trusted by extension/client MIME alone.
- CMS image upload rejects SVG and only accepts detected PNG/JPEG/WebP, then re-encodes with Sharp.
- Final CMS image output size is capped.
- `/api/dev` is no longer registered in production.
- Dependency audit is clean after `qs@6.16.0` override.

Remaining production security checklist:

- Rotate all production secrets before launch.
- Replace weak/dev admin users and passwords before pointing a real domain.
- Store all secrets in the deploy platform secret manager, not in committed files.
- Configure Atlas network access to the production host/egress IP, not `0.0.0.0/0`.
- Put Cloudflare or equivalent WAF/rate limiting in front of the domain.
- Confirm managed HTTPS/TLS and automatic certificate renewal on the deploy platform.
- Confirm HSTS only after HTTPS is stable.
- Add CMS audit logs for create/update/delete/hide/publish actions in week 1.
- Add backup/restore procedure documentation for MongoDB before handover.

## Payment Security Status

The code path is structurally correct for payment safety:

- Razorpay webhook signature verification exists.
- Webhook idempotency is DB-backed using unique provider/event ID behavior.
- Duplicate webhook insert errors return early before payment or lead state changes.
- Captured payment update uses a conditional atomic update instead of read-then-write.
- Lead payment status update is guarded so repeated events do not reapply the transition.

Still required before live payments:

- Set real Razorpay key ID, key secret, and webhook secret in production secrets.
- Configure Razorpay dashboard webhook URL to the deployed `/api/payments/webhook` endpoint.
- Test successful payment, duplicate webhook delivery, invalid signature, partial/failure state, and timeout/retry behavior in Razorpay test mode.
- Confirm payment amount config is server-side and cannot be overridden by the browser.
- Keep payment logs visible to admin, but do not expose raw secrets or sensitive gateway payloads.

## Database And Data Flow Status

Current architecture is MongoDB/Mongoose-backed with clear separation between:

- Leads and survey/contact enquiries.
- Admin users and roles.
- CMS/site content entries.
- Payments and payment logs.
- Webhook events for idempotency.
- Visitor/system telemetry and issue tracking.

Good current properties:

- CMS content uses scoped section/type/placement/order matching to avoid earlier cross-section image collisions.
- Payment state changes now avoid duplicate/retry corruption.
- Admin test user can be seeded from env for local preview.
- Atlas production role has been prepared as database-scoped `readWrite` for `neurocogno`.

Recommended next database hardening:

- Add compound unique/index strategy for CMS `slotKey` plus section/placement/type/order once existing content is normalized.
- Add indexes for admin search surfaces: lead status/date, phone/email, payment status/date, CMS section/type/placement/order.
- Add audit log collection for admin CMS and payment-visible actions.
- Define data retention rules for leads, survey answers, logs, and uploaded media.
- Add backup verification and restore drills before public launch.

## Mobile UX Status

A mobile-only polish layer has been added without changing desktop theme or backend behavior. It is intentionally scoped to small screens and focuses on:

- Compact sticky header.
- Horizontal tab navigation instead of cramped full desktop nav.
- Reduced hero/page heading scale.
- Single-column hero and booking flows.
- Touch-friendly buttons and form controls.
- Safer modal max-height with internal scroll.
- Reduced grid density and better section spacing.
- Admin table/card overflow handling on small screens.

Recommended visual QA before handover:

- Test at 360x740, 390x844, 414x896, 768x1024, and normal desktop.
- Check homepage hero, About Us, Insight Hub rail/buttons, Workshops cards, Collaboration form, Services cards/popups, booking form, survey popup, admin login, admin Website Content, payments log, and mobile footer.
- Verify no text overlaps, no horizontal body scroll, and all popups can be closed on mobile.

## Standards Used For Review

- Google Search Central: SEO starter guide, structured data guidance, and mobile-friendly guidance.
- OWASP: Top 10 risk categories, HTTP headers guidance, TLS guidance, and input/upload validation practices.
- Razorpay: webhook signature verification and retry/idempotency expectations.

## Final Handover Notes

Do not give the temporary test admin credential long-term production power. It is acceptable for short client preview only if the domain is protected and logs are monitored. Before final public launch, rotate credentials, remove or disable the temporary account, and confirm all real production secrets are stored only in the deploy platform.