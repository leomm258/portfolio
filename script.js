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
  enterButton.focus({ preventScroll: true });
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
  enterButton.addEventListener('click', (event) => {
    const keyboardEntry = event.detail === 0;
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
      if (keyboardEntry) document.querySelector('nav .brand').focus({ preventScroll: true });
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
  discord.addEventListener('click', async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(username);
      copied = true;
    } catch {
      const field = document.createElement('textarea');
      field.value = username;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
      discord.focus({ preventScroll: true });
    }
    status.textContent = copied ? 'Discord username copied: leorizoto' : 'Add me on Discord: leorizoto';
    status.hidden = false;
    discord.textContent = copied ? 'USERNAME COPIED ✓' : 'DISCORD · leorizoto';
    clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      discord.textContent = 'DISCORD · leorizoto ↗';
      status.textContent = '';
      status.hidden = true;
    }, 2500);
  });
  updateSound();
})();
