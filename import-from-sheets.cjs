const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Google Sheets configuration
const SHEET_ID = '1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4';
const SHEET_ID_2 = '1qpr6PShU_wGH0JzBQGqklYEqwV1c0Ho8KhSjgBxhtN8';
const SHEET_ID_3 = '1Kbkg7jZOoiynLX5QPnM-T6M3gSYRZxMgOyJ5xxfHN4Q';
const SHEET_ID_GOLF = '1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4'; // Sheet with gid=675420773 for PGATour/LPGATour
const SHEET_ID_4 = '1Yw2A9-7hgGaZEOftq9REuRPp9SCF6hTBmtx79MN790s'; // Sheet ID 4 - MotoGP, Boxing, UFC, Golf, etc.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Leagues that should be written to sportsGames collection instead of separate collections
const MANUAL_LEAGUES_TO_SPORTSGAMES = []; // All leagues now go to their own collections (AFCElite moved to index.js)

// Mapping from league config name to frontend display name
const LEAGUE_DISPLAY_NAME_MAP = {
  'DPWorldTour': 'DP World Tour',
  'PGATourChampions': 'PGA Champions'
};

// League configurations with their field mappings
// sheetId: specify which spreadsheet (defaults to SHEET_ID if not specified)
const LEAGUE_CONFIGS = {
  'NFL': {
    sheetName: 'NFL',
    fields: {
      date: 'Date',
      time: 'Time', 
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NBA': {
    sheetName: 'NBA',
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team', 
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'MLB': {
    sheetName: 'MLB',
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'PremierLeague': {
    sheetName: 'PremierLeague',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'MLS': {
    sheetName: 'MLS',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'TrackAndField': {
    sheetName: 'TrackAndField',
    fields: {
      date: 'Date',
      meet: 'Meet',
      channel: 'Channel'
    }
  },
  'LaLiga': {
    sheetName: 'LaLiga',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'CopaSudamericana': {
    sheetName: 'CopaSudamericana',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'CopaLibertadores': {
    sheetName: 'CopaLibertadores',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'Bundesliga': {
    sheetName: 'Bundesliga',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'BelgianProLeague': {
    sheetName: 'BelgianProLeague',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'EFLChampionship': {
    sheetName: 'EFLChampionship',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'LigaMX': {
    sheetName: 'LigaMX',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'WomensUCL': {
    sheetName: 'WomensUCL',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NASCARCupSeries': {
    sheetName: 'NASCARCupSeries',
    fields: {
      date: 'Date',
      time: 'Time',
      race: 'Race',
      location: 'Location',
      channel: 'Channel'
    }
  },
  'NCAAM': {
    sheetName: 'NCAAM',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NCAAW': {
    sheetName: 'NCAAW',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'CoppaItalia': {
    sheetName: 'CoppaItalia',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'CoupeDeFrance': {
    sheetName: 'CoupeDeFrance',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NCAAF': {
    sheetName: 'NCAAF',
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NHL': {
    sheetName: 'NHL',
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NWSL': {
    sheetName: 'NWSL',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'DPWorldTour': {
    sheetName: 'DPWorldTour',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      tournament: 'Tournament',
      channel: 'Channel'
    }
  },
  'PGATourChampions': {
    sheetName: 'PGATourChampions',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'SerieA': {
    sheetName: 'SerieA',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'Tennis': {
    sheetName: 'Tennis',
    fields: {
      date: 'Date',
      tour: 'Tour',
      tournament: 'Tournament',
      channel: 'Channel'
    }
  },
  'ATP': {
    sheetName: 'ATP',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      tournament: 'Tournament',
      channel: 'Channel'
    }
  },
  'WTA': {
    sheetName: 'WTA',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      tournament: 'Tournament',
      channel: 'Channel'
    }
  },
  'CAFQualifiers': {
    sheetName: 'CAFQualifiers',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'AFCQualifiers': {
    sheetName: 'AFCQualifiers',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'AFCAsianCupQualifiers': {
    sheetName: 'AFCAsianCupQualifiers',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'UEFAEuropeanQualifiers': {
    sheetName: 'UEFAEuropeanQualifiers',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'CONCACAFQualifiers': {
    sheetName: 'CONCACAFQualifiers',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'NCAAMensHockey': {
    sheetName: 'NCAAMensHockey',
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'UEFAEuropaLeague': {
    sheetName: 'UEFAEuropaLeague',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'UEFAChampionsLeague': {
    sheetName: 'UEFAChampionsLeague',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'UEFAConferenceLeague': {
    sheetName: 'UEFAConferenceLeague',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'WNBA': {
    sheetName: 'WNBA',
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'Ligue1': {
    sheetName: 'Ligue1',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'ArgentinePrimeraDivision': {
    sheetName: 'ArgentinePrimeraDivision',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'Brasileirao': {
    sheetName: 'Brasileirao',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'SuperLig': {
    sheetName: 'SuperLig',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'USLChampionship': {
    sheetName: 'USLChampionship',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'CFL': {
    sheetName: 'CFL',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'LigaPortugal': {
    sheetName: 'LigaPortugal',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'Eredivisie': {
    sheetName: 'Eredivisie',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'ScottishPremiership': {
    sheetName: 'ScottishPremiership',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'EFLCup': {
    sheetName: 'EFLCup',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'FACup': {
    sheetName: 'FACup',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'DFBPokal': {
    sheetName: 'DFBPokal',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'CopaDelRey': {
    sheetName: 'CopaDelRey',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'SaudiProLeague': {
    sheetName: 'SaudiProLeague',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'ScottishCup': {
    sheetName: 'ScottishCup',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'WomensSuperLeague': {
    sheetName: 'WomensSuperLeague',
    sheetId: SHEET_ID_2,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  'WorldCupU17': {
    sheetName: 'FIFAU17WorldCup',
    sheetId: SHEET_ID_3,
    fields: {
      date: 'Date',
      time: 'Time',
      away: 'Away Team',
      home: 'Home Team',
      channel: 'Channel'
    }
  },
  // From SHEET_ID_4 (treated same as other sheets)
  'MotoGP': {
    sheetName: 'MotoGP',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'Boxing': {
    sheetName: 'Boxing',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'UFC': {
    sheetName: 'UFC',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'PGATour': {
    sheetName: 'PGATour',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'LPGATour': {
    sheetName: 'LPGATour',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'LIVGolf': {
    sheetName: 'LIVGolf',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'USMNT': {
    sheetName: 'USMNT',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  },
  'FormulaOne': {
    sheetName: 'FormulaOne',
    sheetId: SHEET_ID_4,
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
      channel: 'Channel'
    }
  }
};

// Mapping of league/collection names to their sports
// This automatically assigns sport to each game during import
// If a sheet has a Sport column, that value will override this mapping
const LEAGUE_TO_SPORT_MAP = {
  // American Football
  'NFL': 'American Football',
  'NCAAF': 'American Football',
  // Basketball
  'NBA': 'Basketball',
  'NCAAM': 'Basketball',
  'NCAAW': 'Basketball',
  'WNBA': 'Basketball',
  // Baseball
  'MLB': 'Baseball',
  // Hockey
  'NHL': 'Hockey',
  'NCAAMensHockey': 'Hockey',
  // Soccer
  'PremierLeague': 'Soccer',
  'LaLiga': 'Soccer',
  'Bundesliga': 'Soccer',
  'SerieA': 'Soccer',
  'Ligue1': 'Soccer',
  'MLS': 'Soccer',
  'Eredivisie': 'Soccer',
  'PrimeiraLiga': 'Soccer',
  'CFL': 'American Football',
  'LigaMX': 'Soccer',
  'Brasileirao': 'Soccer',
  'EFLChampionship': 'Soccer',
  'EFLCup': 'Soccer',
  'FACup': 'Soccer',
  'ArgentinePrimeraDivision': 'Soccer',
  'UEFAChampionsLeague': 'Soccer',
  'CopaLibertadores': 'Soccer',
  'CopaSudamericana': 'Soccer',
  'LigaPortugal': 'Soccer',
  'DFBPokal': 'Soccer',
  'CopaDelRey': 'Soccer',
  'ScottishCup': 'Soccer',
  'ScottishPremiership': 'Soccer',
  'BelgianProLeague': 'Soccer',
  'UEFAEuropaLeague': 'Soccer',
  'UEFAConferenceLeague': 'Soccer',
  'NWSL': 'Soccer',
  'WomensSuperLeague': 'Soccer',
  'SuperLig': 'Soccer',
  'USLChampionship': 'Soccer',
  'WorldCupU17': 'Soccer',
  // Motorsport
  'NASCARCupSeries': 'Motorsport',
  'MotoGP': 'Motorsport',
  'FormulaOne': 'Motorsport',
  // Track and Field
  'TrackAndField': 'Track and Field',
  // Tennis
  'Tennis': 'Tennis',
  // Hockey (additional)
  'NCAAMensHockey': 'Hockey',
  'OHL': 'Hockey',
  // Basketball (additional)
  'AmeriCup': 'Basketball',
  // Cricket
  'ICCCricket': 'Cricket',
  'Twenty20International': 'Cricket',
  'TestSeries': 'Cricket',
  'OneDayInternational': 'Cricket',
  // Auto Racing
  'NASCAR': 'Auto Racing',
  // Golf
  'RyderCup': 'Golf',
  'DPWorldTour': 'Golf',
  'PGATourChampions': 'Golf',
  'PGATour': 'Golf',
  'LPGATour': 'Golf',
  'LIVGolf': 'Golf',
  // Boxing/MMA
  'Boxing': 'Boxing',
  'UFC': 'Boxing',
  // Soccer (additional)
  'USMNT': 'Soccer'
};

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    credentials: serviceAccount
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

async function getSheetData(sheets, sheetName, sheetId = SHEET_ID, retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
      valueRenderOption: 'UNFORMATTED_VALUE' // Get raw values (numbers, dates) instead of formatted strings
    });
    
    return response.data.values || [];
  } catch (error) {
    // Check if it's a quota error
    if (error.message && error.message.includes('Quota exceeded') && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
      console.warn(`Quota exceeded for ${sheetName}. Retrying in ${delay/1000}s... (attempt ${retryCount + 1}/${maxRetries})`);
      await delay(delay);
      return getSheetData(sheets, sheetName, sheetId, retryCount + 1);
    }
    console.error(`Error reading sheet ${sheetName}:`, error.message);
    return [];
  }
}

// Batch fetch multiple tabs from the same spreadsheet in one API call
async function batchGetSheetData(sheets, ranges, sheetId, retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay
  
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: ranges.map(range => `${range}!A:Z`),
      valueRenderOption: 'UNFORMATTED_VALUE' // Get raw values (numbers, dates) instead of formatted strings
    });
    
    // Return a map of sheetName -> data
    const result = {};
    if (response.data.valueRanges) {
      response.data.valueRanges.forEach((valueRange, index) => {
        result[ranges[index]] = valueRange.values || [];
      });
    }
    return result;
  } catch (error) {
    // Check if it's a quota error
    if (error.message && error.message.includes('Quota exceeded') && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
      console.warn(`Quota exceeded for batch get. Retrying in ${delay/1000}s... (attempt ${retryCount + 1}/${maxRetries})`);
      await delay(delay);
      return batchGetSheetData(sheets, ranges, sheetId, retryCount + 1);
    }
    console.error(`Error batch reading sheets:`, error.message);
    return {};
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  let date;
  
  // If it's a number (Excel serial date), convert it
  // Excel epoch is December 30, 1899
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date('1899-12-30T00:00:00Z');
    const daysSinceEpoch = Math.floor(dateStr);
    date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
  } else if (dateStr instanceof Date) {
    date = dateStr;
  } else {
    // Try to parse as a date string
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date: ${dateStr}`);
    return null;
  }
  
  // Use UTC methods to get the YYYY-MM-DD string (avoids timezone issues)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function parseTime(timeStr) {
  if (!timeStr) return '';
  
  // If it's a number (Excel serial time), convert it
  // Excel/Google Sheets time is a fraction of a day (0.0 = midnight, 0.5 = noon)
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.floor(timeStr * 86400); // 86400 seconds in a day
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
  
  // If it's a Date object, extract time
  if (timeStr instanceof Date) {
    return timeStr.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // If it's already a time string, return as is
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    return timeStr.trim();
  }
  
  return String(timeStr).trim();
}

// Convert date and time strings to Firestore Timestamp
function createFirestoreTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  
  // All times in sheets 1-4 are in Eastern U.S. time
  // Parse date and time as Eastern, then convert to UTC for Firestore
  
  let date;
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    let hours = 0;
    let minutes = 0;
    
    if (timeStr) {
      // Parse time in Eastern timezone
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3]?.toUpperCase();
        
        // Handle AM/PM conversion
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }
    
    // Create date string in Eastern timezone format (ISO 8601 with timezone offset)
    // EST is UTC-5, EDT is UTC-4
    // DST typically runs from second Sunday in March to first Sunday in November
    // Simple heuristic: months 4-10 (April-October) are DST, plus late March and early November
    const isDST = (month >= 4 && month <= 10) || (month === 3 && day >= 8) || (month === 11 && day <= 7);
    const easternOffset = isDST ? -4 : -5; // EDT is UTC-4, EST is UTC-5
    
    // Create date string with Eastern timezone offset
    const offsetStr = easternOffset >= 0 ? `+${String(easternOffset).padStart(2, '0')}:00` : `${String(easternOffset).padStart(3, '-0')}:00`;
    const dateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00${offsetStr}`;
    
    // Parse as Eastern time, which will be converted to UTC by Date
    date = new Date(dateTimeStr);
  } else {
    // Try standard Date parsing
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date for timestamp: ${dateStr}`);
    return null;
  }
  
  return admin.firestore.Timestamp.fromDate(date);
}

async function importLeagueData(leagueName, config, sheets, preloadedData = null) {
  console.log(`\nImporting ${leagueName}...`);
  
  const sheetId = config.sheetId || SHEET_ID;
  let data;
  
  // Use preloaded data if available (from batch fetch), otherwise fetch individually
  if (preloadedData && preloadedData[config.sheetName]) {
    data = preloadedData[config.sheetName];
  } else {
    data = await getSheetData(sheets, config.sheetName, sheetId);
  }
  
  if (data.length === 0) {
    console.log(`No data found for ${leagueName}`);
    return;
  }
  
  // Get headers from first row
  if (!data || data.length === 0) {
    console.log(`No data found for ${leagueName}`);
    return;
  }
  
  const headers = data[0];
  if (!headers || headers.length === 0) {
    console.log(`No headers found for ${leagueName}`);
    return;
  }
  
  const dataRows = data.slice(1);
  
  console.log(`Found ${dataRows.length} rows for ${leagueName} (headers: ${headers.slice(0, 5).join(', ')}...)`);
  
  // Find column indices for each field
  const fieldIndices = {};
  Object.entries(config.fields).forEach(([key, fieldName]) => {
    const index = headers.findIndex(header => 
      header && header.toLowerCase().includes(fieldName.toLowerCase())
    );
    if (index !== -1) {
      fieldIndices[key] = index;
    } else {
      console.warn(`Field "${fieldName}" not found in ${leagueName} headers`);
    }
  });
  
  // Validate that we found at least the date field
  if (fieldIndices.date === undefined) {
    console.error(`CRITICAL: Date field not found for ${leagueName}. Headers: ${headers.join(', ')}`);
    return;
  }
  
  // Check if this league should be written to sportsGames collection
  const isManualLeague = MANUAL_LEAGUES_TO_SPORTSGAMES.includes(leagueName);
  
  if (isManualLeague) {
    // Write to sportsGames collection
    const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    
    // Delete existing games for this league
    const existingSnapshot = await sportsGamesRef
      .where('League', '==', LEAGUE_DISPLAY_NAME_MAP[leagueName] || leagueName)
      .get();
    
    const deleteBatch = db.batch();
    existingSnapshot.docs.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log(`Cleared existing ${leagueName} games from sportsGames collection`);
    
    // Import new games
    let importBatch = db.batch();
    let docCount = 0;
    let gameIdCounter = 1;
    
    for (const row of dataRows) {
      // Skip empty rows - check if all cells are empty or just whitespace
      if (!row || row.length === 0 || row.every(cell => !cell || (typeof cell === 'string' && cell.trim() === ''))) {
        continue;
      }
      
      // Skip if date field is missing or empty
      const dateValue = row[fieldIndices.date];
      if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === '')) {
        continue;
      }
      
      const dateStr = parseDate(dateValue);
      if (!dateStr) continue; // Skip rows without valid date
      
      const timeValue = row[fieldIndices.time];
      const timeStr = timeValue ? parseTime(timeValue) : '';
      const channel = row[fieldIndices.channel] ? String(row[fieldIndices.channel]).trim() : '';
      
      // Create Firestore Timestamp for Start Time
      const startTime = createFirestoreTimestamp(dateStr, timeStr);
      if (!startTime) continue;
      
      // Build game data object
      const gameData = {
        'League': LEAGUE_DISPLAY_NAME_MAP[leagueName] || leagueName,
        'Sport': LEAGUE_TO_SPORT_MAP[leagueName] || 'Other',
        'Start Time': startTime,
        'gameDate': dateStr,
        'Match Status': 'SCHEDULED',
        'Channel': channel,
        'channel': channel,
        'Last Updated': admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Add league-specific fields - all leagues from sheet ID 4 now use standard home/away structure
      if (fieldIndices.home !== undefined && fieldIndices.away !== undefined) {
        const homeTeam = row[fieldIndices.home] ? String(row[fieldIndices.home]).trim() : '';
        const awayTeam = row[fieldIndices.away] ? String(row[fieldIndices.away]).trim() : '';
        gameData['Home Team'] = homeTeam;
        gameData['Away Team'] = awayTeam;
        gameData['Matchup'] = awayTeam && homeTeam ? `${awayTeam} vs ${homeTeam}` : (homeTeam || awayTeam);
      }
      
      // Generate unique Game ID
      const gameId = `manual-${leagueName.toLowerCase()}-${dateStr.replace(/-/g, '')}-${gameIdCounter++}`;
      gameData['Game ID'] = gameId;
      
      const docRef = sportsGamesRef.doc(gameId);
      importBatch.set(docRef, gameData);
      docCount++;
      
      // Firestore batch limit is 500
      if (docCount % 500 === 0) {
        await importBatch.commit();
        console.log(`Imported ${docCount} games for ${leagueName} to sportsGames`);
        importBatch = db.batch();
      }
    }
    
    // Commit remaining documents
    if (docCount % 500 !== 0) {
      await importBatch.commit();
    }
    
    console.log(`Successfully imported ${docCount} games for ${leagueName} to sportsGames collection`);
    return;
  }
  
  // Original logic for non-manual leagues
  // Clear existing collection
  const collectionRef = db.collection(leagueName);
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleared existing ${leagueName} collection`);
  
  // Standard import for all leagues (all use same field structure now)
  {
    // Standard import for other leagues
    let importBatch = db.batch();
    let docCount = 0;
    
    for (const row of dataRows) {
      if (row.every(cell => !cell || cell.trim() === '')) continue; // Skip empty rows
      
      const docData = {};
      
      // Map fields based on configuration
      Object.entries(fieldIndices).forEach(([key, index]) => {
        const value = row[index];
        if (value !== undefined && value !== '') {
          if (key === 'date') {
            docData[key] = parseDate(value);
          } else if (key === 'time') {
            docData[key] = parseTime(value);
          } else if (key === 'channel') {
            const channelValue = String(value).trim();
            docData.channel = channelValue;
            docData.Channel = channelValue;
          } else {
            docData[key] = String(value).trim();
          }
        }
      });
      
      // Automatically add sport field based on league name (if not already set from sheet)
      // This allows sheets to override, but defaults to the league mapping
      if (!docData.sport && LEAGUE_TO_SPORT_MAP[leagueName]) {
        docData.sport = LEAGUE_TO_SPORT_MAP[leagueName];
      }
      
      if (Object.keys(docData).length > 0) {
        const docRef = collectionRef.doc();
        importBatch.set(docRef, docData);
        docCount++;
        
        // Firestore batch limit is 500
        if (docCount % 500 === 0) {
          await importBatch.commit();
          console.log(`Imported ${docCount} documents for ${leagueName}`);
          importBatch = db.batch(); // Create new batch after committing
        }
      }
    }
    
    // Commit remaining documents
    if (docCount % 500 !== 0) {
      await importBatch.commit();
    }
    
    console.log(`Successfully imported ${docCount} documents for ${leagueName}`);
  }
}

async function importLeagueWideChannels(sheets) {
  console.log('\nImporting league-wide channel mappings...');
  
  const data = await getSheetData(sheets, 'LeagueChannels', SHEET_ID);
  
  if (data.length === 0) {
    console.log('No league-wide channel data found');
    return;
  }
  
  // Get headers from first row
  const headers = data[0];
  const dataRows = data.slice(1);
  
  console.log(`Found ${dataRows.length} league channel mappings`);
  
  // Find column indices
  const leagueIndex = headers.findIndex(h => h && h.toLowerCase().includes('league'));
  const channelIndex = headers.findIndex(h => h && h.toLowerCase().includes('channel'));
  
  if (leagueIndex === -1 || channelIndex === -1) {
    console.warn('Could not find League or Channel columns in LeagueChannels sheet');
    return;
  }
  
  // Clear existing collection
  const collectionRef = db.collection('LeagueChannels');
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('Cleared existing LeagueChannels collection');
  
  // Import new data
  let importBatch = db.batch();
  let docCount = 0;
  
  for (const row of dataRows) {
    const league = row[leagueIndex];
    const channel = row[channelIndex];
    
    if (league && channel && league.trim() !== '' && channel.trim() !== '') {
      const docRef = collectionRef.doc(league.trim());
      importBatch.set(docRef, {
        league: league.trim(),
        channel: channel.trim()
      });
      docCount++;
      
      // Firestore batch limit is 500
      if (docCount % 500 === 0) {
        await importBatch.commit();
        console.log(`Imported ${docCount} league channel mappings`);
        importBatch = db.batch();
      }
    }
  }
  
  // Commit remaining documents
  if (docCount % 500 !== 0) {
    await importBatch.commit();
  }
  
  console.log(`Successfully imported ${docCount} league channel mappings`);
}

// Helper function to add delay between API calls
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    console.log('Starting import from Google Sheets...');
    
    // Authenticate once and reuse the client for all requests
    const sheets = await authenticateGoogleSheets();
    
    // Import league-wide channel mappings first
    await importLeagueWideChannels(sheets);
    
    // Add delay after league-wide channels import (1 second to stay under 60 req/min)
    await delay(1000);
    
    // Group leagues by spreadsheet ID for batch fetching (treat all sheets the same)
    const leaguesBySheet = {};
    for (const [leagueName, config] of Object.entries(LEAGUE_CONFIGS)) {
      const sheetId = config.sheetId || SHEET_ID;
      if (!leaguesBySheet[sheetId]) {
        leaguesBySheet[sheetId] = [];
      }
      leaguesBySheet[sheetId].push({ leagueName, config });
    }
    
    console.log(`\nGrouped ${Object.keys(LEAGUE_CONFIGS).length} leagues into ${Object.keys(leaguesBySheet).length} spreadsheets for batch fetching`);
    
    // Process each spreadsheet (excluding manual games sheet)
    for (const [sheetId, leagues] of Object.entries(leaguesBySheet)) {
      console.log(`\n📊 Processing spreadsheet with ${leagues.length} leagues...`);
      
      // Batch fetch all tabs from this spreadsheet in one API call
      const sheetNames = leagues.map(l => l.config.sheetName);
      const batchData = await batchGetSheetData(sheets, sheetNames, sheetId);
      
      // Process each league using the batch-fetched data
      for (let i = 0; i < leagues.length; i++) {
        const { leagueName, config } = leagues[i];
        await importLeagueData(leagueName, config, sheets, batchData);
      }
      
      // Add delay between spreadsheets (1 second to stay under 60 req/min)
      if (Object.keys(leaguesBySheet).indexOf(sheetId) < Object.keys(leaguesBySheet).length - 1) {
        await delay(1000);
      }
    }
    
    console.log('\nImport completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
