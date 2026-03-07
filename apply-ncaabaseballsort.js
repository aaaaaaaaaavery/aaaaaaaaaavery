const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'recaps-manual/daily/ncaabaseball.json');
const sortPath = path.join(process.cwd(), 'ncaabaseballsort.txt');

const raw = fs.readFileSync(jsonPath, 'utf8');
const sortRaw = fs.readFileSync(sortPath, 'utf8');

function splitTopLevelJsonObjects(input) {
  const chunks = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
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
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        chunks.push(input.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return chunks;
}

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

function normalizeHighlight(entry, away, home) {
  const defaultTitle = `${away || 'Away'} vs ${home || 'Home'} highlights`;

  if (typeof entry === 'string') {
    const videoId = parseVideoId(entry);
    if (!videoId) return null;
    return {
      provider: 'youtube',
      videoId,
      title: defaultTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  if (!entry || typeof entry !== 'object') return null;

  const videoId = String(entry.videoId || '').trim() || parseVideoId(entry.url);
  if (!videoId) return null;

  return {
    provider: 'youtube',
    videoId,
    title: String(entry.title || '').trim() || defaultTitle,
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
  const base = normalizeText(teamName);
  if (!base) return Number.POSITIVE_INFINITY;

  const variants = [base, ...(TEAM_ALIASES[base] || [])];
  let best = Number.POSITIVE_INFINITY;

  for (const v of variants) {
    if (priorityMap.has(v)) best = Math.min(best, priorityMap.get(v));
  }

  return best;
}

const chunks = splitTopLevelJsonObjects(raw);
if (chunks.length === 0) throw new Error('No top-level JSON blocks found');

const parsedObjects = chunks.map((chunk, i) => {
  try {
    return JSON.parse(chunk);
  } catch (error) {
    throw new Error(`Cannot parse JSON block ${i + 1}: ${error.message}`);
  }
});

const base = parsedObjects[0] || {};
const allGames = [];
for (const obj of parsedObjects) {
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

const withSort = deduped.map((game, idx) => {
  const away = String(game?.teams?.away || '').trim();
  const home = String(game?.teams?.home || '').trim();
  const normalizedHighlights = (Array.isArray(game?.highlights) ? game.highlights : [])
    .map((h) => normalizeHighlight(h, away, home))
    .filter(Boolean);

  return {
    ...game,
    highlights: normalizedHighlights,
    __i: idx,
    __p: Math.min(teamPriorityIndex(away), teamPriorityIndex(home)),
  };
});

withSort.sort((a, b) => {
  if (a.__p !== b.__p) return a.__p - b.__p;
  return a.__i - b.__i;
});

for (const game of withSort) {
  delete game.__i;
  delete game.__p;
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
  games: withSort,
};

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2) + '\n');

console.log(`blocks_merged=${parsedObjects.length}`);
console.log(`games_total=${allGames.length}`);
console.log(`games_deduped=${withSort.length}`);
console.log('ncaabaseball.json repaired, normalized, and sorted');
