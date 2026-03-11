#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_SOURCE_BY_LEAGUE = {
  CONCACAFCHAMPIONSCUP: 'https://www.youtube.com/playlist?list=PL6XTKrlgbQUBtOk2ji7hvg_4jVIUP-Kl2',
  UEFACHAMPIONSLEAGUE: 'https://www.youtube.com/playlist?list=PLkwBiY2Dq-oaG6vHAhmcCOc3Q_-To2dlA',
};

const DEFAULT_TITLE_MUST_INCLUDE_BY_LEAGUE = {
  CONCACAFCHAMPIONSCUP: 'concacaf champions cup',
  UEFACHAMPIONSLEAGUE: 'ucl',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function normalizeText(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(y, m, d) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDateToIso(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (ymd) return toIsoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));

  const slash = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) return toIsoDate(Number(slash[3]), Number(slash[1]), Number(slash[2]));

  const monthWord = raw.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})\b/);
  if (monthWord) {
    const dt = new Date(`${monthWord[1]} ${monthWord[2]}, ${monthWord[3]} 12:00:00 GMT`);
    if (!Number.isNaN(dt.getTime())) {
      return toIsoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    }
  }

  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    return toIsoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  return null;
}

function getRecentIsoDatesNY() {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
  const todayIso = parseDateToIso(todayStr);
  if (!todayIso) return new Set();

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
  const yesterdayIso = parseDateToIso(yesterdayStr);

  const out = new Set([todayIso]);
  if (yesterdayIso) out.add(yesterdayIso);
  return out;
}

const WBC_ALLOWED_VIDEO_DATES = getRecentIsoDatesNY();

function includesPhrase(haystackNorm, phraseNorm) {
  if (!phraseNorm) return false;
  const tokens = phraseNorm.split(' ').filter(Boolean);
  if (tokens.length === 0) return false;
  return haystackNorm.includes(tokens.join(' '));
}

const TEAM_NAME_VARIATIONS = {
  'borussia monchengladbach': [
    'gladbach',
    "m'gladbach",
    'm gladbach',
    'borussia m gladbach',
    "borussia m'gladbach",
    'bmg',
  ],
  'bayern munich': ['bayern', 'fc bayern', 'bayern munchen', 'fc bayern munchen', 'fcb', 'bay'],
};

const TEAM_ALIAS_INDEX = (() => {
  const map = new Map();
  for (const [canonical, aliases] of Object.entries(TEAM_NAME_VARIATIONS)) {
    const bucket = new Set([normalizeText(canonical)]);
    for (const alias of aliases) bucket.add(normalizeText(alias));
    const final = [...bucket].filter(Boolean);
    for (const k of final) map.set(k, final);
  }
  return map;
})();

function addAliasFamily(keys, key) {
  const family = TEAM_ALIAS_INDEX.get(key);
  if (!family) return;
  for (const alt of family) keys.add(alt);
}

function teamNameKeys(name) {
  const n = normalizeText(name);
  if (!n) return [];

  const tokens = n.split(' ').filter(Boolean);
  const keys = new Set([n]);
  if (tokens.length >= 1) keys.add(tokens[tokens.length - 1]);
  if (tokens.length >= 2) keys.add(tokens.slice(-2).join(' '));
  if (tokens.length >= 3) keys.add(tokens.slice(-3).join(' '));
  for (const key of [...keys]) addAliasFamily(keys, key);
  return [...keys].filter(Boolean);
}

function parseGameDateIso(game) {
  const fieldDate = parseDateToIso(game?.date || game?.gameDate || game?.matchDate || '');
  if (fieldDate) return fieldDate;

  const idRaw = String(game?.id || '');
  const compact = idRaw.match(/(?:^|[^0-9])(20\d{2})(\d{2})(\d{2})(?:[^0-9]|$)/);
  if (compact) return toIsoDate(Number(compact[1]), Number(compact[2]), Number(compact[3]));
  return null;
}

function parseScoreTeamCodes(score) {
  const raw = String(score || '').toUpperCase();
  if (!raw) return [];
  const re = /\b([A-Z]{2,5})\b\s*\d{1,3}\s*[-:]\s*\b([A-Z]{2,5})\b\s*\d{1,3}\b/;
  const m = raw.match(re);
  if (!m) return [];
  return [normalizeText(m[1]), normalizeText(m[2])].filter(Boolean);
}

