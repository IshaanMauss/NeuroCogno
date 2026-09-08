# NeuroCogno Claude Review Brief

Date: 2026-09-06
Prepared for: External architecture, security, UI/UX, SEO, and production-readiness review
Project: NeuroCogno mental wellness and counselling website with admin CMS

## 1. Intended Topic And Product Purpose

NeuroCogno is a mental wellness, counselling, and emotional wellbeing website for children, teenagers, adults, seniors, parents, families, schools, workplaces, and community groups. The public-facing site is meant to feel calm, professional, reassuring, and easy to navigate for therapy/counselling users who may be anxious, hesitant, or browsing on behalf of someone else.

The website is not only a static brochure. It is intended to function as:

- A public mental wellness and counselling presence.
- A service discovery flow for counselling, anxiety support, stress management, parent guidance, developmental support, emotional wellness, home-based support, and collaborations.
- A lead generation and triage system through booking forms and survey popups.
- A content hub for blogs, podcasts, expert articles, resources, videos, and photo stories.
- A workshop/events listing area.
- A collaboration enquiry area for schools, workplaces, and communities.
- An admin-managed CMS where non-technical staff can update text, images, visual canvases, videos, WhatsApp redirect values, workshop content, insight cards, collaboration media, service content, and homepage assets.
- A future payment-enabled system using Razorpay for appointment/payment workflows.

Primary review question for Claude: Is the architecture suitable for a small-to-medium client-facing mental-health/counselling website that will accept leads, manage CMS content, and eventually process payment confirmations safely?

## 2. Current Tech Stack

### Frontend

- React 18.
- Vite build system.
- Single-page app routing handled in React state/browser path logic rather than a full router package.
- CSS is mostly custom in `client/src/styles.css`.
- Lucide React icons are used for UI symbols.
- Socket.IO client is used for live CMS/admin updates.
- SEO metadata is dynamically updated per route in `client/src/main.jsx`.
- Public build output is generated into `server/public` through Vite.

### Backend

- Node.js.
- Express 4.
- Mongoose/MongoDB.
- Socket.IO server for live content/admin events.
- Razorpay Node SDK prepared for payment flows.
- Pino / pino-http logging.
- Zod validation.
- Helmet security headers.
- CORS.
- Cookie parser.
- express-rate-limit.
- express-mongo-sanitize.
- hpp.
- Sharp for server-side image re-encoding.
- file-type for magic-byte file validation.

### Database

- MongoDB Atlas intended for production.
- Local MongoDB used for development.
- Mongoose models are used for admin users, leads, payments, CMS content, webhook events, visitor/system records, and related domain data.

### Hosting Assumption

The app appears intended to deploy as a Node/Express server that serves the built React SPA from `server/public`. HTTPS/TLS should be handled by the deployment platform or Cloudflare, not manually implemented inside Express.

## 3. Main Public Website Pages

### Home / About Us

Purpose:

- Brand introduction.
- Therapy/counselling positioning.
- Hero section with CTA buttons.
- Who-we-help cards.
- Services overview.
- How-it-works section.
- Booking/appointment form.
- Founder/CEO note and image placement.
- Survey popup for triage during development/testing.

Review focus:

- Does the first viewport feel credible for a therapy/counselling brand?
- Is the hero too visually heavy or compressed at laptop resolutions?
- Is the booking form understandable and not overwhelming?
- Are trust signals visible without making unsupported medical claims?
- Are crisis/legal/consent disclaimers needed before public marketing?

### NeuroCogno Insight Hub

Purpose:

- Content hub for blogs, podcasts, expert articles, resources, news/updates, photo stories, and video learning.
- Uses floating/left-side section controls on desktop to jump to sections.
- Some sections are CMS-controlled visual cards/canvases/videos.

Review focus:

- Are the fixed/floating section controls ergonomic on desktop and safely transformed on mobile?
- Does each CMS canvas act independently by section/type/placement/order?
- Are photo stories and visual cards editable without leaking images into unrelated sections?
- Is the amount of content visually balanced without nested white panels?

### Workshops & Events

Purpose:

