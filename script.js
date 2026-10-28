(() => {
  'use strict';
  // Keep previously shared section links useful after the move to separate pages.
  if (/\/(?:index\.html)?$/.test(location.pathname)) {
    const legacy = {'#projects':'projects.html','#about':'about.html','#skills':'about.html#skills','#contact':'contact.html'};
    if (legacy[location.hash]) { location.replace(legacy[location.hash]); return; }
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
