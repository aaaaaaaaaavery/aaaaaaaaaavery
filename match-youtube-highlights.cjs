#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

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
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function teamNameKeys(teamName) {
  const normalized = normalizeText(teamName);
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const keys = new Set();

  keys.add(normalized);
  keys.add(tokens[tokens.length - 1]);

  if (tokens.length >= 2) keys.add(tokens.slice(-2).join(' '));
  if (tokens.length >= 3) keys.add(tokens.slice(-3).join(' '));

  return [...keys].filter(Boolean);
}

function parseTitleDate(title) {
  return parseDateToIso(title);
}

function scoreMatch(game, video, targetDateIso, titleMustIncludeNorm) {
  const titleNorm = normalizeText(video.title);

  if (titleMustIncludeNorm && !includesPhrase(titleNorm, titleMustIncludeNorm)) {
    return -1;
  }

  const awayKeys = teamNameKeys(game.teams?.away);
  const homeKeys = teamNameKeys(game.teams?.home);

  const awayHit = awayKeys.some((k) => includesPhrase(titleNorm, k));
  const homeHit = homeKeys.some((k) => includesPhrase(titleNorm, k));
  if (!awayHit || !homeHit) return -1;

  let score = 100;

  if (includesPhrase(titleNorm, 'full game highlights')) score += 15;
  if (includesPhrase(titleNorm, 'highlights')) score += 5;

  const dateInTitleIso = parseTitleDate(video.title);
  if (targetDateIso && dateInTitleIso) {
    if (dateInTitleIso === targetDateIso) score += 20;
    else score -= 8;
  }

  return score;
}

function pickBestVideo(game, videos, targetDateIso, titleMustIncludeNorm) {
  let best = null;
  let bestScore = -1;

  for (const video of videos) {
    const s = scoreMatch(game, video, targetDateIso, titleMustIncludeNorm);
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
  const playlist = args.playlist || 'PLlVlyGVtvuVlek5UOvwJaRDtuAI1FgGZf';
  const apiKey = args.apiKey || process.env.YOUTUBE_API_KEY;
  const dateInput = args.date || defaultDateString();
  const usePerGameDate = String(args.usePerGameDate || 'false').toLowerCase() === 'true';
  const titleMustIncludeNorm = normalizeText(args.titleMustInclude || '');

  if (!jsonPathArg) {
    throw new Error('Missing --json path, e.g. --json recaps-manual/daily/nba.json');
  }
  if (!apiKey) {
    throw new Error('Missing YouTube API key. Pass --apiKey or set YOUTUBE_API_KEY.');
  }

  const jsonPath = path.resolve(process.cwd(), jsonPathArg);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.games)) {
    throw new Error('Expected top-level games[] array in JSON file.');
  }

  const globalTargetDateIso = parseDateToIso(dateInput);
  const videos = await fetchPlaylistVideos(apiKey, playlist);

  let matched = 0;
  for (const game of data.games) {
    const perGameDateIso = parseDateToIso(game.date || game.gameDate || game.matchDate || '');
    const targetDateIso = usePerGameDate ? perGameDateIso : globalTargetDateIso;
    const best = pickBestVideo(game, videos, targetDateIso, titleMustIncludeNorm);
    if (best) {
      game.highlights = [best];
      matched += 1;
    } else if (!Array.isArray(game.highlights)) {
      game.highlights = [];
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Processed ${data.games.length} games in ${jsonPathArg}`);
  console.log(`Matched highlights: ${matched}`);
  console.log(`Unmatched: ${data.games.length - matched}`);
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