- Public display of upcoming/planned mental wellness workshops and events.
- Cards include event image, status, title, and description.
- Admin should be able to update images/content.

Review focus:

- One event image previously appeared broken; verify all image paths/fallbacks.
- Cards should look directly connected to the background, not trapped in unnecessary nested containers.
- Events should eventually support real dates, location/mode, registration CTA, and structured Event schema if events become real.

### Collaborations

Purpose:

- Collaboration inquiry page for schools, workplaces, communities, and organizations.
- Should show collaboration media and forms.
- Admin-managed collaboration visuals should display correctly.

Review focus:

- Verify collaboration image visibility.
- Confirm the collaboration route follows the newer background-connected layout, not old nested whiteboard layout.
- Ensure form validation and spam/rate limiting are sufficient.

### Services

Purpose:

- Service cards for counselling, anxiety support, stress management, parent guidance, emotional wellness, developmental support, home-based support, and collaboration.
- Service cards use images, not flat SVG/illustrations.
- Clicking cards opens theme-based rounded popups with compact explanatory content.

Review focus:

- Desktop grid should be two columns by three rows where requested, without oversized cards.
- Home-based support should be included and correctly explained.
- Popup content should be readable, not massive, and should close cleanly.
- Mobile service cards must remain tappable and not overflow.

## 4. Admin Panel Purpose And Workflow

The admin panel is intended to let authorized staff update website content without touching code.

Key workflows:

1. Admin logs in.
2. Admin opens Website Content Management.
3. Admin chooses a content location/preset from a dropdown.
4. The UI should only show fields relevant to that chosen location.
5. Some fields auto-fill based on the selected preset.
6. Required manual fields, such as captions or titles, should be clearly marked.
7. Admin uploads/replaces media or updates text.
8. Save triggers backend validation.
9. Public frontend updates through API fetch and Socket.IO live update.
10. Admin can hide/delete/publish depending on role.

Important CMS behavior already fixed or intended:

- CMS matching should be scoped by section, type, placement, order, and eventually slotKey.
- Each visual canvas should act independently unless explicitly designed to share content.
- Adding an image to one canvas must not replace all canvases.
- If no CMS image exists, placeholders should either be hidden or intentionally displayed based on that section's rule. The current desired behavior for inside visual canvases is: if admin adds images, show those images beautifully; if none exist, avoid ugly pasted placeholders.
- Admin media cards were redesigned toward section grouping and click-to-expand behavior.
- Admin should have clearer close buttons, number/order fields, and theme-based dropdowns.

Admin review focus for Claude:

- Are admin route protections strict enough?
- Is RBAC enforced on backend routes, not only frontend UI?
- Are CMS write paths correctly scoped and validated?
- Is there sufficient auditability for non-technical staff changes?
- Are dangerous actions like delete/hide/publish clear and reversible where appropriate?
- Are uploaded files validated by bytes, re-encoded, and stored safely?

## 5. Desktop UI/UX Expectations

Desired desktop feel:

- Calm, therapy-appropriate, professional.
- Warm slate blue and muted terracotta/soft clay theme.
- Soft cream background, not harsh white.
- Rounded cards/modals/panels everywhere; avoid sharp 90-degree corners.
- Less glow, less cheap-looking cloudy overlay.
- Background should remain visually useful even when the browser zoom changes.
- Pages like Workshops, Insights, Collaborations, and Services should feel connected to the background rather than being stacked inside excessive white boards.
- Buttons and dropdowns should follow the site theme.
- Desktop should not be compressed into a narrow middle strip while side areas are empty.

Known UI history/context:

- There were multiple iterations where large central panels, white boards, and nested canvases made pages feel cheap or cramped.
- The user preferred the Workshops & Events layout because its cards felt directly placed on the background.
- Similar treatment was requested for Insight Hub, Collaborations, Services, and later the admin panel where possible.
- Some attempts to reduce desktop size caused hero/footer collapse or compressed left/right layout. Those areas need careful verification if further global CSS changes are made.

Desktop review questions:

- Are sections balanced at 100% Chrome zoom on common laptop sizes?
- Does the site still look acceptable if zoomed to 90% or 110%?
- Are card sizes proportional and readable?
- Are nav links, buttons, CTAs, and form controls consistent?
- Does the page ever become horizontally scrollable unintentionally?
- Are hero, mid-page content, and footer aligned without overlap?

