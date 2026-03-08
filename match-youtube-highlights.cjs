#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_PLAYLISTS_BY_LEAGUE = {
  NBA: 'PLlVlyGVtvuVlek5UOvwJaRDtuAI1FgGZf',
  WBC: 'PLL-lmlkrmJal3m1rov-FXlDLLaHpPJL6L',
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

function tryParseJson(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 240)}`));
          }
          const parsed = tryParseJson(data);
          if (!parsed) return reject(new Error('Invalid JSON response from API'));
          resolve(parsed);
        });
      })
      .on('error', reject);
  });
}

function parseHandleFromUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const handleDirect = raw.match(/^@([A-Za-z0-9._-]+)$/);
  if (handleDirect) return handleDirect[1];

  const fromUrl = raw.match(/youtube\.com\/@([A-Za-z0-9._-]+)/i);
  if (fromUrl) return fromUrl[1];

  return null;
}

function parseChannelIdFromUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const channelDirect = raw.match(/^(UC[a-zA-Z0-9_-]{20,})$/);
  if (channelDirect) return channelDirect[1];

  const fromUrl = raw.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,})/i);
  if (fromUrl) return fromUrl[1];

  return null;
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

function isPlaceholderTeamName(teamName) {
  const t = normalizeText(teamName);
  if (!t) return true;
  return (
    t === 'n a' ||
    t === 'na' ||
    t === 'none' ||
    t === 'null' ||
    t === 'unknown' ||
    t === 'tbd' ||
    t === 'to be determined' ||
    t === 'to be announced'
  );
}

function toIsoDate(y, m, d) {
  const yy = String(y).padStart(4, '0');
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function parseDateToIso(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const slash = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const year = Number(slash[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return toIsoDate(year, month, day);
    }
  }

  const monthWord = raw.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})\b/);
  if (monthWord) {
    const dt = new Date(`${monthWord[1]} ${monthWord[2]}, ${monthWord[3]} 12:00:00 GMT`);
    if (!Number.isNaN(dt.getTime())) {
      return toIsoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toIsoDate(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
  }

  return null;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesPhrase(haystack, phrase) {
  if (!phrase) return false;
  const pattern = new RegExp(`\\b${escapeRegex(phrase).replace(/\\ /g, '\\s+')}\\b`, 'i');
  return pattern.test(haystack);
}

// Common club/team aliases used in highlight titles.
// Keep values human-readable; they are normalized before matching.
const TEAM_NAME_VARIATIONS = {
  'wolverhampton wanderers': ['wolves', 'wolverhampton'],
  'tottenham hotspur': ['spurs', 'tottenham'],
  'celta de vigo': ['celta', 'celta vigo'],
  'borussia monchengladbach': [
    'gladbach',
    "m'gladbach",
    'm gladbach',
    'monchengladbach',
    'borussia m gladbach',
    "borussia m'gladbach",
    'borussia mgladbach',
    'bmg',
  ],
  'bayern munich': ['bayern', 'fc bayern', 'bayern munchen', 'fc bayern munchen', 'fc bayern munich', 'fcb', 'bay'],
  'borussia dortmund': ['dortmund', 'bvb', 'bvb09'],
  'fc koln': ['fc koln', '1 fc koln', '1. fc koln', 'koln', 'koeln', 'fc cologne'],
  'bayer leverkusen': ['leverkusen', 'b04'],
  'eintracht frankfurt': ['frankfurt', 'eintracht'],
  'rb leipzig': ['leipzig', 'rbl'],
  'vfb stuttgart': ['stuttgart'],
  'vfl wolfsburg': ['wolfsburg'],
  'hoffenheim': ['tsg hoffenheim', 'tsg'],
  'werder bremen': ['bremen', 'werder'],
  'union berlin': ['fc union berlin', 'union'],
  'sc freiburg': ['freiburg'],
  'mainz 05': ['mainz', 'mainz05'],
  'augsburg': ['fc augsburg'],
  'bochum': ['vfl bochum'],
  'st pauli': ['fc st pauli', 'st. pauli'],
  'heidenheim': ['fc heidenheim'],
  'holstein kiel': ['kiel'],
  'juventus': ['juve'],
  'internazionale': ['inter', 'inter milan'],
  'ac milan': ['milan'],
  'as roma': ['roma'],
  'napoli': ['ssc napoli'],
  'lazio': ['ss lazio'],
  'atalanta': ['atalanta bc'],
  'fiorentina': ['acf fiorentina'],
  'torino': ['torino fc'],
  'genoa': ['genoa cfc'],
  'sampdoria': ['uc sampdoria'],
  'real madrid': ['madrid', 'rm'],
  'atletico madrid': ['atletico', 'atleti'],
  'barcelona': ['fc barcelona', 'barca'],
  'athletic club': ['athletic bilbao', 'bilbao'],
  'real sociedad': ['sociedad', 'la real'],
  'real betis': ['betis'],
  'sevilla': ['sevilla fc'],
  'valencia': ['valencia cf'],
  'villarreal': ['villarreal cf'],
  'girona': ['girona fc'],
  'osasuna': ['ca osasuna'],
  'espanyol': ['rcd espanyol'],
  'rayo vallecano': ['rayo'],
  'getafe': ['getafe cf'],
  'mallorca': ['rcd mallorca'],
  'leganes': ['cd leganes'],
  'real valladolid': ['valladolid'],
  'deportivo alaves': ['alaves', 'alaves'],
  'paris saint germain': ['psg', 'paris sg'],
  'manchester united': ['man utd', 'man united', 'utd'],
  'manchester city': ['man city', 'city'],
  'newcastle united': ['newcastle'],
  'west ham united': ['west ham'],
  'nottingham forest': ['forest'],
  'brighton and hove albion': ['brighton'],
  'wolverhampton': ['wolves'],
  'liverpool': ['lfc'],
  'arsenal': ['afc arsenal'],
  'chelsea': ['chelsea fc'],
  'aston villa': ['villa'],
  'everton': ['everton fc'],
  'fulham': ['fulham fc'],
  'crystal palace': ['palace'],
  'brentford': ['brentford fc'],
  'bournemouth': ['afc bournemouth'],
  'leicester city': ['leicester'],
  'southampton': ['southampton fc'],
  'ipswich town': ['ipswich'],
};

const TEAM_ALIAS_INDEX = (() => {
  const map = new Map();
  for (const [canonical, aliases] of Object.entries(TEAM_NAME_VARIATIONS)) {
    const bucket = new Set();
    bucket.add(normalizeText(canonical));
    for (const alias of aliases) bucket.add(normalizeText(alias));
    const final = [...bucket].filter(Boolean);
    for (const key of final) {
      map.set(key, final);
    }
  }
  return map;
})();

function addAliasFamily(keys, key) {
  const family = TEAM_ALIAS_INDEX.get(key);
  if (!family) return;
  for (const alt of family) keys.add(alt);
}

function teamNameKeys(teamName) {
  const normalized = normalizeText(teamName);
  if (!normalized || isPlaceholderTeamName(normalized)) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const keys = new Set();

  keys.add(normalized);
  keys.add(tokens[tokens.length - 1]);

  if (tokens.length >= 2) keys.add(tokens.slice(-2).join(' '));
  if (tokens.length >= 3) keys.add(tokens.slice(-3).join(' '));

  // Add common shortened variants, e.g., Borussia Monchengladbach -> Gladbach.
  for (const key of [...keys]) {
    addAliasFamily(keys, key);
  }

  return [...keys].filter(Boolean);
}

function parseScoreTeamCodes(score) {
  const raw = String(score || '').toUpperCase();
  if (!raw) return [];

  // Capture common scoreboard abbreviations around numeric scores, e.g. BAY 4 - BMG 1.
  const re = /\b([A-Z]{2,5})\b\s*\d{1,3}\s*[-:]\s*\b([A-Z]{2,5})\b\s*\d{1,3}\b/;
  const m = raw.match(re);
  if (!m) return [];

  return [m[1], m[2]]
    .map((s) => normalizeText(s))
    .filter((s) => s && s.length >= 2 && s.length <= 5);
}

function parseTitleDate(title) {
  return parseDateToIso(title);
}

function parseRoundNumberFromText(input) {
  const text = String(input || '');
  if (!text) return null;

  const direct = text.match(/\bround\s*([1-4])\b/i);
  if (direct) return Number(direct[1]);

  const words = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
  };

  const throughWord = text.match(/\bthrough\s+(one|two|three|four)\s+rounds?\b/i);
  if (throughWord) return words[throughWord[1].toLowerCase()] || null;

  const ordinalWord = text.match(/\b(first|second|third|fourth)\s+round\b/i);
  if (ordinalWord) return words[ordinalWord[1].toLowerCase()] || null;

  return null;
}

function parseGameRoundNumber(game, leagueEntry) {
  const chunks = [
    game?.headline,
    game?.brief,
    game?.context,
    leagueEntry?.newsBriefing,
  ];

  const bullets = Array.isArray(game?.bullets) ? game.bullets : [];
  chunks.push(...bullets);

  for (const c of chunks) {
    const round = parseRoundNumberFromText(c);
    if (round) return round;
  }

  return null;
}

function parseGameDateIso(game) {
  const fieldDate = parseDateToIso(game?.date || game?.gameDate || game?.matchDate || '');
  if (fieldDate) return fieldDate;

  const idRaw = String(game?.id || '');
  const compact = idRaw.match(/(?:^|[^0-9])(20\d{2})(\d{2})(\d{2})(?:[^0-9]|$)/);
  if (compact) {
    return toIsoDate(Number(compact[1]), Number(compact[2]), Number(compact[3]));
  }

  return null;
}

function extractPlaylistId(rawInput) {
  const raw = String(rawInput || '').trim();
  if (!raw) return null;

  const listFromUrl = raw.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return listFromUrl ? listFromUrl[1] : raw;
}

function resolvePlaylistIds(argsPlaylist, leagueKey) {
  const raw = String(argsPlaylist || '').trim();
  if (raw) {
    const tokens = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const ids = [];
    for (const token of tokens) {
      const id = extractPlaylistId(token);
      if (id) ids.push(id);
    }
    return [...new Set(ids)];
  }

  const byLeague = DEFAULT_PLAYLISTS_BY_LEAGUE[String(leagueKey || '').toUpperCase()];
  if (byLeague) return [byLeague];

  return [DEFAULT_PLAYLISTS_BY_LEAGUE.NBA];
}

function scoreMatch(game, video, targetDateIso, titleMustIncludeNorm, roundHint, leagueKeyNorm, leagueNameNorm) {
  const titleNorm = normalizeText(video.title);
  const dateInTitleIso = parseTitleDate(video.title);
  const publishedDateIso = parseDateToIso(video.publishedAt || '');

  if (titleMustIncludeNorm && !includesPhrase(titleNorm, titleMustIncludeNorm)) {
    return -1;
  }

  const awayKeys = teamNameKeys(game.teams?.away);
  const homeKeys = teamNameKeys(game.teams?.home);
  const scoreCodes = parseScoreTeamCodes(game.score);
  if (scoreCodes[0]) awayKeys.push(scoreCodes[0]);
  if (scoreCodes[1]) homeKeys.push(scoreCodes[1]);
  const hasTeamContext = awayKeys.length > 0 && homeKeys.length > 0;

  const awayHit = awayKeys.some((k) => includesPhrase(titleNorm, k));
  const homeHit = homeKeys.some((k) => includesPhrase(titleNorm, k));

  let score = 100;
  if (hasTeamContext) {
    // Team-based entries: require both teams in title and exact same date.
    if (!awayHit || !homeHit) return -1;
    const dateMatches =
      targetDateIso && (publishedDateIso === targetDateIso || dateInTitleIso === targetDateIso);
    if (!dateMatches) return -1;
  } else if (!awayHit || !homeHit) {

    // Teamless summary entries (e.g., LIV/Tennis) can use date/round fallback.
    if (targetDateIso && publishedDateIso && publishedDateIso === targetDateIso) {
      score = 92;
    } else if (targetDateIso && dateInTitleIso && dateInTitleIso === targetDateIso) {
      score = 90;
    } else if (roundHint) {
      const titleRound = parseRoundNumberFromText(video.title);
      if (!titleRound || titleRound !== roundHint) return -1;
      score = 88;
    } else {
      return -1;
    }
  }

  if (includesPhrase(titleNorm, 'full game highlights')) score += 15;
  if (includesPhrase(titleNorm, 'highlights')) score += 5;

  if (targetDateIso && dateInTitleIso) {
    if (dateInTitleIso === targetDateIso) score += 20;
    else score -= 8;
  }

  if (targetDateIso && publishedDateIso) {
    if (publishedDateIso === targetDateIso) score += 16;
    else score -= 5;
  }

  return score;
}

function pickBestVideo(
  game,
  videos,
  targetDateIso,
  titleMustIncludeNorm,
  roundHint,
  leagueKeyNorm,
  leagueNameNorm
) {
  let best = null;
  let bestScore = -1;

  for (const video of videos) {
    const s = scoreMatch(
      game,
      video,
      targetDateIso,
      titleMustIncludeNorm,
      roundHint,
      leagueKeyNorm,
      leagueNameNorm
    );
    if (s > bestScore) {
      bestScore = s;
      best = video;
    }
  }

  if (!best || bestScore < 85) return null;

  return {
    provider: 'youtube',
    videoId: best.videoId,
    title: best.title,
    url: `https://www.youtube.com/watch?v=${best.videoId}`,
    embedUrl: `https://www.youtube.com/embed/${best.videoId}`,
    publishedAt: best.publishedAt,
    matchScore: bestScore,
  };
}

