(() => {
  'use strict';
  const entrance = document.getElementById('enter-screen');
  const enterButton = document.getElementById('enter-button');
  const discord = document.querySelector('.discord');
  const status = document.getElementById('copy-status');
  const username = 'leorizoto';
  let entered = false;
  let copyTimer;
  status.hidden = true;
  document.documentElement.classList.add('entrance-active');
  const behindEntrance = [...document.querySelector('main').children].filter(el => el !== entrance);
  behindEntrance.forEach(el => { el.inert = true; });

  enterButton.addEventListener('click', () => {
    if (entered) return;
    entered = true;
    entrance.classList.add('leaving');
    entrance.inert = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('revealing-portfolio');
    window.setTimeout(() => {
      entrance.hidden = true;
      behindEntrance.forEach(el => { el.inert = false; });

      document.documentElement.classList.remove('entrance-active');
      document.documentElement.classList.remove('revealing-portfolio');
    }, reducedMotion ? 0 : 1050);
  });
  function bindCopy(button, value, label) {
    const feedback = button.querySelector('.contact-hint');
    let resetTimer;
    button.addEventListener('click', async () => {
      let copied = false;
      try { await navigator.clipboard.writeText(value); copied = true; }
      catch {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(field); field.select();
        try { copied = document.execCommand('copy'); } catch {}
        field.remove();
      }
      feedback.textContent = copied ? 'Copied ✓' : 'Select and copy: ' + value;
      button.classList.toggle('copied', copied);
      status.textContent = copied ? label + ' copied: ' + value : label + ': ' + value;
      status.hidden = false;
      clearTimeout(resetTimer); clearTimeout(copyTimer);
      resetTimer = window.setTimeout(() => {
        feedback.textContent = 'Click to copy'; button.classList.remove('copied');
      }, 2500);
      copyTimer = window.setTimeout(() => { status.hidden = true; status.textContent = ''; }, 2500);
    });
  }
  bindCopy(discord, username, 'Discord username');
  bindCopy(document.querySelector('.email-contact'), 'contact@leorizoto.fr', 'Email');

})();