## 6. Mobile UI/UX Expectations

Mobile redesign is a priority. The user specifically does not want desktop responsiveness mechanically squeezed into mobile. The mobile layout should feel intentionally designed for smaller screens.

Mobile goals:

- Compact sticky header.
- Brand/logo readable but not huge.
- Navigation should become horizontally scrollable pills or a compact mobile-friendly pattern.
- Hero text should be shorter and better scaled.
- Long words should not overflow.
- CTAs should be easy to tap.
- Cards should stack cleanly.
- Service cards should remain usable and visual.
- Forms should be single-column, with comfortable spacing.
- Survey popup should be usable on small screens, closeable, and scroll internally.
- Admin tables/cards should scroll internally or transform safely.
- Footer should stack naturally.
- No body-level horizontal scroll.

Mobile CSS pass already added:

- A dated mobile-only layer exists in `client/src/styles.css` under a 2026-09-06 comment.
- It targets small screens without intentionally changing desktop theme or backend behavior.
- It adjusts header/nav, hero, cards, grids, modals, survey UI, booking forms, admin shell, tables, and footer.

Mobile review questions for Claude:

- Is the mobile-only layer too broad or conflicting with existing selectors?
- Are any desktop fixes accidentally being applied to mobile or vice versa?
- Are touch targets at least reasonable size?
- Are modal scroll/close controls reliable?
- Does the booking flow remain readable on 360px width?
- Does admin remain usable on tablet/mobile, even if not perfect for heavy operations?

## 7. SEO Current State

Implemented:

- `client/index.html` contains baseline meta tags, Open Graph/Twitter tags, canonical link, favicon/logo, and Organization schema.
- `robots.txt` allows public pages and blocks `/admin` and `/api`.
- `sitemap.xml` now includes all public routes:
  - `/`
  - `/about-us`
  - `/services`
  - `/neurocogno-insight`
  - `/workshops-events`
  - `/collaborations`
- Route-level dynamic SEO exists in `client/src/main.jsx`:
  - Home: WebSite and ProfessionalService schema.
  - Collaborations: WebPage and Service schema.
  - Insight Hub: CollectionPage and ItemList schema.
  - Workshops: CollectionPage and EventSeries schema.
  - Services: Service schema.

SEO review focus:

- Because this is a React SPA, confirm that search crawlers will receive useful HTML/metadata. Dynamic client-side meta updates help but are not equivalent to server-side rendering for all crawlers.
- Consider prerendering or SSR later if organic SEO becomes business-critical.
- Add real content depth for individual services if SEO competition matters.
- Add real service/location pages only if accurate.
- Replace generic logo OG image with a polished 1200x630 branded image.
- Submit sitemap in Google Search Console after deployment.
- Verify canonical URLs once final domain is confirmed.

## 8. Security Current State

Implemented or present:

- Helmet enabled.
- CORS configured.
- express-rate-limit used.
- express-mongo-sanitize enabled.
- hpp enabled.
- Zod validation used for public/admin payloads.
- Body size limits configured.
- Secure-ish cookie/session/token flow exists; review exact production flags.
- Admin RBAC exists.
- Socket.IO auth exists.
- `/api/dev` is now gated behind non-production environment.
- File uploads use `file-type` magic-byte detection and Sharp re-encoding.
- SVG uploads are rejected.
- CMS uploads force generated server filenames rather than trusting client filenames.
- Dependency audit is currently clean after `qs@6.16.0` override.

Security review focus:

- Confirm all admin write routes enforce backend RBAC.
- Confirm no dangerous route is exposed without auth.
- Confirm production `NODE_ENV=production` is guaranteed on deploy.
- Confirm cookies use secure, httpOnly, sameSite values suitable for deployment.
- Confirm CORS origin list is strict in production.
- Confirm rate limits are applied to login, public forms, payments, uploads, and survey endpoints.
- Confirm request body limits are not bypassable.
- Confirm logs do not leak secrets, tokens, passwords, Razorpay signatures, or sensitive therapy notes.
- Confirm uploaded files are never served from a path where executable content could run.
- Confirm admin test/dev accounts are removed before public launch.