function fetchVideosWithYtDlp(sourceUrl) {
  const proc = spawnSync(
    'yt-dlp',
    ['--flat-playlist', '--dump-json', sourceUrl],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );

  if (proc.status !== 0) {
    throw new Error(`yt-dlp failed (${proc.status}): ${(proc.stderr || '').slice(0, 400)}`);
  }

  const out = String(proc.stdout || '').trim();
  if (!out) return [];

  return out
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .map((v) => ({
      videoId: v.id,
      title: v.title || '',
      uploadDateIso: parseDateToIso(v.upload_date || ''),
    }))
    .filter((v) => v.videoId && v.title);
}

function pickBestTeamVideo(game, videos, targetDateIso, titleMustIncludeNorm, leagueKeyNorm) {
  const awayKeys = teamNameKeys(game?.teams?.away);
  const homeKeys = teamNameKeys(game?.teams?.home);
  const scoreCodes = parseScoreTeamCodes(game?.score);
  if (scoreCodes[0]) awayKeys.push(scoreCodes[0]);
  if (scoreCodes[1]) homeKeys.push(scoreCodes[1]);

  if (awayKeys.length === 0 || homeKeys.length === 0) return null;

  let best = null;
  let bestScore = -1;

  for (const v of videos) {
    const titleNorm = normalizeText(v.title);
    if (titleMustIncludeNorm && !includesPhrase(titleNorm, titleMustIncludeNorm)) continue;

    const awayHit = awayKeys.some((k) => includesPhrase(titleNorm, k));
    const homeHit = homeKeys.some((k) => includesPhrase(titleNorm, k));
    if (!awayHit || !homeHit) continue;

    // WBC uploads can land today or yesterday in ET regardless of game date parsing.
    const isWbc = String(leagueKeyNorm || '').toUpperCase() === 'WBC';
    if (isWbc) {
      if (!v.uploadDateIso || !WBC_ALLOWED_VIDEO_DATES.has(v.uploadDateIso)) continue;
    } else {
      // Required: same date for team-based games.
      if (!targetDateIso || v.uploadDateIso !== targetDateIso) continue;
    }

    let score = 100;
    if (includesPhrase(titleNorm, normalizeText(game?.teams?.away))) score += 5;
    if (includesPhrase(titleNorm, normalizeText(game?.teams?.home))) score += 5;
    if (includesPhrase(titleNorm, 'highlights')) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }

  if (!best) return null;
  return {
    provider: 'youtube',
    videoId: best.videoId,
    title: best.title,
    url: `https://www.youtube.com/watch?v=${best.videoId}`,
    embedUrl: `https://www.youtube.com/embed/${best.videoId}`,
    matchScore: bestScore,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const jsonPathArg = args.json;
  const dateInput = args.date || '';
  const usePerGameDate = String(args.usePerGameDate || '').toLowerCase() === 'true';
  let titleMustIncludeNorm = normalizeText(args.titleMustInclude || '');

  if (!jsonPathArg) throw new Error('Missing --json path');

  const jsonPath = path.resolve(process.cwd(), jsonPathArg);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const games = Array.isArray(data?.games) ? data.games : null;
  if (!games) throw new Error('Expected object with games[]');
  const leagueKeyNorm = String(data?.leagueKey || '').toUpperCase();
  const channelUrl = args.channelUrl || args.channel || DEFAULT_SOURCE_BY_LEAGUE[leagueKeyNorm] || '';
  if (!channelUrl) throw new Error('Missing --channelUrl (and no default source for this league).');

  if (!titleMustIncludeNorm) {
    titleMustIncludeNorm = normalizeText(DEFAULT_TITLE_MUST_INCLUDE_BY_LEAGUE[leagueKeyNorm] || '');
  }

  const globalTargetDateIso = parseDateToIso(dateInput);
  const videos = fetchVideosWithYtDlp(channelUrl);

  let matched = 0;
  for (const game of games) {
    const targetDateIso = usePerGameDate ? parseGameDateIso(game) : globalTargetDateIso;
    const best = pickBestTeamVideo(game, videos, targetDateIso, titleMustIncludeNorm, leagueKeyNorm);
    if (best) {
      game.highlights = [best];
      matched += 1;
    } else if (!Array.isArray(game.highlights)) {
      game.highlights = [];
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Processed ${games.length} games in ${jsonPathArg}`);
  console.log(`Matched highlights: ${matched}`);
  console.log(`Unmatched: ${games.length - matched}`);
  console.log(`Video source: yt-dlp:${channelUrl}`);
  console.log(`Date mode: ${usePerGameDate ? 'per-game' : 'global'}`);
  if (globalTargetDateIso) console.log(`Global date filter (ISO): ${globalTargetDateIso}`);
  if (titleMustIncludeNorm) console.log(`Title include filter: ${titleMustIncludeNorm}`);
}

try {
  main();
} catch (err) {
  console.error('[match-youtube-highlights-noapi] Error:', err.message);
  process.exit(1);
}
