(() => {
  const root = document.querySelector('.game-impact');
  if (!root) return;
  const endpoint = 'https://raw.githubusercontent.com/leomm258/portfolio/game-stats/game-stats.json';
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
  const exact = new Intl.NumberFormat('en-US');
  let snapshot;
  let inFlight = false;
  // Optional parts: the home page shows a compact strip without the status line or sources.
  const status = root.querySelector('.stats-updated');
  const ccuLabel = root.querySelector('[data-ccu-label]');
  const peakDetail = root.querySelector('[data-peak-detail]');
  function ageLabel() {
    if (!snapshot) return;
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(snapshot.updatedAt)) / 60000));
    const stale = minutes > 20;
    root.classList.toggle('stats-stale', stale);
    if (ccuLabel) ccuLabel.textContent = stale ? (ccuLabel.dataset.stale || 'PLAYERS · LAST SNAPSHOT') : (ccuLabel.dataset.live || 'PLAYERS ONLINE · CCU');
    if (!status) return;
    status.textContent = `${stale ? 'Last available snapshot' : 'Updated'} · ${minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : new Date(snapshot.updatedAt).toLocaleString()}${stale ? '' : ' · Auto refresh'}`;
    status.title = new Date(snapshot.updatedAt).toLocaleString();
  }
  function render(data) {
    if (data?.universeId !== 9584852943 || !['playing', 'visits', 'favorites'].every(key => Number.isSafeInteger(data[key]) && data[key] >= 0)) throw new Error('Invalid snapshot');
    if (!Number.isFinite(Date.parse(data.updatedAt)) || Date.parse(data.updatedAt) > Date.now() + 300000) throw new Error('Invalid time');
    if (snapshot && Date.parse(data.updatedAt) < Date.parse(snapshot.updatedAt)) return;
    snapshot = data;
    for (const key of ['playing', 'visits', 'favorites']) {
      const el = root.querySelector(`[data-stat="${key}"]`);
      if (!el) continue;
      el.textContent = compact.format(data[key]);
      el.title = exact.format(data[key]);
      el.setAttribute('aria-label', exact.format(data[key]));
    }
    if (Number.isSafeInteger(data.peak?.count) && data.peak.count > 0) {
      const peak = root.querySelector('[data-stat="peak"]');
      if (peak) { peak.textContent = compact.format(data.peak.count); peak.title = exact.format(data.peak.count); }
      if (peakDetail) peakDetail.textContent = `${exact.format(data.peak.count)} concurrent players · ${data.peak.date}`;
    }
    ageLabel();
  }
  async function refresh() {
    if (document.hidden || inFlight) return;
    inFlight = true;
    try {
      const response = await fetch(`${endpoint}?t=${Math.floor(Date.now() / 60000)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Feed unavailable');
      render(await response.json());
    } catch {
      if (!snapshot) {
        try {
          const fallback = await fetch('game-stats.json', { signal: AbortSignal.timeout(5000) });
          if (fallback.ok) render(await fallback.json());
        } catch {}
      }
      if (snapshot) ageLabel();
      else if (status) status.textContent = 'Automatic update unavailable · showing the dated snapshot below';
    } finally { inFlight = false; }
  }
  refresh();
  setInterval(() => { ageLabel(); refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { ageLabel(); refresh(); } });
})();
