const { google } = require('googleapis');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

// Check if Firebase is already initialized to avoid duplicate initialization error
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Google Sheets configuration for Featured Games
const FEATURED_SHEET_ID = '1ZZWtajq2QQBzwKVBHbJ_0Sgr4UvjQZDFXHa2Jr6uHG4';
const FEATURED_SHEET_NAME = 'Featured Games';

// Manual games Google Sheet configuration (same as in index.js)
const MANUAL_GAMES_SHEET_ID = '1Yw2A9-7hgGaZEOftq9REuRPp9SCF6hTBmtx79MN790s';
const SHEET_ID = '1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4';
const MANUAL_LEAGUE_SHEETS = ['MotoGP', 'Boxing', 'UFC', 'PGATour', 'LPGATour', 'LIVGolf', 'USMNT', 'FormulaOne', 'NCAAF'];

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const FEATURED_FIELD_NAMES = ['Featured', 'featured', 'Featured ID', 'featuredId'];

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: SCOPES
  });
  
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function readFeaturedGamesFromSheet() {
  console.log('Reading Featured Games from Google Sheets...');
  
  const sheets = await authenticateGoogleSheets();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: FEATURED_SHEET_ID,
    range: `${FEATURED_SHEET_NAME}!A:D` // Date, Game ID, Title, and YesterdayTitle columns
  });
  
  const rows = response.data.values || [];
  console.log(`Found ${rows.length} rows in Featured Games sheet`);
  
  if (rows.length < 2) {
    console.log('No featured games data found (less than 2 rows including header)');
    return [];
  }
  
  const featuredGames = [];
  const headerRow = rows[0];
  console.log('Header row:', headerRow);
  
  // Process data rows (skip header)
  let currentTitle = ''; // Track the current title to apply to subsequent rows
  let currentYesterdayTitle = ''; // Track the current yesterdayTitle to apply to subsequent rows
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2 && row[0] && row[1]) { // Date and Game ID must be present
      const dateStr = row[0];
      const gameId = row[1];
      
      // If this row has a title, update currentTitle, otherwise keep using the last title
      if (row[2] && row[2].trim()) {
        currentTitle = row[2].trim();
      }
      
      // If this row has a yesterdayTitle, update currentYesterdayTitle, otherwise keep using the last yesterdayTitle
      if (row[3] && row[3].trim()) {
        currentYesterdayTitle = row[3].trim();
      }
      
      console.log(`Processing featured game: Date=${dateStr}, GameID=${gameId}, Title=${currentTitle}, YesterdayTitle=${currentYesterdayTitle}`);
      
      // Convert MM/DD/YYYY to ISO format
      let isoDate;
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        isoDate = dateStr; // Already in ISO format
      }
      
      featuredGames.push({
        date: isoDate,
        gameId: gameId,
        title: currentTitle,
        yesterdayTitle: currentYesterdayTitle,
        originalDate: dateStr,
        order: i - 1 // Preserve the order from Google Sheets (0-based index)
      });
    }
  }
  
  console.log(`Processed ${featuredGames.length} featured games`);
  return featuredGames;
}

