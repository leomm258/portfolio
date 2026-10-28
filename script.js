(() => {
  'use strict';
  // Keep previously shared section links useful after the move to separate pages.
  if (/\/(?:index\.html)?$/.test(location.pathname)) {
    const legacy = {'#projects':'projects.html','#about':'about.html','#skills':'about.html#skills','#contact':'contact.html'};
    if (legacy[location.hash]) { location.replace(legacy[location.hash]); return; }
  }
  const entrance = document.getElementById('enter-screen');
  if (entrance) {
    const content = [...document.body.children].filter(el => el !== entrance && el.tagName !== 'SCRIPT');
    // Returning from another portfolio page skips the welcome; a fresh visit or
    // reload keeps the original opening experience.
    const fromPortfolio = document.referrer.startsWith(location.origin + '/') &&
      !/\/(?:index\.html)?(?:[?#].*)?$/.test(new URL(document.referrer).pathname);
    const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload';
    if (fromPortfolio && !reloaded) entrance.hidden = true;
    else {
      document.documentElement.classList.add('entrance-active');
      content.forEach(el => { el.inert = true; });
      let entered = false;
      document.getElementById('enter-button').addEventListener('click', () => {
        if (entered) return;
        entered = true;
        entrance.classList.add('leaving');
        entrance.inert = true;
        document.documentElement.classList.add('revealing-portfolio');
        setTimeout(() => {
          entrance.hidden = true;
          content.forEach(el => { el.inert = false; });
          document.documentElement.classList.remove('entrance-active','revealing-portfolio');
        }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1050);
      });
    }
  }
  let copyTimer;
  const status = document.getElementById('copy-status');
  function bindCopy(button, value, label) {
    if (!button) return;
    const feedback = button.querySelector('.contact-hint');
    let resetTimer;
    button.addEventListener('click', async () => {
      let copied = false;
      try { await navigator.clipboard.writeText(value); copied = true; }
      catch {
        const field = document.createElement('textarea');
        field.value = value; field.setAttribute('readonly','');
        field.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(field); field.select();
        try { copied = document.execCommand('copy'); } catch {}
        field.remove();
      }
      feedback.textContent = copied ? 'Copied ✓' : 'Select and copy: ' + value;
      status.textContent = copied ? label + ' copied' : label + ': ' + value;
      status.hidden = false;
      clearTimeout(resetTimer); clearTimeout(copyTimer);
      resetTimer = setTimeout(() => { feedback.textContent = 'Click to copy'; },2500);
      copyTimer = setTimeout(() => { status.hidden = true; },2500);
    });
  }
  bindCopy(document.querySelector('.discord'),'leorizoto','Discord username');
  bindCopy(document.querySelector('.email-contact'),'contact@leorizoto.fr','Email');
  const filters = [...document.querySelectorAll('[data-filter]')];
  filters.forEach(button => button.addEventListener('click',() => {
    filters.forEach(other => other.setAttribute('aria-pressed',String(other===button)));
    let count=0;
    document.querySelectorAll('.collection .project-card').forEach(card => {
      card.hidden = button.dataset.filter !== 'All' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    document.getElementById('collection-count').textContent = count + ' projects';
  }));
})();
