const fs = require('fs');

const filePath = 'recaps-manual/daily/ncaabaseball.json';
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

function extractVideoId(value) {
  const input = String(value || '').trim();
  if (!input) return '';

  if (/^[A-Za-z0-9_-]{6,}$/.test(input) && !input.includes('http')) {
    return input;
  }

  try {
    const u = new URL(input);

    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace(/^\//, '').trim();
    }

    const v = u.searchParams.get('v');
    if (v) return String(v).trim();

    const embedMatch = u.pathname.match(/\/embed\/([A-Za-z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    return '';
  }

  return '';
}

function normalizeHighlight(item, away, home) {
  const fallbackTitle = `${away || 'Away'} vs ${home || 'Home'} highlights`;

  if (typeof item === 'string') {
    const videoId = extractVideoId(item);
    if (!videoId) return null;
    return {
      provider: 'youtube',
      videoId,
      title: fallbackTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  if (!item || typeof item !== 'object') return null;

  const videoId = extractVideoId(item.videoId || item.url || item.embedUrl);
  if (!videoId) return null;

  return {
    provider: 'youtube',
    videoId,
    title: String(item.title || '').trim() || fallbackTitle,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

const games = Array.isArray(data.games) ? data.games : [];
let updatedGames = 0;
let totalHighlights = 0;

for (const game of games) {
  const away = String(game?.teams?.away || '').trim();
  const home = String(game?.teams?.home || '').trim();
  const current = Array.isArray(game.highlights) ? game.highlights : [];

  const normalized = current
    .map((h) => normalizeHighlight(h, away, home))
    .filter(Boolean);

  totalHighlights += normalized.length;

  if (JSON.stringify(current) !== JSON.stringify(normalized)) {
    updatedGames += 1;
  }

  game.highlights = normalized;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

console.log(`games=${games.length}`);
console.log(`updatedGames=${updatedGames}`);
console.log(`totalHighlights=${totalHighlights}`);
