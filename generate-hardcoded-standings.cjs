const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const STANDINGS_SOURCES = {
  NFL: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings' },
  NBA: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings' },
  MLB: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings' },
  NHL: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings' },
  NCAAF: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings' },
  NCAAM: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings' },
  NCAAW: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/basketball/womens-college-basketball/standings' },
  PremierLeague: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings' },
  LaLiga: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings' },
  SerieA: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/ita.1/standings' },
  Bundesliga: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings' },
  Ligue1: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/fra.1/standings' },
  MLS: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings' },
  LigaMX: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/mex.1/standings' },
  NWSL: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/usa.nwsl/standings' },
  UEFAChampionsLeague: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings' },
  UEFAEuropaLeague: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.europa/standings' },
  UEFAConferenceLeague: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.europa.conf/standings' },
  FACup: { type: 'espn', url: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.fa/standings' },
  FormulaOne: { type: 'f1-drivers', url: 'https://f1api.dev/api/current/drivers-championship' },
  F1ConstructorStandings: { type: 'f1-constructors', url: 'https://f1api.dev/api/current/constructors-championship' },
  PGATour: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRh72gyQFguMGj0RkHvy-WrAH3EBpOMdikyKIjrOfSs5aAYYlE7NjbRJsBa7gkkJ4gV_nUUYSbCje2L/pub?gid=786471151&single=true&output=csv' },
  LPGATour: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgv4aRqL4dKgbADnZNH1e_oR8rgnbGOY9roEzXNVas0C6nlkx3RggqK7RCq0Cl148yFD0DfxAxtK4q/pub?gid=0&single=true&output=csv' },
  LIVGolf: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ7zf4PAme33oOeQ5NFNVE3W1OXJDJ2-qN0_TKLYaditRtpsa7yfxGY3lsGJQxZLQxhIKGzAH7NgBo/pub?gid=0&single=true&output=csv' },
  IndyCar: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWqPs7Krfm7U1_bU2MShMSgAGF5RIXqIVUZ6vQO2XWz0waDHd48eiawVeOwXwAkeZBdoNA1X4Mkzs3/pub?gid=0&single=true&output=csv' },
  NASCARCupSeries: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzMLdfLfGydr1dpjhS8hr1PLCBod_Jm-J9ABvGaeyhttkAep5HAtWfB5hGeCaLHteZBapJMhNExe0l/pub?gid=0&single=true&output=csv' },
  MotoGP: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqOmundPRaLEu2Jcgt3KBdTRX6jy-Nmkb89fuJC_SfntbZVF_Y-tNehFSnZwqdmK2O3GJR3UlHFXms/pub?gid=0&single=true&output=csv' },
  Tennis: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ74Qw3ZgBqRAKd_HVAnGLI9zDqk_JILTBTtlrFKI8oCosRHnLQZ9Nu8BIAVYdLq932wzE8oz3UNCIP/pub?gid=0&single=true&output=csv' },
  UFC: {
    type: 'csv-multi',
    sources: [
      { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2Z0QfXw34ib6V0gmcdqVvu6gwy8vHnD6cF3xMhJGZJHpU_s0vwC0h7phvbV0joe4tdVDGHiJ1kBfX/pub?gid=0&single=true&output=csv', Gender: 'M' }
    ]
  },
  Boxing: {
    type: 'csv-multi',
    sources: [
      { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRthmvN_N-bKFQdsc5V_Otx92FF5qwjYkI9YXHoKgKyV5jvfmb6skABo0Ncbh1x0ehEU-4Je3w_KPmb/pub?gid=1100984840&single=true&output=csv', Gender: 'M' },
      { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRthmvN_N-bKFQdsc5V_Otx92FF5qwjYkI9YXHoKgKyV5jvfmb6skABo0Ncbh1x0ehEU-4Je3w_KPmb/pub?gid=0&single=true&output=csv', Gender: 'F' }
    ]
  },
  CFP: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYKo1O2-4yDvnW6ZyX11vCDhvQE3fqx4bGGWkTgLthGXD4OOYJ_4BwxJ2YUQnP1M_vui8rAg2YrbCG/pub?gid=1770666144&single=true&output=csv' },
  TrackAndField: { type: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbnsEETRJkJlYNokKws_nlk6-OfyJKg8aoq8AldZZgRcdV5YtuQ1kdINCKvR2H-XQZJVxRxcZaKOq2/pub?gid=2060167316&single=true&output=csv' }
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      cell = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some((v) => v !== '')) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.replace(/^"|"$/g, '').trim());
  return rows.slice(1).map((vals) => {
    const out = {};
    headers.forEach((h, idx) => {
      out[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim();
    });
    return out;
  }).filter((r) => Object.values(r).some(Boolean));
}

function statMapFromEntry(entry) {
  const stats = Array.isArray(entry?.stats) ? entry.stats : [];
  const map = {};
  stats.forEach((s) => {
    if (!s?.name) return;
    map[String(s.name).toLowerCase()] = s.displayValue ?? s.value ?? '';
  });
  return map;
}

function pick(map, keys) {
  for (const key of keys) {
    const v = map[String(key).toLowerCase()];
    if (v !== undefined && v !== null && String(v) !== '') return String(v);
  }
  return '';
}

function normalizeEspnEntries(data) {
  const groups = Array.isArray(data?.children) ? data.children : [];
  const entries = [];

  if (groups.length) {
    groups.forEach((group) => {
      const standingsEntries = Array.isArray(group?.standings?.entries) ? group.standings.entries : [];
      standingsEntries.forEach((entry) => entries.push({ ...entry, _group: group?.name || '' }));
    });
  } else if (Array.isArray(data?.standings?.entries)) {
    data.standings.entries.forEach((entry) => entries.push({ ...entry, _group: '' }));
  }

  return entries.map((entry, idx) => {
    const team = entry?.team || {};
    const stats = statMapFromEntry(entry);
    const wins = pick(stats, ['wins', 'win']);
    const losses = pick(stats, ['losses', 'loss']);
    const draws = pick(stats, ['ties', 'draws', 'draw']);
    return {
      Rank: pick(stats, ['rank', 'playoffseed']) || String(idx + 1),
      Team: team.shortDisplayName || team.displayName || team.name || '',
      FullName: team.displayName || team.name || '',
      Points: pick(stats, ['points', 'pts']),
      MP: pick(stats, ['gamesplayed', 'games', 'matchesplayed']),
      Wins: wins,
      Draws: draws,
      Losses: losses,
      PCT: pick(stats, ['winpercent', 'pct']),
      GF: pick(stats, ['pointsfor', 'goalsfor', 'for']),
      GA: pick(stats, ['pointsagainst', 'goalsagainst', 'against']),
      GD: pick(stats, ['pointdifferential', 'goaldifferential', 'differential']),
      Record: [wins, draws, losses].filter(Boolean).join('-') || [wins, losses].filter(Boolean).join('-'),
      Group: entry?._group || '',
      lastUpdated: new Date().toISOString()
    };
  });
}

function normalizeF1Rows(data, type) {
  const rows = Array.isArray(data?.drivers_championship)
    ? data.drivers_championship
    : Array.isArray(data?.constructors_championship)
      ? data.constructors_championship
      : [];

  return rows.map((row, idx) => ({
    Rank: String(row?.position ?? idx + 1),
    Team: type === 'drivers' ? String(row?.driver_name || '') : String(row?.team_name || ''),
    Points: String(row?.points ?? ''),
    Wins: String(row?.wins ?? ''),
    lastUpdated: new Date().toISOString()
  }));
}

async function fetchLeagueStandings(source) {
  if (source.type === 'espn') {
    const data = await fetchJson(source.url);
    return normalizeEspnEntries(data);
  }

  if (source.type === 'csv') {
    const text = await fetchText(source.url);
    return parseCsv(text).map((r) => ({ ...r, lastUpdated: new Date().toISOString() }));
  }

  if (source.type === 'csv-multi') {
    const out = [];
    for (const part of source.sources || []) {
      const text = await fetchText(part.url);
      const rows = parseCsv(text).map((r) => ({
        ...r,
        ...(part.Gender ? { Gender: part.Gender } : {}),
        lastUpdated: new Date().toISOString()
      }));
      out.push(...rows);
    }
    return out;
  }

  if (source.type === 'f1-drivers') {
    const data = await fetchJson(source.url);
    return normalizeF1Rows(data, 'drivers');
  }

  if (source.type === 'f1-constructors') {
    const data = await fetchJson(source.url);
    return normalizeF1Rows(data, 'constructors');
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

async function generateHardcodedStandings() {
  console.log('Building standings directly from league sources (no Firebase)...\n');
  const standings = {};

  for (const [leagueKey, source] of Object.entries(STANDINGS_SOURCES)) {
    try {
      const rows = await fetchLeagueStandings(source);
      standings[leagueKey] = rows;
      console.log(`OK ${leagueKey}: ${rows.length} rows`);
    } catch (error) {
      standings[leagueKey] = [];
      console.warn(`WARN ${leagueKey}: ${error.message}`);
    }
  }

  let code = '    // HARDCODED_STANDINGS_START\n';
  code += '    // Auto-generated by scrape-all-standings.cjs (no Firebase).\n';
  code += '    const HARDCODED_STANDINGS = ' + JSON.stringify(standings, null, 4) + ';\n';
  code += '    window.HARDCODED_STANDINGS = HARDCODED_STANDINGS;\n';
  code += '    // HARDCODED_STANDINGS_END\n';
  return code;
}

async function updateHTMLWithStandings() {
  const htmlPath = path.join(__dirname, 'index-test.html');
  if (!fs.existsSync(htmlPath)) throw new Error(`HTML file not found: ${htmlPath}`);

  let html = fs.readFileSync(htmlPath, 'utf8');
  const generatedBlock = await generateHardcodedStandings();

  const startMarker = '// HARDCODED_STANDINGS_START';
  const endMarker = '// HARDCODED_STANDINGS_END';

  if (html.includes(startMarker) && html.includes(endMarker)) {
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker, start);
    const afterEndLine = html.indexOf('\n', end);
    const tailStart = afterEndLine === -1 ? html.length : afterEndLine + 1;
    html = html.slice(0, start) + generatedBlock + html.slice(tailStart);
  } else {
    const anchor = 'const TOP10_HEADLINE_PILL_CLASS =';
    const idx = html.indexOf(anchor);
    if (idx === -1) throw new Error('Could not find insertion anchor in index-test.html');
    const lineEnd = html.indexOf('\n', idx);
    const insertAt = lineEnd === -1 ? html.length : lineEnd + 1;
    html = html.slice(0, insertAt) + '\n' + generatedBlock + html.slice(insertAt);
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('\nWrote standings directly into index-test.html');
}

if (require.main === module) {
  updateHTMLWithStandings().catch((error) => {
    console.error('Failed to write standings into index-test.html:', error.message);
    process.exit(1);
  });
}

module.exports = { updateHTMLWithStandings, generateHardcodedStandings };