## 9. Payment Security Current State

Razorpay is prepared but not fully configured for final production payments yet.

Implemented or previously verified:

- Razorpay webhook signature verification exists.
- Webhook idempotency uses a DB-backed event record with a unique provider/event ID pattern.
- Webhook handler follows insert-as-lock behavior.
- Duplicate key error `11000` returns early before payment/lead update logic.
- Payment captured transition uses conditional atomic `findOneAndUpdate` behavior with status guard.
- Lead payment status update is guarded to avoid repeated state transitions.
- Server-side amount config has been reviewed as important.

Payment review focus:

- Verify payment amount can never be changed by browser input.
- Verify all Razorpay secrets are env-only and never committed.
- Verify webhook endpoint returns correct 2xx on duplicate safe retries.
- Verify invalid webhook signatures do not alter payment state.
- Verify logs preserve useful payment event audit trail without leaking secrets.
- Verify frontend payment callback and backend webhook cannot race into inconsistent lead/payment states.
- Verify payment status shown to admin is derived from backend state, not browser trust.

Still needed before live payment launch:

- Configure real Razorpay key ID, key secret, and webhook secret in production secret manager.
- Configure Razorpay dashboard webhook URL to deployed `/api/payments/webhook`.
- Run test-mode payment flow end to end on deployed domain.
- Simulate duplicate webhook and invalid signature.
- Confirm refund/failure/partial capture behavior if those states are in scope.

## 10. Database And Data Flow

Current data flow overview:

1. Public user submits booking/survey/contact/collaboration data.
2. Backend validates payload with schemas.
3. Data is written to MongoDB through Mongoose models.
4. Admin panel reads and updates records through protected routes.
5. CMS content updates are written to MongoDB and pushed live through Socket.IO events.
6. Payments create server-side order/state records.
7. Razorpay webhook verifies signature, dedupes event, and atomically updates payment/lead state.
8. Admin views payment logs and lead status.

Collections/models to review:

- Admin users.
- Leads/enquiries.
- Payments.
- Webhook events.
- Site/CMS content.
- Visitor/system/issue records if present.

Database strengths:

- Atlas production role has been designed as database-scoped `readWrite` on `neurocogno`, not atlasAdmin.
- Payment idempotency has a persistent collection.
- CMS content has improved scoping rules compared with earlier section-collision behavior.

Database leftovers:

- Add CMS compound unique/index hardening around `slotKey`, `section`, `type`, `placement`, and `order` after existing content is normalized.
- Add indexes for lead search/filter by status, phone/email, date, and service/concern.
- Add indexes for payments by order/payment IDs, status, lead, and created date.
- Add indexes for CMS section/type/placement/order and active status.
- Add audit log collection for admin actions.
- Define data retention policy for therapy-adjacent enquiries and survey answers.
- Define backup/restore procedure and test restore before full production launch.

## 11. Admin Test Account Added For Preview

A temporary local/client-preview admin was added through `.env` and seeded locally.

Credentials:

- Username: `test`
- Email: `test@neurocogno.com`
- Password: `Test@Neuro555879`
- Role: `developer`

Important security note:

This account should not remain as a long-term production admin. It is acceptable for short client preview only. Before public production launch, remove it or rotate it to a strong client-owned account with proper accountability.

## 12. Verification Completed In Latest Pass

Commands passed:

- `npm run check`
- `npm run build`
- `npm audit --audit-level=high`

Additional result:

- `npm install` after dependency override reported `found 0 vulnerabilities`.
- Local admin seeding completed successfully for the test admin.

## 13. High-Priority Leftovers From Codex Point Of View

### P0 Before Public Launch

1. Production secret rotation.
   - Rotate MongoDB URI, JWT secret, Razorpay keys, webhook secret, and admin credentials.
   - Store only in deploy platform secrets.

2. Remove weak/dev admin accounts.
   - Existing local accounts with weak/default passwords must not go live.
   - Temporary `test` admin should be removed or tightly controlled.

