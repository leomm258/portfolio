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
    if (!event.target.closest('nav .brand')) return;
    if (/\/(?:index\.html)?$/.test(location.pathname)) event.preventDefault();
    else return;
    const now = performance.now();
    clicks = clicks.filter(time => now - time <= 1800);
    clicks.push(now);
    if (clicks.length === 5) { admin.hidden = false; clicks = []; }
  });

  // No tracker request on previews, localhost, or the GitHub Pages domain.
  if (location.hostname !== 'leorizoto.fr' || location.protocol !== 'https:' ||
      !/^[0-9a-f-]{36}$/.test(websiteId)) return;

  const pages = ['index.html','projects.html','about.html','contact.html','keyboard-escape.html','read-my-mind.html','cooking-game.html','modern-menu.html'];
  const file = location.pathname.split('/').pop() || 'index.html';
  if (!pages.includes(file)) return;
  const pageUrl = file === 'index.html' ? '/' : '/' + file;
  if (file === 'index.html' && ['#projects','#about','#skills','#contact'].includes(location.hash)) return;
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
          website: websiteId, hostname: 'leorizoto.fr', url: pageUrl,
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

  const projects = {
    'keyboard-escape': {project:'+1 Speed Keyboard Escape',category:'Game'},
    'read-my-mind': {project:'Read My Mind',category:'Game'},
    'cooking-game': {project:'Cooking game',category:'Showcase'},
    'modern-menu': {project:'Modern menu',category:'Showcase'},
  };
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-project]');
    if (card && projects[card.dataset.project]) { track('project_open',projects[card.dataset.project]); return; }
    if (event.target.closest('.discord')) track('contact_click',{method:'Discord'});
    else if (event.target.closest('.email-contact')) track('contact_click',{method:'Email'});
    else {
      const link=event.target.closest('a[data-external], .stats-sources a');
      if (link) {
        const current=projects[file.replace('.html','')];
        const destination=link.dataset.external ? 'Roblox game' : link.href.includes('rolimons.com') ? 'Rolimons statistics' : 'Roblox statistics';
        track('external_link',{destination,...(current||{})});
      }
    }
  });
  // Count visible categories once per document, including after filter changes.
  const seen = new Set(), timers = new Map(), visible = new Set();
  function schedule(el) {
    const category=el.dataset.category;
    if (document.hidden || seen.has(category) || timers.has(el)) return;
    timers.set(el,setTimeout(() => {
      timers.delete(el);
      if (!document.hidden && !el.hidden && visible.has(el) && !seen.has(category)) {
        seen.add(category); track('category_view',{category});
      }
    },600));
  }
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio>=.25) {visible.add(entry.target);schedule(entry.target);}
        else {visible.delete(entry.target);clearTimeout(timers.get(entry.target));timers.delete(entry.target);}
      });
    },{threshold:[0,.25]});
    document.querySelectorAll('.project-card[data-category]').forEach(el=>observer.observe(el));
    document.addEventListener('visibilitychange',()=>{
      timers.forEach(clearTimeout);timers.clear();
      if (!document.hidden) visible.forEach(schedule);
    });
  }
})();
