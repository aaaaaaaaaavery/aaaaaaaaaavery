const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'recaps-manual/daily/ncaabaseball.json');
const sortPath = path.join(process.cwd(), 'ncaabaseballsort.txt');

const raw = fs.readFileSync(jsonPath, 'utf8');
const sortRaw = fs.readFileSync(sortPath, 'utf8');

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVideoId(url) {
  const rawUrl = String(url || '').trim();
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace(/^\//, '').trim();
    return (u.searchParams.get('v') || '').trim();
  } catch {
    return '';
  }
}

function findMatchingBraceEnd(input, startIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < input.length; i += 1) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function extractLeagueObjects(input, leagueName) {
  const objects = [];
  const needle = `"leagueName": "${leagueName}"`;
  let cursor = 0;

  while (true) {
    const found = input.indexOf(needle, cursor);
    if (found === -1) break;

    let start = found;
    while (start >= 0 && input[start] !== '{') start -= 1;
    if (start < 0) {
      cursor = found + needle.length;
      continue;
    }

    const end = findMatchingBraceEnd(input, start);
    if (end < 0) {
      cursor = found + needle.length;
      continue;
    }

    const chunk = input.slice(start, end + 1);
    try {
      const parsed = JSON.parse(chunk);
      if (String(parsed.leagueName || '') === leagueName) {
        objects.push(parsed);
      }
    } catch {
      // Skip malformed chunk and continue.
    }

    cursor = end + 1;
  }

  return objects;
}

function normalizeHighlight(item, away, home) {
  const defaultTitle = `${away || 'Away'} vs ${home || 'Home'} highlights`;

  if (typeof item === 'string') {
    const videoId = parseVideoId(item);
    if (!videoId) return null;
    return {
      provider: 'youtube',
      videoId,
      title: defaultTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  if (!item || typeof item !== 'object') return null;

  const videoId = String(item.videoId || '').trim() || parseVideoId(item.url);
  if (!videoId) return null;

  return {
    provider: 'youtube',
    videoId,
    title: String(item.title || '').trim() || defaultTitle,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

function getTeamPriority(text) {
  const marker = 'Team priority order (first to last)';
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) return [];

  return lines
    .slice(start + 1)
    .map((line) => line.trim())
    .filter(Boolean);
}

const objects = extractLeagueObjects(raw, 'NCAA Baseball');
if (objects.length === 0) {
  throw new Error('No NCAA Baseball objects found in ncaabaseball.json');
}

const base = objects[0];
const allGames = [];
for (const obj of objects) {
  if (Array.isArray(obj.games)) allGames.push(...obj.games);
}

const deduped = [];
const seen = new Set();
for (const game of allGames) {
  const away = String(game?.teams?.away || '').trim();
  const home = String(game?.teams?.home || '').trim();
  const id = String(game?.id || '').trim();
  const key = id || `${away}|${home}|${String(game?.score || '').trim()}|${String(game?.headline || '').trim()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(game);
}

const priorityTeams = getTeamPriority(sortRaw);
const priorityMap = new Map();
priorityTeams.forEach((team, idx) => {
  priorityMap.set(normalizeText(team), idx);
});

const TEAM_ALIASES = {
  [normalizeText('South Carolina Upstate')]: [normalizeText('USC Upstate')],
  [normalizeText('USC Upstate')]: [normalizeText('South Carolina Upstate')],
  [normalizeText('Queens University')]: [normalizeText('Queens (NC)')],
};

function teamPriorityIndex(teamName) {
  const baseName = normalizeText(teamName);
  if (!baseName) return Number.POSITIVE_INFINITY;

  const variants = [baseName, ...(TEAM_ALIASES[baseName] || [])];
  let best = Number.POSITIVE_INFINITY;

  for (const v of variants) {
    if (priorityMap.has(v)) best = Math.min(best, priorityMap.get(v));
  }

  return best;
}

const normalizedGames = deduped.map((game, i) => {
  const away = String(game?.teams?.away || '').trim();
  const home = String(game?.teams?.home || '').trim();
  const highlights = (Array.isArray(game?.highlights) ? game.highlights : [])
    .map((h) => normalizeHighlight(h, away, home))
    .filter(Boolean);

  return {
    ...game,
    highlights,
    __priority: Math.min(teamPriorityIndex(away), teamPriorityIndex(home)),
    __index: i,
  };
});

normalizedGames.sort((a, b) => {
  if (a.__priority !== b.__priority) return a.__priority - b.__priority;
  return a.__index - b.__index;
});

for (const game of normalizedGames) {
  delete game.__priority;
  delete game.__index;
}

const output = {
  leagueName: String(base.leagueName || 'NCAA Baseball'),
  leagueKey: String(base.leagueKey || 'ncaa_baseball'),
  sourceType: String(base.sourceType || 'console_recaps'),
  ...(Object.prototype.hasOwnProperty.call(base, 'newsBriefing')
    ? { newsBriefing: base.newsBriefing }
    : Object.prototype.hasOwnProperty.call(base, 'leagueBriefing')
      ? { leagueBriefing: base.leagueBriefing }
      : {}),
  games: normalizedGames,
};

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2) + '\n');

console.log(`objects_found=${objects.length}`);
console.log(`games_total=${allGames.length}`);
console.log(`games_deduped=${normalizedGames.length}`);
console.log('Applied ncaabaseballsort.txt to ncaabaseball.json');
