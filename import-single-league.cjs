const { google } = require('googleapis');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

// Check if Firebase is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Google Sheets configuration (same as in index.js)
const SHEET_ID = '1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4';
const SHEET_ID_2 = '1qpr6PShU_wGH0JzBQGqklYEqwV1c0Ho8KhSjgBxhtN8';
const SHEET_ID_3 = '1Kbkg7jZOoiynLX5QPnM-T6M3gSYRZxMgOyJ5xxfHN4Q';
const SHEET_ID_4 = '1Yw2A9-7hgGaZEOftq9REuRPp9SCF6hTBmtx79MN790s';

// League configurations (subset from index.js - add more as needed)
const LEAGUE_CONFIGS = {
  // From SHEET_ID
  'NFL': { sheetName: 'NFL', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'NBA': { sheetName: 'NBA', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'MLB': { sheetName: 'MLB', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'PremierLeague': { sheetName: 'PremierLeague', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'MLS': { sheetName: 'MLS', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'LaLiga': { sheetName: 'LaLiga', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'Bundesliga': { sheetName: 'Bundesliga', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'SerieA': { sheetName: 'SerieA', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'Ligue1': { sheetName: 'Ligue1', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'UEFAChampionsLeague': { sheetName: 'UEFAChampionsLeague', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'UEFAEuropaLeague': { sheetName: 'UEFAEuropaLeague', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'UEFAConferenceLeague': { sheetName: 'UEFAConferenceLeague', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'NCAAF': { sheetName: 'NCAAF', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'NHL': { sheetName: 'NHL', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'WNBA': { sheetName: 'WNBA', sheetId: SHEET_ID, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  // From SHEET_ID_2
  'BelgianProLeague': { sheetName: 'BelgianProLeague', sheetId: SHEET_ID_2, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'FACup': { sheetName: 'FACup', sheetId: SHEET_ID_2, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: true },
  'CopaDelRey': { sheetName: 'CopaDelRey', sheetId: SHEET_ID_2, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: true },
  // From SHEET_ID_3
  'NCAAM': { sheetName: 'NCAAM', sheetId: SHEET_ID_3, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'NCAAW': { sheetName: 'NCAAW', sheetId: SHEET_ID_3, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'ATP': { sheetName: 'ATP', sheetId: SHEET_ID_3, fields: { date: 'Date', time: 'Time', tournament: 'Tournament', channel: 'Channel' }, isSoccer: false },
  'WTA': { sheetName: 'WTA', sheetId: SHEET_ID_3, fields: { date: 'Date', time: 'Time', tournament: 'Tournament', channel: 'Channel' }, isSoccer: false },
  'DPWorldTour': { sheetName: 'DPWorldTour', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', away: 'Away Team', home: 'Home Team', channel: 'Channel' }, isSoccer: false },
  'PGATourChampions': { sheetName: 'PGATourChampions', sheetId: SHEET_ID_3, fields: { date: 'Date', time: 'Time', tournament: 'Tournament', channel: 'Channel' }, isSoccer: false },
  // From SHEET_ID_4
  'MotoGP': { sheetName: 'MotoGP', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false },
  'Boxing': { sheetName: 'Boxing', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false },
  'UFC': { sheetName: 'UFC', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false },
  'PGATour': { sheetName: 'PGATour', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false },
  'LPGATour': { sheetName: 'LPGATour', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false },
  'LIVGolf': { sheetName: 'LIVGolf', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false },
  'USMNT': { sheetName: 'USMNT', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: true },
  'FormulaOne': { sheetName: 'FormulaOne', sheetId: SHEET_ID_4, fields: { date: 'Date', time: 'Time', home: 'Home Team', away: 'Away Team', channel: 'Channel' }, isSoccer: false }
};

const LEAGUE_TO_SPORT_MAP = {
  'NFL': 'American Football', 'NCAAF': 'American Football',
  'NBA': 'Basketball', 'NCAAM': 'Basketball', 'NCAAW': 'Basketball', 'WNBA': 'Basketball',
  'MLB': 'Baseball',
  'NHL': 'Hockey',
  'PremierLeague': 'Soccer', 'LaLiga': 'Soccer', 'Bundesliga': 'Soccer', 'SerieA': 'Soccer', 'Ligue1': 'Soccer',
  'MLS': 'Soccer', 'UEFAChampionsLeague': 'Soccer', 'UEFAEuropaLeague': 'Soccer', 'UEFAConferenceLeague': 'Soccer',
  'BelgianProLeague': 'Soccer', 'FACup': 'Soccer', 'CopaDelRey': 'Soccer', 'USMNT': 'Soccer',
  'MotoGP': 'Motorsport', 'PGATour': 'Golf', 'LPGATour': 'Golf', 'LIVGolf': 'Golf', 'FormulaOne': 'Motorsport',
  'DPWorldTour': 'Golf', 'PGATourChampions': 'Golf',
  'Boxing': 'Boxing', 'UFC': 'Boxing',
  'ATP': 'Tennis', 'WTA': 'Tennis'
};

const LEAGUE_DISPLAY_NAME_MAP = {
  'PremierLeague': 'England: Premier League', 'LaLiga': 'Spain: LaLiga', 'Bundesliga': 'Germany: Bundesliga',
  'SerieA': 'Italy: Serie A', 'Ligue1': 'France: Ligue 1', 'MLS': 'USA: MLS',
  'UEFAChampionsLeague': 'UEFA Champions League', 'UEFAEuropaLeague': 'Europa League',
  'UEFAConferenceLeague': 'Conference League',
  'DPWorldTour': 'DP World Tour', 'PGATourChampions': 'PGA Champions',
  'MotoGP': 'MotoGP', 'PGATour': 'PGA Tour', 'LPGATour': 'LPGA Tour', 'LIVGolf': 'LIV Golf', 'FormulaOne': 'Formula 1',
  'Boxing': 'Boxing', 'UFC': 'UFC',
  'ATP': 'ATP', 'WTA': 'WTA'
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: SCOPES
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

function parseDateForImport(dateStr) {
  if (!dateStr) return null;
  let date;
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date('1899-12-30T00:00:00Z');
    const daysSinceEpoch = Math.floor(dateStr);
    date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTimeForImport(timeStr) {
  if (!timeStr) return '';
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    return timeStr.trim();
  }
  let hours = 0, minutes = 0;
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.floor(timeStr * 86400);
    hours = Math.floor(totalSeconds / 3600);
    minutes = Math.floor((totalSeconds % 3600) / 60);
  } else if (timeStr instanceof Date) {
    hours = timeStr.getUTCHours();
    minutes = timeStr.getUTCMinutes();
  } else {
    return String(timeStr).trim();
  }
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function createFirestoreTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!timeStr) {
    return admin.firestore.Timestamp.fromDate(new Date(year, month - 1, day, 23, 59, 0));
  }
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return null;
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const date = new Date(year, month - 1, day, hours, minutes, 0);
  return admin.firestore.Timestamp.fromDate(date);
}

// Helper: create canonical key for matching (league|home|away|date)
function getGameKey(league, homeTeam, awayTeam, date) {
  return `${league}|${(homeTeam || '').toLowerCase().trim()}|${(awayTeam || '').toLowerCase().trim()}|${date}`;
}

async function importSingleLeague(leagueName) {
  const config = LEAGUE_CONFIGS[leagueName];
  if (!config) {
    console.error(`League "${leagueName}" not found in configuration.`);
    console.log('Available leagues:', Object.keys(LEAGUE_CONFIGS).join(', '));
    process.exit(1);
  }

  const db = admin.firestore();
  const gamesRef = db.collection(`artifacts/${process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'}/public/data/sportsGames`);
  const allGames = [];

  console.log(`Importing ${leagueName} from sheet "${config.sheetName}" (Sheet ID: ${config.sheetId})...`);

  const sheets = await authenticateGoogleSheets();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: `${config.sheetName}!A:Z`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const data = response.data.values || [];
    if (data.length === 0) {
      console.log(`  No data found for ${leagueName}`);
      return;
    }

    const headers = data[0];
    const dataRows = data.slice(1);

    // Find column indices for each field
    const fieldIndices = {};
    Object.entries(config.fields).forEach(([key, fieldName]) => {
      const index = headers.findIndex(header => 
        header && header.toString().toLowerCase().includes(fieldName.toLowerCase())
      );
      if (index !== -1) {
        fieldIndices[key] = index;
      }
    });
    
    // Validate required fields
    if (fieldIndices.date === undefined) {
      console.error(`  ✗ CRITICAL: Date field not found. Cannot import games.`);
      return;
    }

    const nowInMountain = DateTime.now().setZone('America/Denver');
    const todayStr = nowInMountain.toISODate();
    const tomorrowStr = nowInMountain.plus({ days: 1 }).toISODate();

    let gameIdCounter = 0;
    let displayOrder = 0;

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      const dateStr = parseDateForImport(row[fieldIndices.date]);
      if (!dateStr || (dateStr !== todayStr && dateStr !== tomorrowStr)) continue;

      const rawTime = row[fieldIndices.time];
      const timeStr = rawTime ? parseTimeForImport(rawTime) : '';
      const channel = row[fieldIndices.channel] ? String(row[fieldIndices.channel]).trim() : '';
      
      const startTime = timeStr ? createFirestoreTimestamp(dateStr, timeStr) : createFirestoreTimestamp(dateStr, '11:59 PM');
      if (!startTime) continue;

      let awayTeam = fieldIndices.away && row[fieldIndices.away] ? String(row[fieldIndices.away]).trim() : '';
      let homeTeam = fieldIndices.home && row[fieldIndices.home] ? String(row[fieldIndices.home]).trim() : '';

      const leagueDisplayName = LEAGUE_DISPLAY_NAME_MAP[leagueName] || leagueName;
      const sport = LEAGUE_TO_SPORT_MAP[leagueName] || 'Other';

      const gameData = {
        'League': leagueDisplayName,
        'Sport': sport,
        'Start Time': startTime,
        'gameDate': dateStr,
        'Match Status': 'SCHEDULED',
        'Channel': channel,
        'channel': channel,
        'Last Updated': admin.firestore.FieldValue.serverTimestamp(),
        'Game ID': `imported-${leagueName.toLowerCase()}-${dateStr.replace(/-/g, '')}-${gameIdCounter++}`,
        'canonicalGameKey': getGameKey(leagueDisplayName, homeTeam, awayTeam, dateStr),
        'displayOrder': displayOrder++
      };

      // Add team fields if they exist
      if (homeTeam) gameData['Home Team'] = homeTeam;
      if (awayTeam) gameData['Away Team'] = awayTeam;
      if (awayTeam && homeTeam) {
        gameData['Matchup'] = `${awayTeam} vs ${homeTeam}`;
      } else if (homeTeam) {
        gameData['Matchup'] = homeTeam;
      } else if (awayTeam) {
        gameData['Matchup'] = awayTeam;
      }

      if (!timeStr) {
        gameData['timeString'] = '';
      }

      allGames.push(gameData);
    }

    console.log(`Found ${allGames.length} games for ${leagueName}`);

    // Write to Firestore
    const batch = db.batch();
    for (const game of allGames) {
      const docRef = gamesRef.doc(game['Game ID']);
      batch.set(docRef, game, { merge: true });
    }
    await batch.commit();

    console.log(`✅ Successfully imported ${allGames.length} games for ${leagueName}`);

  } catch (error) {
    console.error(`Error importing ${leagueName}:`, error.message);
    process.exit(1);
  }
}

// Get league name from command line argument
const leagueName = process.argv[2];

if (!leagueName) {
  console.error('Usage: node import-single-league.cjs <LEAGUE_NAME>');
  console.log('\nAvailable leagues:');
  console.log(Object.keys(LEAGUE_CONFIGS).join(', '));
  console.log('\nExample: node import-single-league.cjs DPWorldTour');
  process.exit(1);
}

importSingleLeague(leagueName).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