3. Atlas network policy.
   - Replace `0.0.0.0/0` with production egress IP or private networking where possible.

4. Razorpay live/test production setup.
   - Add real env keys.
   - Configure webhook URL.
   - Run duplicate/invalid/success tests.

5. HTTPS/TLS and edge protection.
   - Use managed HTTPS.
   - Put Cloudflare or equivalent in front.
   - Enable WAF managed rules and basic rate limiting.

6. Mobile visual QA on real devices.
   - Test 360px, 390px, 414px, iPad/tablet, and desktop.
   - Verify no collapsed hero/footer, no horizontal scroll, no uncloseable popup.

### P1 Soon After Handover

1. CMS audit logs.
   - Track who created, updated, deleted, hid, published, or replaced media.

2. Database indexes and uniqueness hardening.
   - CMS slot uniqueness.
   - Lead/payment search indexes.

3. Legal/privacy/content disclaimers.
   - Privacy policy.
   - Consent language.
   - Crisis disclaimer.
   - Therapy scope disclaimer.

4. Monitoring and backups.
   - Error logging.
   - Uptime monitoring.
   - MongoDB backups.
   - Restore rehearsal.

5. SEO launch workflow.
   - Search Console.
   - Sitemap submission.
   - Real OG preview image.
   - Structured data validation.

### P2 Refinements

1. SSR/prerendering if SEO becomes a major acquisition channel.
2. Admin UX refinement for bulk CMS management.
3. 2FA for admin users.
4. More granular RBAC permissions.
5. Accessibility audit with keyboard-only and screen-reader pass.
6. Performance optimization for large CMS image galleries.
7. Image CDN/object storage instead of local server uploads if content volume grows.

## 14. Specific Questions For Claude To Review

1. Is the Express/Mongo architecture adequate for first production deployment, or is any structural issue launch-blocking?
2. Are there any hidden security gaps in admin auth, RBAC, cookies, CORS, Socket.IO auth, upload handling, or payment callbacks?
3. Is the Razorpay webhook/payment-state flow truly race-safe under duplicate webhooks and concurrent frontend polling?
4. Does the CMS scoping model need an immediate unique compound index before handover, or can it wait until after content normalization?
5. Is the React SPA SEO acceptable for launch, or should prerendering be introduced before public marketing?
6. Does the mobile-only CSS layer risk selector conflicts with desktop layouts?
7. Are there any admin endpoints that trust frontend role/state too much?
8. Are logs privacy-safe for a mental-health website?
9. Is local file upload storage acceptable for launch, or should object storage/CDN be required immediately?
10. What should be the minimum production checklist before giving the client access?

## 15. Files Claude Should Inspect First

Suggested first-pass files:

- `package.json`
- `server/src/server.js`
- `server/src/config/env.js`
- `server/src/routes/authRoutes.js`
- `server/src/routes/adminRoutes.js`
- `server/src/routes/publicRoutes.js`
- `server/src/routes/paymentRoutes.js`
- `server/src/models/WebhookEvent.js`
- `server/src/models/Payment.js`
- `server/src/models/AdminUser.js`
- `server/src/models/SiteContent.js`
- `server/src/services/adminSeed.js`
- `client/src/main.jsx`
- `client/src/styles.css`
- `client/index.html`
- `client/public/robots.txt`
- `client/public/sitemap.xml`
- `PRE_HANDOVER_DEEP_AUDIT_2026-09-06.md`
- `ATLAS_PRODUCTION_SETUP.md`
- `SECURITY_GUIDE.md`
- `README_SECURITY.md`

## 16. Final Codex Assessment

The project is significantly improved compared with the earlier state. The biggest code-level production risks around file upload spoofing, webhook duplication, payment race-safety, and accidental production dev routes have been addressed. SEO coverage is better and mobile has a targeted refinement layer.

The largest remaining risks are not ordinary React styling issues. They are deployment discipline risks: real secrets, live Razorpay setup, Atlas network restrictions, Cloudflare/WAF, removing dev admins, and final device testing. If those are handled carefully, this can move into client preview. For public launch, privacy/legal disclaimers, admin audit logs, and production monitoring/backups should follow quickly.