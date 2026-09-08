import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  Baby,
  Brain,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Lock,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Moon,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  Download,
  Wallet,
  Wifi,
  Wrench,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';
import './styles.css';

const navItems = [
  ['/about-us', 'About Us'],
  ['/neurocogno-insight', 'NeuroCogno Insight'],
  ['/workshops-events', 'Workshops & Events'],
  ['/collaborations', 'Collaboration'],
  ['/services', 'Services']
];

const siteUrl = 'https://neurocogno.com';

const seoByRoute = {
  home: {
    title: 'NeuroCogno | Mental Wellness, Counselling & Emotional Wellbeing',
    description:
      'NeuroCogno provides confidential counselling, psychological support, anxiety support, stress management, parent guidance, relationship counselling and emotional wellbeing services for children, teens, adults and seniors.',
    path: '/',
    keywords:
      'mental wellness counselling, psychological support, anxiety support, stress management, emotional wellbeing, relationship counselling, child counselling, teen counselling, adult counselling, senior counselling, parent guidance, online counselling, in person counselling',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'NeuroCogno',
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: 'NeuroCogno',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        email: 'info@neurocogno.com',
        description:
          'Confidential counselling and mental wellness support for children, teenagers, adults, seniors, parents and relationships.',
        areaServed: 'India',
        knowsAbout: [
          'Counselling',
          'Mental wellness',
          'Anxiety support',
          'Stress management',
          'Relationship counselling',
          'Parent guidance',
          'Child counselling',
          'Teen counselling',
          'Emotional wellbeing'
        ],
        makesOffer: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Counselling' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Anxiety Support' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Stress Management' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Relationship Counselling' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Parent Guidance' } }
        ]
      }
    ]
  },
  collaborations: {
    title: 'Collaborate With NeuroCogno | Mental Wellness Programs & Workshops',
    description:
      'Partner with NeuroCogno for school wellness programs, corporate mental health workshops, community awareness drives, counselling events and emotional wellbeing collaborations.',
    path: '/collaborations',
    keywords:
      'mental wellness collaboration, counselling workshop, school wellness program, corporate mental health workshop, community mental health camp, psychology awareness event, emotional wellbeing program, NeuroCogno collaboration',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Collaborate With NeuroCogno',
        url: `${siteUrl}/collaborations`,
        description:
          'Collaboration enquiries for school wellness programs, workplace mental health workshops, community counselling awareness drives and emotional wellbeing events.'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Mental Wellness Collaboration Programs',
        provider: {
          '@type': 'Organization',
          name: 'NeuroCogno',
          url: siteUrl
        },
        serviceType: 'Mental wellness workshops and counselling awareness collaborations',
        audience: [
          { '@type': 'Audience', audienceType: 'Schools' },
          { '@type': 'Audience', audienceType: 'Workplaces' },
          { '@type': 'Audience', audienceType: 'Community organizations' }
        ]
      }
    ]
  },
  insights: {
    title: 'NeuroCogno Insight Hub | Mental Wellness Blogs, Resources & Learning',
    description:
      'Explore NeuroCogno Insight Hub for mental wellness blogs, counselling education, parent guidance resources, psychology articles, therapy creativity stories and video learning.',
    path: '/neurocogno-insight',
    keywords:
      'mental wellness blogs, psychology articles, counselling resources, therapy learning, child development resources, parent guidance articles, anxiety education, stress management resources, NeuroCogno Insight Hub',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'NeuroCogno Insight Hub',
        url: `${siteUrl}/neurocogno-insight`,
        description:
          'Mental wellness education, blogs, podcasts, photo stories, videos and practical resources from NeuroCogno.'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'NeuroCogno mental wellness learning sections',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Blogs' },
          { '@type': 'ListItem', position: 2, name: 'Podcasts' },
          { '@type': 'ListItem', position: 3, name: 'Expert Articles' },
          { '@type': 'ListItem', position: 4, name: 'Resources' },
          { '@type': 'ListItem', position: 5, name: 'Photo Stories' }
        ]
      }
    ]
  },
  workshops: {
    title: 'NeuroCogno Workshops & Events | Mental Wellness Programs',
    description:
      'View NeuroCogno workshops and events for schools, workplaces, parents and communities, including awareness drives, wellbeing camps and counselling education sessions.',
    path: '/workshops-events',
    keywords:
      'mental health workshops, counselling events, school anxiety awareness, corporate stress management workshop, parent child communication session, mental wellbeing awareness camp, NeuroCogno events',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'NeuroCogno Workshops & Events',
        url: `${siteUrl}/workshops-events`,
        description:
          'Upcoming and past mental wellness workshops, counselling awareness events and community wellbeing programs by NeuroCogno.'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'EventSeries',
        name: 'NeuroCogno mental wellness workshops',
        organizer: {
          '@type': 'Organization',
          name: 'NeuroCogno',
          url: siteUrl
        },
        eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode'
      }
    ]
  },
  services: {
    title: 'NeuroCogno Services | Counselling, Therapy & Homecare Support',
    description:
      'Discover NeuroCogno counselling services including anxiety support, stress management, emotional wellness, parent guidance, developmental support, collaborations and home help.',
    path: '/services',
    keywords:
      'counselling services, therapy support, anxiety counselling, stress management counselling, parent guidance, developmental support, emotional wellness, homecare therapy, NeuroCogno services',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'NeuroCogno counselling and mental wellness services',
        provider: {
          '@type': 'ProfessionalService',
          name: 'NeuroCogno',
          url: siteUrl
        },
        serviceType: 'Counselling, therapy, parent guidance, emotional wellbeing and homecare support',
        areaServed: 'India',
        audience: [
          { '@type': 'Audience', audienceType: 'Children' },
          { '@type': 'Audience', audienceType: 'Teenagers' },
          { '@type': 'Audience', audienceType: 'Adults' },
          { '@type': 'Audience', audienceType: 'Families' }
        ]
      }
    ]
  }
};

function setMeta(name, content, attribute = 'name') {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function useSeo(routeKey) {
  useEffect(() => {
    const seo = seoByRoute[routeKey] || seoByRoute.home;
    const canonical = `${siteUrl}${seo.path}`;
    const image = `${siteUrl}/logo.png`;

    document.title = seo.title;
    setMeta('description', seo.description);
    setMeta('keywords', seo.keywords);
    setMeta('og:url', canonical, 'property');
    setMeta('og:title', seo.title, 'property');
    setMeta('og:description', seo.description, 'property');
    setMeta('og:image', image, 'property');
    setMeta('twitter:title', seo.title);
    setMeta('twitter:description', seo.description);
    setMeta('twitter:image', image);
    setLink('canonical', canonical);

    document.head.querySelectorAll('script[data-route-schema="true"]').forEach((script) => script.remove());
    seo.schema.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.routeSchema = 'true';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [routeKey]);
}

function useThemeMode() {
  const [theme, setTheme] = useState(() => localStorage.getItem('neurocogno_theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('neurocogno_theme', theme);
    setMeta('theme-color', theme === 'dark' ? '#172a46' : '#6aaee8');
  }, [theme]);

  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))];
}