async function fetchGameDataFromManualSheet(featuredId, targetDate) {
  // Look up manual game by the ID in the Featured column
  console.log(`Looking up manual game with Featured ID: ${featuredId}, Date: ${targetDate}`);
  
  const sheets = await authenticateGoogleSheets();
  
  // League mappings (same as in index.js)
  const LEAGUE_DISPLAY_NAME_MAP = {
    'MotoGP': 'MotoGP',
    'Boxing': 'Boxing',
    'UFC': 'UFC',
    'PGATour': 'PGA Tour',
    'LPGATour': 'LPGA Tour',
    'LIVGolf': 'LIV Golf',
    'USMNT': 'USMNT',
    'FormulaOne': 'Formula 1',
    'NCAAF': 'USA: NCAA'
  };
  const LEAGUE_TO_SPORT_MAP = {
    'MotoGP': 'Motorsport',
    'Boxing': 'Boxing',
    'UFC': 'Boxing',
    'PGATour': 'Motorsport',
    'LPGATour': 'Motorsport',
    'LIVGolf': 'Motorsport',
    'USMNT': 'Soccer',
    'FormulaOne': 'Motorsport',
    'NCAAF': 'American Football'
  };
  
  // Map league names to their sheet IDs
  const LEAGUE_SHEET_ID_MAP = {
    'MotoGP': MANUAL_GAMES_SHEET_ID,
    'Boxing': MANUAL_GAMES_SHEET_ID,
    'UFC': MANUAL_GAMES_SHEET_ID,
    'PGATour': MANUAL_GAMES_SHEET_ID,
    'LPGATour': MANUAL_GAMES_SHEET_ID,
    'LIVGolf': MANUAL_GAMES_SHEET_ID,
    'USMNT': MANUAL_GAMES_SHEET_ID,
    'FormulaOne': MANUAL_GAMES_SHEET_ID,
    'NCAAF': SHEET_ID
  };
  
  for (const sheetName of MANUAL_LEAGUE_SHEETS) {
    try {
      const sheetId = LEAGUE_SHEET_ID_MAP[sheetName] || MANUAL_GAMES_SHEET_ID;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:Z`,
        valueRenderOption: 'UNFORMATTED_VALUE'
      });
      
      const rows = response.data.values || [];
      if (rows.length < 2) continue;
      
      const headers = rows[0].map(h => h ? String(h).trim() : '');
      const dataRows = rows.slice(1);
      
      const dateIndex = headers.findIndex(h => h && h.toLowerCase().includes('date'));
      const timeIndex = headers.findIndex(h => h && h.toLowerCase().includes('time'));
      const awayTeamIndex = headers.findIndex(h => h && h.toLowerCase().includes('away'));
      const homeTeamIndex = headers.findIndex(h => h && h.toLowerCase().includes('home'));
      const channelIndex = headers.findIndex(h => h && h.toLowerCase().includes('channel'));
      const featuredIndex = headers.findIndex(h => h && (h.toLowerCase().includes('featured') || h.toLowerCase().includes('game id')));
      
      if (featuredIndex === -1) continue;
      
      // Find the row with matching Featured ID
      // Also track the last channel value for inheritance
      let lastChannel = '';
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        // Update lastChannel if this row has a channel value (even if it's not the featured row)
        if (channelIndex !== -1 && row[channelIndex] !== null && row[channelIndex] !== undefined && row[channelIndex] !== '') {
          const rowChannel = String(row[channelIndex]).trim();
          if (rowChannel) {
            lastChannel = rowChannel;
          }
        }
        
        const featuredValue = row[featuredIndex];
        
        if (featuredValue === null || featuredValue === undefined || featuredValue === '') continue;
        
        // Check if this row's Featured ID matches
        if (String(featuredValue).trim() !== String(featuredId).trim()) continue;
        
        // Found matching row - extract game data
        const rawDate = row[dateIndex];
        const dateStr = parseDateForManualGames(rawDate);
        if (!dateStr) continue;
        
        let timeStr = '';
        const rawTime = row[timeIndex];
        if (rawTime !== null && rawTime !== undefined && rawTime !== '') {
          timeStr = parseTimeForManualGames(rawTime);
          console.log(`  Extracted time from raw value (type: ${typeof rawTime}): "${rawTime}" -> "${timeStr}"`);
        }
        
        const awayTeam = awayTeamIndex !== -1 && row[awayTeamIndex] ? String(row[awayTeamIndex]).trim() : '';
        const homeTeam = homeTeamIndex !== -1 && row[homeTeamIndex] ? String(row[homeTeamIndex]).trim() : '';
        
        if (!awayTeam && !homeTeam) continue;
        
        // Get channel - use row's channel if present, otherwise inherit from lastChannel
        let channel = '';
        if (channelIndex !== -1 && row[channelIndex] !== null && row[channelIndex] !== undefined && row[channelIndex] !== '') {
          channel = String(row[channelIndex]).trim();
          console.log(`  Row ${i + 2} has channel in cell: "${channel}"`);
        }
        // If channel is empty, inherit from previous row
        if (!channel && lastChannel) {
          channel = lastChannel;
          console.log(`  Row ${i + 2} inheriting channel from previous row: "${channel}"`);
        }
        if (!channel) {
          console.log(`  ⚠️ Row ${i + 2} has no channel and no channel to inherit`);
        }
        
        const leagueDisplayName = LEAGUE_DISPLAY_NAME_MAP[sheetName] || sheetName;
        const sport = LEAGUE_TO_SPORT_MAP[sheetName] || 'Other';
        
        const startTime = timeStr ? createFirestoreTimestamp(dateStr, timeStr) : createFirestoreTimestamp(dateStr, '11:59 PM');
        if (!startTime) continue;
        
        // Debug: Log the timestamp creation
        if (timeStr) {
          const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const ampm = timeMatch[3]?.toUpperCase();
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            const estDateTime = DateTime.fromObject({
              year: parseInt(dateStr.split('-')[0]),
              month: parseInt(dateStr.split('-')[1]),
              day: parseInt(dateStr.split('-')[2]),
              hour: hours,
              minute: minutes
            }, { zone: 'America/New_York' });
            console.log(`  Created timestamp: ${timeStr} EST on ${dateStr} = ${estDateTime.toUTC().toISO()} UTC`);
          }
        }
        
        // Use the featuredId as the Game ID (or create one based on it)
        const gameId = `manual-${featuredId}`;
        
        const gameData = {
          'League': leagueDisplayName,
          'Sport': sport,
          'Start Time': startTime,
          'gameDate': dateStr,
          'Match Status': 'SCHEDULED',
          'Channel': channel,
          'channel': channel,
          'Home Team': homeTeam,
          'Away Team': awayTeam,
          'Matchup': awayTeam && homeTeam ? `${awayTeam} vs ${homeTeam}` : (homeTeam || awayTeam),
          'Game ID': gameId,
          'Last Updated': admin.firestore.FieldValue.serverTimestamp(),
          'isFeatured': true
        };
        
        // Store timeString for frontend display (the timestamp is already in UTC, frontend will convert to local)
        if (timeStr) {
          gameData['timeString'] = timeStr;
        } else {
          gameData['timeString'] = '';
        }
        
        console.log(`Found manual game with Featured ID ${featuredId}: ${awayTeam} vs ${homeTeam} on ${dateStr} at ${timeStr || 'no time'} (channel: ${channel || 'none'})`);
        return gameData;
      }
    } catch (error) {
      console.error(`Error reading ${sheetName} sheet:`, error.message);
    }
  }
  
  console.log(`Manual game not found with Featured ID: ${featuredId}`);
  return null;
}

async function fetchGameDataFromFirestore(gameId, targetDate) {
  // For manual games, the gameId in Featured Games sheet is the Featured ID (like "B1234")
  // Manual games have Game IDs like "manual-ufc-20241115-1" in Firestore
  // So if gameId doesn't start with a known FlashLive pattern, check Manual Games sheet first
  
  // Check if this looks like a FlashLive API Game ID (typically alphanumeric, not starting with "manual-")
  // Manual game Featured IDs are things like "B1234", "B1235", etc.
  // FlashLive Game IDs are typically longer alphanumeric strings
  const isLikelyManualGameId = /^[A-Z]\d+$/.test(gameId) || gameId.startsWith('manual-');
  
  if (isLikelyManualGameId) {
    // This is likely a manual game Featured ID - check Manual Games sheet first
    console.log(`Game ID "${gameId}" looks like a manual game Featured ID, checking Manual Games sheet first`);
    const manualGameData = await fetchGameDataFromManualSheet(gameId, targetDate);
    if (manualGameData) {
      return manualGameData;
    }
    // If not found in Manual Games sheet, fall through to Firestore lookup
    console.log(`Manual game not found in sheet, checking Firestore as fallback`);
  }
  
  console.log(`Fetching game data for GameID: ${gameId}, Date: ${targetDate}`);

  const normalizedGameId = String(gameId).trim();
  
  async function findGameByIdentifiers(collectionRef, collectionName) {
    let snapshot = await collectionRef.where('Game ID', '==', normalizedGameId).limit(1).get();
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      console.log(`Found game in ${collectionName} via Game ID match: ${data['Home Team']} vs ${data['Away Team']}`);
      return data;
    }
    
    for (const fieldName of FEATURED_FIELD_NAMES) {
      snapshot = await collectionRef.where(fieldName, '==', normalizedGameId).limit(1).get();
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        console.log(`Found game in ${collectionName} via "${fieldName}" match for Featured ID ${normalizedGameId}`);
        return data;
      }
    }
    
    return null;
  }
  
  // Try to find the game in sportsGames collection first (for live games)
  const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
  const sportsGameData = await findGameByIdentifiers(sportsGamesRef, 'sportsGames');
  if (sportsGameData) {
    return { ...sportsGameData, isFeatured: true };
  }
  
  // If not found in sportsGames, try yesterdayScores collection (for completed games)
  const yesterdayScoresRef = db.collection('artifacts/flashlive-daily-scraper/public/data/yesterdayScores');
  const yesterdayGameData = await findGameByIdentifiers(yesterdayScoresRef, 'yesterdayScores');
  if (yesterdayGameData) {
    return { ...yesterdayGameData, isFeatured: true };
  }
  
  // If not found in Firestore and we haven't checked Manual Games sheet yet, check it now
  if (!isLikelyManualGameId) {
    console.log(`Game not found in Firestore, checking Manual Games sheet for Featured ID: ${gameId}`);
    return await fetchGameDataFromManualSheet(gameId, targetDate);
  }
  
  console.log(`Game not found in Firestore or Manual Games sheet for GameID: ${gameId}`);
  return null;
}

async function writeFeaturedGamesToFirestore(featuredGamesData) {
  console.log(`Writing ${featuredGamesData.length} featured games to Firestore...`);
  
  const featuredRef = db.collection('artifacts/flashlive-daily-scraper/public/data/Featured');
  
  // Only clear featured games that are 2+ days old (keep today's and yesterday's)
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const existingSnapshot = await featuredRef.get();
  if (!existingSnapshot.empty) {
    const batch = db.batch();
    let deletedCount = 0;
    
    existingSnapshot.docs.forEach(doc => {
      const gameData = doc.data();
      const gameDate = gameData.gameDate || gameData.date;
      
      // Delete if game is 2+ days old
      if (gameDate && gameDate < twoDaysAgoStr) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Cleared ${deletedCount} featured games that are 2+ days old (keeping today's and yesterday's)`);
    } else {
      console.log('No old featured games to clear');
    }
  }

  // Remove existing entries for the dates we are about to write (fresh rebuild)
  const datesToRefresh = [...new Set(featuredGamesData
    .map(game => game.gameDate || game.date || game.featuredDate || '')
    .filter(Boolean))];

  for (const date of datesToRefresh) {
    const snapshot = await featuredRef.where('gameDate', '==', date).get();
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Cleared existing featured games for ${date}`);
    }
  }
  
  // Write new featured games
  const batch = db.batch();
  featuredGamesData.forEach((gameData, index) => {
    const dateForDoc = gameData.gameDate || gameData.date;
    const gameId = gameData['Game ID'];
    if (!dateForDoc || !gameId) {
      console.warn(`Skipping game data missing date or Game ID:`, gameData);
      return;
    }
    
    // Ensure channel is preserved (use Channel if channel is missing, or vice versa)
    if (gameData.channel && !gameData.Channel) {
      gameData.Channel = gameData.channel;
    }
    if (gameData.Channel && !gameData.channel) {
      gameData.channel = gameData.Channel;
    }
    
    // Debug log for manual games
    if (gameId.startsWith('manual-')) {
      console.log(`📝 Writing featured manual game: ${gameData['Away Team']} vs ${gameData['Home Team']}, channel="${gameData.channel || gameData.Channel || 'MISSING'}"`);
    }
    
    const docRef = featuredRef.doc(`${dateForDoc}_${gameId}`);
    batch.set(docRef, gameData);
  });
  
  await batch.commit();
  console.log(`Successfully wrote ${featuredGamesData.length} featured games to Featured collection`);
}

// Helper functions to parse dates and times (same as in index.js)
function parseDateForManualGames(rawDate) {
  if (!rawDate) return null;
  
  // Handle Excel serial numbers (numbers)
  if (typeof rawDate === 'number') {
    // Excel epoch is 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + rawDate * 24 * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Handle date strings
  const dateStr = String(rawDate).trim();
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr; // Already in YYYY-MM-DD format
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return null;
}

function parseTimeForManualGames(timeStr) {
  if (!timeStr) return '';
  
  // If it's already a string with time format, return it
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    return timeStr.trim();
  }
  
  let hours = 0;
  let minutes = 0;
  
  // If it's a number (Excel serial time), convert it
  // Excel/Google Sheets time is a fraction of a day (0.0 = midnight, 0.5 = noon)
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.floor(timeStr * 86400); // 86400 seconds in a day
    hours = Math.floor(totalSeconds / 3600);
    minutes = Math.floor((totalSeconds % 3600) / 60);
  }
  // If it's a Date object, Google Sheets returns time-only values as Date objects
  // The Date object represents the time in UTC, but we need to extract it as EST
  // Google Sheets stores time-only values using Excel epoch (1899-12-30) as the date
  else if (timeStr instanceof Date) {
    // Check if this is a time-only value (date is 1899-12-30, Excel epoch)
    const isTimeOnly = timeStr.getUTCFullYear() === 1899 && 
                       timeStr.getUTCMonth() === 11 && 
                       timeStr.getUTCDate() === 30;
    
    if (isTimeOnly) {
      // This is a time-only value - extract UTC hours/minutes (these represent the raw time)
      hours = timeStr.getUTCHours();
      minutes = timeStr.getUTCMinutes();
    } else {
      // This is a full datetime - extract UTC hours/minutes
      hours = timeStr.getUTCHours();
      minutes = timeStr.getUTCMinutes();
    }
  } else {
    return String(timeStr).trim();
  }
  
  // Format as "H:MM AM/PM" - these hours/minutes represent EST time from Google Sheets
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function createFirestoreTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  
  // Parse date and time as EST/EDT timezone, then convert to UTC for Firestore
  let dateTime;
  
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3]?.toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        dateTime = DateTime.fromObject({
          year,
          month,
          day,
          hour: hours,
          minute: minutes
        }, { zone: 'America/New_York' });
      } else {
        dateTime = DateTime.fromObject({
          year,
          month,
          day,
          hour: 0,
          minute: 0
        }, { zone: 'America/New_York' });
      }
    } else {
      dateTime = DateTime.fromObject({
        year,
        month,
        day,
        hour: 0,
        minute: 0
      }, { zone: 'America/New_York' });
    }
  } else {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date for timestamp: ${dateStr}`);
      return null;
    }
    dateTime = DateTime.fromJSDate(date, { zone: 'America/New_York' });
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3]?.toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        dateTime = dateTime.set({ hour: hours, minute: minutes });
      }
    }
  }
  
  if (!dateTime || !dateTime.isValid) {
    console.warn(`Invalid date/time for timestamp: ${dateStr} ${timeStr}`);
    return null;
  }
  
  const utcDate = dateTime.toUTC().toJSDate();
  return admin.firestore.Timestamp.fromDate(utcDate);
}