async function fetchPlaylistVideos(apiKey, playlistId) {
  const out = [];
  let pageToken = '';

  while (true) {
    const q = new URLSearchParams({
      part: 'snippet,contentDetails',
      maxResults: '50',
      playlistId,
      key: apiKey,
    });
    if (pageToken) q.set('pageToken', pageToken);

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?${q.toString()}`;
    const json = await httpGetJson(url);

    const items = Array.isArray(json.items) ? json.items : [];
    for (const item of items) {
      const videoId = item?.contentDetails?.videoId;
      const title = item?.snippet?.title;
      const publishedAt = item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt || null;
      if (!videoId || !title) continue;
      out.push({ videoId, title, publishedAt });
    }

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return out;
}

async function fetchVideosFromPlaylists(apiKey, playlistIds) {
  const merged = [];
  for (const pid of playlistIds) {
    const vids = await fetchPlaylistVideos(apiKey, pid);
    merged.push(...vids);
  }

  // Same video can appear in multiple playlists; keep one record per videoId.
  const byId = new Map();
  for (const v of merged) {
    if (!byId.has(v.videoId)) {
      byId.set(v.videoId, v);
      continue;
    }
    // Prefer record with an explicit contentDetails publish date when available.
    const existing = byId.get(v.videoId);
    const existingHasDate = Boolean(parseDateToIso(existing.publishedAt || ''));
    const nextHasDate = Boolean(parseDateToIso(v.publishedAt || ''));
    if (!existingHasDate && nextHasDate) {
      byId.set(v.videoId, v);
    }
  }

  return [...byId.values()];
}

async function resolveChannelId(apiKey, rawChannelInput) {
  const directId = parseChannelIdFromUrl(rawChannelInput);
  if (directId) return directId;

  const handle = parseHandleFromUrl(rawChannelInput);
  if (!handle) {
    throw new Error('Could not parse YouTube channel handle or channel ID from --channel input.');
  }

  const q = new URLSearchParams({
    part: 'id',
    forHandle: handle,
    key: apiKey,
  });
  const url = `https://www.googleapis.com/youtube/v3/channels?${q.toString()}`;
  const json = await httpGetJson(url);
  const channelId = json?.items?.[0]?.id || null;
  if (!channelId) {
    throw new Error(`Could not resolve channel ID for handle @${handle}`);
  }
  return channelId;
}

async function fetchChannelVideos(apiKey, rawChannelInput) {
  const out = [];
  const channelId = await resolveChannelId(apiKey, rawChannelInput);
  let pageToken = '';

  while (true) {
    const q = new URLSearchParams({
      part: 'snippet',
      channelId,
      type: 'video',
      order: 'date',
      maxResults: '50',
      key: apiKey,
    });
    if (pageToken) q.set('pageToken', pageToken);

    const url = `https://www.googleapis.com/youtube/v3/search?${q.toString()}`;
    const json = await httpGetJson(url);

    const items = Array.isArray(json.items) ? json.items : [];
    for (const item of items) {
      const videoId = item?.id?.videoId;
      const title = item?.snippet?.title;
      const publishedAt = item?.snippet?.publishedAt || null;
      if (!videoId || !title) continue;
      out.push({ videoId, title, publishedAt });
    }

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return { channelId, videos: out };
}

function defaultDateString() {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}

async function main() {
  const args = parseArgs(process.argv);

  const jsonPathArg = args.json || args.file;
  const apiKey = args.apiKey || process.env.YOUTUBE_API_KEY;
  const dateInput = args.date || defaultDateString();
  const titleMustIncludeNorm = normalizeText(args.titleMustInclude || '');
  const channelInput = args.channel || args.channelUrl || '';

  if (!jsonPathArg) {
    throw new Error('Missing --json path, e.g. --json recaps-manual/daily/nba.json');
  }
  if (!apiKey) {
    throw new Error('Missing YouTube API key. Pass --apiKey or set YOUTUBE_API_KEY.');
  }

  const jsonPath = path.resolve(process.cwd(), jsonPathArg);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);

  let leagueEntry = null;
  let games = null;
  let leagueKeyForDefaults = '';

  if (Array.isArray(data)) {
    const requestedLeagueKey = String(args.leagueKey || '').trim().toUpperCase();
    if (!requestedLeagueKey) {
      throw new Error('For array JSON files, pass --leagueKey (e.g. --leagueKey LIV).');
    }

    leagueEntry = data.find(
      (entry) => String(entry?.leagueKey || '').trim().toUpperCase() === requestedLeagueKey
    );
    if (!leagueEntry) {
      throw new Error(`Could not find league entry for --leagueKey ${requestedLeagueKey}.`);
    }
    games = leagueEntry.games;
    leagueKeyForDefaults = String(leagueEntry.leagueKey || '');
  } else {
    leagueEntry = data;
    games = data.games;
    leagueKeyForDefaults = String(data.leagueKey || '');
  }

  if (!Array.isArray(games)) {
    throw new Error('Expected games[] array for the selected league JSON entry.');
  }

  const playlistIds = resolvePlaylistIds(args.playlist, leagueKeyForDefaults);
  const usePerGameDateArg = String(args.usePerGameDate || '').toLowerCase();
  const usePerGameDate = usePerGameDateArg
    ? usePerGameDateArg === 'true'
    : String(leagueKeyForDefaults || '').toUpperCase() === 'WBC';

  const globalTargetDateIso = parseDateToIso(dateInput);
  const leagueKeyNorm = String(leagueKeyForDefaults || '').toUpperCase();
  const leagueNameNorm = normalizeText(leagueEntry?.leagueName || '');
  let videos = [];
  let sourceLabel = '';
  if (channelInput) {
    const channelResult = await fetchChannelVideos(apiKey, channelInput);
    videos = channelResult.videos;
    sourceLabel = `channel:${channelResult.channelId}`;
  } else {
    videos = await fetchVideosFromPlaylists(apiKey, playlistIds);
    sourceLabel = `playlists:${playlistIds.join(',')}`;
  }

  let matched = 0;
  for (const game of games) {
    const perGameDateIso = parseGameDateIso(game);
    const targetDateIso = usePerGameDate ? perGameDateIso : globalTargetDateIso;
    const roundHint = parseGameRoundNumber(game, leagueEntry);
    const best = pickBestVideo(
      game,
      videos,
      targetDateIso,
      titleMustIncludeNorm,
      roundHint,
      leagueKeyNorm,
      leagueNameNorm
    );
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
  console.log(`Video source: ${sourceLabel}`);
  console.log(`Date filter: ${dateInput}`);
  console.log(`Date mode: ${usePerGameDate ? 'per-game' : 'global'}`);
  if (titleMustIncludeNorm) {
    console.log(`Title include filter: ${titleMustIncludeNorm}`);
  }
}

main().catch((err) => {
  console.error('[match-youtube-highlights] Error:', err.message);
  process.exit(1);
});
