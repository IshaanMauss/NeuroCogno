# 📱 MOBILE-FIRST, SEO & DARK MODE IMPLEMENTATION GUIDE

## 🎯 Overview

This guide ensures your NeuroCogno website is:
- ✅ **Mobile-First** (not just responsive)
- ✅ **SEO Optimized** (Google ranking ready)
- ✅ **Dark Mode** (with auto-detection)
- ✅ **Performance Optimized** (fast loading)
- ✅ **Accessibility Compliant** (WCAG 2.1 AA)

---

## 📱 MOBILE-FIRST DESIGN

### Core Principles

**Mobile-First ≠ Responsive**
- Responsive = Design for desktop, squeeze for mobile ❌
- Mobile-First = Design for mobile, enhance for desktop ✅

### CSS Strategy

```css
/* ===================================
   MOBILE-FIRST CSS STRUCTURE
   =================================== */

/* 1. BASE STYLES (Mobile - Default) */
/* These apply to ALL devices */

body {
  font-size: 16px; /* Base font - never go below 16px on mobile */
  line-height: 1.6;
  padding: 0;
  margin: 0;
}

.container {
  width: 100%;
  padding: 1rem; /* 16px on mobile */
  max-width: 100%;
}

/* Touch targets: Minimum 44x44px (Apple), 48x48px (Google) */
button, a, input {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 20px;
}

/* Typography - Mobile First */
h1 { font-size: 1.75rem; } /* 28px */
h2 { font-size: 1.5rem; }  /* 24px */
h3 { font-size: 1.25rem; } /* 20px */
p { font-size: 1rem; }     /* 16px */

/* 2. TABLET (min-width: 768px) */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 720px;
    margin: 0 auto;
  }

  h1 { font-size: 2rem; }   /* 32px */
  h2 { font-size: 1.75rem; }
  h3 { font-size: 1.5rem; }
}

/* 3. DESKTOP (min-width: 1024px) */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }

  h1 { font-size: 2.5rem; }  /* 40px */
  h2 { font-size: 2rem; }
}

/* 4. LARGE DESKTOP (min-width: 1280px) */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

### Mobile-First Components

```css
/* Card Component - Mobile First */
.card {
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

/* Navigation - Mobile First (Hamburger) */
.nav {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: -100%;
  width: 80%;
  height: 100vh;
  background: var(--bg-primary);
  transition: left 0.3s ease;
  z-index: 1000;
}

.nav.active {
  left: 0;
}

/* Desktop: Horizontal nav */
@media (min-width: 1024px) {
  .nav {
    position: static;
    flex-direction: row;
    width: auto;
    height: auto;
    left: 0;
  }

  .hamburger {
    display: none;
  }
}
```

### Touch Optimization

```css
/* Smooth scrolling for mobile */
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Disable double-tap zoom on buttons */
button, a {
  touch-action: manipulation;
}

/* Larger input fields for mobile */
input, textarea, select {
  font-size: 16px; /* Prevents zoom on iOS */
  padding: 12px;
}

/* Remove tap highlight on mobile */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Better touch targets */
.clickable {
  position: relative;
  padding: 12px;
}

.clickable::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
}
```

---

## 🌙 DARK MODE IMPLEMENTATION

### CSS Variables Strategy

```css
/* ===================================
   DARK MODE - CSS VARIABLES
   =================================== */

:root {
  /* Light Mode (Default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-tertiary: #adb5bd;
  
  --border-color: #dee2e6;
  --shadow: rgba(0, 0, 0, 0.1);
  
  --brand-primary: #6f42c1;
  --brand-secondary: #4527a0;
  
  --success: #28a745;
  --error: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
}

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #404040;
  
  --text-primary: #f8f9fa;
  --text-secondary: #adb5bd;
  --text-tertiary: #6c757d;
  
  --border-color: #404040;
  --shadow: rgba(0, 0, 0, 0.3);
  
  --brand-primary: #9575cd;
  --brand-secondary: #7e57c2;
  
  --success: #4caf50;
  --error: #f44336;
  --warning: #ff9800;
  --info: #2196f3;
}

/* Apply colors */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow);
}

button.primary {
  background-color: var(--brand-primary);
  color: var(--text-primary);
}

/* Images in dark mode */
[data-theme="dark"] img {
  opacity: 0.9;
}

