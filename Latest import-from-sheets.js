How to run:

Terminal at Copy of THPORTHIndex

node import-from-sheets.js







latest import-from-sheets.js

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
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// League configurations with their field mappings
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
  'Boxing': {
    sheetName: 'Boxing',
    fields: {
      date: 'Date',
      event: 'Event',
      boxers: 'Boxers',
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
  'LIVGolf': {
    sheetName: 'LIVGolf',
    fields: {
      date: 'Date',
      time: 'Time',
      event: 'Event',
      channel: 'Channel'
    }
  },
  'LPGATour': {
    sheetName: 'LPGATour',
    fields: {
      date: 'Date',
      tournament: 'Tournament',
      channel: 'Channel'
    }
  },
  'MotoGP': {
    sheetName: 'MotoGP',
    fields: {
      date: 'Date',
      time: 'Time',
      home: 'Home Team',
      away: 'Away Team',
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
  'PGATour': {
    sheetName: 'PGATour',
    fields: {
      date: 'Date',
      tournament: 'Tournament',
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
  'UFC': {
    sheetName: 'UFC',
    fields: {
      date: 'Date',
      time: 'Time',
      event: 'Event',
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
  'FormulaOne': {
    sheetName: 'Formula 1',
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
  }
};

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    credentials: serviceAccount
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

async function getSheetData(sheets, sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:Z`
    });
    
    return response.data.values || [];
  } catch (error) {
    console.error(`Error reading sheet ${sheetName}:`, error.message);
    return [];
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle various date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date: ${dateStr}`);
    return null;
  }
  
  // Return just the date string in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

function parseTime(timeStr) {
  if (!timeStr) return '';
  
  // If it's already a time string, return as is
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    return timeStr.trim();
  }
  
  // If it's a date object, extract time
  if (timeStr instanceof Date) {
    return timeStr.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  return String(timeStr).trim();
}

async function importLeagueData(leagueName, config) {
  console.log(`\nImporting ${leagueName}...`);
  
  const sheets = await authenticateGoogleSheets();
  const data = await getSheetData(sheets, config.sheetName);
  
  if (data.length === 0) {
    console.log(`No data found for ${leagueName}`);
    return;
  }
  
  // Get headers from first row
  const headers = data[0];
  const dataRows = data.slice(1);
  
  console.log(`Found ${dataRows.length} rows for ${leagueName}`);
  
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
  
  // Clear existing collection
  const collectionRef = db.collection(leagueName);
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleared existing ${leagueName} collection`);
  
  // Import new data
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
        } else {
          docData[key] = String(value).trim();
        }
      }
    });
    
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

async function main() {
  try {
    console.log('Starting import from Google Sheets...');
    
    for (const [leagueName, config] of Object.entries(LEAGUE_CONFIGS)) {
      await importLeagueData(leagueName, config);
    }
    
    console.log('\nImport completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();