async function importFeaturedGames() {
  try {
    console.log('=== Starting Featured Games Import ===');
    
    // Step 1: Read featured games from Featured Games sheet (existing functionality)
    const featuredGamesFromSheet = await readFeaturedGamesFromSheet();
    console.log(`Found ${featuredGamesFromSheet.length} featured games from Featured Games sheet`);
    
    // Step 2: Fetch game data for all entries in Featured Games sheet
    // This will look up FlashLive API games in Firestore, or manual games in the Manual Games sheet
    const featuredGamesData = [];
    
    for (const featuredGame of featuredGamesFromSheet) {
      const gameData = await fetchGameDataFromFirestore(
        featuredGame.gameId, 
        featuredGame.date
      );
      if (gameData) {
        // Add the title, yesterdayTitle, and order from the Featured Games sheet
        // This preserves the order and custom titles
        gameData.title = featuredGame.title || '';
        gameData.yesterdayTitle = featuredGame.yesterdayTitle || '';
        gameData.order = featuredGame.order;
        
        // Debug: Log channel data for manual games
        if (gameData['Game ID'] && gameData['Game ID'].startsWith('manual-')) {
          console.log(`📺 Manual game channel data: GameID=${gameData['Game ID']}, channel="${gameData.channel || gameData.Channel || 'MISSING'}"`);
        }
        
        featuredGamesData.push(gameData);
      } else {
        console.log(`⚠️ Could not find game data for GameID: ${featuredGame.gameId}`);
      }
    }
    
    console.log(`Total featured games to cache: ${featuredGamesData.length} (from Featured Games sheet, order preserved)`);
    
    // Step 5: Write to Featured collection in Firestore (this caches all featured games)
    if (featuredGamesData.length > 0) {
      await writeFeaturedGamesToFirestore(featuredGamesData);
    }
    
    console.log('=== Featured Games Import Complete ===');
    
  } catch (error) {
    console.error('Error importing featured games:', error);
    throw error;
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importFeaturedGames()
    .then(() => {
      console.log('Featured games import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Featured games import failed:', error);
      process.exit(1);
    });
}

module.exports = { importFeaturedGames };
