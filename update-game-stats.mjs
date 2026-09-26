import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const universeId = 9584852943;
export const peakUrl = 'https://www.rolimons.com/game/95082159892680';
export function validateGame(payload) {
  const game = payload?.data?.find(item => item.id === universeId);
  if (!game || !['playing', 'visits', 'favoritedCount'].every(key => Number.isSafeInteger(game[key]) && game[key] >= 0)) {
    throw new Error('Invalid Roblox statistics; keeping the previous snapshot.');
  }
  return game;
}
export function parsePeak(html) {
  const match = html.match(/>All-Time<\/div>\s*<div[^>]*class="game_stat_data"[^>]*>([\d,]+)<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
  const count = Number(match?.[1].replaceAll(',', ''));
  const date = Date.parse(`${match?.[2]} UTC`);
  if (!Number.isSafeInteger(count) || count <= 0 || !Number.isFinite(date)) throw new Error('Peak source format unavailable');
  return { count, date: new Date(date).toISOString().slice(0, 10), source: peakUrl };
}
async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'leorizoto-portfolio-stats/1.0' } });
  if (!response.ok) throw new Error(`Statistics request failed: ${response.status}`);
  return response;
}
export async function collect(previous = {}) {
  const game = validateGame(await (await request(`https://games.roblox.com/v1/games?universeIds=${universeId}`)).json());
  const updatedAt = new Date().toISOString();
  let peak = previous.peak;
  if (!peak || Date.now() - Date.parse(peak.checkedAt || '') >= 86400000 || !Number.isFinite(Date.parse(peak.checkedAt || ''))) {
    try {
      const result = parsePeak(await (await request(peakUrl)).text());
      peak = result.count >= (peak?.count || 0) ? { ...result, checkedAt: updatedAt } : peak;
    } catch (error) {
      console.warn('Peak unchanged:', error.message);
    }
  }
  return { universeId, updatedAt, playing: game.playing, visits: game.visits, favorites: game.favoritedCount, peak: peak || null };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv[2] || 'game-stats.json';
  let previous = {};
  try { previous = JSON.parse(await fs.readFile(process.argv[3] || output, 'utf8')); } catch {}
  const snapshot = await collect(previous);
  await fs.writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Updated Roblox statistics at ${snapshot.updatedAt}`);
}