const api = {
  async get(path) {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  async patch(path, body) {
    const res = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  async delete(path) {
    const res = await fetch(path, { method: 'DELETE', credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
};


function useSiteContent(section) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const query = section ? `?section=${encodeURIComponent(section)}` : '';

    async function loadContent() {
      try {
        const data = await api.get(`/api/public/site-content${query}`);
        if (alive) setItems(data.items || []);
      } catch {
        if (alive) setItems([]);
      }
    }

    loadContent();
    const socket = io('/', { withCredentials: true });
    socket.on('site-content:updated', loadContent);
    socket.on('site-content:media-uploaded', loadContent);
    return () => {
      alive = false;
      socket.disconnect();
    };
  }, [section]);

  return items;
}

function contentByKey(items, key, fallback = '') {
  const item = items.find((entry) => entry.key === key && entry.isActive !== false);
  return item?.value || item?.body || item?.title || fallback;
}

function sortContentItems(items) {
  return [...items].sort((a, b) => {
    const orderDiff = Number(a.order || 0) - Number(b.order || 0);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
}

function carouselFromContent(items, fallback, placement = '') {
  const target = placement.toLowerCase();
  const cmsItems = sortContentItems(
    items.filter((item) => {
      if (item.isActive === false || !['carousel_item', 'image'].includes(item.type)) return false;
      if (!target) return true;
      const placementText = `${item.key || ''} ${item.placement || ''} ${item.label || ''}`.toLowerCase();
      return placementText.includes(target);
    })
  ).map((item) => ({
    image: item.imageUrl || item.url || '/logo.png',
    tag: item.subtitle || item.placement || item.section,
    title: item.title || item.label,
    copy: item.description || item.body || item.value || '',
    alt: item.alt || item.label || item.title,
    order: Number(item.order || 0)
  }));

  if (!cmsItems.length) return fallback;
  const merged = [...fallback];
  cmsItems.forEach((item) => {
    const slot = Number.isFinite(item.order) ? Math.max(0, Math.floor(item.order)) : merged.length;
    if (slot < merged.length) merged[slot] = item;
    else merged.push(item);
  });
  return merged;
}

function videoFromContent(items, fallback = '', keyHint = '') {
  const target = keyHint.toLowerCase();
  const videos = sortContentItems(
    items.filter((entry) => {
      if (entry.isActive === false || entry.type !== 'video') return false;
      if (!target) return true;
      return `${entry.key || ''} ${entry.placement || ''} ${entry.label || ''}`.toLowerCase().includes(target);
    })
  );
  const item = videos[0];
  return item?.url || item?.value || fallback;
}
function mediaByKey(items, key) {
  return items.find((entry) => entry.key === key && entry.isActive !== false);
}

function itemsByPlacement(items, placement) {
  const target = placement.toLowerCase();
  return items.filter((item) => item.isActive !== false && String(item.placement || '').toLowerCase().includes(target));
}

function youtubeEmbedUrl(url) {
  if (!url) return '';
  let value = String(url).trim();
  const iframeSrc = value.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) value = iframeSrc;
  if (!/^https?:\/\//i.test(value)) value = `https://${value.replace(/^\/\//, '')}`;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
    const path = parsed.pathname.split('/').filter(Boolean);
    let id = '';

    if (host === 'youtu.be') id = path[0] || '';
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      if (path[0] === 'embed' || path[0] === 'shorts' || path[0] === 'live') id = path[1] || '';
      if (!id && path[0] === 'watch') id = parsed.searchParams.get('v') || '';
      if (!id && parsed.searchParams.get('v')) id = parsed.searchParams.get('v') || '';
      if (!id && parsed.searchParams.get('list')) return `https://www.youtube.com/embed/videoseries?list=${parsed.searchParams.get('list')}&rel=0`;
    }

    id = id.replace(/[^a-zA-Z0-9_-]/g, '');
    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : value;
  } catch {
    return value;
  }
}
function visitorId() {
  const key = 'neurocogno_visitor_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = `vis_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, value);
  return value;
}

function track(type, payload = {}) {
  api.post('/api/public/visitor-events', {
    visitorId: visitorId(),
    type,
    path: window.location.pathname,
    ...payload
  }).catch(() => {});
}

function navigateTo(path, options = {}) {
  const targetPath = path || '/about-us';
  const hash = options.hash ? `#${options.hash}` : '';
  const nextUrl = `${targetPath}${hash}`;
  if (window.location.pathname !== targetPath || window.location.hash !== hash) {
    if (hash) sessionStorage.setItem('neurocogno_pending_hash_scroll', hash.slice(1));
    window.history.pushState({}, '', nextUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  track('nav_click', { section: targetPath, metadata: options.hash ? { hash: options.hash } : undefined });
  window.setTimeout(() => {
    if (options.hash) {
      document.getElementById(options.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 50);
}

function scrollToSection(id) {
  if (typeof id === 'string' && id.startsWith('/')) {
    navigateTo(id);
    return;
  }

  const routeBySection = {
    home: '/about-us',
    'about-us': '/about-us',
    insights: '/neurocogno-insight',
    workshops: '/workshops-events',
    collaboration: '/collaborations',
    services: '/services'
  };

  if (routeBySection[id]) {
    navigateTo(routeBySection[id]);
    return;
  }

  if (id === 'booking' || id === 'faqs') {
    navigateTo('/about-us', { hash: id });
    return;
  }

  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  track('section_jump', { section: id });
}

function goToCollaboration() {
  navigateTo('/collaborations');
  track('cta_click', { section: 'collaboration_page' });
}

function goToBooking() {
  navigateTo('/about-us', { hash: 'booking' });
}

function goHome() {
  navigateTo('/about-us');
}

function Logo() {
  return (
    <button type="button" className="logoButton" onClick={goHome} aria-label="Go to About Us">
      <span className="logoMark">
        <img src="/logo.png" alt="" onError={(event) => event.currentTarget.classList.add('missingLogo')} />
      </span>
      <span>
        <strong>
          Neuro<span>Cogno</span>
        </strong>
        <small>Mental Wellness & Counselling</small>
      </span>
    </button>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      className={`themeToggle ${isDark ? 'active' : ''}`}
      onClick={onToggle}
      type="button"
      aria-label={isDark ? 'Switch to day mode' : 'Switch to night mode'}
      title={isDark ? 'Day mode' : 'Night mode'}
    >
      <span className="themeToggleOrb">{isDark ? <Moon size={15} /> : <Sun size={15} />}</span>
    </button>
  );
}

function activeNavPath() {
  const currentPath = window.location.pathname === '/' ? '/about-us' : window.location.pathname;
  return navItems.find(([path]) => currentPath === path || currentPath.startsWith(`${path}/`))?.[0] || '/about-us';
}

function Header({ contact, theme, onToggleTheme }) {
  const currentNavPath = activeNavPath();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Close the mobile menu automatically on any route change (nav click,
    // back/forward, programmatic navigateTo), so it never stays open over
    // the next page by mistake.
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener('popstate', closeMenu);
    return () => window.removeEventListener('popstate', closeMenu);
  }, []);

  useEffect(() => {
    // Prevent background scroll while the mobile menu overlay is open.
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function go(path) {
    setMenuOpen(false);
    navigateTo(path);
  }

  function goBookFromMenu() {
    setMenuOpen(false);
    goToBooking();
  }

  return (
    <header className="siteHeader">
      <Logo />
      <nav className="navLinks" aria-label="Main navigation">
        {navItems.map(([path, label]) => {
          const isActive = currentNavPath === path;
          return (
            <button
              key={path}
              className={isActive ? 'active' : ''}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigateTo(path)}
            >
              {label}
            </button>
          );
        })}
      </nav>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <button className="primaryButton headerCta" onClick={goToBooking}>
        <CalendarDays size={18} />
        Book Appointment
      </button>
      <a className="mobileCall" href={`tel:${contact.ceoPhone}`} aria-label="Connect with NeuroCogno team">
        <Phone size={18} />
      </a>
      <button
        type="button"
        className="mobileMenuToggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {menuOpen &&
        createPortal(
          <div className="mobileMenuOverlay" role="dialog" aria-modal="true" aria-label="Site menu">
            <nav className="mobileMenuLinks" aria-label="Main navigation (mobile)">
              {navItems.map(([path, label]) => {
                const isActive = currentNavPath === path;
                return (
                  <button
                    key={path}
                    className={isActive ? 'active' : ''}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => go(path)}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
            <div className="mobileMenuActions">
              <button className="primaryButton" onClick={goBookFromMenu}>
                <CalendarDays size={18} />
                Book Appointment
              </button>
              <a className="outlineButton mobileMenuCall" href={`tel:${contact.ceoPhone}`} onClick={() => setMenuOpen(false)}>
                <Phone size={18} />
                Call the team
              </a>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

const dailyInsights = [
  {
    title: 'Name the feeling',
    kicker: 'Today\'s Gentle Insight',
    body: 'Affect labeling, simply naming what you feel, can reduce emotional intensity and make the next step easier to choose.',
    action: 'Try saying: I am noticing worry, not I am worry.'
  },
  {
    title: 'One slower breath',
    kicker: 'Today\'s Mind Hack',
    body: 'A longer exhale can signal safety to the nervous system. It is a small reset, not a cure, and it works best when repeated gently.',
    action: 'Inhale for four, exhale for six, three times.'
  },
  {
    title: 'Attention is trainable',
    kicker: 'Psychology Note',
    body: 'The mind wanders naturally. Bringing attention back without self-criticism is the useful part of the practice.',
    action: 'Pick one sound nearby and listen to it for ten seconds.'
  },
  {
    title: 'Tiny routines help',
    kicker: 'Wellbeing Cue',
    body: 'Predictable routines reduce decision load. Even a two-minute ritual can make the day feel less scattered.',
    action: 'Choose one small anchor: water, sunlight, stretch, or journaling.'
  },
  {
    title: 'Rest is information',
    kicker: 'Gentle Reminder',
    body: 'Tiredness is not failure. It is data from the body asking for pacing, support, or recovery.',
    action: 'Ask: what would make the next hour 5 percent lighter?'
  },
  {
    title: 'Connection regulates',
    kicker: 'Human Care Fact',
    body: 'Supportive social contact can help the body move out of threat mode. A short honest message is often enough to begin.',
    action: 'Send one person: thinking of you, hope your day is okay.'
  },
  {
    title: 'Thoughts are events',
    kicker: 'Cognitive Skill',
    body: 'A thought can be real as an experience without being the final truth. Creating distance helps choice return.',
    action: 'Try: I am having the thought that...'
  }
];

function todayInsight() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start.getTime()) / 86400000);
  return dailyInsights[day % dailyInsights.length];
}

function DailyInsight() {
  const [open, setOpen] = useState(false);
  const insight = todayInsight();

  return (
    <>
      <button className="dailyInsightChip" type="button" onClick={() => setOpen(true)}>
        <Sparkles size={18} />
        <span>{insight.kicker}</span>
      </button>
      {open && createPortal(
        <div className="insightOverlay" role="dialog" aria-modal="true">
          <div className="insightCloud">
            <button className="insightClose" type="button" aria-label="Close daily insight" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            <p>{insight.kicker}</p>
            <h2>{insight.title}</h2>
            <span>{insight.body}</span>
            <strong>{insight.action}</strong>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


function MiniCareScene({ type = 'counselling', className = '' }) {
  const Person = ({ x = 0, y = 0, tone = '', scale = 1, mirror = false }) => (
    <g className={`scenePerson ${tone}`} transform={`translate(${x} ${y}) scale(${mirror ? -scale : scale} ${scale})`}>
      <circle className="sceneHead" cx="16" cy="15" r="8" />
      <path className="sceneHair" d="M8 13c3-9 15-10 18-2-6-2-12-1-18 2z" />
      <path className="sceneBody" d="M4 34c4-13 21-13 25 0l4 31H0l4-31z" />
    </g>
  );

  const Desk = () => <path className="sceneTable" d="M63 73h30c5 0 8 3 8 8v4H55v-4c0-5 3-8 8-8z" />;

  const scenes = {
    confidential: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="62" ry="13" />
        <rect className="sceneObject" x="24" y="42" width="38" height="43" rx="7" />
        <path className="sceneLine" d="M33 42v-8c0-13 10-23 23-23s23 10 23 23v8" />
        <Person x="96" y="26" tone="alt" />
        <path className="sceneAccent" d="M100 75l8 8 19-24" />
        <path className="sceneLine soft" d="M35 60h14M35 70h18" />
      </>
    ),
    psychologist: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="62" ry="13" />
        <rect className="sceneChair" x="24" y="60" width="38" height="28" rx="8" />
        <Person x="35" y="24" />
        <Desk />
        <path className="sceneLine" d="M91 43h32l13 12-13 12H91z" />
        <path className="sceneAccent" d="M100 53h17M100 60h11" />
      </>
    ),
    supportive: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="62" ry="13" />
        <Person x="39" y="27" />
        <Person x="103" y="27" tone="alt" mirror />
        <path className="sceneAccent" d="M70 55c5-9 13-9 18 0 5-9 18-5 18 5 0 13-18 21-27 28-9-7-27-15-27-28 0-10 13-14 18-5z" />
        <path className="sceneArm" d="M65 74c9 7 19 7 28 0" />
      </>
    ),
    online: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="60" ry="13" />
        <rect className="sceneScreen" x="26" y="34" width="58" height="42" rx="7" />
        <circle className="sceneHead" cx="55" cy="51" r="8" />
        <path className="sceneBody" d="M43 67c4-10 21-10 24 0" />
        <path className="sceneLine" d="M50 87h20M60 76v11" />
        <path className="sceneAccent" d="M101 42c8 8 8 24 0 32M113 34c14 14 14 38 0 52" />
      </>
    ),
    counselling: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="62" ry="13" />
        <rect className="sceneChair" x="24" y="59" width="38" height="29" rx="9" />
        <rect className="sceneChair sceneChairAlt" x="94" y="59" width="38" height="29" rx="9" />
        <Person x="35" y="25" />
        <Person x="109" y="25" tone="alt" mirror />
        <Desk />
        <path className="sceneLine soft" d="M68 53h20M68 62h25" />
      </>
    ),
    anxiety: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="58" ry="13" />
        <Person x="63" y="31" />
        <path className="sceneHalo" d="M48 62c-9-22 4-46 28-50M108 62c9-22-4-46-28-50" />
        <path className="sceneBreath" d="M31 76c13-8 25-8 38 0M87 76c13-8 25-8 38 0" />
        <path className="sceneAccent" d="M45 36c-8 6-13 14-15 24M111 36c8 6 13 14 15 24" />
      </>
    ),
    stress: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="60" ry="13" />
        <rect className="sceneObject" x="28" y="38" width="39" height="50" rx="7" />
        <path className="sceneLine" d="M39 53h17M39 65h20M39 77h14" />
        <Person x="94" y="31" />
        <path className="sceneArm" d="M92 73l-25 8" />
        <path className="sceneAccent" d="M94 25l8-9 8 9M118 23l10-6M84 21l-8-7" />
      </>
    ),
    parent: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="62" ry="13" />
        <Person x="39" y="25" />
        <Person x="92" y="41" tone="alt" scale="0.78" />
        <path className="sceneArm" d="M68 70c9 8 17 8 25 0" />
        <path className="sceneAccent" d="M73 54c4-7 10-7 14 0 5-8 16-4 16 5 0 11-15 17-23 24-8-7-23-13-23-24 0-9 11-13 16-5z" />
      </>
    ),
    emotional: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="58" ry="13" />
        <Person x="63" y="31" />
        <path className="sceneHalo" d="M43 66c0-29 16-50 37-50s37 21 37 50" />
        <path className="sceneAccent" d="M57 51c4-8 11-8 15 0 5-8 16-4 16 5 0 11-15 18-23 25-8-7-23-14-23-25 0-9 11-13 15-5z" />
      </>
    ),
    developmental: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="60" ry="13" />
        <Person x="34" y="34" />
        <path className="sceneLine" d="M91 80V43M91 80h34M91 64h25M91 49h16" />
        <path className="sceneAccent" d="M80 42c10-12 24-17 43-13M80 59c13-9 26-12 42-8" />
        <circle className="sceneDot" cx="126" cy="43" r="4" />
      </>
    ),
    collaboration: (
      <>
        <ellipse className="sceneShadow" cx="78" cy="103" rx="63" ry="13" />
        <rect className="sceneScreen" x="25" y="37" width="48" height="37" rx="7" />
        <circle className="sceneHead" cx="49" cy="53" r="8" />
        <path className="sceneBody" d="M37 69c4-10 21-10 24 0" />
        <path className="sceneLine" d="M49 85h18M58 74v11" />
        <Person x="100" y="33" tone="alt" scale="0.9" />
        <path className="sceneAccent" d="M80 55h20M80 67h25" />
      </>
    )
  };

  return (
    <svg className={`miniCareScene ${className}`} viewBox="0 0 156 120" aria-hidden="true" focusable="false">
      {scenes[type] || scenes.counselling}
    </svg>
  );
}

function Hero({ contact, content = [], onOpenSurvey }) {
  const heroImage = mediaByKey(content, 'homepage.hero.image');
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const showCmsHeroImage = Boolean(heroImage?.imageUrl && !heroImageFailed);

  useEffect(() => {
    setHeroImageFailed(false);
  }, [heroImage?.imageUrl]);

  return (
    <section className="hero section" id="home">
      <div className="heroCopy">
      <svg className="peaceSigil" viewBox="0 0 520 620" aria-hidden="true">
        <g className="sigilGlow" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="sigilPath sigilBase" pathLength="1" d="M112 542 H408" />
          <path className="sigilPath sigilStem" pathLength="1" d="M260 542 L260 110" />
          <path className="sigilPath sigilSide sigilLeftSide" pathLength="1" d="M260 110 C232 149 190 191 155 244 C118 300 107 374 139 431 C164 477 208 504 260 508" />
          <path className="sigilPath sigilSide sigilRightSide" pathLength="1" d="M260 110 C288 149 330 191 365 244 C402 300 413 374 381 431 C356 477 312 504 260 508" />
          <path className="sigilPath sigilBowl sigilLeftBowl" pathLength="1" d="M130 354 C151 427 206 461 260 459" />
          <path className="sigilPath sigilBowl sigilRightBowl" pathLength="1" d="M390 354 C369 427 314 461 260 459" />
          <path className="sigilPath sigilCurl sigilLeftCurl" pathLength="1" d="M260 376 C225 391 177 370 164 326 C151 280 180 238 222 244 C262 250 281 294 254 326 C235 349 202 345 192 321" />
          <path className="sigilPath sigilCurl sigilRightCurl" pathLength="1" d="M260 376 C295 391 343 370 356 326 C369 280 340 238 298 244 C258 250 239 294 266 326 C285 349 318 345 328 321" />
          <circle className="sigilDot" cx="260" cy="100" r="18" />
        </g>
      </svg>
        <p className="eyebrow">{contentByKey(content, 'homepage.hero.eyebrow', 'Compassionate. Confidential. Caring.')}</p>
        <h1>
          Supporting Minds,
          <br />
          Enriching <span>Lives.</span>
        </h1>
        <p className="heroText">
          {contentByKey(content, 'homepage.hero.subtitle', 'Professional counselling and psychological support for children, teens, adults and seniors.')}
        </p>
        <DailyInsight />
        <div className="heroActions">
          <button className="primaryButton" onClick={goToBooking}>
            <CalendarDays size={18} />
            Book Appointment
          </button>
          <a
            className="outlineButton"
            href="/collaborations"
            onClick={(event) => {
              event.preventDefault();
              goToCollaboration();
            }}
          >
            <Users size={18} />
            Collab With Us
          </a>
          <a
            className="outlineButton"
            href={`tel:${contact.ceoPhone}`}
            onClick={() => track('cta_click', { section: 'call_founder' })}
          >
            <Phone size={18} />
            Connect with Team
          </a>
        </div>
        <div className="trustStrip iconTrustStrip">
          <span>
            <ShieldCheck size={22} /> 100% Confidential
          </span>
          <span>
            <User size={22} /> Professional Care
          </span>
          <span>
            <HeartHandshake size={22} /> Safe & Supportive
          </span>
          <span>
            <Monitor size={22} /> Online & In-Person
          </span>
        </div>
      </div>
      <div className={`heroVisual ${showCmsHeroImage ? 'hasCmsImage' : ''}`} aria-label={heroImage?.alt || 'Counselling room visual'}>
        {showCmsHeroImage ? (
          <img
            className="heroCmsImage"
            src={heroImage.imageUrl}
            alt={heroImage.alt || heroImage.label || 'NeuroCogno counselling visual'}
            onError={() => setHeroImageFailed(true)}
          />
        ) : (
          <>
            <div className="wallFrame">you matter</div>
            <div className="plant tall" />
            <div className="plant small" />
            <div className="couch">
              <div className="counsellor person" />
              <div className="client person" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

const helpCards = [
  {
    title: 'Children',
    Icon: Baby,
    points: ['Learning Difficulties', 'Behaviour Concerns', 'Emotional Support'],
    detail:
      'Children may need support when learning, behaviour, emotions, sleep, school adjustment or confidence begin affecting daily life. NeuroCogno keeps the process gentle, parent-aware and age-sensitive.',
    focus: ['Learning and attention patterns', 'Emotional expression', 'Behaviour and routine support', 'Parent-child understanding']
  },
  {
    title: 'Teenagers',
    Icon: Sparkles,
    points: ['Anxiety & Stress', 'Confidence Building', 'Academic Pressure'],
    detail:
      'Teenagers often need a space where they are heard without pressure. Support can focus on anxiety, exam stress, identity, friendships, emotional overwhelm and confidence.',
    focus: ['Academic and exam stress', 'Confidence and self-worth', 'Emotional regulation', 'Family and peer communication']
  },
  {
    title: 'Adults',
    Icon: User,
    points: ['Stress Management', 'Relationship Issues', 'Emotional Wellbeing'],
    detail:
      'Adults may seek counselling for stress, overthinking, burnout, relationship strain, life transitions or emotional clarity. Sessions are structured around practical wellbeing and steady insight.',
    focus: ['Stress and burnout', 'Relationship patterns', 'Mood and overthinking', 'Work-life emotional balance']
  },
  {
    title: 'Seniors',
    Icon: Leaf,
    points: ['Loneliness', 'Life Transitions', 'Emotional Support'],
    detail:
      'Senior support can help with loneliness, grief, changing roles, health-related stress, family distance and emotional adjustment. The tone stays respectful, patient and reassuring.',
    focus: ['Loneliness and companionship needs', 'Life transition support', 'Grief and adjustment', 'Emotional safety']
  },
  {
    title: 'Love & Relationships',
    Icon: HeartPulse,
    points: ['Communication', 'Trust & Understanding', 'Emotional Connection'],
    detail:
      'Relationship support helps people understand communication patterns, trust concerns, emotional distance, conflict cycles and the need for healthier connection.',
    focus: ['Communication patterns', 'Trust and emotional safety', 'Conflict understanding', 'Connection and boundaries']
  }
];

function HelpDetailModal({ card, onClose }) {
  if (!card) return null;
  const Icon = card.Icon;
  const book = () => {
    onClose();
    window.setTimeout(goToBooking, 120);
  };

  return createPortal(
    <div className="helpDetailOverlay" role="dialog" aria-modal="true" aria-label={`${card.title} support details`}>
      <div className="helpDetailModal">
        <button className="helpDetailClose" type="button" aria-label="Close details" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="helpDetailIcon">
          <Icon size={34} />
        </div>
        <p className="eyebrow">How NeuroCogno Helps</p>
        <h2>{card.title}</h2>
        <p className="helpDetailCopy">{card.detail}</p>
        <div className="helpDetailFocus">
          {card.focus.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="helpDetailActions">
          <button className="primaryButton" type="button" onClick={book}>
            <CalendarDays size={18} />
            Book Appointment
          </button>
          <button className="outlineButton" type="button" onClick={onClose}>
            Keep Exploring
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function WhoWeHelp() {
  const [activeHelp, setActiveHelp] = useState(null);

  return (
    <section className="section" id="who">
      <SectionTitle title="Who We Help" />
      <div className="helpGrid">
        {helpCards.map(({ title, Icon, points }, index) => (
          <article className={`helpCard tone${index + 1}`} key={title}>
            <div className="avatarCircle">
              <Icon size={42} />
            </div>
            <h3>{title}</h3>
            <ul>
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <button onClick={() => setActiveHelp(helpCards[index])}>Learn more</button>
          </article>
        ))}
      </div>
      <HelpDetailModal card={activeHelp} onClose={() => setActiveHelp(null)} />
    </section>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="sectionTitle">
      <h2>{title}</h2>
      <span />
    </div>
  );
}

const serviceDetails = {
  Counselling: {
    title: 'Counselling',
    intro: 'Counselling is a confidential, guided conversation where a person can understand emotions, thoughts, relationships and repeated life patterns at a safe pace.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'Counselling gives space to speak freely without being judged. It helps the concern become clearer before solutions are forced.'],
      ['When it started', 'Modern counselling grew from talk-based psychological care and guidance practices, where listening, reflection and structured support became central to emotional wellbeing.'],
      ['How it helps', 'It can support stress, low mood, anxiety, relationship strain, confusion, grief, confidence and life transitions by turning scattered feelings into understandable patterns.'],
      ['How we do it', 'NeuroCogno begins with a gentle intake, understands the person and their context, then plans sessions around pace, privacy and practical emotional goals.'],
      ['What happens inside', 'Sessions may include reflective questions, emotional mapping, coping routines, communication support, grounding strategies and small next steps for daily life.'],
      ['What to expect', 'The first session is not about perfect answers. It is about feeling heard, identifying the concern, and deciding the most helpful support path.']
    ]
  },
  'Anxiety Support': {
    title: 'Anxiety Support',
    intro: 'Anxiety support helps people understand worry, fear, body tension and overthinking without treating them as weakness.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'Anxiety can show up as racing thoughts, restlessness, sleep difficulty, panic, avoidance or a constant feeling that something may go wrong.'],
      ['When to consider it', 'Support is useful when worry starts affecting school, work, relationships, sleep, decision-making or daily confidence.'],
      ['How it helps', 'It helps identify triggers, calm the nervous system, reduce avoidance and build steadier coping habits.'],
      ['How we do it', 'NeuroCogno uses a calm assessment, psychoeducation, grounding skills and practical routines that fit the client’s real life.'],
      ['Session focus', 'Sessions may explore thought loops, body signals, safety behaviours, pressure points and small steps for facing situations gradually.'],
      ['What to expect', 'The aim is not to erase every anxious feeling, but to make anxiety understandable and manageable.']
    ]
  },
  'Stress Management': {
    title: 'Stress Management',
    intro: 'Stress management helps people recognise overload and build healthier ways to respond before exhaustion becomes normal.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'Stress can come from workload, academics, family pressure, decisions, caregiving, deadlines or emotional responsibilities.'],
      ['When to consider it', 'It matters when tiredness, irritability, headaches, low focus, sleep issues or burnout patterns start repeating.'],
      ['How it helps', 'Support helps separate urgent from important, restore routines, regulate emotions and reduce pressure that feels constant.'],
      ['How we do it', 'NeuroCogno maps the stress cycle, identifies drains and builds a realistic plan for rest, boundaries and coping.'],
      ['Session focus', 'Sessions can include relaxation skills, time structure, thought reframing, emotional release and problem-solving.'],
      ['What to expect', 'The work stays practical and gentle so the person can make changes without adding more pressure.']
    ]
  },
  'Parent Guidance': {
    title: 'Parent Guidance',
    intro: 'Parent guidance supports caregivers in understanding a child’s behaviour, emotions, learning needs and communication style.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'It is not about blaming parents. It is about helping families understand what the child may be expressing through behaviour.'],
      ['When to consider it', 'It is useful for tantrums, withdrawal, school difficulty, attention concerns, emotional outbursts or parent-child conflict.'],
      ['How it helps', 'Parents learn calmer responses, clearer boundaries and ways to support the child without fear or pressure.'],
      ['How we do it', 'NeuroCogno listens to family context, observes patterns and suggests age-sensitive strategies that can work at home.'],
      ['Session focus', 'Sessions may include communication tools, routines, behaviour mapping, emotional coaching and parent reflection.'],
      ['What to expect', 'The process is collaborative. The goal is to make home feel more understandable and supportive.']
    ]
  },
  'Emotional Wellness': {
    title: 'Emotional Wellness',
    intro: 'Emotional wellness is about understanding feelings, building self-awareness and responding to life with more steadiness.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'It includes mood, confidence, self-expression, relationships, emotional regulation and a person’s sense of inner safety.'],
      ['When to consider it', 'Support helps when feelings feel heavy, confusing, bottled up or difficult to explain to others.'],
      ['How it helps', 'It improves emotional language, self-understanding, coping and the ability to ask for support before things escalate.'],
      ['How we do it', 'NeuroCogno creates a soft space for reflection, then builds tools around the person’s needs and comfort.'],
      ['Session focus', 'Sessions may include emotion naming, journaling prompts, coping plans, self-compassion and relationship awareness.'],
      ['What to expect', 'The work is steady and non-judgmental, helping the person feel less alone with their emotions.']
    ]
  },
  'Developmental Support': {
    title: 'Developmental Support',
    intro: 'Developmental support helps children, teens and families understand growth, learning, attention, behaviour and emotional milestones.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'It looks at how a person learns, plays, communicates, manages emotions and responds to everyday demands.'],
      ['When to consider it', 'Support may help with learning concerns, attention, social confidence, emotional regulation or developmental differences.'],
      ['How it helps', 'It gives families clearer language, realistic expectations and supportive strategies for daily routines.'],
      ['How we do it', 'NeuroCogno uses child-safe interaction, parent input and practical observation to understand the support need.'],
      ['Session focus', 'Sessions can include play-based tasks, attention activities, emotional expression, parent guidance and structured support plans.'],
      ['What to expect', 'The process is gentle, privacy-aware and focused on helping the child feel capable, not labelled.']
    ]
  },
  'Home-Based Support': {
    title: 'Home-Based Support',
    intro: 'Home-based support helps clients and families receive guided mental wellness care in a familiar, comfortable setting when clinic visits may feel difficult.',
    cta: 'Book an Appointment',
    action: goToBooking,
    sections: [
      ['What it means', 'Support is planned around the person’s home context, comfort level and practical daily routines.'],
      ['Who it helps', 'It can help children, parents, seniors or clients who need a gentler starting point.'],
      ['How it helps', 'A familiar environment can reduce hesitation and make observation, communication and family support easier.'],
      ['How we do it', 'NeuroCogno first understands the need, then suggests whether home-based support is suitable and safe.'],
      ['Session focus', 'Sessions may include counselling guidance, parent support, emotional check-ins and practical home routines.'],
      ['What to expect', 'The goal is calm, respectful care that does not feel forced or overwhelming.']
    ]
  },
  Collaboration: {
    title: 'Collaboration',
    intro: 'Collaboration opens space for schools, workplaces, communities and care groups to build mental wellness programs with NeuroCogno.',
    cta: 'Collab With Us',
    action: goToCollaboration,
    sections: [
      ['What it means', 'It can include workshops, awareness sessions, school programs, workplace wellbeing support and community mental health initiatives.'],
      ['Who it is for', 'Schools, colleges, offices, parent groups, NGOs and community teams can partner for structured mental wellness support.'],
      ['How it helps', 'Collaboration makes support accessible before people reach crisis. It normalises mental health conversations in familiar spaces.'],
      ['How we do it', 'NeuroCogno understands the audience, designs the topic flow and delivers sessions that are warm, practical and respectful.'],
      ['Program formats', 'Formats may include talks, group workshops, screening camps, parent sessions, educator sessions and awareness drives.'],
      ['What to expect', 'The collaboration page collects enquiries so the team can plan the right format, schedule and scope.']
    ]
  }
};

function ServiceInfoModal({ service, onClose }) {
  if (!service) return null;
  const compactSections = service.sections.map(([title, copy]) => {
    const firstSentence = copy.split(/(?<=\.)\s+/)[0] || copy;
    return [title, firstSentence];
  });

  return createPortal(
    <div className="serviceInfoOverlay" role="dialog" aria-modal="true">
      <article className="serviceInfoModal">
        <button className="serviceInfoClose" type="button" onClick={onClose} aria-label="Close service information">
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="serviceInfoHeader">
          <p className="eyebrow">NeuroCogno service guide</p>
          <h2>{service.title}</h2>
          <p>{service.intro}</p>
        </div>
        <div className="serviceInfoGrid">
          {compactSections.map(([title, copy]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </section>
          ))}
        </div>
        <div className="serviceInfoActions">
          <button className="outlineButton" type="button" onClick={onClose}>Close</button>
          <button
            className="primaryButton"
            type="button"
            onClick={() => {
              onClose();
              service.action();
            }}
          >
            {service.cta}
            <CalendarDays size={17} />
          </button>
        </div>
      </article>
    </div>,
    document.body
  );
}

function Services() {
  const [activeService, setActiveService] = useState(null);
  const services = [
    ['Counselling', 'https://img.shetu66.com/2023/11/09/1699533669014469.png', 'Therapist and client in a calm illustrated counselling room'],
    ['Anxiety Support', 'https://us.123rf.com/450wm/marinanaumova/marinanaumova2509/marinanaumova250900059/252172267-unhappy-woman-has-messy-chaos-in-head-mental-problems-big-hand-holds-an-upset-and-crying-girl.jpg?ver=6', 'Illustration of anxiety support and emotional holding'],
    ['Stress Management', 'https://fs02.vseosvita.ua/02011e1x-7ad7-1376x768.png', 'Illustration of untangling stress and mental overwhelm'],
    ['Parent Guidance', 'https://static.wixstatic.com/media/5f811e_c19ae8c870764a0dbf1235763d9ab876~mv2.webp/v1/fill/w_875%2Ch_556%2Cal_c%2Cq_85%2Cenc_auto/5f811e_c19ae8c870764a0dbf1235763d9ab876~mv2.webp', 'Family therapy illustration with parent and child'],
    ['Emotional Wellness', 'https://irp.cdn-website.com/450dd43d/dms3rep/multi/16692786_5767956.jpg', 'Therapist offering protective emotional support illustration'],
    ['Developmental Support', 'https://cdn.prod.website-files.com/67e1f63c84121880d6041305/69dc0fdf6c8f1d9af494fec1_Parent%20and%20Child%20Play%20Therapy%20%283%29.webp', 'Play therapy and developmental support illustration'],
    ['Home-Based Support', '/team/booking-room.png', 'Calm counselling room for home-based mental wellness support'],
    ['Collaboration', '/insights/creative/creative-07.jpeg', 'Art-style human collaboration and teamwork illustration']
  ];
  const steps = [
    ['Book Session', CalendarDays],
    ['Initial Assessment', User],
    ['Personalised Plan', ClipboardList],
    ['Regular Support', HeartHandshake],
    ['Improved Wellbeing', Sparkles]
  ];

  return (
    <section className="servicesBand section" id="services">
      <div className="servicesIllustrationPanel">
        <h2>Our Services</h2>
        <div className="serviceIcons humanServiceScenes">
          {services.map(([label, image, alt]) => (
            <button key={label} className="serviceImageTile" onClick={() => setActiveService(serviceDetails[label])}>
              <span className="serviceImageFrame">
                <img src={image} alt={alt} onError={(event) => event.currentTarget.classList.add('missingMedia')} />
              </span>
              <b>{label}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="processPanel">
        <h2>How It Works</h2>
        <div className="steps simpleSteps">
          {steps.map(([label, Icon], index) => (
            <div className="step" key={label}>
              <span className="stepIcon">
                <Icon size={30} />
              </span>
              <strong>{index + 1}</strong>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
      <ServiceInfoModal service={activeService} onClose={() => setActiveService(null)} />
    </section>
  );
}
const traversalLinks = [
  ['/about-us', 'Start with About Us', 'Meet NeuroCogno and book an appointment'],
  ['/neurocogno-insight', 'Read NeuroCogno Insight', 'Blogs, education, videos and resources'],
  ['/workshops-events', 'View Workshops & Events', 'Upcoming programs and awareness sessions'],
  ['/collaborations', 'Collaborate With Us', 'Partnerships for schools, workplaces and communities'],
  ['/services', 'Explore Services', 'Counselling and mental wellness support areas']
];

function PageLinks({ current }) {
  return (
    <section className="pageLinks section" aria-label="Explore NeuroCogno pages">
      <div>
        <p className="eyebrow">Explore NeuroCogno</p>
        <h2>Move through the site without losing context.</h2>
      </div>
      <div className="pageLinkGrid">
        {traversalLinks
          .filter(([path]) => path !== current)
          .map(([path, title, copy]) => (
            <button key={path} onClick={() => navigateTo(path)}>
              <strong>{title}</strong>
              <span>{copy}</span>
            </button>
          ))}
      </div>
    </section>
  );
}

const serviceDocItems = [
  {
    title: 'Counselling and Emotional Support',
    copy:
      'A confidential space for people who want to understand their thoughts, emotions, relationships and repeated patterns with steady professional guidance. Sessions are planned around the person, their pace and their current life context.',
    points: ['Personal emotional concerns', 'Relationship and communication stress', 'Low mood, overthinking and self-doubt']
  },
  {
    title: 'Anxiety and Stress Management',
    copy:
      'Support for clients experiencing tension, restlessness, academic pressure, workplace fatigue or difficulty switching off. The focus is on recognising triggers, building coping routines and making daily life feel more manageable.',
    points: ['Anxiety support', 'Stress regulation', 'Practical coping plans']
  },
  {
    title: 'Parent Guidance and Child Support',
    copy:
      'Guidance for parents and caregivers who want clearer ways to support children through learning concerns, behaviour changes, emotional needs or developmental challenges without creating fear or pressure at home.',
    points: ['Parent-child communication', 'Behaviour concerns', 'Learning and developmental support']
  },
  {
    title: 'Teen and Young Adult Wellbeing',
    copy:
      'A careful support pathway for teenagers and young adults dealing with confidence, identity, exams, social pressure, emotional overwhelm or family expectations. The tone stays respectful, practical and non-judgemental.',
    points: ['Academic pressure', 'Confidence building', 'Emotional expression']
  },
  {
    title: 'Workshops and Psychoeducation',
    copy:
      'Structured mental wellness sessions for schools, workplaces, parents and communities. Topics can include stress management, emotional literacy, mindful communication, resilience and awareness around seeking support early.',
    points: ['School programs', 'Corporate workshops', 'Community awareness']
  }
];

const serviceFaqs = [
  ['Which service should I choose first?', 'If you are unsure, start with the appointment request. The team can understand your concern and guide you toward the right support path.'],
  ['Can counselling be online?', 'Yes. Depending on availability and suitability, sessions can be planned online or in person.'],
  ['Is this only for serious mental health concerns?', 'No. Many people seek support for stress, confusion, relationship difficulty, parenting concerns, academic pressure or emotional clarity.'],
  ['Can parents enquire for a child or teenager?', 'Yes. Parents can request guidance and the team can explain the next appropriate step.'],
  ['Do workshops need to be customised?', 'Usually yes. School, workplace and community programs work best when the topic, age group and outcome are decided before the session.']
];

function ServicesDocumentation() {
  const testimonials = [
    'The sessions helped us understand the concern calmly and take practical next steps.',
    'The guidance felt structured, respectful and easy to follow between sessions.',
    'The workshop language was simple, warm and useful for both parents and students.'
  ];

  return (
    <section className="servicesDoc section" id="services">
      <div className="servicesDocHero">
        <p className="eyebrow">Professional care areas</p>
        <h1>NeuroCogno Services</h1>
        <p>
          NeuroCogno services are designed for people, families, students, parents, schools and organizations who need
          emotionally safe, practical and confidential mental wellness support. The goal is not to force a label, but to
          understand the concern clearly and decide the next helpful step.
        </p>
        <div className="docHeroActions">
          <button className="primaryButton" onClick={goToBooking}>Book Appointment</button>
          <button className="outlineButton" onClick={() => navigateTo('/neurocogno-insight')}>Check Our Insight Hub</button>
        </div>
      </div>

      <div className="serviceDocList">
        {serviceDocItems.map((item) => (
          <article key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.copy}</p>
            <ul>
              {item.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <section className="serviceTestimonials">
        <SectionTitle title="What People Usually Value" />
        <div className="testimonials compactTestimonials">
          {testimonials.map((quote) => (
            <article key={quote}>
              <div className="stars">*****</div>
              <p>{quote}</p>
              <strong>- NeuroCogno client feedback</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="serviceFaqBlock">
        <SectionTitle title="General Service Questions" />
        <div className="faqList">
          {serviceFaqs.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown size={16} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </section>
  );
}
function About() {
  return (
    <section className="about aboutCanvas section" id="about-us">
      <div className="aboutIntro">
        <p className="eyebrow">Private, steady, human care</p>
        <h2>Support designed around the person, not the problem label.</h2>
      </div>
      <div className="aboutCopyPanel">
        <p>
          NeuroCogno helps people speak openly, understand patterns, and move toward practical wellbeing
          through confidential counselling and psychological support.
        </p>
        <div className="aboutCareNotes" aria-label="NeuroCogno care approach">
          <span>Confidential first conversations</span>
          <span>Support matched to the concern</span>
          <span>Gentle follow-up without pressure</span>
        </div>
      </div>
    </section>
  );
}
function FounderStory() {
  return (
    <section className="founderStory section" aria-label="NeuroCogno founder story">
      <div className="founderPortrait">
        <img src="/team/ceo-booking.jpeg" alt="NeuroCogno CEO and founder" />
      </div>
      <div className="founderCopy">
        <p className="eyebrow">Founder’s note</p>
        <h2>Care built from listening first.</h2>
        <p>
          NeuroCogno began with a simple belief: people do not need to be rushed into labels before they are understood.
          Our founder shaped the practice around calm conversations, child-safe creative work, and practical psychological support
          that families can trust. What started as a focused vision for compassionate mental wellness has grown into a space where
          children, adults and communities can feel heard, guided and respected.
        </p>
      </div>
    </section>
  );
}

function AppointmentForm({ config, onLeadReady }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    ageGroup: '',
    reason: '',
    message: '',
    consentToContact: false
  });
  const [status, setStatus] = useState('');
  const draftTimer = useRef(null);

  useEffect(() => {
    clearTimeout(draftTimer.current);
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) return;

    draftTimer.current = setTimeout(() => {
      api.post('/api/public/lead-drafts', {
        visitorId: visitorId(),
        source: 'appointment_form',
        name: form.name,
        phone: form.phone,
        email: form.email,
        ageGroup: form.ageGroup,
        reason: form.reason,
        message: form.message
      }).catch(() => {});
    }, 900);

    return () => clearTimeout(draftTimer.current);
  }, [form]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (['name', 'phone', 'email'].includes(field)) track('form_focus', { section: 'booking' });
  };

  async function submit(event) {
    event.preventDefault();
    setStatus('Saving appointment request...');
    try {
      const data = await api.post('/api/public/appointments', {
        ...form,
        visitorId: visitorId(),
        source: 'appointment_form'
      });
      setStatus('Appointment request saved. You can now secure the booking slot.');
      onLeadReady(data.leadId, data.payment || config.payment);
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <form className="bookingForm" onSubmit={submit}>
      <div className="fieldPair">
        <input required placeholder="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
        <input
          required
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>
      <div className="fieldPair">
        <input placeholder="Email Address" value={form.email} onChange={(e) => update('email', e.target.value)} />
        <select value={form.ageGroup} onChange={(e) => update('ageGroup', e.target.value)}>
          <option value="">Age Group</option>
          <option>Child</option>
          <option>Teenager</option>
          <option>Adult</option>
          <option>Senior</option>
        </select>
      </div>
      <select value={form.reason} onChange={(e) => update('reason', e.target.value)}>
        <option value="">Reason for Consultation</option>
        <option>Anxiety or stress</option>
        <option>Relationship concern</option>
        <option>Parent guidance</option>
        <option>Academic pressure</option>
        <option>Emotional wellbeing</option>
      </select>
      <textarea placeholder="Your Message" value={form.message} onChange={(e) => update('message', e.target.value)} />
      <label className="consent">
        <input
          required
          type="checkbox"
          checked={form.consentToContact}
          onChange={(e) => update('consentToContact', e.target.checked)}
        />
        I consent to NeuroCogno saving my details and contacting me about this request.
      </label>
      <p className="privacyNote">Details typed here may be saved so the care team can follow up if you leave midway.</p>
      <button className="primaryButton fullWidth" type="submit">
        Request Appointment
        <Send size={17} />
      </button>
      {status && <p className="formStatus">{status}</p>}
    </form>
  );
}

const appointmentCheckQuestions = [
  [
    'Which emotional pattern feels most present today?',
    ['Anxiety or tension', 'Low mood or emotional fatigue', 'Relationship stress', 'I am not able to name it yet']
  ],
  [
    'What would you want the first session to help clarify?',
    ['My thoughts and triggers', 'A coping plan', 'Family or relationship dynamics', 'Whether counselling is right for me']
  ],
  [
    'How intense has this been over the last few days?',
    ['Mild but repeating', 'Moderate and affecting routine', 'Heavy and difficult to manage', 'It changes throughout the day']
  ],
  [
    'What pace of support would feel comfortable?',
    ['A gentle first conversation', 'Structured psychological assessment', 'Regular counselling support', 'Guidance before deciding']
  ]
];
function AppointmentSelfCheck({ onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const current = appointmentCheckQuestions[step];
  const completed = step >= appointmentCheckQuestions.length;

  function choose(option) {
    const nextAnswers = [...answers, { question: current[0], answer: option }];
    setAnswers(nextAnswers);
    track('appointment_self_check', {
      section: 'booking',
      metadata: { question: current[0], answer: option, step: step + 1 }
    });
    setStep((value) => value + 1);
  }

  function continueToBooking() {
    track('cta_click', { section: 'self_check_continue_to_booking', metadata: { answers } });
    onClose();
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="surveyOverlay selfCheckOverlay" role="dialog" aria-modal="true" aria-label="Appointment readiness self-check">
      <div className="surveyModal selfCheckModal">
        <button className="closeButton" onClick={onClose} aria-label="Close self-check">
          ×
        </button>
        <div className="pulseGlow" />
        {!completed ? (
          <>
            <p className="eyebrow">Before booking</p>
            <h2>{current[0]}</h2>
            <p className="selfCheckText">
              This short reflective check can help you approach the appointment with more clarity.
            </p>
            <div className="surveyOptions">
              {current[1].map((option) => (
                <button key={option} onClick={() => choose(option)}>
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="surveyContact selfCheckResult">
            <p className="eyebrow">Your starting point</p>
            <h2>A gentle first consultation may be the right next step.</h2>
            <p>
              You do not need to have the perfect words before booking. The first session can help map your concern,
              emotional patterns, and the kind of support that may suit you.
            </p>
            <button className="primaryButton fullWidth" onClick={continueToBooking}>
              Continue to Appointment Form
              <CalendarDays size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Booking({ config, onLeadReady }) {
  const [selfCheckOpen, setSelfCheckOpen] = useState(false);

  return (
    <>
      <section className="booking section" id="booking">
        <div className="bookingPortrait" aria-label="Calm counselling room visual">
          <img src="/team/booking-room.png" alt="Calm counselling room at NeuroCogno" />
        </div>
        <div className="bookingCopy">
          <h2>Book an Appointment</h2>
          <p>Take the first step towards a better tomorrow.</p>
          {['100% Confidential', 'Safe & Supportive Environment', 'Professional Guidance', 'Flexible Scheduling'].map(
            (item) => (
              <span key={item}>
                <CheckCircle size={18} />
                {item}
              </span>
            )
          )}
          <div className="bookingSelfCheck">
            <p>Unsure what to share first?</p>
            <button className="outlineButton" type="button" onClick={() => setSelfCheckOpen(true)}>
              <Brain size={17} />
              Take a Gentle Self-Check
            </button>
          </div>
        </div>
        <AppointmentForm config={config} onLeadReady={onLeadReady} />
      </section>
      {selfCheckOpen && <AppointmentSelfCheck onClose={() => setSelfCheckOpen(false)} />}
    </>
  );
}

const blogItems = [
  {
    title: 'Play-based expression in child sessions',
    tag: 'Child Therapy',
    image: '/insights/creative/creative-01.jpeg',
    alt: 'Block tower activity from child therapy work'
  },
  {
    title: 'Colour as a gentle emotional language',
    tag: 'Art Reflection',
    image: '/insights/creative/creative-02.jpeg',
    alt: 'Colourful child artwork used for emotional expression'
  },
  {
    title: 'Patterns, focus and calm planning',
    tag: 'Attention Skills',
    image: '/insights/creative/creative-03.jpeg',
    alt: 'Child arranging blocks for sequencing and focus'
  },
  {
    title: 'Identity stories through creative art',
    tag: 'Expression',
    image: '/insights/creative/creative-05.jpeg',
    alt: 'Child artwork portrait for expressive work'
  },
  {
    title: 'Clay work for sensory grounding',
    tag: 'Sensory Work',
    image: '/insights/creative/creative-06.jpeg',
    alt: 'Clay craft made during child-safe creative work'
  },
  {
    title: 'Construction play and flexible thinking',
    tag: 'Problem Solving',
    image: '/insights/creative/creative-07.jpeg',
    alt: 'Colourful construction activity for planning skills'
  }
];

function MovingCardStrip({ title, kicker, items, id }) {
  const loopItems = [...items, ...items];

  return (
    <section className="marqueeSection section" id={id}>
      <div className="marqueeHeader">
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
      </div>
      <div className="marqueeViewport">
        <div className="marqueeTrack">
          {loopItems.map((item, index) => (
            <article className="marqueeCard" key={`${item.title}-${index}`}>
              <div className="marqueeImage">
                <img src={item.image} alt={item.alt || item.title || 'NeuroCogno media'} onError={(event) => event.currentTarget.classList.add('missingMedia')} />
              </div>
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const insightResources = [
  { title: 'Blogs', id: 'insight-blogs', copy: 'Expert-backed articles on emotional wellness, child development, stress, relationships and parent guidance.' },
  { title: 'Podcasts', id: 'insight-podcasts', copy: 'Space for NeuroCogno audio conversations, expert interviews and educational series.' },
  { title: 'Expert Articles', id: 'insight-expert-articles', copy: 'Long-form explainers, clinical reflections and practical mental wellness resources.' },
  { title: 'News & Updates', id: 'insight-news', copy: 'Announcements, public programs, launches and team updates.' },
  { title: 'Resources', id: 'insight-resources', copy: 'Downloadable guides, checklists and worksheets can be added here later.' },
  { title: 'Photo Stories', id: 'insight-media', copy: 'Polaroid-style snapshots from awareness programs, shoots and community initiatives.' }
];

function InsightFloatingRail() {
  function jumpTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="insightFloatingRail" aria-label="NeuroCogno Insight sections">
      {insightResources.map((item) => (
        <button type="button" key={item.id} onClick={() => jumpTo(item.id)}>
          <span>{item.title}</span>
        </button>
      ))}
    </nav>
  );
}

const insightSectionFallbacks = {
  'insight-blogs': [
    {
      image: '/insights/creative/creative-02.jpeg',
      tag: 'Emotional Wellness',
      title: 'Gentle notes on feelings, growth and care',
      copy: 'Short NeuroCogno blog stories can introduce families to emotional wellness ideas without making the content feel clinical or heavy.',
      alt: 'Colourful child artwork for emotional wellness blog canvas'
    },
    {
      image: '/team/booking-room.png',
      tag: 'Care Notes',
      title: 'Understanding support before a first session',
      copy: 'Use this space for readable guidance, parent-friendly explainers and reflections from the NeuroCogno team.',
      alt: 'Calm counselling room for NeuroCogno blog canvas'
    }
  ],
  'insight-expert-articles': [
    {
      image: '/insights/creative/creative-03.jpeg',
      tag: 'Clinical Reflection',
      title: 'Attention, regulation and everyday patterns',
      copy: 'Long-form articles can explain therapy concepts, coping skills and psychological ideas in practical language.',
      alt: 'Pattern activity representing attention and regulation'
    },
    {
      image: '/insights/creative/creative-07.jpeg',
      tag: 'Applied Psychology',
      title: 'How children build problem-solving confidence',
      copy: 'A space for deeper explainers, professional reflections and evidence-informed wellbeing resources.',
      alt: 'Construction play activity for applied psychology article'
    }
  ],
  'insight-news': [
    {
      image: '/team/booking-room.png',
      tag: 'Team Update',
      title: 'Announcements, programs and public updates',
      copy: 'Use this canvas for launches, awareness drives, community programs, collaboration notices and NeuroCogno updates.',
      alt: 'Calm NeuroCogno room for news update canvas'
    },
    {
      image: '/insights/creative/creative-04.jpeg',
      tag: 'Awareness Moment',
      title: 'Seasonal activities and wellbeing messages',
      copy: 'A visual place for timely updates that should feel warm, useful and easy for families to scan.',
      alt: 'Child seasonal artwork for awareness update'
    }
  ],
  'insight-resources': [
    {
      image: '/insights/creative/creative-06.jpeg',
      tag: 'Downloadable Guide',
      title: 'Worksheets, checklists and simple support tools',
      copy: 'Add resource cards here for guides, self-check sheets, parent prompts, classroom tools and psychoeducation material.',
      alt: 'Clay activity representing hands-on wellbeing resource'
    },
    {
      image: '/insights/creative/creative-01.jpeg',
      tag: 'Family Resource',
      title: 'Small tools for daily emotional support',
      copy: 'This section can hold practical resources families can revisit before or after sessions.',
      alt: 'Block tower activity representing family resource canvas'
    }
  ]
};

function InsightSectionCanvas({ resource, items = [] }) {
  const cards = items.length ? items : insightSectionFallbacks[resource.id] || [];

  return (
    <section id={resource.id} className="insightResourcePanel insightCanvasSection">
      <div className="insightCanvasSectionIntro">
        <p className="eyebrow">{resource.title}</p>
        <h3>{resource.title}</h3>
        <p>{resource.copy}</p>
      </div>
      <div className="insightCanvasCards">
        {cards.map((item, index) => (
          <article key={`${resource.id}-${item.title}-${index}`}>
            <img src={item.image} alt={item.alt || item.title || resource.title} onError={(event) => event.currentTarget.classList.add('missingMedia')} />
            <div>
              <span>{item.tag}</span>
              <h4>{item.title}</h4>
              {item.copy && <p>{item.copy}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function InsightResourceSections({ content = [] }) {
  const placements = {
    'insight-blogs': 'insights.blogs',
    'insight-expert-articles': 'insights.expert',
    'insight-news': 'insights.news',
    'insight-resources': 'insights.resources'
  };

  return (
    <div className="insightResourceSections" aria-label="Insight written resources">
      {insightResources.filter((item) => !['insight-media', 'insight-podcasts'].includes(item.id)).map((item) => (
        <InsightSectionCanvas
          key={item.id}
          resource={item}
          items={carouselFromContent(content, [], placements[item.id])}
        />
      ))}
    </div>
  );
}
const insightCanvasFallback = [
  {
    image: '/logo.png',
    tag: 'Clinical Reflection',
    title: 'A calm space for upcoming insight visuals',
    copy: 'Use the admin visual canvas preset to publish posters, awareness creatives, event moments, or approved media here.',
    alt: 'NeuroCogno visual canvas placeholder'
  },
  {
    image: '/logo.png',
    tag: 'Awareness Creative',
    title: 'Editable visual canvas slot',
    copy: 'This canvas is independent from the Photo Wall and creative therapy section.',
    alt: 'NeuroCogno visual canvas placeholder'
  },
  {
    image: '/logo.png',
    tag: 'Insight Resource',
    title: 'Add a dedicated canvas image',
    copy: 'Upload an image from Website Media & Text using the Insight visual canvas preset.',
    alt: 'NeuroCogno visual canvas placeholder'
  }
];

const defaultWorkshopCards = [
  [
    'Upcoming',
    'School anxiety awareness drive',
    'For students, parents and educators',
    'https://static.wixstatic.com/media/697d34_be8a059be41f4682a32b4c97486d04b7~mv2.png/v1/fill/w_980%2Ch_653%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/697d34_be8a059be41f4682a32b4c97486d04b7~mv2.png',
    'School mental health workshop with students'
  ],
  [
    'Upcoming',
    'Corporate stress management workshop',
    'Workplace emotional resilience program',
    'https://images.squarespace-cdn.com/content/v1/688a04d92f356070a4d41031/d5e25236-3854-4158-92c3-9ecc94c6555e/d68dc833-8f49-4bff-8c77-19040936f46e.jpg',
    'Corporate wellbeing and stress regulation workshop'
  ],
  [
    'Planning',
    'Parent-child communication session',
    'Guided support for family systems',
    'https://speedy.uenicdn.com/6dbf598a-f1a5-4057-9ae5-8d1713958bd3/c680_a/image/upload/v1694452809/business/00a4a85a-2b00-4ad9-a1f9-a3f3616c3ee6.jpg',
    'Family counselling session in a calm room'
  ],
  [
    'Planning',
    'Mental wellbeing awareness camp',
    'Community outreach and screening support',
    '/team/booking-room.png',
    'Community mental health awareness group session'
  ]
];

const creativeTherapyFallback = [
  {
    image: '/insights/creative/creative-01.jpeg',
    tag: 'Play-Based Expression',
    title: 'Stacking feelings into visible form',
    copy: 'Structured play can help children externalise emotions, practise patience, and explore control, balance and frustration safely.',
    alt: 'Child therapy block tower activity'
  },
  {
    image: '/insights/creative/creative-02.jpeg',
    tag: 'Art Reflection',
    title: 'Colour as emotional language',
    copy: 'Creative drawing gives children a softer route to show perception, mood, imagination and inner experience without forcing direct verbal disclosure.',
    alt: 'Child artwork with colourful face and flower'
  },
  {
    image: '/insights/creative/creative-03.jpeg',
    tag: 'Attention & Sequencing',
    title: 'Patterns, focus and planning',
    copy: 'Hands-on pattern work can support observation, sequencing, motor planning and self-paced problem solving in a calm environment.',
    alt: 'Child arranging blue blocks in a pattern activity'
  },
  {
    image: '/insights/creative/creative-04.jpeg',
    tag: 'Seasonal Creativity',
    title: 'Festive imagination and structure',
    copy: 'Theme-based art can blend creativity with instruction following, colour choice, symbolic thinking and completion confidence.',
    alt: 'Child drawing of a decorated Christmas tree'
  },
  {
    image: '/insights/creative/creative-05.jpeg',
    tag: 'Identity Through Art',
    title: 'Stories children choose to tell',
    copy: 'Portrait and character drawings can become gentle windows into identity, attachment, confidence and the symbols children connect with.',
    alt: 'Child artwork of Krishna portrait'
  },
  {
    image: '/insights/creative/creative-06.jpeg',
    tag: 'Clay & Sensory Work',
    title: 'Tactile calm and expression',
    copy: 'Clay activities can support sensory regulation, hand strength, imagination and emotional grounding through touch and form.',
    alt: 'Yellow clay Ganesha made by child'
  },
  {
    image: '/insights/creative/creative-07.jpeg',
    tag: 'Construction Play',
    title: 'Building ideas step by step',
    copy: 'Construction play can reveal planning style, flexibility, persistence and how a child adapts when a design changes.',
    alt: 'Colourful craft-stick construction activity'
  }
];

function CreativeTherapyCanvas({ items = [] }) {
  const highlights = items.length ? items : creativeTherapyFallback;
  const lead = highlights[0];
  const rest = highlights.slice(1, 7);

  return (
    <section className="creativeTherapyCanvas" id="insight-photo-stories" aria-label="Child creativity and therapy activity highlights">
      <div className="creativeCanvasIntro">
        <p className="eyebrow">Child creativity, play and expressive work</p>
        <h3>Therapy moments without exposing identity.</h3>
        <p>
          NeuroCogno can highlight child-safe creative work, play-based activities and art expressions while keeping privacy intact.
          These visual stories help families understand how therapeutic activities can support emotion, attention, confidence and communication.
        </p>
      </div>
      <div className="creativeCanvasGrid">
        {lead && (
          <article className="creativeFeature">
            <img src={lead.image} alt={lead.alt || lead.title || 'NeuroCogno creative therapy highlight'} />
            <div>
              <span>{lead.tag}</span>
              <h4>{lead.title}</h4>
              <p>{lead.copy}</p>
            </div>
          </article>
        )}
        <div className="creativeMiniGrid">
          {rest.map((item, index) => (
            <article key={`${item.title}-${index}`} className={`creativeMini miniTone${index + 1}`}>
              <img src={item.image} alt={item.alt || item.title || 'NeuroCogno creative work'} />
              <div>
                <span>{item.tag}</span>
                <h4>{item.title}</h4>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightHub({ content = [] }) {
  const photoWallItems = carouselFromContent(content, blogItems, 'insights.card');
  const canvasItems = carouselFromContent(content, [], 'insights.canvas');
  const videoItems = sortContentItems(
    content.filter((item) => item.isActive !== false && item.type === 'video')
  ).map((item) => ({
    title: item.title || item.label || 'NeuroCogno video',
    tag: item.subtitle || item.placement || 'Video',
    copy: item.description || item.body || 'Approved NeuroCogno video resource.',
    embed: youtubeEmbedUrl(item.url || item.value)
  })).filter((item) => item.embed);
  const videoUrl = videoItems[0]?.embed || youtubeEmbedUrl(videoFromContent(content));

  return (
    <section className="insightHub section" id="insights">
      <InsightFloatingRail />
      <div className="insightIntro">
        <p className="eyebrow">Knowledge, media, updates</p>
        <h2>NeuroCogno Insight Hub</h2>
        <p>
          A dedicated space for blogs, podcasts, expert articles, educational resources, news updates, photos and video-led learning.
        </p>
      </div>
      <MovingCardStrip title="Insight Photo Wall" kicker="Blogs, stories, resources" items={photoWallItems} id="insight-media" />
      <CreativeTherapyCanvas items={carouselFromContent(content, creativeTherapyFallback, 'insights.creative')} />
      {canvasItems.length > 0 && (
        <div className="insightCanvasBoard" aria-label="Insight media canvases">
          {canvasItems.map((item, index) => (
            <article className={`insightCanvas canvasTone${index + 1}`} key={`${item.title}-${index}`}>
              <div className="insightCanvasImage">
                <img src={item.image} alt={item.alt || item.title || 'NeuroCogno visual story'} onError={(event) => event.currentTarget.classList.add('missingMedia')} />
              </div>
              <div>
                <span>{item.tag}</span>
                <h3>{item.title}</h3>
                {item.copy && <p>{item.copy}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
      <InsightResourceSections content={content} />
      <div className="videoLearningPanel" id="insight-podcasts">
        <div>
          <p className="eyebrow">Video learning space</p>
          <h3>YouTube education video embed</h3>
          <p>Paste an approved YouTube watch, shorts, embed, playlist, or iframe link in CMS and it can play directly here.</p>
        </div>
        <div className={`videoFrame ${videoUrl ? 'hasVideo' : ''}`} aria-label="YouTube video space">
          {videoUrl ? (
            <iframe src={videoUrl} title="NeuroCogno education video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          ) : (
            <>
              <Monitor size={42} />
              <strong>Video Embed Space</strong>
              <span>Ready for YouTube, podcast clips, or educational media.</span>
            </>
          )}
        </div>
      </div>
      {videoItems.length > 1 && (
        <div className="insightVideoBoard" aria-label="Additional NeuroCogno videos">
          {videoItems.slice(1, 4).map((item) => (
            <article key={item.embed}>
              <iframe src={item.embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
function WorkshopsEvents({ content = [] }) {
  const cmsCards = carouselFromContent(content, [], 'workshops.event');
  const cards = cmsCards.length ? cmsCards.map((item) => [item.tag, item.title, item.copy, item.image, item.alt]) : defaultWorkshopCards;

  return (
    <section className="workshopSection section" id="workshops">
      <div className="workshopHeader">
        <p className="eyebrow">Upcoming workshops and event calendar</p>
        <h2>Workshops & Events</h2>
        <p>Designed for schools, workplaces, parents, educators and communities, with clear space for upcoming programs and past highlights.</p>
      </div>
      <div className="workshopPolaroids">
        {cards.map(([status, title, copy, image, alt], index) => (
          <article key={title} className={`workshopCard tilt${index + 1}`}>
            <div className={`workshopPhotoSlot ${image ? 'hasCmsImage' : ''}`}>
              {image ? <img src={image} alt={alt || title} /> : <CalendarDays size={34} />}
            </div>
            <span>{status}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TestimonialsFaq({ contact }) {
  const faqs = [
    ['How long is a counselling session?', 'Most sessions are planned for 45 to 60 minutes.'],
    ['Is counselling confidential?', 'Yes. Client privacy and consent are handled carefully.'],
    ['Are online sessions available?', 'Yes. The team can support online and in-person sessions.'],
    ['How do I book a session?', 'Use the appointment form or connect with the NeuroCogno team directly.']
  ];

  return (
    <section className="feedbackFaq section" id="faqs">
      <div>
        <SectionTitle title="What Our Clients Say" />
        <div className="testimonials">
          {['Very supportive and understanding.', 'Our child has shown so much improvement.', 'Professional, kind and truly caring.'].map(
            (quote, index) => (
              <article key={quote}>
                <div className="stars">★★★★★</div>
                <p>{quote}</p>
                <strong>{index === 1 ? '- Parent' : '- Client'}</strong>
              </article>
            )
          )}
        </div>
      </div>
      <div>
        <SectionTitle title="Frequently Asked Questions" />
        <div className="faqList">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronDown size={16} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
      <a
        className="floatingCall whatsappHelp"
        href="/api/public/whatsapp-help"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('cta_click', { section: 'whatsapp_help' })}
        aria-label="Need help? Connect with team on WhatsApp"
      >
        <svg className="whatsappGlyph" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16.02 3.2c-7.02 0-12.74 5.67-12.74 12.64 0 2.23.6 4.4 1.73 6.3L3.2 28.8l6.86-1.78a12.85 12.85 0 0 0 5.96 1.47c7.02 0 12.74-5.67 12.74-12.65S23.04 3.2 16.02 3.2Zm0 22.99c-1.9 0-3.76-.52-5.38-1.5l-.39-.23-4.06 1.05 1.08-3.93-.26-.4a10.2 10.2 0 0 1-1.56-5.34c0-5.7 4.75-10.34 10.57-10.34s10.57 4.64 10.57 10.34-4.75 10.35-10.57 10.35Z" />
          <path d="M21.86 18.5c-.32-.16-1.9-.93-2.2-1.04-.3-.1-.52-.16-.73.16-.22.32-.84 1.04-1.03 1.25-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.6-.96-.85-1.6-1.9-1.8-2.23-.18-.32-.02-.5.14-.65.15-.14.32-.38.48-.56.16-.19.22-.32.32-.54.11-.21.06-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.85.4-.3.32-1.12 1.08-1.12 2.64 0 1.55 1.15 3.06 1.31 3.27.16.21 2.26 3.42 5.48 4.8.77.33 1.37.53 1.84.68.77.24 1.47.2 2.02.12.62-.09 1.9-.77 2.17-1.52.27-.74.27-1.38.19-1.52-.08-.13-.3-.21-.62-.37Z" />
        </svg>
        <span>Need help?<br />Connect with team</span>
      </a>
    </section>
  );
}

function Footer({ contact }) {
  return (
    <footer className="footer section" id="contact">
      <div>
        <Logo />
        <p>Empowering minds. Enriching lives.</p>
      </div>
      <div>
        <h3>Quick Links</h3>
        {navItems.map(([path, label]) => (
          <button key={path} onClick={() => navigateTo(path)}>
            {label}
          </button>
        ))}
      </div>
      <div>
        <h3>Contact Us</h3>
        <a href={`tel:${contact.ceoPhone}`}>
          <Phone size={16} /> {contact.ceoPhone}
        </a>
        {(contact.emails?.length ? contact.emails : [contact.email]).map((email) => (
          <a href={`mailto:${email}`} key={email}>
            <Mail size={16} /> {email}
          </a>
        ))}
        <p>{contact.address}</p>
      </div>
      <div>
        <h3>Direct Support</h3>
        <a href={`tel:${contact.ceoPhone}`}>
          <Phone size={18} /> Connect with Team
        </a>
        <button onClick={goToCollaboration}>
          <Users size={18} /> Collab With Us
        </button>
      </div>
    </footer>
  );
}

const surveyQuestions = [
  {
    question: 'What brings you to NeuroCogno today?',
    options: [
      '😟 Feeling stressed or overwhelmed',
      '😰 Experiencing anxiety or frequent worry',
      '😔 Feeling low, sad, or emotionally drained',
      '💔 Relationship or family concerns',
      '🌱 Looking for personal growth or emotional support',
      '🤔 I am not sure, but I would like to speak with a therapist'
    ]
  },
  {
    question: 'What would you like support with?',
    options: [
      'Managing stress or anxiety',
      'Improving emotional wellbeing',
      'Child or adolescent behavioural concerns',
      'Relationship or family concerns',
      'Academic or career-related challenges',
      'Personal growth and self-development',
      'I am not sure yet'
    ]
  },
  {
    question: 'Who is seeking support?',
    options: ['Myself', 'My child', 'My teenager', 'My partner or spouse', 'A family member', 'I am enquiring for someone else']
  },
  {
    question: 'How long have you been experiencing this?',
    options: ['A few days', 'A few weeks', 'A few months', 'More than 6 months', 'I am not sure']
  },
  {
    question: 'How would you like us to help?',
    options: ['Individual counselling', 'Homecare therapy', 'Child therapy', 'Parent guidance', 'Special education support', 'I am not sure, please guide me']
  },
  {
    question: 'How soon would you like to begin?',
    options: ['As soon as possible', 'Within the next 2-3 days', 'Within this week', 'I am exploring my options']
  },
  {
    question: 'Preferred time for a callback',
    options: ['Morning (9 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)', 'Anytime']
  },
  {
    question: 'Preferred mode of therapy',
    options: ['Online', 'In-person', 'Homecare (if available)', 'I am not sure']
  },
  {
    question: 'Have you received therapy before?',
    options: ['Yes', 'No', 'Prefer not to say']
  },
  {
    question: 'Is there anything you would like us to know before we contact you?',
    type: 'text',
    placeholder: 'You can share a short note here. This is optional.'
  }
];function SurveyPopup({ config, onLeadReady, openSignal = 0 }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [contact, setContact] = useState({ name: '', phone: '', email: '', consentToContact: false });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const hiddenUntil = Number(localStorage.getItem('neurocogno_survey_hidden_until') || 0);
    if (Date.now() < hiddenUntil) return;

    const timer = setTimeout(() => setVisible(true), 22000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const close = () => {
    const hideForOneDay = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('neurocogno_survey_hidden_until', String(hideForOneDay));
    setVisible(false);
  };

  async function submit(event) {
    event.preventDefault();
    setStatus('Saving callback request...');
    try {
      const data = await api.post('/api/public/survey-callbacks', {
        visitorId: visitorId(),
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        consentToContact: contact.consentToContact,
        answers
      });
      setStatus('Callback request received. Our team can now follow up.');
      const hideForThirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('neurocogno_survey_hidden_until', String(hideForThirtyDays));
      onLeadReady(data.leadId, data.payment || config.payment);
    } catch (error) {
      setStatus(error.message);
    }
  }

  const current = surveyQuestions[step];
  const isDevSurvey = import.meta.env.DEV;
  const goPreviousStep = () => setStep((value) => Math.max(0, value - 1));
  const goNextStep = () => setStep((value) => Math.min(surveyQuestions.length, value + 1));

  return (
    <div className="surveyOverlay" role="dialog" aria-modal="true" aria-label="Mental health callback survey">
      <div className="surveyModal">
        <button className="closeButton" onClick={close} aria-label="Close survey">
          ×
        </button>
        <div className="pulseGlow" />
        {step < surveyQuestions.length ? (
          <>
            <p className="eyebrow">A gentle check-in</p>
            <h2>{current.question}</h2>
            {current.type === 'text' ? (
              <form
                className="surveyContact surveyNoteStep"
                onSubmit={(event) => {
                  event.preventDefault();
                  const note = event.currentTarget.elements.surveyNote.value.trim();
                  setAnswers((items) => [...items, { question: current.question, answer: note || 'No note shared' }]);
                  setStep((value) => value + 1);
                }}
              >
                <textarea name="surveyNote" placeholder={current.placeholder} rows="4" />
                <div className="surveyStepActions">
                  <button
                    className="outlineButton"
                    type="button"
                    onClick={() => {
                      setAnswers((items) => [...items, { question: current.question, answer: 'No note shared' }]);
                      setStep((value) => value + 1);
                    }}
                  >
                    Skip
                  </button>
                  <button className="primaryButton" type="submit">Continue</button>
                </div>
              </form>
            ) : (
              <div className="surveyOptions">
                {current.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAnswers((items) => [...items, { question: current.question, answer: option }]);
                      setStep((value) => value + 1);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={submit} className="surveyContact">
            <p className="eyebrow">Request for a callback</p>
            <h2>Where should we call you?</h2>
            <input
              required
              placeholder="Full Name"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <input
              required
              placeholder="Phone Number"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
            <input
              placeholder="Email Address (optional)"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
            <label className="consent">
              <input
                required
                type="checkbox"
                checked={contact.consentToContact}
                onChange={(e) => setContact({ ...contact, consentToContact: e.target.checked })}
              />
              I consent to being contacted by NeuroCogno.
            </label>
            <button className="primaryButton fullWidth" type="submit">
              Request Callback
            </button>
            <a className="outlineButton fullWidth" href={`tel:${config.contact.ceoPhone}`}>
              <Phone size={17} />
              Connect with Team Directly
            </a>
            {status && <p className="formStatus">{status}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

function PaymentPanel({ pendingLead, config }) {
  const [status, setStatus] = useState('');

  if (!pendingLead) return null;

  async function loadRazorpay() {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function pay() {
    setStatus('Preparing secure checkout...');
    try {
      const order = await api.post('/api/payments/orders', { leadId: pendingLead, source: 'appointment_form' });
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Could not load payment checkout.');

      track('payment_opened', { metadata: { leadId: pendingLead } });

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'NeuroCogno',
        description: 'Booking slot payment',
        order_id: order.orderId,
        handler: async (response) => {
          await api.post('/api/payments/verify', { ...response, leadId: pendingLead });
          setStatus('Payment verified. Your booking slot is secured.');
        },
        theme: { color: '#5f8fc4' },
        modal: {
          ondismiss: () => setStatus('Checkout closed before payment was completed.')
        }
      });
      checkout.open();
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="paymentPanel">
      <div>
        <Wallet size={22} />
        <strong>Booking slot payment</strong>
        <span>Amount: ₹{config.payment.amountInr}</span>
      </div>
      <button className="primaryButton" onClick={pay}>
        Pay Securely
      </button>
      {!config.payment.configured && <p>Gateway keys are not configured yet. This is visible in admin issues.</p>}
      {status && <p>{status}</p>}
    </div>
  );
}

function PublicSite({ theme, onToggleTheme }) {
  useSeo('home');
  const [config, setConfig] = useState({
    payment: { configured: false, amountInr: 499 },
    contact: {
      ceoPhone: '+918976543210',
      email: 'hello@neurocogno.com',
      emails: ['info@neurocogno.com', 'support@neurocogno.com'],
      address: 'Bangalore, India'
    }
  });
  const [pendingLead, setPendingLead] = useState('');

  useEffect(() => {
    api.get('/api/public/config').then(setConfig).catch(() => {});
    track('page_view');
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) track('section_view', { section: entry.target.id });
        });
      },
      { threshold: 0.45 }
    );
    document.querySelectorAll('.section[id]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header contact={config.contact} theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <Hero contact={config.contact} content={homepageContent} />
        <About />
        <WhoWeHelp />
        <Booking config={config} onLeadReady={setPendingLead} />
        <PaymentPanel pendingLead={pendingLead} config={config} />
        <TestimonialsFaq contact={config.contact} />
        <InsightHub content={insightContent} />
        <WorkshopsEvents content={workshopContent} />
        </main>
      <Footer contact={config.contact} />
      <SurveyPopup config={config} onLeadReady={setPendingLead} />
    </>
  );
}

const collaborationItems = [
  {
    title: 'School Wellness Awareness Program',
    tag: 'Education Partner',
    image: '/collabs/collab-1.jpg'
  },
  {
    title: 'Corporate Emotional Wellness Workshop',
    tag: 'Workplace Care',
    image: '/collabs/collab-2.jpg'
  },
  {
    title: 'Community Mental Health Camp',
    tag: 'Community Outreach',
    image: '/collabs/collab-3.jpg'
  },
  {
    title: 'Parent Guidance Collaboration',
    tag: 'Family Support',
    image: '/collabs/collab-4.jpg'
  }
];

const upcomingEvents = [
  ['July 2026', 'School anxiety awareness drive'],
  ['August 2026', 'Corporate stress management workshop'],
  ['September 2026', 'Parent-child communication session']
];

function CollaborationPage({ theme, onToggleTheme }) {
  useSeo('collaborations');
  const content = useSiteContent('collaborations');
  const [config, setConfig] = useState({
    contact: {
      ceoPhone: '+918976543210',
      email: 'hello@neurocogno.com',
      emails: ['info@neurocogno.com', 'support@neurocogno.com'],
      address: 'Bangalore, India'
    }
  });
  const [form, setForm] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    collaborationType: '',
    message: '',
    consentToContact: false
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/api/public/config').then(setConfig).catch(() => {});
    track('page_view', { section: 'collaborations' });
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    setStatus('Sending collaboration enquiry...');
    try {
      await api.post('/api/public/collaboration-inquiries', {
        ...form,
        visitorId: visitorId()
      });
      setStatus('Collaboration enquiry saved. Our team will contact you.');
      setForm({
        name: '',
        organization: '',
        phone: '',
        email: '',
        collaborationType: '',
        message: '',
        consentToContact: false
      });
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <>
      <Header contact={config.contact} theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <section className="collabHero">
          <p className="eyebrow">Partnerships, workshops, awareness drives</p>
          <h1>Collaborate with NeuroCogno</h1>
          <p>
            Schools, workplaces, communities and care groups can partner with NeuroCogno for mental wellness programs,
            counselling awareness, events and guided support sessions.
          </p>
          <div className="collabHeroActions" aria-label="Collaboration page shortcuts">
            <button className="primaryButton" onClick={() => document.getElementById('collab-enquiry')?.scrollIntoView({ behavior: 'smooth' })}>
              <Send size={18} />
              Send Collaboration Enquiry
            </button>
            <button className="outlineButton" onClick={() => document.getElementById('collab-gallery')?.scrollIntoView({ behavior: 'smooth' })}>
              <Users size={18} />
              View Collaboration Wall
            </button>
            <button className="outlineButton" onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>
              <CalendarDays size={18} />
              Upcoming Events
            </button>
          </div>
        </section>
        <MovingCardStrip
          title="Recent Collaborations"
          kicker="Live collaboration wall"
          items={carouselFromContent(content, collaborationItems, 'collaborations.card')}
          id="collab-gallery"
        />
        <section className="collabDetails section">
          <div>
            <h2>What We Can Build Together</h2>
            <p>Awareness talks, school programs, workplace wellness sessions, community camps and specialised support circles.</p>
          </div>
          <div className="detailGrid">
            {['School Programs', 'Corporate Workshops', 'Community Camps', 'Parent Guidance', 'Event Partnerships', 'Referral Networks'].map((item) => (
              <article key={item}>{item}</article>
            ))}
          </div>
        </section>
        <section className="eventsSection section" id="events">
          <SectionTitle title="Upcoming Events" />
          <div className="eventGrid">
            {upcomingEvents.map(([date, title]) => (
              <article key={title}>
                <span>{date}</span>
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </section>
        <section className="collabEnquiry section" id="collab-enquiry">
          <div>
            <h2>Collaboration Enquiry</h2>
            <p>Share the basic details and the team can follow up with the right proposal.</p>
            <a href={`mailto:${config.contact.emails?.[0] || config.contact.email}`}>
              <Mail size={18} />
              {config.contact.emails?.[0] || config.contact.email}
            </a>
          </div>
          <form className="bookingForm" onSubmit={submit}>
            <div className="fieldPair">
              <input required placeholder="Full Name" value={form.name} onChange={(event) => update('name', event.target.value)} />
              <input placeholder="Organization / Institution" value={form.organization} onChange={(event) => update('organization', event.target.value)} />
            </div>
            <div className="fieldPair">
              <input required placeholder="Phone Number" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
              <input placeholder="Email Address" value={form.email} onChange={(event) => update('email', event.target.value)} />
            </div>
            <input required placeholder="Collaboration Type" value={form.collaborationType} onChange={(event) => update('collaborationType', event.target.value)} />
            <textarea placeholder="Tell us about the collaboration idea" value={form.message} onChange={(event) => update('message', event.target.value)} />
            <label className="consent">
              <input
                required
                type="checkbox"
                checked={form.consentToContact}
                onChange={(event) => update('consentToContact', event.target.checked)}
              />
              I consent to NeuroCogno saving these details and contacting me about collaboration.
            </label>
            <button className="primaryButton fullWidth" type="submit">
              Send Enquiry
              <Send size={17} />
            </button>
            {status && <p className="formStatus">{status}</p>}
          </form>
        </section>
      </main>
      <PageLinks current={window.location.pathname === '/' ? '/about-us' : window.location.pathname} />
      <Footer contact={config.contact} />
    </>
  );
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api.post('/api/auth/login', form);
      if (!window.location.pathname.startsWith('/admin')) {
        window.history.replaceState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="adminLogin">
      <form onSubmit={submit}>
        <Logo />
        <h1>Admin Login</h1>
        <input
          required
          type="text"
          placeholder="Admin ID or Email"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="primaryButton fullWidth" type="submit">
          <Lock size={17} />
          Login
        </button>
        {error && <p className="formStatus error">{error}</p>}
      </form>
    </main>
  );
}

const adminTabs = [
  ['survey-callbacks', 'Survey Popup Leads', HeartPulse],
  ['submitted-appointments', 'Appointment Form Leads', CalendarDays],
  ['collaboration-inquiries', 'Collaboration Requests', Users],
  ['incomplete-leads', 'Saved Draft Leads', Users],
  ['confirmed-leads', 'Confirmed / Paid Clients', CheckCircle],
  ['archived-leads', 'Archived Records', ClipboardList],
  ['site-content', 'Website Media & Text', Monitor],
  ['operations', 'Website Health & Traffic', Wifi],
  ['issues', 'Server / Payment Logs', Wrench],
  ['backup', 'Backup & Recovery', Download]
];

async function downloadAdminFile(path, fallbackName) {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) {
    const message = await res.json().then((d) => d.message).catch(() => 'Download failed');
    throw new Error(message || 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackName;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function BackupPanel({ showToast }) {
  const [busy, setBusy] = useState(null);

  async function handleDownload(kind) {
    setBusy(kind);
    try {
      if (kind === 'json') {
        await downloadAdminFile('/api/admin/backup/json', 'neurocogno-backup.json');
        showToast('JSON backup downloaded');
      } else {
        await downloadAdminFile('/api/admin/backup/excel', 'neurocogno-backup.xlsx');
        showToast('Excel backup downloaded');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="backupPanel">
      <div className="backupIntro">
        <h2>Keep a copy of your real data</h2>
        <p>
          These downloads capture everything in your database right now &mdash; leads, confirmed clients,
          payments, website content, user accounts (without passwords), and activity logs &mdash; in two
          formats built for two different jobs.
        </p>
      </div>

      <div className="backupOptions">
        <div className="backupOptionCard">
          <ShieldCheck size={26} />
          <h3>JSON backup</h3>
          <p>
            An exact, complete copy of every record. This is the one to keep for real disaster recovery
            &mdash; if the database was ever lost or corrupted, this file has everything needed to restore it.
            Not meant to be opened and read by a person.
          </p>
          <button className="primaryButton" disabled={busy === 'json'} onClick={() => handleDownload('json')}>
            <Download size={16} /> {busy === 'json' ? 'Preparing...' : 'Download JSON backup'}
          </button>
        </div>

        <div className="backupOptionCard">
          <ClipboardList size={26} />
          <h3>Excel backup</h3>
          <p>
            The same data, laid out as a spreadsheet with one tab per section (leads, payments, website
            content, and so on) plus a summary tab. Built for a person to actually open, skim, filter, and
            search &mdash; useful for reviewing records or sharing a snapshot with someone who isn&apos;t
            technical.
          </p>
          <button className="primaryButton" disabled={busy === 'excel'} onClick={() => handleDownload('excel')}>
            <Download size={16} /> {busy === 'excel' ? 'Preparing...' : 'Download Excel backup'}
          </button>
        </div>
      </div>

      <div className="backupAutoNote">
        <Wifi size={18} />
        <p>
          A full backup is also taken automatically every Sunday and stored securely in cloud storage,
          separate from this website&apos;s own database &mdash; so a recent copy always exists even if
          nobody downloads one manually. The last 8 weekly backups are kept.
        </p>
      </div>
    </div>
  );
}

function AdminDashboard({ theme, onToggleTheme }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('survey-callbacks');
  const [metrics, setMetrics] = useState(null);
  const [data, setData] = useState({});
  const [search, setSearch] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [actionLead, setActionLead] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [contentEditor, setContentEditor] = useState(null);

  function showToast(message, type = 'success') {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3600);
  }

  const loadAll = async () => {
    const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
    const requests = {
      metrics: api.get('/api/admin/metrics'),
      'survey-callbacks': api.get(`/api/admin/survey-callbacks${query}`),
      'submitted-appointments': api.get(`/api/admin/submitted-appointments${query}`),
      'collaboration-inquiries': api.get(`/api/admin/collaboration-inquiries${query}`),
      'incomplete-leads': api.get(`/api/admin/incomplete-leads${query}`),
      'confirmed-leads': api.get(`/api/admin/confirmed-leads${query}`),
      'archived-leads': api.get(`/api/admin/archived-leads${query}`),
      'site-content': api.get('/api/admin/site-content'),
      payments: api.get('/api/admin/payments'),
      traffic: api.get('/api/admin/traffic'),
      issues: api.get('/api/admin/issues')
    };

    const entries = await Promise.all(
      Object.entries(requests).map(async ([key, request]) => {
        try {
          return [key, await request];
        } catch {
          return [key, key === 'metrics' ? null : { items: [] }];
        }
      })
    );
    const results = Object.fromEntries(entries);

    if (results.metrics) setMetrics(results.metrics);
    setData({
      'survey-callbacks': results['survey-callbacks'].items,
      'submitted-appointments': results['submitted-appointments'].items,
      'collaboration-inquiries': results['collaboration-inquiries'].items,
      'incomplete-leads': results['incomplete-leads'].items,
      'confirmed-leads': results['confirmed-leads'].items,
      'archived-leads': results['archived-leads'].items,
      'site-content': results['site-content'].items,
      payments: results.payments.items,
      traffic: results.traffic.items,
      issues: results.issues.items
    });
  };

  useEffect(() => {
    api.get('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    let refreshTimer;
    loadAll().catch(() => {});
    const socket = io('/', { withCredentials: true });
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => loadAll().catch(() => {}), 650);
    };
    socket.on('lead:created', scheduleRefresh);
    socket.on('lead:updated', scheduleRefresh);
    socket.on('lead:deleted', scheduleRefresh);
    socket.on('payment:updated', scheduleRefresh);
    socket.on('site-content:updated', scheduleRefresh);
    socket.on('site-content:media-uploaded', scheduleRefresh);
    socket.on('system:issue', scheduleRefresh);
    return () => {
      window.clearTimeout(refreshTimer);
      socket.disconnect();
    };
  }, [user, search]);

  async function saveLead(id, updates) {
    try {
      await api.patch(`/api/admin/leads/${id}`, updates);
      setEditingLead(null);
      showToast('Lead saved successfully');
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  }

  function confirmLead(item) {
    setActionLead({ mode: 'confirm', item });
  }

  function archiveLead(item) {
    setActionLead({ mode: 'archive', item });
  }

  async function submitLeadAction(payload) {
    if (!actionLead) return;
    try {
      await api.post(`/api/admin/leads/${actionLead.item._id}/${actionLead.mode}`, payload);
      showToast(actionLead.mode === 'confirm' ? 'Client confirmed' : 'Lead archived');
      setActionLead(null);
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function saveContent(payload) {
    try {
      if (contentEditor?._id) {
        await api.patch(`/api/admin/site-content/${contentEditor._id}`, payload);
        showToast('Website item updated and synced');
      } else {
        await api.post('/api/admin/site-content', payload);
        showToast('Website item saved and synced');
      }
      setContentEditor(null);
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  }

  async function deleteContent(item) {
    if (!window.confirm(`Permanently delete ${item.label}? Use Hide when you may need it later.`)) return;
    try {
      await api.delete(`/api/admin/site-content/${item._id}`);
      showToast('Website item permanently deleted');
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function toggleContentVisibility(item) {
    try {
      await api.patch(`/api/admin/site-content/${item._id}`, { isActive: item.isActive === false });
      showToast(item.isActive === false ? 'Website item published' : 'Website item hidden');
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function uploadSiteMedia(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Use PNG, JPG, WEBP, or SVG images only.');
    }
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('Image is too large. Please upload an image below 12MB; the system will compress it automatically.');
    }

    const preparedFile = await compressImageForCms(file);
    const dataUrl = await blobToDataUrl(preparedFile);
    const data = await api.post('/api/admin/site-media', {
      filename: preparedFile.name,
      mimeType: preparedFile.type,
      dataUrl
    });
    showToast(preparedFile.size < file.size ? 'Image compressed and uploaded' : 'Image uploaded');
    return data.url;
  }

  async function logout() {
    await api.post('/api/auth/logout', {});
    setUser(null);
  }

  if (loading) return <main className="adminLogin">Loading...</main>;
  if (!user) return <AdminLogin onLogin={setUser} />;

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <Logo />
        <div className="adminUser">
          <strong>{user.name}</strong>
          <span>{user.role.toUpperCase()}</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {adminTabs.map(([id, label, Icon]) => (
          <button className={active === id ? 'active' : ''} key={id} onClick={() => setActive(id)}>
            <Icon size={18} />
            {label}
          </button>
        ))}
        <button onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
      <section className="adminContent">
        <h1>{adminTabs.find(([id]) => id === active)?.[1]}</h1>
        <div className="adminToolbar">
          <input
            type="search"
            placeholder="Search by name, number, email, reason, or remarks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="outlineButton" onClick={() => loadAll()}>
            Search
          </button>
        </div>
        <Metrics metrics={metrics} />
        {active === 'site-content' ? (
          <ContentManager
            items={data['site-content'] || []}
            onNew={() => setContentEditor({})}
            onEdit={setContentEditor}
            onDelete={deleteContent}
            onToggleVisibility={toggleContentVisibility}
          />
        ) : active === 'operations' ? (
          <Operations metrics={metrics} payments={data.payments || []} traffic={data.traffic || []} />
        ) : active === 'issues' ? (
          <IssueTable items={data.issues || []} />
        ) : active === 'backup' ? (
          <BackupPanel showToast={showToast} />
        ) : (
          <LeadTable
            items={data[active] || []}
            onEdit={setEditingLead}
            onConfirm={confirmLead}
            onArchive={archiveLead}
          />
        )}
      </section>
      {editingLead && (
        <LeadEditor item={editingLead} onClose={() => setEditingLead(null)} onSave={saveLead} />
      )}
      {contentEditor && (
        <ContentEditor
          item={contentEditor}
          onClose={() => setContentEditor(null)}
          onSave={saveContent}
          onUpload={uploadSiteMedia}
        />
      )}
      {actionLead && (
        <LeadActionModal
          mode={actionLead.mode}
          item={actionLead.item}
          onClose={() => setActionLead(null)}
          onSubmit={submitLeadAction}
        />
      )}
      <ToastStack items={toasts} />
    </main>
  );
}


function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read selected file'));
    reader.readAsDataURL(blob);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not process selected image'));
    };
    image.src = url;
  });
}

async function compressImageForCms(file, maxBytes = 2 * 1024 * 1024) {
  if (file.type === 'image/svg+xml') return file;
  if (file.size <= maxBytes && file.type === 'image/webp') return file;

  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  while (blob && blob.size > maxBytes && quality > 0.58) {
    quality -= 0.08;
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  }

  if (!blob) throw new Error('Could not compress selected image');
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
}


const contentPresets = [
  {
    name: 'Homepage hero image',
    helper: 'Main image area on the right side of the About Us homepage hero.',
    values: {
      key: 'homepage.hero.image',
      section: 'homepage',
      type: 'image',
      label: 'Homepage hero image',
      placement: 'Hero right visual area',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight photo wall card',
    helper: 'One moving card inside the NeuroCogno Insight photo wall. Set Order 0, 1, 2, 3 etc. to replace that exact wall position. Title is the card headline, Subtitle / Tag is the small label, Description is the editable caption.',
    values: {
      key: 'insights.card.',
      section: 'insights',
      type: 'carousel_item',
      label: 'Insight photo wall card',
      placement: 'Insight photo wall',
      subtitle: 'Mental Wellness',
      title: 'New insight photo story',
      description: 'Short caption shown with this Insight Photo Wall card.',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight YouTube video',
    helper: 'A YouTube embed/link shown inside the Insight Hub video learning space.',
    values: {
      key: 'insights.video.featured',
      section: 'insights',
      type: 'video',
      label: 'Featured insight video',
      placement: 'Insight video learning space',
      title: 'YouTube education video embed',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight blog canvas card',
    helper: 'Image card shown in the Blogs section of NeuroCogno Insight. Order controls card position only inside Blogs.',
    values: {
      key: 'insights.blogs.',
      section: 'insights',
      type: 'image',
      label: 'Insight blog canvas card',
      placement: 'insights.blogs',
      subtitle: 'Blog',
      title: 'New blog highlight',
      description: 'Short blog summary shown on this card.',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight expert article canvas card',
    helper: 'Image card shown in the Expert Articles section. Order controls card position only inside Expert Articles.',
    values: {
      key: 'insights.expert.',
      section: 'insights',
      type: 'image',
      label: 'Insight expert article canvas card',
      placement: 'insights.expert',
      subtitle: 'Expert Article',
      title: 'New expert article',
      description: 'Short expert article summary shown on this card.',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight news update canvas card',
    helper: 'Image card shown in the News & Updates section. Order controls card position only inside News & Updates.',
    values: {
      key: 'insights.news.',
      section: 'insights',
      type: 'image',
      label: 'Insight news update canvas card',
      placement: 'insights.news',
      subtitle: 'News Update',
      title: 'New NeuroCogno update',
      description: 'Short update summary shown on this card.',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight resource canvas card',
    helper: 'Image card shown in the Resources section. Order controls card position only inside Resources.',
    values: {
      key: 'insights.resources.',
      section: 'insights',
      type: 'image',
      label: 'Insight resource canvas card',
      placement: 'insights.resources',
      subtitle: 'Resource',
      title: 'New downloadable resource',
      description: 'Short resource summary shown on this card.',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'Insight visual canvas',
    helper: 'A larger image canvas inside the NeuroCogno Insight Hub for photos, posters, event moments, or awareness creatives.',
    values: {
      key: 'insights.canvas.',
      section: 'insights',
      type: 'image',
      label: 'Insight visual canvas',
      placement: 'Insight visual canvas board',
      subtitle: 'Visual Story',
      title: 'New visual highlight',
      description: 'Short context for this photo or visual.',
      order: 20,
      isActive: true
    }
  },
  {
    name: 'Insight video library item',
    helper: 'Additional YouTube video card inside the NeuroCogno Insight Hub video board.',
    values: {
      key: 'insights.video.',
      section: 'insights',
      type: 'video',
      label: 'Insight video library item',
      placement: 'Insight video board',
      subtitle: 'Video Resource',
      title: 'New NeuroCogno video',
      description: 'Short context for this video.',
      order: 20,
      isActive: true
    }
  },
  {
    name: 'Insight creative therapy highlight',
    helper: 'Photo plus caption shown in the child-safe creative therapy canvas on the NeuroCogno Insight Hub. Use this for child artwork, play activities, craft work, and therapy-safe visual stories.',
    values: {
      key: 'insights.creative.',
      section: 'insights',
      type: 'image',
      label: 'Creative therapy highlight',
      placement: 'Insight creative therapy canvas',
      subtitle: 'Creative Work',
      title: 'New creative therapy highlight',
      description: 'Short child-safe context for this artwork, play activity, or therapy moment.',
      alt: 'Child-safe NeuroCogno creative therapy highlight',
      order: 30,
      isActive: true
    }
  },
  {
    name: 'Workshop or event card',
    helper: 'A workshop/event card shown on the Workshops & Events page.',
    values: {
      key: 'workshops.event.',
      section: 'workshops',
      type: 'carousel_item',
      label: 'Workshop event card',
      placement: 'Workshops & Events cards',
      subtitle: 'Upcoming',
      title: 'New workshop or event',
      order: 10,
      isActive: true
    }
  },
  {
    name: 'Collaboration wall card',
    helper: 'One moving card inside the Collaboration page wall.',
    values: {
      key: 'collaborations.card.',
      section: 'collaborations',
      type: 'carousel_item',
      label: 'Collaboration wall card',
      placement: 'Recent collaborations wall',
      subtitle: 'Collaboration',
      title: 'New collaboration highlight',
      order: 10,
      isActive: true
    }
  },
  {
    name: 'Homepage short text',
    helper: 'Editable headline support text such as eyebrow or subtitle.',
    values: {
      key: 'homepage.hero.subtitle',
      section: 'homepage',
      type: 'text',
      label: 'Homepage hero subtitle',
      placement: 'Hero copy below headline',
      value: 'Professional counselling and psychological support for children, teens, adults and seniors.',
      order: 0,
      isActive: true
    }
  },
  {
    name: 'WhatsApp help number',
    helper: 'Update the WhatsApp number used by the floating Need Help button. Enter country code plus number, for example 918851550848.',
    values: {
      key: 'global.whatsapp.help',
      section: 'global',
      type: 'contact',
      label: 'WhatsApp help number',
      placement: 'Floating help button',
      value: '918851550848',
      order: 0,
      isActive: true
    }
  }
];
const contentFieldSchemas = {
  'Homepage hero image': {
    intro: 'Replace the main visual shown on the right side of the About Us hero.',
    fields: ['imageUpload', 'imageUrl', 'alt', 'isActive'],
    required: ['imageUrl'],
    labels: { imageUpload: 'Upload hero image *', imageUrl: 'Image URL *', alt: 'Image description for accessibility' }
  },
  'Insight photo wall card': {
    intro: 'Create or replace one moving card in the Insight Photo Wall. Order 0, 1, 2, 3 controls the exact card slot.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl', 'title'],
    labels: { order: 'Photo wall position *', imageUpload: 'Upload card photo *', imageUrl: 'Image URL *', subtitle: 'Small label / category', title: 'Card headline *', description: 'Caption shown below image', alt: 'Image description for accessibility' }
  },
  'Insight blog canvas card': {
    intro: 'Add or replace a visual card inside the Blogs section. This affects only Blogs, not Photo Wall or Resources.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl', 'title'],
    labels: { order: 'Blog card position', imageUpload: 'Upload blog image *', imageUrl: 'Image URL *', subtitle: 'Small blog label', title: 'Blog headline *', description: 'Blog summary / caption', alt: 'Image description for accessibility' }
  },
  'Insight expert article canvas card': {
    intro: 'Add or replace a visual card inside Expert Articles. This affects only Expert Articles.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl', 'title'],
    labels: { order: 'Expert article position', imageUpload: 'Upload article image *', imageUrl: 'Image URL *', subtitle: 'Small article label', title: 'Article headline *', description: 'Article summary / caption', alt: 'Image description for accessibility' }
  },
  'Insight news update canvas card': {
    intro: 'Add or replace a visual card inside News & Updates. This affects only News & Updates.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl', 'title'],
    labels: { order: 'News card position', imageUpload: 'Upload update image *', imageUrl: 'Image URL *', subtitle: 'Small update label', title: 'Update headline *', description: 'Update summary / caption', alt: 'Image description for accessibility' }
  },
  'Insight resource canvas card': {
    intro: 'Add or replace a visual card inside Resources. This affects only Resources.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl', 'title'],
    labels: { order: 'Resource card position', imageUpload: 'Upload resource image *', imageUrl: 'Image URL *', subtitle: 'Small resource label', title: 'Resource headline *', description: 'Resource summary / caption', alt: 'Image description for accessibility' }
  },  'Insight visual canvas': {
    intro: 'Publish an independent large visual canvas in the Insight Hub. This never borrows Photo Wall or child creative images.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl'],
    labels: { order: 'Canvas order', imageUpload: 'Upload canvas image *', imageUrl: 'Image URL *', subtitle: 'Small label above title', title: 'Canvas title', description: 'Short explanation / caption', alt: 'Image description for accessibility' }
  },
  'Insight creative therapy highlight': {
    intro: 'Add a child-safe therapy artwork, activity, or craft highlight. Use only approved non-identifying photos.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['imageUrl', 'title'],
    labels: { order: 'Creative card position', imageUpload: 'Upload creative photo *', imageUrl: 'Image URL *', subtitle: 'Activity label', title: 'Highlight title *', description: 'Therapy-safe context / caption', alt: 'Image description for accessibility' }
  },
  'Workshop or event card': {
    intro: 'Create or replace one Workshops & Events card. Order controls the card position.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['title'],
    labels: { order: 'Event card position', imageUpload: 'Upload event image', imageUrl: 'Image URL', subtitle: 'Status label', title: 'Event title *', description: 'Audience / short details', alt: 'Image description for accessibility' }
  },
  'Collaboration wall card': {
    intro: 'Create or replace one moving collaboration card.',
    fields: ['order', 'imageUpload', 'imageUrl', 'subtitle', 'title', 'description', 'alt', 'isActive'],
    required: ['title'],
    labels: { order: 'Collaboration card position', imageUpload: 'Upload collaboration image', imageUrl: 'Image URL', subtitle: 'Partner / category label', title: 'Collaboration title *', description: 'Short collaboration caption', alt: 'Image description for accessibility' }
  },
  'Insight YouTube video': {
    intro: 'Update the featured YouTube embed in the Insight Hub video learning space.',
    fields: ['url', 'title', 'description', 'isActive'],
    required: ['url'],
    labels: { url: 'YouTube link *', title: 'Video title', description: 'Short video context' }
  },
  'Insight video library item': {
    intro: 'Add a YouTube card to the Insight video board.',
    fields: ['order', 'url', 'subtitle', 'title', 'description', 'isActive'],
    required: ['url', 'title'],
    labels: { order: 'Video card position', url: 'YouTube link *', subtitle: 'Video category', title: 'Video title *', description: 'Short video context' }
  },
  'Homepage short text': {
    intro: 'Update a short public text line on the homepage.',
    fields: ['value', 'isActive'],
    required: ['value'],
    labels: { value: 'Text shown on website *' }
  },
  'WhatsApp help number': {
    intro: 'Update the WhatsApp number used by the floating Need Help button. The website still redirects through the backend route, so this number is not hardcoded into the frontend button.',
    fields: ['value', 'isActive'],
    required: ['value'],
    labels: { value: 'WhatsApp number with country code *' }
  }
};

function getPresetForContent(item, selectedName) {
  if (selectedName) return contentPresets.find((preset) => preset.name === selectedName);
  if (!item) return null;
  return contentPresets.find((preset) => {
    const keyBase = preset.values.key.endsWith('.') ? preset.values.key : `${preset.values.key}.`;
    return item.key === preset.values.key || item.key?.startsWith(keyBase) || item.placement === preset.values.placement;
  }) || null;
}

function getFieldSchema(preset) {
  return contentFieldSchemas[preset?.name] || {
    intro: 'Update this website item. Only edit fields that are needed for where this content appears.',
    fields: ['order', 'label', 'placement', 'title', 'subtitle', 'description', 'url', 'value', 'imageUpload', 'imageUrl', 'alt', 'isActive'],
    required: ['label'],
    labels: {}
  };
}
function ContentManager({ items, onNew, onEdit, onDelete, onToggleVisibility }) {
  const [expandedId, setExpandedId] = useState(null);
  const grouped = items.reduce((acc, item) => {
    acc[item.section] = acc[item.section] || [];
    acc[item.section].push(item);
    return acc;
  }, {});
  const sectionOrder = ['homepage', 'insights', 'workshops', 'collaborations', 'services', 'contact', 'global'];
  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => {
    const ai = sectionOrder.indexOf(a);
    const bi = sectionOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const totalImages = items.filter((item) => item.imageUrl).length;
  const activeItems = items.filter((item) => item.isActive !== false).length;

  function actionClick(event, callback) {
    event.stopPropagation();
    callback();
  }

  return (
    <div className="contentManager compactContentManager">
      <div className="contentManagerHeader">
        <div>
          <h2>Website Content Library</h2>
          <p>Compact by default. Click any card to view details, replace media, hide, or delete.</p>
        </div>
        <button className="primaryButton" onClick={onNew}>Add / Replace Website Item</button>
      </div>
      <div className="cmsGuidanceBox">
        <ShieldCheck size={18} />
        <p>
          Every card below is one specific spot on the live website, identified by its Section + Placement +
          Order. To change what shows in a spot &mdash; a new hero image, updated text &mdash; click that
          existing card and choose &ldquo;Replace Media&rdquo; or &ldquo;Update Details&rdquo; rather than
          creating a brand-new item with the same Section/Placement/Order. Creating a duplicate for a spot
          that already has one causes a save error, since the website can only show one item per spot. Use
          &ldquo;Add / Replace Website Item&rdquo; only for a genuinely new spot that doesn&apos;t exist yet.
        </p>
      </div>
      <div className="contentStats">
        <article><span>Total Items</span><strong>{items.length}</strong></article>
        <article><span>Published</span><strong>{activeItems}</strong></article>
        <article><span>Images</span><strong>{totalImages}</strong></article>
      </div>
      {groupedEntries.map(([section, records]) => (
        <section className="contentGroup" key={section}>
          <div className="contentGroupTitle">
            <h3>{section.replace('-', ' ')}</h3>
            <span>{records.length} item{records.length === 1 ? '' : 's'}</span>
          </div>
          <div className="contentCards compactContentCards">
            {records.map((item) => {
              const id = item._id || item.key;
              const expanded = expandedId === id;
              return (
                <article
                  key={id}
                  className={`${!item.isActive ? 'inactiveContent' : ''} ${expanded ? 'expandedContentCard' : ''}`}
                  onClick={() => setExpandedId((current) => (current === id ? null : id))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setExpandedId((current) => (current === id ? null : id));
                    }
                  }}
                >
                  <div className="contentThumb">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.alt || item.label} /> : <Monitor size={28} />}
                  </div>
                  <div className="contentCardBody">
                    <div className="contentCardMeta">
                      <span>{item.type.replace('_', ' ')}</span>
                      <span>{item.isActive === false ? 'Hidden' : 'Live'}</span>
                      <span>Order {item.order ?? 0}</span>
                    </div>
                    <h4>{item.label}</h4>
                    {expanded && (
                      <>
                        <p>{item.placement || item.description || 'No placement note added.'}</p>
                        <small>{item.key}</small>
                      </>
                    )}
                  </div>
                  {expanded && (
                    <div className="rowActions contentActions">
                      <button onClick={(event) => actionClick(event, () => onEdit(item))}>{item.imageUrl ? 'Replace Media' : 'Update Details'}</button>
                      <button onClick={(event) => actionClick(event, () => onToggleVisibility(item))}>{item.isActive === false ? 'Publish' : 'Hide'}</button>
                      <button className="dangerAction" onClick={(event) => actionClick(event, () => onDelete(item))}>Delete Permanently</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
      {!items.length && <p className="emptyState">No website content has been added yet.</p>}
    </div>
  );
}
function ContentEditor({ item, onClose, onSave, onUpload }) {
  const [form, setForm] = useState({
    key: item.key || '',
    section: item.section || 'homepage',
    type: item.type || 'carousel_item',
    label: item.label || '',
    description: item.description || '',
    placement: item.placement || '',
    title: item.title || '',
    subtitle: item.subtitle || '',
    body: item.body || '',
    value: item.value || '',
    url: item.url || '',
    imageUrl: item.imageUrl || '',
    alt: item.alt || '',
    order: item.order ?? 0,
    isActive: item.isActive ?? true
  });
  const [status, setStatus] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const activePreset = getPresetForContent(item, selectedPreset);
  const fieldSchema = getFieldSchema(activePreset);
  const visibleFields = fieldSchema.fields;
  const fieldLabels = fieldSchema.labels || {};
  const requiredFields = new Set(fieldSchema.required || []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  function applyPreset(name) {
    setSelectedPreset(name);
    const preset = contentPresets.find((entry) => entry.name === name);
    if (!preset) return;
    setForm((current) => ({
      ...current,
      ...preset.values,
      key: preset.values.key.endsWith('.') ? `${preset.values.key}${Date.now()}` : preset.values.key
    }));
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus('Preparing and compressing image...');
    try {
      const url = await onUpload(file);
      update('imageUrl', url);
      setStatus('Image uploaded. Click Save Update to publish it on the website.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, order: Number(form.order), isActive: Boolean(form.isActive) });
  }

  function renderContentField(field) {
    const label = fieldLabels[field] || field;
    const required = requiredFields.has(field);
    const requiredText = required && !label.includes('*') ? ' *' : '';
    if (field === 'isActive') {
      return (
        <label className="consent contentPublishToggle" key={field}>
          <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} />
          Publish this item on the website
        </label>
      );
    }
    if (field === 'imageUpload') {
      return <label key={field}>{label}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload} /></label>;
    }
    if (field === 'order') {
      return <label key={field}>{label}{requiredText}<input type="number" min="0" value={form.order} onChange={(event) => update('order', event.target.value)} required={required} /></label>;
    }
    if (field === 'description' || field === 'body') {
      return <label className="wideField" key={field}>{label}{requiredText}<textarea value={form[field]} onChange={(event) => update(field, event.target.value)} required={required} /></label>;
    }
    return (
      <label key={field}>
        {label}{requiredText}
        <input
          required={required}
          value={form[field] || ''}
          onChange={(event) => update(field, field === 'key' ? event.target.value.toLowerCase() : event.target.value)}
          placeholder={field === 'imageUrl' ? 'Upload an image or paste a URL' : ''}
        />
      </label>
    );
  }

  return createPortal(
    <div className="editorOverlay" role="dialog" aria-modal="true">
      <form className="leadEditor contentEditor" onSubmit={submit}>
        <div className="editorHeader">
          <h2>{item._id ? 'Update Website Item' : 'Add / Replace Website Item'}</h2>
          <button type="button" onClick={onClose} aria-label="Close editor"><X size={18} strokeWidth={2.4} /></button>
        </div>
        {!item._id && (
          <label className="presetPicker">
            Where should this appear?
            <select value={selectedPreset} onChange={(event) => applyPreset(event.target.value)}>
              <option value="">Choose website area</option>
              {contentPresets.map((preset) => (
                <option key={preset.name} value={preset.name}>{preset.name}</option>
              ))}
            </select>
            {selectedPreset && <span>{contentPresets.find((preset) => preset.name === selectedPreset)?.helper}</span>}
          </label>
        )}
        {activePreset && (
          <div className="contentEditorGuide">
            <strong>{activePreset.name}</strong>
            <p>{fieldSchema.intro}</p>
            <small>Website area: {form.section} · Placement: {form.placement} · Key: {form.key}</small>
          </div>
        )}
        <div className="editorGrid dynamicContentGrid">
          {visibleFields.map(renderContentField)}
        </div>
        {form.imageUrl && <img className="contentPreview" src={form.imageUrl} alt={form.alt || form.label} />}
        <div className="editorActions">
          <button type="button" className="outlineButton" onClick={onClose}>Cancel</button>
          <button type="submit" className="primaryButton">Save Update</button>
        </div>
        {status && <p className="formStatus">{status}</p>}
      </form>
    </div>,
    document.body
  );
}
function Metrics({ metrics }) {
  if (!metrics) return null;
  const cards = [
    ['Survey', metrics.surveyCallbacks],
    ['Direct', metrics.submittedAppointments],
    ['Collab', metrics.collaborationInquiries],
    ['Incomplete', metrics.incompleteLeads],
    ['Paid', metrics.paidClients],
    ['Payment Fails', metrics.failedPayments],
    ['Issues', metrics.activeIssues]
  ];
  return (
    <div className="metricGrid">
      {cards.map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}

function paymentBadge(item) {
  if (item.paymentStatus === 'paid') return { className: 'statusBadge paid', label: 'Paid' };
  if (item.paymentStatus === 'failed') return { className: 'statusBadge failed', label: 'Failed' };
  if (item.paymentStatus === 'created') return { className: 'statusBadge pending', label: 'Payment Started' };
  if (item.status === 'submitted' || item.status === 'survey_callback') {
    return { className: 'statusBadge pending', label: 'Details Received, Payment Pending' };
  }
  return { className: 'statusBadge neutral', label: item.paymentStatus || 'Not Started' };
}

function LeadTable({ items, onEdit, onConfirm, onArchive }) {
  return (
    <div className="adminTable">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Alt Phone</th>
            <th>Email</th>
            <th>Age</th>
            <th>Reason</th>
            <th>Message / Survey</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Lead State</th>
            <th>Remarks</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} className={item.paymentStatus === 'paid' ? 'paidRow' : item.status === 'submitted' ? 'pendingPaymentRow' : ''}>
              <td>{item.name}</td>
              <td>{item.phone || '-'}</td>
              <td>{item.alternatePhone || '-'}</td>
              <td>{item.email || '-'}</td>
              <td>{item.ageGroup || '-'}</td>
              <td>{item.reason || '-'}</td>
              <td className="wideCell">
                {item.message || '-'}
                {!!item.answers?.length && (
                  <div className="answerList">
                    {item.answers.map((answer) => (
                      <span key={`${answer.question}-${answer.answer}`}>
                        {answer.question}: {answer.answer}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td>{item.status}</td>
              <td>
                <span className={paymentBadge(item).className}>{paymentBadge(item).label}</span>
              </td>
              <td>{item.lifecycleStatus || 'active'}</td>
              <td className="wideCell">
                {item.manualStatusNote || item.archiveReason || item.internalRemarks || '-'}
              </td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>
                <div className="rowActions">
                  <button onClick={() => onEdit(item)}>Edit</button>
                  <button onClick={() => onConfirm(item)}>Confirm</button>
                  <button onClick={() => onArchive(item)}>Archive</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && <p className="emptyState">No records yet.</p>}
    </div>
  );
}

function LeadActionModal({ mode, item, onClose, onSubmit }) {
  const isArchive = mode === 'archive';
  const [archiveReason, setArchiveReason] = useState(item.archiveReason || 'Not continuing session');
  const [remarks, setRemarks] = useState(
    item.internalRemarks || item.manualStatusNote || (isArchive ? '' : 'Confirmed client')
  );

  function submit(event) {
    event.preventDefault();
    onSubmit(isArchive ? { archiveReason, remarks } : { remarks });
  }

  return (
    <div className="editorOverlay" role="dialog" aria-modal="true">
      <form className="leadActionModal" onSubmit={submit}>
        <div className="editorHeader">
          <h2>{isArchive ? 'Archive Lead' : 'Confirm Client'}</h2>
          <button type="button" onClick={onClose} aria-label="Close action">
            ×
          </button>
        </div>
        <p>
          {item.name} · {item.phone || item.email || 'No contact detail'}
        </p>
        {isArchive && (
          <label>
            Archive Reason
            <input value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} required />
          </label>
        )}
        <label>
          Remarks
          <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </label>
        <div className="editorActions">
          <button type="button" className="outlineButton" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={isArchive ? 'dangerButton' : 'primaryButton'}>
            {isArchive ? 'Archive Lead' : 'Confirm Client'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToastStack({ items }) {
  return (
    <div className="toastStack" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div className={`toast ${item.type}`} key={item.id}>
          {item.message}
        </div>
      ))}
    </div>
  );
}

function LeadEditor({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item.name || '',
    phone: item.phone || '',
    alternatePhone: item.alternatePhone || '',
    email: item.email || '',
    alternateEmail: item.alternateEmail || '',
    ageGroup: item.ageGroup || '',
    reason: item.reason || '',
    message: item.message || '',
    paymentStatus: item.paymentStatus || 'not_started',
    lifecycleStatus: item.lifecycleStatus || 'active',
    manualStatusNote: item.manualStatusNote || '',
    archiveReason: item.archiveReason || '',
    internalRemarks: item.internalRemarks || ''
  });
  const [status, setStatus] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    setStatus('Saving...');
    try {
      await onSave(item._id, form);
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="editorOverlay" role="dialog" aria-modal="true">
      <form className="leadEditor" onSubmit={submit}>
        <div className="editorHeader">
          <h2>Edit Lead</h2>
          <button type="button" onClick={onClose} aria-label="Close editor">
            ×
          </button>
        </div>
        <div className="editorGrid">
          <label>
            Full Name
            <input value={form.name} onChange={(event) => update('name', event.target.value)} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => update('phone', event.target.value)} />
          </label>
          <label>
            Alternate Phone
            <input value={form.alternatePhone} onChange={(event) => update('alternatePhone', event.target.value)} />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => update('email', event.target.value)} />
          </label>
          <label>
            Alternate Email
            <input value={form.alternateEmail} onChange={(event) => update('alternateEmail', event.target.value)} />
          </label>
          <label>
            Age Group
            <input value={form.ageGroup} onChange={(event) => update('ageGroup', event.target.value)} />
          </label>
          <label>
            Reason
            <input value={form.reason} onChange={(event) => update('reason', event.target.value)} />
          </label>
          <label>
            Payment Status
            <select value={form.paymentStatus} onChange={(event) => update('paymentStatus', event.target.value)}>
              <option value="not_started">Not Started</option>
              <option value="created">Created</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="not_configured">Not Configured</option>
            </select>
          </label>
          <label>
            Lead State
            <select value={form.lifecycleStatus} onChange={(event) => update('lifecycleStatus', event.target.value)}>
              <option value="active">Active</option>
              <option value="confirmed">Confirmed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        <label>
          Message
          <textarea value={form.message} onChange={(event) => update('message', event.target.value)} />
        </label>
        {!!item.answers?.length && (
          <div className="surveyReadout">
            <strong>Survey Answers</strong>
            {item.answers.map((answer) => (
              <p key={`${answer.question}-${answer.answer}`}>
                {answer.question}: {answer.answer}
              </p>
            ))}
          </div>
        )}
        <label>
          Manual Status Note
          <input value={form.manualStatusNote} onChange={(event) => update('manualStatusNote', event.target.value)} />
        </label>
        <label>
          Archive Reason
          <input value={form.archiveReason} onChange={(event) => update('archiveReason', event.target.value)} />
        </label>
        <label>
          Internal Remarks
          <textarea value={form.internalRemarks} onChange={(event) => update('internalRemarks', event.target.value)} />
        </label>
        <div className="editorActions">
          <button type="button" className="outlineButton" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primaryButton">
            Save Lead
          </button>
        </div>
        {status && <p className="formStatus">{status}</p>}
      </form>
    </div>
  );
}

function PaginatedAdminTable({ items, pageSize = 12, emptyMessage, children }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visibleItems = (items || []).slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

  return (
    <div className="adminDataPanel">
      <div className="adminDataPanelHeader">
        <div>
          <strong>{items?.length || 0} record{items?.length === 1 ? '' : 's'}</strong>
          <span>Showing {items?.length ? start + 1 : 0}-{Math.min(start + pageSize, items?.length || 0)} of {items?.length || 0}</span>
        </div>
        <div className="adminPagination" aria-label="Table pagination">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>Previous</button>
          <span>Page {safePage} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages}>Next</button>
        </div>
      </div>
      <div className="adminTable adminScrollableTable">
        {children(visibleItems)}
        {!items?.length && <p className="emptyState">{emptyMessage}</p>}
      </div>
    </div>
  );
}

function IssueTable({ items }) {
  return (
    <PaginatedAdminTable items={items} pageSize={14} emptyMessage="No server or payment issues recorded.">
      {(visibleItems) => (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>Problem</th>
              <th>Path</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item._id}>
                <td>{item.type}</td>
                <td><span className={`severityPill ${item.severity || 'neutral'}`}>{item.severity}</span></td>
                <td>{item.title}</td>
                <td>{item.path || '-'}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PaginatedAdminTable>
  );
}
function Operations({ metrics, payments, traffic }) {
  return (
    <div className="operationsGrid">
      <article>
        <h2>Server Health</h2>
        <p>Database: {metrics?.database?.status || 'unknown'}</p>
        <p>Traffic events in 24h: {metrics?.traffic24h || 0}</p>
        <p>Unique visitors in 24h: {metrics?.uniqueVisitors || 0}</p>
      </article>
      <article>
        <h2>Latest Payments</h2>
        {(payments || []).slice(0, 6).map((payment) => (
          <p key={payment._id}>
            {payment.status} · ₹{payment.amount / 100} · {new Date(payment.createdAt).toLocaleString()}
          </p>
        ))}
      </article>
      <article>
        <h2>Recent Traffic</h2>
        {(traffic || []).slice(0, 8).map((event) => (
          <p key={event._id}>
            {event.type} {event.section ? `· ${event.section}` : ''}
          </p>
        ))}
      </article>
    </div>
  );
}

function usePublicConfig(section = 'public') {
  const [config, setConfig] = useState({
    payment: { configured: false, amountInr: 499 },
    contact: {
      ceoPhone: '+918976543210',
      email: 'hello@neurocogno.com',
      emails: ['info@neurocogno.com', 'support@neurocogno.com'],
      address: 'Bangalore, India'
    }
  });

  useEffect(() => {
    api.get('/api/public/config').then(setConfig).catch(() => {});
    track('page_view', { section });
  }, [section]);

  return config;
}

function useSectionTracking(scope) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) track('section_view', { section: entry.target.id, metadata: { page: scope } });
        });
      },
      { threshold: 0.45 }
    );
    document.querySelectorAll('.section[id]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [scope]);
}

function useHashScroll() {
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    const pending = sessionStorage.getItem('neurocogno_pending_hash_scroll');
    window.setTimeout(() => {
      if (id && pending === id) {
        sessionStorage.removeItem('neurocogno_pending_hash_scroll');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0 });
      }
    }, 80);
  }, [window.location.pathname, window.location.hash]);
}

function SiteLayout({ config, theme, onToggleTheme, children, onSurveyLeadReady, footerSlot, surveyOpenSignal }) {
  return (
    <>
      <Header contact={config.contact} theme={theme} onToggleTheme={onToggleTheme} />
      <main>{children}</main>
      {footerSlot ?? <PageLinks current={window.location.pathname === '/' ? '/about-us' : window.location.pathname} />}
      <Footer contact={config.contact} />
      {onSurveyLeadReady && <SurveyPopup config={config} onLeadReady={onSurveyLeadReady} openSignal={surveyOpenSignal} />}
    </>
  );
}

function AboutUsPage({ theme, onToggleTheme }) {
  useSeo('home');
  useSectionTracking('about-us');
  useHashScroll();
  const config = usePublicConfig('about-us');
  const homepageContent = useSiteContent('homepage');
  const [pendingLead, setPendingLead] = useState('');

  return (
    <SiteLayout config={config} theme={theme} onToggleTheme={onToggleTheme} onSurveyLeadReady={setPendingLead} footerSlot={<FounderStory />}>
      <Hero contact={config.contact} content={homepageContent} />
      <About />
      <WhoWeHelp />
            <Services />
      <Booking config={config} onLeadReady={setPendingLead} />
      <PaymentPanel pendingLead={pendingLead} config={config} />
      <TestimonialsFaq contact={config.contact} />
    </SiteLayout>
  );
}

function InsightPage({ theme, onToggleTheme }) {
  useSeo('insights');
  useSectionTracking('neurocogno-insight');
  useHashScroll();
  const config = usePublicConfig('neurocogno-insight');
  const insightContent = useSiteContent('insights');

  return (
    <SiteLayout config={config} theme={theme} onToggleTheme={onToggleTheme}>
      <InsightHub content={insightContent} />
    </SiteLayout>
  );
}

function WorkshopsPage({ theme, onToggleTheme }) {
  useSeo('workshops');
  useSectionTracking('workshops-events');
  useHashScroll();
  const config = usePublicConfig('workshops-events');
  const workshopContent = useSiteContent('workshops');

  return (
    <SiteLayout config={config} theme={theme} onToggleTheme={onToggleTheme}>
      <WorkshopsEvents content={workshopContent} />
    </SiteLayout>
  );
}

function ServicesPage({ theme, onToggleTheme }) {
  useSeo('services');
  useSectionTracking('services');
  useHashScroll();
  const config = usePublicConfig('services');

  return (
    <SiteLayout config={config} theme={theme} onToggleTheme={onToggleTheme}>
      <ServicesDocumentation />
    </SiteLayout>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [theme, toggleTheme] = useThemeMode();

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  if (path.startsWith('/admin')) return <AdminDashboard theme={theme} onToggleTheme={toggleTheme} />;
  if (path === '/' || path.startsWith('/about-us')) return <AboutUsPage theme={theme} onToggleTheme={toggleTheme} />;
  if (path.startsWith('/neurocogno-insight')) return <InsightPage theme={theme} onToggleTheme={toggleTheme} />;
  if (path.startsWith('/workshops-events')) return <WorkshopsPage theme={theme} onToggleTheme={toggleTheme} />;
  if (path.startsWith('/collaborations')) return <CollaborationPage theme={theme} onToggleTheme={toggleTheme} />;
  if (path.startsWith('/services')) return <ServicesPage theme={theme} onToggleTheme={toggleTheme} />;
  return <AboutUsPage theme={theme} onToggleTheme={toggleTheme} />;
}

createRoot(document.getElementById('root')).render(<App />);


