[data-theme="dark"] img:hover {
  opacity: 1;
}
```

### JavaScript Implementation

```javascript
// ===================================
// DARK MODE - JavaScript
// ===================================

class ThemeManager {
  constructor() {
    this.currentTheme = this.getTheme();
    this.applyTheme(this.currentTheme);
    this.setupListeners();
  }

  getTheme() {
    // Priority: 1. User preference (saved), 2. System preference, 3. Default (light)
    const saved = localStorage.getItem('theme');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      return saved;
    }

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  applyTheme(theme) {
    const effectiveTheme = this.resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    this.updateMetaThemeColor(effectiveTheme);
  }

  resolveTheme(theme) {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  updateMetaThemeColor(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  }

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);

    // Sync with backend
    this.syncThemeToBackend(theme);
  }

  async syncThemeToBackend(theme) {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) return;

    try {
      await fetch('/api/profile/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, preferredTheme: theme })
      });
    } catch (error) {
      console.error('Failed to sync theme:', error);
    }
  }

  setupListeners() {
    // Listen for system theme changes (when theme is 'auto')
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  toggle() {
    const newTheme = this.resolveTheme(this.currentTheme) === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
}

// Initialize
const themeManager = new ThemeManager();

// Theme toggle button
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  themeManager.toggle();
});
```

### HTML Setup

```html
<!-- Add to <head> -->
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ffffff">

<!-- Theme toggle button -->
<button id="theme-toggle" aria-label="Toggle dark mode">
  <svg class="sun-icon" width="24" height="24" viewBox="0 0 24 24">
    <!-- Sun icon SVG -->
  </svg>
  <svg class="moon-icon" width="24" height="24" viewBox="0 0 24 24">
    <!-- Moon icon SVG -->
  </svg>
</button>
```

---

## 🔍 SEO OPTIMIZATION

### Meta Tags (Dynamic)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>NeuroCogno - Professional Counseling & Mental Wellness</title>
  <meta name="title" content="NeuroCogno - Professional Counseling & Mental Wellness">
  <meta name="description" content="Get expert counseling for anxiety, depression, stress, and relationship issues. Book your confidential session with certified therapists at NeuroCogno.">
  <meta name="keywords" content="counseling, therapy, mental health, psychologist, anxiety, depression, online counseling, mental wellness">
  <meta name="author" content="NeuroCogno">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://neurocogno.com/">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://neurocogno.com/">
  <meta property="og:title" content="NeuroCogno - Professional Counseling & Mental Wellness">
  <meta property="og:description" content="Get expert counseling for anxiety, depression, stress, and relationship issues. Book your confidential session with certified therapists.">
  <meta property="og:image" content="https://neurocogno.com/og-image.jpg">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="NeuroCogno">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://neurocogno.com/">
  <meta property="twitter:title" content="NeuroCogno - Professional Counseling & Mental Wellness">
  <meta property="twitter:description" content="Get expert counseling for anxiety, depression, stress, and relationship issues. Book your confidential session with certified therapists.">
  <meta property="twitter:image" content="https://neurocogno.com/twitter-image.jpg">

  <!-- Mobile Meta Tags -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="NeuroCogno">

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">

  <!-- Schema.org for Google -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "NeuroCogno",
    "description": "Professional counseling and mental wellness services",
    "url": "https://neurocogno.com",
    "telephone": "+91-XXX-XXX-XXXX",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your Street",
      "addressLocality": "Your City",
      "postalCode": "XXXXXX",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://facebook.com/neurocogno",
      "https://twitter.com/neurocogno",
      "https://linkedin.com/company/neurocogno"
    ]
  }
  </script>
</head>
```

### Semantic HTML

```html
<!-- Use semantic HTML5 tags -->
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation -->
  </nav>
</header>

<main role="main">
  <article>
    <h1>Professional Counseling Services</h1>
    <section>
      <h2>Our Services</h2>
      <!-- Content -->
    </section>
  </article>
</main>

<aside role="complementary">
  <!-- Sidebar content -->
</aside>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

### Performance Optimization

```html
<!-- Preconnect to critical domains -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://checkout.razorpay.com">

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/primary.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/styles/critical.css" as="style">

<!-- Defer non-critical CSS -->
<link rel="stylesheet" href="/styles/main.css" media="print" onload="this.media='all'">

<!-- Lazy load images -->
<img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy" alt="Descriptive alt text">
```

### robots.txt

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /profile/

Sitemap: https://neurocogno.com/sitemap.xml
```

### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://neurocogno.com/</loc>
    <lastmod>2026-06-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://neurocogno.com/services</loc>
    <lastmod>2026-06-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://neurocogno.com/about</loc>
    <lastmod>2026-06-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Critical CSS (Inline in <head>)

```html
<style>
  /* Critical above-the-fold styles */
  body {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background: #fff;
  }
  
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
```

### Image Optimization

```html
<!-- Responsive images with srcset -->
<picture>
  <source
    media="(min-width: 1024px)"
    srcset="hero-desktop.webp 1x, hero-desktop@2x.webp 2x"
    type="image/webp">
  <source
    media="(min-width: 768px)"
    srcset="hero-tablet.webp 1x, hero-tablet@2x.webp 2x"
    type="image/webp">
  <img
    src="hero-mobile.jpg"
    srcset="hero-mobile.webp 1x, hero-mobile@2x.webp 2x"
    alt="Professional counseling services"
    loading="lazy"
    width="800"
    height="600">
</picture>
```

### JavaScript Loading

```html
<!-- Defer non-critical JS -->
<script src="/js/main.js" defer></script>

<!-- Async for analytics -->
<script src="/js/analytics.js" async></script>

<!-- Module preload for modern browsers -->
<link rel="modulepreload" href="/js/app.js">
```

---

## 📊 ANALYTICS & TRACKING

### Backend SEO API Endpoints

```javascript
// Add to server/src/routes/publicRoutes.js

/**
 * Get SEO metadata for dynamic pages
 */
router.get('/seo/metadata', async (req, res) => {
  const { page } = req.query;

  const metadata = {
    home: {
      title: 'NeuroCogno - Professional Counseling & Mental Wellness',
      description: 'Get expert counseling for anxiety, depression, stress...',
      keywords: 'counseling, therapy, mental health...',
      ogImage: '/images/og-home.jpg'
    },
    services: {
      title: 'Our Counseling Services | NeuroCogno',
      description: 'Explore our comprehensive counseling services...',
      keywords: 'counseling services, therapy types...',
      ogImage: '/images/og-services.jpg'
    }
    // Add more pages
  };

  res.json(metadata[page] || metadata.home);
});
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Mobile-First
- [ ] Design screens at 375px width first
- [ ] Touch targets minimum 48x48px
- [ ] Font size minimum 16px (prevents zoom on iOS)
- [ ] Test on real devices
- [ ] Hamburger menu for mobile
- [ ] Bottom navigation for mobile app feel
- [ ] Swipe gestures supported

### Dark Mode
- [ ] CSS variables defined for all colors
- [ ] Auto-detect system preference
- [ ] Save user preference
- [ ] Smooth transitions (0.3s)
- [ ] Toggle button accessible
- [ ] Meta theme-color updates
- [ ] Images adjusted for dark mode

### SEO
- [ ] All meta tags present
- [ ] Schema.org markup added
- [ ] Sitemap.xml created
- [ ] robots.txt configured
- [ ] Canonical URLs set
- [ ] Alt tags on all images
- [ ] Semantic HTML used
- [ ] Page load < 3 seconds
- [ ] Mobile-friendly (Google test)

---

**🚀 With these implementations, your website will rank high on Google, load fast on slow connections, and provide excellent user experience on all devices!**

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


## 2026-09-06 Pre-Handover Audit, Mobile, SEO, And Security Update

- Added route-specific SEO metadata and structured data for Insight Hub, Workshops & Events, and Services so those public routes no longer inherit homepage SEO.
- Updated sitemap coverage for all public routes: home, about, services, insight, workshops, and collaborations.
- Added a mobile-only UI refinement layer for small screens covering header/nav, hero, grids, cards, forms, popups, admin tables, and footer behavior without changing backend orchestration.
- Gated `/api/dev` so developer routes are not registered when `NODE_ENV=production`.
- Added a temporary local/client-preview admin seed account through `.env` only; this must be removed or disabled before final public launch.
- Resolved dependency audit findings by forcing `qs@6.16.0`; `npm audit --audit-level=high` now reports zero vulnerabilities.
- Verification completed: `npm run check`, `npm run build`, and `npm audit --audit-level=high` all pass.
- Created `PRE_HANDOVER_DEEP_AUDIT_2026-09-06.md` with the current SEO/security/payment/database/mobile readiness status and remaining deploy-time checklist.
