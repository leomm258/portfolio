(() => {
  'use strict';
  const entrance = document.getElementById('enter-screen');
  const enterButton = document.getElementById('enter-button');
  const audio = document.getElementById('ambient-audio');
  const soundButton = document.getElementById('sound-toggle');
  const discord = document.querySelector('.discord');
  const status = document.getElementById('copy-status');
  const username = 'leorizoto';
  const storageKey = 'portfolio-music-muted';
  let entered = false;
  let wantsMusic = true;
  let playRequest = 0;
  let copyTimer;
  try { wantsMusic = localStorage.getItem(storageKey) !== 'true'; } catch {}
  // Quiet ambience. Do not fetch the original MP3 until the visitor enters.
  audio.volume = 0.05;
  status.hidden = true;
  document.documentElement.classList.add('entrance-active');
  const behindEntrance = [...document.querySelector('main').children].filter(el => el !== entrance && el !== audio);
  behindEntrance.forEach(el => { el.inert = true; });

  function updateSound() {
    const playing = !audio.paused && !audio.muted && !document.hidden;
    soundButton.textContent = playing ? 'SOUND ON' : 'SOUND OFF';
    soundButton.setAttribute('aria-pressed', String(playing));
    soundButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  }
  async function playMusic() {
    if (!entered || !wantsMusic || document.hidden) return;
    const request = ++playRequest;
    if (!audio.getAttribute('src')) audio.src = audio.dataset.src;
    try {
      await audio.play();
      if (request !== playRequest) return;
      if (!wantsMusic || document.hidden) audio.pause();
    } catch { /* Keep the sound button available if playback is blocked. */ }
    updateSound();
  }
  function pauseMusic() { ++playRequest; audio.pause(); updateSound(); }
  enterButton.addEventListener('click', () => {
    if (entered) return;
    entered = true;
    // Opening the portfolio never waits for the music to download or play.
    entrance.classList.add('leaving');
    entrance.inert = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('revealing-portfolio');
    window.setTimeout(() => {
      entrance.hidden = true;
      behindEntrance.forEach(el => { el.inert = false; });
      soundButton.classList.add('visible');

      document.documentElement.classList.remove('entrance-active');
      document.documentElement.classList.remove('revealing-portfolio');
    }, reducedMotion ? 0 : 1050);
    void playMusic();
  });
  soundButton.addEventListener('click', () => {
    wantsMusic = audio.paused;
    try { localStorage.setItem(storageKey, String(!wantsMusic)); } catch {}
    if (wantsMusic) void playMusic(); else pauseMusic();
  });
  audio.addEventListener('play', updateSound);
  audio.addEventListener('pause', updateSound);
  audio.addEventListener('error', updateSound);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMusic(); else void playMusic();
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
  updateSound();
})();
