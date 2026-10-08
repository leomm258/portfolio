(() => {
  'use strict';
  if (window.__portfolioAnalyticsLoaded) return;
  window.__portfolioAnalyticsLoaded = true;

  // Public website identifier only. The dashboard requires an Umami login.
  const websiteId = 'a83a608a-140c-4cc5-8df9-0a64747cf958';
  const dashboardUrl = 'https://cloud.umami.is/analytics/eu/websites/a83a608a-140c-4cc5-8df9-0a64747cf958';
  const admin = document.createElement('aside');
  admin.className = 'private-admin';
  admin.hidden = true;
  admin.setAttribute('aria-label', 'Private analytics');
  const dashboard = document.createElement('a');
  dashboard.textContent = 'ADMIN ↗';
  dashboard.href = dashboardUrl;
  dashboard.target = '_blank';
  dashboard.rel = 'noopener noreferrer';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Hide admin shortcut');
  admin.append(dashboard, close);
  document.body.append(admin);
  let clicks = [];
  close.addEventListener('click', () => { admin.hidden = true; clicks = []; });
  document.addEventListener('click', event => {
    if (!event.target.closest('nav .brand, .entrance-signature')) return;
    const now = performance.now();
    clicks = clicks.filter(time => now - time <= 1800);
    clicks.push(now);
    if (clicks.length === 5) { admin.hidden = false; clicks = []; }
  });

  // No tracker request on previews, localhost, or the GitHub Pages domain.
  if (location.hostname !== 'leorizoto.fr' || location.protocol !== 'https:' ||
      !/^[0-9a-f-]{36}$/.test(websiteId)) return;

  let ready = false;
  let stopped = false;
  let sending = false;
  const queue = [];
  const timeout = (promise, ms) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Analytics timeout')), ms);
    Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); });
  });
  async function drain() {
    if (!ready || stopped || sending) return;
    sending = true;
    while (queue.length && !stopped) {
      const event = queue.shift();
      try {
        // Explicit payload: never send query strings, hashes, referrers, copied
        // contact details, text input, or a visitor identifier.
        await timeout(window.umami.track({
          website: websiteId, hostname: 'leorizoto.fr', url: '/',
          title: 'leorizoto — Roblox Developer', referrer: '',
          language: navigator.language, screen: `${screen.width}x${screen.height}`,
          ...event,
        }), 8000);
      } catch { /* Never retry an uncertain send: it could count twice. */ }
    }
    sending = false;
  }
  function track(name, data) {
    if (stopped || queue.length >= 30) return;
    queue.push(name ? { name, data } : {});
    void drain();
  }
  track(); // Exactly one pageview; anchor navigation is not a new page.
  const tracker = document.createElement('script');
  tracker.src = 'https://cloud.umami.is/script.js';
  tracker.async = true;
  tracker.dataset.websiteId = websiteId;
  tracker.dataset.autoTrack = 'false';
  tracker.dataset.domains = 'leorizoto.fr';
  const stop = () => { stopped = true; queue.length = 0; };
  const loadingTimeout = setTimeout(stop, 8000);
  tracker.onload = () => {
    clearTimeout(loadingTimeout);
    if (!stopped && typeof window.umami?.track === 'function') {
      ready = true;
      void drain();
    } else stop();
  };
  tracker.onerror = () => { clearTimeout(loadingTimeout); stop(); };
  document.head.append(tracker);

  const projects = [
    { selector: '.project-cta', card: '.featured-game .project-copy',
      project: '+1 Speed Keyboard Escape', category: 'Game' },
    { selector: '.showcase-link[href*="85839579546169"]',
      project: 'Cooking game', category: 'Showcase' },
    { selector: '.showcase-link[href*="116627717607931"]',
      project: 'Modern menu', category: 'Showcase' },
  ];
  document.addEventListener('click', event => {
    const target = event.target;
    for (const { selector, project, category } of projects) {
      if (target.closest(selector)) { track('project_open', { project, category }); return; }
    }
    if (target.closest('.discord')) track('contact_click', { method: 'Discord' });
    else if (target.closest('.email-contact')) track('contact_click', { method: 'Email' });
    else if (target.closest('.stats-sources a[href^="https://games.roblox.com/"]'))
      track('external_link', { destination: 'Roblox statistics' });
    else if (target.closest('.stats-sources a[href^="https://www.rolimons.com/"]'))
      track('external_link', { destination: 'Rolimons statistics' });
  });

  // A category is seen once per page load, after 600 ms of visible content.
  // Decorative images are deliberately not gallery views: this site has no gallery.
  const seen = new Set();
  const timers = new Map();
  const visible = new Set();
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }
  function schedule(element) {
    const category = element.dataset.analyticsCategory;
    if (document.hidden || seen.has(category) || timers.has(element)) return;
    timers.set(element, setTimeout(() => {
      timers.delete(element);
      if (!document.hidden && visible.has(element) && !seen.has(category)) {
        seen.add(category);
        track('category_view', { category });
      }
    }, 600));
  }
  function observeCategories() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          visible.add(entry.target); schedule(entry.target);
        } else {
          visible.delete(entry.target);
          clearTimeout(timers.get(entry.target)); timers.delete(entry.target);
        }
      }
    }, { threshold: [0, 0.25] });
    for (const { selector, card, category } of projects) {
      const element = document.querySelector(card || `${selector} .project-copy`);
      if (element) { element.dataset.analyticsCategory = category; observer.observe(element); }
    }
    document.addEventListener('visibilitychange', () => {
      clearTimers();
      if (!document.hidden) visible.forEach(schedule);
    });
  }
  const entrance = document.getElementById('enter-screen');
  if (!entrance || entrance.hidden) observeCategories();
  else {
    const entranceObserver = new MutationObserver(() => {
      if (entrance.hidden) { entranceObserver.disconnect(); observeCategories(); }
    });
    entranceObserver.observe(entrance, { attributes: true, attributeFilter: ['hidden'] });
  }
})();
