# NeuroCogno SEO Implementation Notes

Last updated: 2026-06-09

This file records exactly where SEO has been added, what technology is being used, and what is still missing before production launch.

## SEO Currently Applied

### 1. Base HTML SEO

File:

```txt
client/index.html
```

What is added:

- Main page title: `NeuroCogno | Mental Wellness & Counselling`
- Meta description for counselling, mental wellness, anxiety support, stress management, relationship counselling, parent guidance, and emotional wellbeing.
- Meta keywords focused on the mental wellness/counselling niche.
- `robots` meta tag with index/follow and rich-preview permissions.
- Canonical URL currently pointing to `https://neurocogno.com/`.
- Author/application metadata for NeuroCogno.
- Theme color for browser/mobile display.
- Favicon and Apple touch icon using `/logo.png`.
- Web app manifest link using `/site.webmanifest`.
- Open Graph tags for social sharing.
- Twitter card tags for social sharing.
- Organization JSON-LD structured data.

### 2. Route-Specific React SEO

File:

```txt
client/src/main.jsx
```

Technology used:

```txt
React useEffect + direct document head updates
```

Where it lives:

```txt
seoByRoute
setMeta()
setLink()
useSeo()
```

Routes currently covered:

- `/`
- `/collaborations`

For the home page, SEO includes:

- Title focused on mental wellness, counselling, and emotional wellbeing.
- Description covering counselling, psychological support, anxiety, stress, parent guidance, relationships, children, teens, adults, and seniors.
- Keywords for counselling niche searches.
- JSON-LD `WebSite` schema.
- JSON-LD `ProfessionalService` schema.

For the collaboration page, SEO includes:

- Title focused on collaboration, mental wellness programs, and workshops.
- Description for school wellness programs, corporate mental health workshops, community awareness drives, counselling events, and emotional wellbeing collaborations.
- Keywords for collaboration/workshop searches.
- JSON-LD `WebPage` schema.
- JSON-LD `Service` schema for mental wellness collaboration programs.

### 3. Crawl Rules

File:

```txt
client/public/robots.txt
```

What is added:

- Allows public crawling.
- Blocks `/admin`.
- Blocks `/api`.
- Points crawlers to the sitemap:

```txt
https://neurocogno.com/sitemap.xml
```

Reason:

- Public website should be indexed.
- Admin dashboard and backend API should not be indexed.

### 4. Sitemap

File:

```txt
client/public/sitemap.xml
```

URLs currently listed:

- `https://neurocogno.com/`
- `https://neurocogno.com/collaborations`

Current frequency/priority:

- Home page: weekly, priority 1.0
- Collaborations page: monthly, priority 0.8

### 5. Site Manifest

File:

```txt
client/public/site.webmanifest
```

Purpose:

- Helps browsers understand the website/app identity.
- Connects the NeuroCogno logo and brand name to the public web app metadata.

### 6. Media SEO Preparation

Files/folders:

```txt
client/public/logo.png
client/public/blogs/
client/public/collabs/
```

Current media approach:

- Logo is referenced from SEO tags as `/logo.png`.
- Blog and collaboration preview images are served from public asset folders.
- README files in those folders now explain recommended image replacement rules.

## Keywords Currently Covered

Niche keywords currently included:

- mental wellness counselling
- psychological counselling
- psychological support
- anxiety support
- stress management counselling
- relationship counselling
- child counselling
- teen counselling
- adult counselling
- senior counselling
- parent guidance
- emotional wellness
- emotional wellbeing
- online counselling
- in person counselling
- mental wellness collaboration
- counselling workshop
- school wellness program
- corporate mental health workshop
- community mental health camp
- psychology awareness event

## Important Production Changes Needed

### Final Domain Confirmation

Current SEO assumes:

```txt
https://neurocogno.com
```

If the real domain changes, update:

- `client/index.html`
- `client/src/main.jsx`
- `client/public/robots.txt`
- `client/public/sitemap.xml`
- Any future analytics/Search Console setup

### Social Preview Image

Current Open Graph/Twitter image uses:

```txt
https://neurocogno.com/logo.png
```

Production should add a proper 1200x630 preview image for social sharing.

Recommended future file:

```txt
client/public/og-image.jpg
```

Then update Open Graph and Twitter image tags to use it.

### Real Blog Pages

Current blogs are preview cards only.

For stronger SEO, add real blog detail URLs later:

```txt
/blogs/anxiety-support
/blogs/stress-management
/blogs/parent-guidance
```

Each blog page should have:

- Unique URL
- Unique title
- Unique meta description
- Article JSON-LD
- Real author/date
- Internal links to booking/collaboration where relevant

### Location SEO

Location-wise SEO is not applied yet by decision.

Future location pages may include:

- City-specific counselling pages
- Local business schema
- Address/areaServed details
- Google Business Profile connection
- Local FAQs

### Legal And Trust Pages

Production should add indexable trust/legal pages:

- Privacy Policy
- Terms and Conditions
- Mental health/counselling disclaimer
- Contact page
- About page with real team/clinic details if approved

### Search Console And Sitemap Submission

After deployment:

- Add Google Search Console.
- Verify domain ownership.
- Submit sitemap.
- Fix coverage/indexing warnings.
- Add Bing Webmaster Tools if needed.

### Technical SEO Checks Before Launch

Run final checks for:

- Correct production canonical URLs.
- No local URLs in SEO tags.
- Sitemap returns 200.
- `robots.txt` returns 200.
- Admin/API blocked from indexing.
- Mobile viewport layout.
- Page title length.
- Meta description quality.
- Image alt text where images carry content.
- Lighthouse SEO/accessibility score.
- No broken public links.

## Missing Areas To Apply Later

- Real location-wise SEO.
- Real blog pages with unique URLs.
- Real collaboration/case-study pages if public.
- Dedicated contact/about/legal pages.
- Social preview image instead of logo-only preview.
- Google Search Console and sitemap submission.
- Analytics/Tag Manager only after privacy consent decision.
- Schema update with real address, phone, opening hours, and sameAs links when client approves.
- Server-side rendering or prerendering if SEO performance becomes a problem for React SPA indexing.

## Current SEO Limitation

This website is currently a React SPA. Google can index modern JavaScript apps, but traditional static HTML or server-rendered pages are stronger for SEO.

For production, if ranking becomes a serious priority, consider:

- Prerendering the public pages.
- Moving public site pages to a framework with SSR/SSG.
- Keeping the admin dashboard as SPA-only and blocked from search engines.

## 2026-08-27 SEO Continuity Update

This entry tracks SEO areas affected by the latest routed-page and content-management changes.

### SEO Areas Currently Covered Or Expected
- Core HTML metadata should cover NeuroCogno as a mental wellness, counselling, psychological support, child support, parent guidance, anxiety support, emotional wellness, workshops, and collaboration-oriented website.
- Route-specific content now exists for About Us, NeuroCogno Insight, Workshops & Events, Collaboration, and Services, so each page should eventually receive a unique title, meta description, canonical URL, and Open Graph/Twitter metadata.
- Public image uploads through CMS must require meaningful alt text, especially for hero images, insight cards, workshop cards, collaboration images, founder images, and visual canvas items.
- Insight and service pages should use clear headings, descriptive body copy, and semantic sections instead of image-only content.
- FAQ content should remain indexable where appropriate and can later be upgraded with FAQ schema if legally/clinically approved.

### Production SEO Still Pending
- Replace localhost URLs in sitemap/canonical tags with the final domain.
- Add location-wise SEO once service geography is finalized.
- Add Organization, LocalBusiness/MedicalBusiness where appropriate, BreadcrumbList, and FAQ structured data after final content approval.
- Confirm robots.txt and sitemap.xml after deployment.
- Compress and name uploaded images with descriptive filenames where possible.
- Add final page titles/descriptions for every route after client copy is locked.


## 2026-09-06 Pre-Handover Audit, Mobile, SEO, And Security Update

- Added route-specific SEO metadata and structured data for Insight Hub, Workshops & Events, and Services so those public routes no longer inherit homepage SEO.
- Updated sitemap coverage for all public routes: home, about, services, insight, workshops, and collaborations.
- Added a mobile-only UI refinement layer for small screens covering header/nav, hero, grids, cards, forms, popups, admin tables, and footer behavior without changing backend orchestration.
- Gated `/api/dev` so developer routes are not registered when `NODE_ENV=production`.
- Added a temporary local/client-preview admin seed account through `.env` only; this must be removed or disabled before final public launch.
- Resolved dependency audit findings by forcing `qs@6.16.0`; `npm audit --audit-level=high` now reports zero vulnerabilities.
- Verification completed: `npm run check`, `npm run build`, and `npm audit --audit-level=high` all pass.
- Created `PRE_HANDOVER_DEEP_AUDIT_2026-09-06.md` with the current SEO/security/payment/database/mobile readiness status and remaining deploy-time checklist.
