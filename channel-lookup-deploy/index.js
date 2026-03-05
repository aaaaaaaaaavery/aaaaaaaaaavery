// Cloud Function entry point for channel lookup from Google Sheets
const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const { google } = require('googleapis');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Google Sheets IDs
const SHEET_ID = '1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4';
const SHEET_ID_2 = '1qpr6PShU_wGH0JzBQGqklYEqwV1c0Ho8KhSjgBxhtN8';
const SHEET_ID_3 = '1Kbkg7jZOoiynLX5QPnM-T6M3gSYRZxMgOyJ5xxfHN4Q';

// League to Google Sheet mapping
// Focus on leagues where ESPN doesn't provide channels and NCAA leagues
const LEAGUE_SHEET_MAP = {
  // NCAA leagues (NCAA API doesn't provide channel data)
  'USA: NCAA': { sheetId: SHEET_ID_3, sheetName: 'NCAAM', sport: 'Basketball' },
  'USA: NCAA Women': { sheetId: SHEET_ID_3, sheetName: 'NCAAW', sport: 'Basketball' },
  
  // Leagues where ESPN API doesn't provide channels - add as needed
  'Mexico: Liga MX': { sheetId: SHEET_ID, sheetName: 'LigaMX', sport: 'Soccer' },
  'Saudi Arabia: Saudi Professional League': { sheetId: SHEET_ID_2, sheetName: 'SaudiProLeague', sport: 'Soccer' },
  'Scotland: Premiership': { sheetId: SHEET_ID_2, sheetName: 'ScottishPremiership', sport: 'Soccer' },
  'France: Ligue 1': { sheetId: SHEET_ID, sheetName: 'Ligue1', sport: 'Soccer' },
  'Turkey: Super Lig': { sheetId: SHEET_ID_2, sheetName: 'SuperLig', sport: 'Soccer' },
  'SuperLig': { sheetId: SHEET_ID_2, sheetName: 'SuperLig', sport: 'Soccer' },
  'Belgium: Jupiler Pro League': { sheetId: SHEET_ID_2, sheetName: 'BelgianProLeague', sport: 'Soccer' },
  'Portugal: Liga Portugal': { sheetId: SHEET_ID_2, sheetName: 'LigaPortugal', sport: 'Soccer' },
  'Netherlands: Eredivisie': { sheetId: SHEET_ID_2, sheetName: 'Eredivisie', sport: 'Soccer' },
  'Eredivisie': { sheetId: SHEET_ID_2, sheetName: 'Eredivisie', sport: 'Soccer' },
  'Brazil: Serie A Betano': { sheetId: SHEET_ID, sheetName: 'Brasileirao', sport: 'Soccer' },
  'England: WSL': { sheetId: SHEET_ID_2, sheetName: 'WomensSuperLeague', sport: 'Soccer' },
  'Europe: Champions League Women - League phase': { sheetId: SHEET_ID_3, sheetName: 'WomensUCL', sport: 'Soccer' },
  'Argentina: Torneo Betano - Apertura': { sheetId: SHEET_ID, sheetName: 'ArgentinePrimeraDivision', sport: 'Soccer' },
  'Argentina: Torneo Betano - Clausura': { sheetId: SHEET_ID, sheetName: 'ArgentinePrimeraDivision', sport: 'Soccer' },
  'Argentine Primera División': { sheetId: SHEET_ID, sheetName: 'ArgentinePrimeraDivision', sport: 'Soccer' },
  'Argentine Primera': { sheetId: SHEET_ID, sheetName: 'ArgentinePrimeraDivision', sport: 'Soccer' },
  'Taça de Portugal': { sheetId: SHEET_ID_2, sheetName: 'TacaDePortugal', sport: 'Soccer' },
  'Coppa Italia': { sheetId: SHEET_ID_3, sheetName: 'CoppaItalia', sport: 'Soccer' },
  'Italy: Coppa Italia': { sheetId: SHEET_ID_3, sheetName: 'CoppaItalia', sport: 'Soccer' },
  'France: Coupe de France': { sheetId: SHEET_ID_3, sheetName: 'CoupeDeFrance', sport: 'Soccer' },
  'Coupe de France': { sheetId: SHEET_ID_3, sheetName: 'CoupeDeFrance', sport: 'Soccer' },
  'CoupeDeFrance': { sheetId: SHEET_ID_3, sheetName: 'CoupeDeFrance', sport: 'Soccer' },
  'North & Central America: Concacaf Champions Cup': { sheetId: SHEET_ID_2, sheetName: 'CONCACAFChampionsCup', sport: 'Soccer' },
  'Concacaf Champions Cup': { sheetId: SHEET_ID_2, sheetName: 'CONCACAFChampionsCup', sport: 'Soccer' },
  'CONCACAFChampionsCup': { sheetId: SHEET_ID_2, sheetName: 'CONCACAFChampionsCup', sport: 'Soccer' },
  'Germany: DFB Pokal': { sheetId: SHEET_ID_2, sheetName: 'DFBPokal', sport: 'Soccer' },
  'German: DFB Pokal': { sheetId: SHEET_ID_2, sheetName: 'DFBPokal', sport: 'Soccer' },
  'DFB-Pokal': { sheetId: SHEET_ID_2, sheetName: 'DFBPokal', sport: 'Soccer' },
  'DFBPokal': { sheetId: SHEET_ID_2, sheetName: 'DFBPokal', sport: 'Soccer' },
  'Spain: Copa del Rey': { sheetId: SHEET_ID_2, sheetName: 'CopaDelRey', sport: 'Soccer' },
  'Copa del Rey': { sheetId: SHEET_ID_2, sheetName: 'CopaDelRey', sport: 'Soccer' },
  'CopaDelRey': { sheetId: SHEET_ID_2, sheetName: 'CopaDelRey', sport: 'Soccer' },
  'England: FA Cup': { sheetId: SHEET_ID_2, sheetName: 'FACup', sport: 'Soccer' },
  'FA Cup': { sheetId: SHEET_ID_2, sheetName: 'FACup', sport: 'Soccer' },
  'FACup': { sheetId: SHEET_ID_2, sheetName: 'FACup', sport: 'Soccer' },
  'England: Championship': { sheetId: SHEET_ID, sheetName: 'EFLChampionship', sport: 'Soccer' },
  'South America: Copa Libertadores': { sheetId: SHEET_ID, sheetName: 'CopaLibertadores', sport: 'Soccer' },
  'Copa Libertadores': { sheetId: SHEET_ID, sheetName: 'CopaLibertadores', sport: 'Soccer' },
  'CopaLibertadores': { sheetId: SHEET_ID, sheetName: 'CopaLibertadores', sport: 'Soccer' },
  
  // Example: 'Europe: Champions League - League phase': { sheetId: SHEET_ID, sheetName: 'UEFAChampionsLeague' },
  
  // You can add more leagues here that need channel lookup from Google Sheets
};

// Function to get sheet mapping based on league and sport
function getSheetMapping(league, sport) {
  // Handle NCAA leagues with sport-specific mapping
  if (league === 'USA: NCAA') {
    if (sport === 'Basketball') {
      return { sheetId: SHEET_ID_3, sheetName: 'NCAAM' };
    }
    // Add other sports as needed
    return null;
  }
  
  if (league === 'USA: NCAA Women') {
    if (sport === 'Basketball') {
      return { sheetId: SHEET_ID_3, sheetName: 'NCAAW' };
    }
    return null;
  }
  
  // Try exact match
  if (LEAGUE_SHEET_MAP[league]) {
    const mapping = LEAGUE_SHEET_MAP[league];
    // If sport is specified in mapping, check it matches
    if (mapping.sport && mapping.sport !== sport) {
      return null;
    }
    return { sheetId: mapping.sheetId, sheetName: mapping.sheetName };
  }
  
  return null;
}

// Load team alias mappings from Firestore (cached)
let teamAliasMappingsCache = null;
let teamAliasMappingsCacheTime = null;
const ALIAS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadTeamAliasMappings() {
  // Check cache first
  if (teamAliasMappingsCache && teamAliasMappingsCacheTime) {
    const cacheAge = Date.now() - teamAliasMappingsCacheTime;
    if (cacheAge < ALIAS_CACHE_DURATION) {
      return teamAliasMappingsCache;
    }
  }

  try {
    const mappingsRef = db.collection('artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings');
    const snapshot = await mappingsRef.get();
    
    const mappings = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const league = data.league;
      if (league && data.mappings) {
        mappings[league] = data.mappings;
      }
    });
    
    teamAliasMappingsCache = mappings;
    teamAliasMappingsCacheTime = Date.now();
    
    console.log(`✅ Loaded team alias mappings for ${Object.keys(mappings).length} leagues`);
    return mappings;
  } catch (error) {
    console.warn('⚠️  Error loading team alias mappings:', error.message);
    return teamAliasMappingsCache || {};
  }
}

// Normalize team name for matching (removes special chars, normalizes whitespace)
function normalizeTeamNameForMatching(name) {
  if (!name) return '';
  // Remove " W" suffix if present (for NWSL, NCAAW, etc.)
  let normalized = name.endsWith(" W") ? name.slice(0, -2) : name;
  return normalized
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert game league to mapping league key
function getMappingLeagueKey(league) {
  if (!league) return null;
  // Map game league names to mapping league keys
  if (league === 'USA: NCAA' || league.includes('NCAA') && league.includes('Men')) return 'NCAAM';
  if (league === 'USA: NCAA Women' || league.includes('NCAA') && league.includes('Women')) return 'NCAAW';
  if (league === 'NCAAF' || league.includes('NCAA') && league.includes('Football')) return 'NCAAF';
  if (league === 'Mexico: Liga MX' || league.includes('Liga MX')) return 'LigaMX';
  if (league === 'Saudi Arabia: Saudi Professional League' || league.includes('Saudi Professional League')) return 'SaudiProLeague';
  if (league === 'Scotland: Premiership' || league.includes('Scottish Premiership')) return 'ScottishPremiership';
  if (league === 'France: Ligue 1' || league === 'Ligue 1' || league === 'Ligue1') return 'Ligue1';
  if (league === 'Turkey: Super Lig' || league.includes('Turkish Super Lig') || league.includes('Super Lig')) return 'SuperLig';
  if (league === 'SuperLig') return 'SuperLig';
  if (league === 'Belgium: Jupiler Pro League' || league.includes('Belgian Pro League')) return 'BelgianProLeague';
  if (league === 'Portugal: Liga Portugal' || league.includes('Liga Portugal')) return 'LigaPortugal';
  if (league === 'Netherlands: Eredivisie' || league === 'Eredivisie') return 'Eredivisie';
  if (league === 'Brazil: Serie A Betano' || league.includes('Brasileirao') || league.includes('Brasileirão')) return 'Brasileirao';
  if (league === 'England: WSL' || league.includes('Women\'s Super League') || league.includes('WSL')) return 'WomensSuperLeague';
  if (league === 'England: Championship' || league === 'EFL Championship' || league.includes('Championship') && league.includes('England')) return 'EFLChampionship';
  if (league === 'Europe: Champions League Women - League phase' || league.includes('Champions League Women')) return 'WomensUCL';
  if (league === 'Argentina: Torneo Betano - Apertura' || league === 'Argentina: Torneo Betano - Clausura' || league.includes('Argentine Primera Division') || league === 'Argentine Primera División' || league.includes('Argentine Primera División') || league === 'Argentine Primera' || league.includes('Argentine Primera')) return 'ArgentinePrimeraDivision';
  if (league === 'Taça de Portugal' || league.includes('Taca de Portugal') || league.includes('Taça de Portugal')) return 'TacaDePortugal';
  if (league === 'Coppa Italia' || league === 'Italy: Coppa Italia' || league.includes('Coppa Italia')) return 'CoppaItalia';
  if (league === 'France: Coupe de France' || league === 'Coupe de France' || league === 'CoupeDeFrance') return 'CoupeDeFrance';
  if (league === 'North & Central America: Concacaf Champions Cup' || league === 'Concacaf Champions Cup' || league === 'CONCACAFChampionsCup') return 'CONCACAFChampionsCup';
  if (league === 'Germany: DFB Pokal' || league === 'German: DFB Pokal' || league === 'DFB-Pokal' || league === 'DFBPokal') return 'DFBPokal';
  if (league === 'Spain: Copa del Rey' || league === 'Copa del Rey' || league === 'CopaDelRey') return 'CopaDelRey';
  if (league === 'England: FA Cup' || league === 'FA Cup' || league === 'FACup') return 'FACup';
  if (league === 'England: EFL Cup' || league === 'Carabao Cup' || league === 'EFLCup') return 'EFLCup';
  if (league === 'South America: Copa Libertadores' || league.includes('Copa Libertadores') || league === 'CopaLibertadores') return 'CopaLibertadores';
  // Try direct match
  return league;
}

// Get canonical name from alias mappings (STRICT - only returns if name is in mappings)
// Returns null if name is not in any alias group
// league can be either "NCAAM"/"NCAAW" (league key) or "USA: NCAA" (league filter)
function getCanonicalNameFromAlias(name, league) {
  if (!name || !league) return null;
  
  // Handle both league key (NCAAM) and league filter (USA: NCAA)
  let mappingLeagueKey = league;
  if (league === 'USA: NCAA' || league === 'USA: NCAA Women') {
    mappingLeagueKey = getMappingLeagueKey(league);
  }
  // If already a league key (NCAAM, NCAAW), use it directly
  
  if (!mappingLeagueKey || !teamAliasMappingsCache) return null;
  
  const leagueMappings = teamAliasMappingsCache[mappingLeagueKey];
  if (!leagueMappings) return null;
  
  // Try exact match first
  if (leagueMappings[name]) {
    return leagueMappings[name];
  }
  
  // Try case-insensitive match
  const nameLower = name.toLowerCase();
  for (const [variation, canonicalName] of Object.entries(leagueMappings)) {
    if (!variation.startsWith('_equivalents_') && variation.toLowerCase() === nameLower) {
      return canonicalName;
    }
  }
  
  // Try normalized match
  const normalized = normalizeTeamNameForMatching(name);
  for (const [variation, canonicalName] of Object.entries(leagueMappings)) {
    if (!variation.startsWith('_equivalents_')) {
      const normalizedVariation = normalizeTeamNameForMatching(variation);
      if (normalizedVariation === normalized) {
        return canonicalName;
      }
    }
  }
  
  // Not found in alias mappings - return null (strict matching)
  return null;
}

// Check if two team names are in the same alias group (STRICT matching)
function areTeamsInSameAliasGroup(name1, name2, league) {
  if (!name1 || !name2 || !league) return false;
  if (name1 === name2) return true;
  
  const canonical1 = getCanonicalNameFromAlias(name1, league);
  const canonical2 = getCanonicalNameFromAlias(name2, league);
  
  // Both must be in alias mappings AND map to the same canonical name
  if (canonical1 && canonical2 && canonical1 === canonical2) {
    return true;
  }
  
  return false;
}

// Normalize team names for matching (with alias support - synchronous version using cache)
function normalizeTeamName(name, league = null) {
  if (!name) return '';
  
  // Try to use alias mappings if league is provided and cache is available
  if (league && teamAliasMappingsCache) {
    const mappingLeagueKey = getMappingLeagueKey(league);
    const leagueMappings = mappingLeagueKey ? teamAliasMappingsCache[mappingLeagueKey] : null;
    
    if (leagueMappings) {
      // Try exact match first
      if (leagueMappings[name]) {
        return normalizeTeamNameForMatching(leagueMappings[name]);
      }
      
      // Try case-insensitive match
      const nameLower = name.toLowerCase();
      for (const [variation, displayName] of Object.entries(leagueMappings)) {
        if (!variation.startsWith('_equivalents_') && variation.toLowerCase() === nameLower) {
          return normalizeTeamNameForMatching(displayName);
        }
      }
      
      // Try normalized match
      const normalized = normalizeTeamNameForMatching(name);
      for (const [variation, displayName] of Object.entries(leagueMappings)) {
        if (!variation.startsWith('_equivalents_')) {
          const normalizedVariation = normalizeTeamNameForMatching(variation);
          if (normalizedVariation === normalized) {
            return normalizeTeamNameForMatching(displayName);
          }
        }
      }
    }
  }
  
  // Fallback to basic normalization
  return normalizeTeamNameForMatching(name);
}

// Authenticate Google Sheets API
let sheets = null;
async function authenticateGoogleSheets() {
  if (sheets) return sheets;
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const authClient = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('✅ Google Sheets API authenticated');
    return sheets;
  } catch (error) {
    console.error('❌ Error authenticating Google Sheets:', error);
    throw error;
  }
}

// Parse date from Google Sheets (handles various formats)
// Google Sheets uses EST, but we need to convert to Mountain Time (UTC-6) to match Firestore gameDate
function parseSheetDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle Excel serial date (number)
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date('1899-12-30T00:00:00Z');
    const daysSinceEpoch = Math.floor(dateStr);
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    // Convert EST date to Mountain Time date
    const estDate = DateTime.fromJSDate(date).setZone('America/New_York');
    const mountainDate = estDate.setZone('America/Denver');
    return mountainDate.toISODate();
  }
  
  // Handle string dates
  const dateStrTrimmed = String(dateStr).trim();
  
  // Format: YYYY-MM-DD - assume it's EST and convert to Mountain
  if (dateStrTrimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const estDate = DateTime.fromISO(dateStrTrimmed, { zone: 'America/New_York' });
    const mountainDate = estDate.setZone('America/Denver');
    return mountainDate.toISODate();
  }
  
  // Format: MM/DD/YYYY or M/D/YYYY - parse as EST, convert to Mountain
  if (dateStrTrimmed.includes('/')) {
    const parts = dateStrTrimmed.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (month && day && year) {
        // Parse as EST (noon to avoid timezone edge cases)
        const estDate = DateTime.fromObject({ year, month, day, hour: 12 }, { zone: 'America/New_York' });
        // Convert to Mountain Time to get the equivalent date
        const mountainDate = estDate.setZone('America/Denver');
        return mountainDate.toISODate();
      }
    }
  }
  
  // Try parsing as ISO date, assume EST and convert to Mountain
  const parsed = DateTime.fromISO(dateStrTrimmed, { zone: 'America/New_York' });
  if (parsed.isValid) {
    const mountainDate = parsed.setZone('America/Denver');
    return mountainDate.toISODate();
  }
  
  return null;
}

// Get channel data from Google Sheets
async function getChannelDataFromSheets(games, todayStr) {
  const channelMap = new Map(); // Key: "normalizedHome|normalizedAway|date", Value: channel
  
  try {
    await authenticateGoogleSheets();
    
    // Group games by sheet to minimize API calls
    const gamesBySheet = {};
    for (const game of games) {
      const sheetMapping = getSheetMapping(game.League, game.Sport);
      if (sheetMapping) {
        const sheetKey = `${sheetMapping.sheetId}|${sheetMapping.sheetName}`;
        if (!gamesBySheet[sheetKey]) {
          gamesBySheet[sheetKey] = {
            mapping: sheetMapping,
            games: []
          };
        }
        gamesBySheet[sheetKey].games.push(game);
      }
    }
    
    // Read from each sheet
    for (const [sheetKey, sheetData] of Object.entries(gamesBySheet)) {
      const { sheetId, sheetName } = sheetData.mapping;
      
      try {
        console.log(`📋 Reading channel data from sheet: ${sheetName} (${sheetId})`);
        
        // Read the entire sheet (or specific range)
        const range = `${sheetName}!A:Z`;
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: range
        });
        
        const rows = response.data.values || [];
        if (rows.length < 2) {
          console.log(`⚠️  Sheet ${sheetName} has no data rows`);
          continue;
        }
        
        // Find column indices
        const headerRow = rows[0];
        const dateCol = headerRow.findIndex(col => col && col.toString().toLowerCase().includes('date'));
        const homeCol = headerRow.findIndex(col => col && col.toString().toLowerCase().includes('home') && col.toString().toLowerCase().includes('team'));
        const awayCol = headerRow.findIndex(col => col && col.toString().toLowerCase().includes('away') && col.toString().toLowerCase().includes('team'));
        const channelCol = headerRow.findIndex(col => col && col.toString().toLowerCase().includes('channel'));
        
        if (dateCol === -1 || homeCol === -1 || awayCol === -1 || channelCol === -1) {
          console.log(`⚠️  Sheet ${sheetName} missing required columns (Date, Home Team, Away Team, Channel)`);
          console.log(`   Found columns: ${headerRow.join(', ')}`);
          continue;
        }
        
        console.log(`✅ Sheet ${sheetName} columns: Date=${dateCol}, Home=${homeCol}, Away=${awayCol}, Channel=${channelCol}`);
        
        // Process data rows
        let processedCount = 0;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const dateStr = row[dateCol] ? String(row[dateCol]).trim() : '';
          const homeTeam = row[homeCol] ? String(row[homeCol]).trim() : '';
          const awayTeam = row[awayCol] ? String(row[awayCol]).trim() : '';
          const channel = row[channelCol] ? String(row[channelCol]).trim() : '';
          
          if (!dateStr || !homeTeam || !awayTeam || !channel) continue;
          
          // Parse date
          const rowDateStr = parseSheetDate(dateStr);
          if (!rowDateStr) {
            console.log(`⚠️  Could not parse date "${dateStr}" in row ${i + 1} of ${sheetName}`);
            continue;
          }
          
          // Only process rows matching dates we're looking for
          const relevantDates = new Set([todayStr]);
          sheetData.games.forEach(game => {
            if (game.gameDate) {
              relevantDates.add(game.gameDate);
            }
          });
          
          if (!relevantDates.has(rowDateStr)) {
            console.log(`⏭️  Skipping row ${i + 1}: date "${rowDateStr}" not in relevant dates ${Array.from(relevantDates).join(', ')}`);
            continue;
          }
          
          console.log(`📅 Processing row ${i + 1}: ${awayTeam} @ ${homeTeam} on ${rowDateStr} → Channel: ${channel}`);
          
          // Use sheet name as league key for mappings (e.g., 'NCAAM', 'NCAAW')
          const normalizedHome = normalizeTeamName(homeTeam, sheetName);
          const normalizedAway = normalizeTeamName(awayTeam, sheetName);
          
          // Create keys for both possible orders (home/away and away/home)
          const key1 = `${normalizedHome}|${normalizedAway}|${rowDateStr}`;
          const key2 = `${normalizedAway}|${normalizedHome}|${rowDateStr}`;
          channelMap.set(key1, channel);
          channelMap.set(key2, channel);
          processedCount++;
        }
        
        console.log(`✅ Processed ${processedCount} channel entries from ${sheetName}`);
      } catch (err) {
        console.error(`❌ Error reading sheet ${sheetName}:`, err.message);
      }
    }
    
    console.log(`📊 Total channel entries found: ${channelMap.size}`);
  } catch (error) {
    console.error('❌ Error fetching channel data from Google Sheets:', error);
  }
  
  return channelMap;
}

// Get league-wide channel mappings from Firestore
async function getLeagueWideChannels() {
  const leagueChannelMap = new Map(); // Key: league name, Value: channel
  
  try {
    const leagueChannelsRef = db.collection('LeagueChannels');
    const snapshot = await leagueChannelsRef.get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.league && data.channel) {
        leagueChannelMap.set(data.league, data.channel);
        console.log(`📺 League-wide channel: ${data.league} → ${data.channel}`);
      }
    });
    
    console.log(`Found ${leagueChannelMap.size} league-wide channel mappings`);
  } catch (error) {
    console.error('Error fetching league-wide channels:', error);
  }
  
  return leagueChannelMap;
}

// Get all alias variations for a team name (including the name itself)
// Recursively collects ALL variations in the same alias group
function getAllAliasVariations(name, leagueKey) {
  if (!name || !leagueKey || leagueKey === 'NCAAF') {
    // NCAAF doesn't use alias mappings, return just the name
    return [name];
  }
  
  if (!teamAliasMappingsCache) return [name];
  
  const leagueMappings = teamAliasMappingsCache[leagueKey];
  if (!leagueMappings) return [name];
  
  const variations = new Set();
  const toProcess = [name];
  const processed = new Set();
  
  // Recursively collect all variations
  while (toProcess.length > 0) {
    const current = toProcess.shift();
    if (processed.has(current)) continue;
    processed.add(current);
    variations.add(current);
    
    // Get display name (if this name maps to one)
    const displayName = leagueMappings[current];
    if (displayName && !processed.has(displayName)) {
      toProcess.push(displayName);
    }
    
    // Get all equivalents for this name
    const equivalents = leagueMappings[`_equivalents_${current}`] || [];
    equivalents.forEach(eq => {
      if (!processed.has(eq)) {
        toProcess.push(eq);
      }
    });
    
    // Also check if this name is an equivalent of another name
    for (const [key, value] of Object.entries(leagueMappings)) {
      if (key.startsWith('_equivalents_')) {
        const baseName = key.replace('_equivalents_', '');
        if (Array.isArray(value) && value.includes(current) && !processed.has(baseName)) {
          toProcess.push(baseName);
        }
      }
    }
  }
  
  return Array.from(variations);
}

// Load Top 25 rankings from standings collection
async function loadTop25Rankings(leagueKey) {
  const collectionMap = {
    'NCAAF': 'NCAAFStandings',
    'NCAAM': 'NCAAMStandings',
    'NCAAW': 'NCAAWStandings'
  };
  
  const collectionName = collectionMap[leagueKey];
  if (!collectionName) return {};
  
  try {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
      console.log(`No Top 25 data found for ${leagueKey}`);
      return {};
    }
    
    // Build rankings map: store ranking under ALL alias variations
    // Key: normalized variation, Value: ranking data
    const rankingsMap = {};
    
    for (const doc of snapshot.docs) {
      const teamData = doc.data();
      if (teamData.Top25Rank !== null && teamData.Top25Rank !== undefined && teamData.Team) {
        const teamName = teamData.Team;
        
        // Get ALL variations for this team name (all aliases in the same group)
        const allVariations = getAllAliasVariations(teamName, leagueKey);
        
        const rankingData = {
          rank: teamData.Top25Rank,
          points: teamData.Top25Points || null,
          previous: teamData.Top25Previous || null,
          originalName: teamName
        };
        
        // Store ranking under normalized version of EACH variation
        // This way "Florida State" ranking is stored under "florida state", "florida st", "florida st.", etc.
        allVariations.forEach(variation => {
          if (variation) {
            const normalized = normalizeTeamName(variation, leagueKey);
            rankingsMap[normalized] = rankingData;
          }
        });
        
        // Debug: log what variations were stored (for teams with multiple aliases)
        if (allVariations.length > 1) {
          console.log(`  📊 Ranking #${teamData.Top25Rank}: "${teamName}" → stored under ${allVariations.length} variations: ${allVariations.slice(0, 5).join(', ')}${allVariations.length > 5 ? '...' : ''}`);
        }
        
      }
    }
    
    console.log(`✅ Loaded ${Object.keys(rankingsMap).length} Top 25 rankings for ${leagueKey}`);
    return rankingsMap;
  } catch (error) {
    console.error(`Error loading Top 25 rankings for ${leagueKey}:`, error);
    return {};
  }
}

// Determine league key from game data
function getLeagueKeyFromGame(game) {
  const league = game.League || '';
  const sport = game.Sport || '';
  
  if (league === 'USA: NCAA Women' && sport === 'Basketball') {
    return 'NCAAW';
  } else if (league === 'USA: NCAA' && sport === 'Basketball') {
    return 'NCAAM';
  } else if (league === 'USA: NCAA' && sport === 'American Football') {
    return 'NCAAF';
  }
  
  return null;
}

// Sync Top 25 rankings to games (STRICT matching - only within alias groups)
async function syncTop25ToGames(leagueKey) {
  console.log(`\n🔄 Syncing Top 25 rankings for ${leagueKey}...`);
  
  // Ensure alias mappings are loaded first
  await loadTeamAliasMappings();
  
  // Debug: Check if mappings are loaded and test Florida teams
  if (teamAliasMappingsCache && teamAliasMappingsCache[leagueKey]) {
    const mappingKeys = Object.keys(teamAliasMappingsCache[leagueKey]).filter(k => !k.startsWith('_equivalents_')).slice(0, 10);
    console.log(`  📋 Alias mappings loaded for ${leagueKey}: ${mappingKeys.length} entries (sample: ${mappingKeys.join(', ')})`);
    
    // Test alias lookup for Florida teams
    if (leagueKey === 'NCAAM') {
      console.log(`  🧪 Testing alias lookup:`);
      const floridaStateVars = getAllAliasVariations('Florida State', leagueKey);
      const floridaStVars = getAllAliasVariations('Florida St.', leagueKey);
      const floridaVars = getAllAliasVariations('Florida', leagueKey);
      console.log(`    "Florida State" → ${floridaStateVars.length} variations: ${floridaStateVars.join(', ')}`);
      console.log(`    "Florida St." → ${floridaStVars.length} variations: ${floridaStVars.join(', ')}`);
      console.log(`    "Florida" → ${floridaVars.length} variations: ${floridaVars.join(', ')}`);
    }
  } else {
    console.log(`  ⚠️  No alias mappings found for ${leagueKey}!`);
  }
  
  // Load rankings
  const rankingsMap = await loadTop25Rankings(leagueKey);
  if (Object.keys(rankingsMap).length === 0) {
    console.log(`⚠️ No rankings found for ${leagueKey}, skipping...`);
    return;
  }
  
  // Determine league filter
  let leagueFilter = '';
  let sportFilter = '';
  if (leagueKey === 'NCAAF') {
    leagueFilter = 'USA: NCAA';
    sportFilter = 'American Football';
  } else if (leagueKey === 'NCAAM') {
    leagueFilter = 'USA: NCAA';
    sportFilter = 'Basketball';
  } else if (leagueKey === 'NCAAW') {
    leagueFilter = 'USA: NCAA Women';
    sportFilter = 'Basketball';
  }
  
  // Get games collection
  const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
  
  // Query games for this league
  let query = gamesRef.where('League', '==', leagueFilter);
  if (sportFilter) {
    query = query.where('Sport', '==', sportFilter);
  }
  
  const gamesSnapshot = await query.get();
  console.log(`Found ${gamesSnapshot.size} games for ${leagueKey}`);
  
  if (gamesSnapshot.empty) {
    console.log(`No games found for ${leagueKey}`);
    return;
  }
  
  // Update games with rankings
  const batch = db.batch();
  let updateCount = 0;
  
  for (const doc of gamesSnapshot.docs) {
    const game = doc.data();
    const awayTeam = game['Away Team'] || game['AwayTeam'] || '';
    const homeTeam = game['Home Team'] || game['HomeTeam'] || '';
    
    // Skip games without team names
    if (!awayTeam || !homeTeam) continue;
    
    let awayRank = null;
    let homeRank = null;
    let needsUpdate = false;
    
    
    // Match away team: get ALL aliases, check if any normalized alias exists in rankings map
    if (awayTeam) {
      // Get ALL variations for this team (all aliases in the same group)
      const awayVariations = getAllAliasVariations(awayTeam, leagueKey);
      
      // Debug: log for problematic teams
      const debugTeams = ['Iowa', 'Florida', 'Arkansas', 'Kansas'];
      const shouldDebug = debugTeams.some(team => awayTeam.toLowerCase().includes(team.toLowerCase()));
      
      if (shouldDebug) {
        console.log(`\n🔍 Away team "${awayTeam}" → ${awayVariations.length} variations: ${awayVariations.join(', ')}`);
      }
      
      // Try each variation - if any normalized variation exists in rankings map, we have a match
      for (const variation of awayVariations) {
        const normalized = normalizeTeamName(variation, leagueKey);
        if (rankingsMap[normalized]) {
          awayRank = rankingsMap[normalized].rank;
          if (shouldDebug) {
            console.log(`  ✅ Matched: "${variation}" → normalized "${normalized}" → rank ${awayRank}`);
          }
          break; // Found match, stop looking
        } else if (shouldDebug) {
          console.log(`  ❌ No match for "${variation}" → normalized "${normalized}"`);
        }
      }
      
      if (!awayRank && shouldDebug) {
        console.log(`  ⚠️  No ranking found for "${awayTeam}" after trying ${awayVariations.length} variations`);
      }
    }
    
    // Match home team: get ALL aliases, check if any normalized alias exists in rankings map
    if (homeTeam) {
      // Get ALL variations for this team (all aliases in the same group)
      const homeVariations = getAllAliasVariations(homeTeam, leagueKey);
      
      // Debug: log for problematic teams
      const debugTeams = ['Iowa', 'Florida', 'Arkansas', 'Kansas'];
      const shouldDebug = debugTeams.some(team => homeTeam.toLowerCase().includes(team.toLowerCase()));
      
      if (shouldDebug) {
        console.log(`\n🔍 Home team "${homeTeam}" → ${homeVariations.length} variations: ${homeVariations.join(', ')}`);
      }
      
      // Try each variation - if any normalized variation exists in rankings map, we have a match
      for (const variation of homeVariations) {
        const normalized = normalizeTeamName(variation, leagueKey);
        if (rankingsMap[normalized]) {
          homeRank = rankingsMap[normalized].rank;
          if (shouldDebug) {
            console.log(`  ✅ Matched: "${variation}" → normalized "${normalized}" → rank ${homeRank}`);
          }
          break; // Found match, stop looking
        } else if (shouldDebug) {
          console.log(`  ❌ No match for "${variation}" → normalized "${normalized}"`);
        }
      }
      
      if (!homeRank && shouldDebug) {
        console.log(`  ⚠️  No ranking found for "${homeTeam}" after trying ${homeVariations.length} variations`);
      }
    }
    
    // Check if we need to update
    const currentAwayRank = game['Away Team Ranking'] || game['Away Team Rank'] || game['AwayTeamRank'] || null;
    const currentHomeRank = game['Home Team Ranking'] || game['Home Team Rank'] || game['HomeTeamRank'] || null;
    
    if (awayRank !== currentAwayRank || homeRank !== currentHomeRank) {
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      const gameRef = doc.ref;
      const updateData = {};
      
      if (awayRank !== null) {
        updateData['Away Team Ranking'] = awayRank;
        updateData['Away Team Rank'] = awayRank;
        updateData['AwayTeamRank'] = awayRank;
      } else {
        updateData['Away Team Ranking'] = null;
        updateData['Away Team Rank'] = null;
        updateData['AwayTeamRank'] = null;
      }
      
      if (homeRank !== null) {
        updateData['Home Team Ranking'] = homeRank;
        updateData['Home Team Rank'] = homeRank;
        updateData['HomeTeamRank'] = homeRank;
      } else {
        updateData['Home Team Ranking'] = null;
        updateData['Home Team Rank'] = null;
        updateData['HomeTeamRank'] = null;
      }
      
      batch.update(gameRef, updateData);
      updateCount++;
      
      if (awayRank || homeRank) {
        console.log(`  📝 ${awayTeam}${awayRank ? ` (#${awayRank})` : ''} vs ${homeTeam}${homeRank ? ` (#${homeRank})` : ''}`);
      }
    }
  }
  
  // Commit batch
  if (updateCount > 0) {
    try {
      await batch.commit();
      console.log(`✅ Updated ${updateCount} games with Top 25 rankings for ${leagueKey}`);
    } catch (error) {
      console.error(`❌ Error updating games for ${leagueKey}:`, error);
    }
  } else {
    console.log(`ℹ️ No games needed updating for ${leagueKey}`);
  }
}

// Cloud Function handler
exports.channelLookupHandler = async (req, res) => {
  try {
    console.log('🚀 Starting channel lookup process from Google Sheets...');
    
    // Get today's date in Mountain Time (matches Firestore gameDate timezone)
    const nowInMountain = DateTime.now().setZone('America/Denver');
    const todayStrMountain = nowInMountain.toISODate();
    
    // Also get Eastern date for reference (Google Sheets uses EST)
    const nowInEastern = DateTime.now().setZone('America/New_York');
    const todayStrEastern = nowInEastern.toISODate();
    
    console.log(`Today's date (Mountain/UTC-6): ${todayStrMountain}`);
    console.log(`Today's date (Eastern): ${todayStrEastern}`);
    
    // Get today's games from sportsGames (contains ESPN/NCAA API games)
    // Firestore stores gameDate in Mountain Time (UTC-6)
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    
    // Query using Mountain Time date (matches Firestore storage)
    let snapshot = await gamesRef.where('gameDate', '==', todayStrMountain).get();
    
    // If no games found and dates differ, try Eastern date (fallback)
    if (snapshot.empty && todayStrMountain !== todayStrEastern) {
      console.log(`No games found for Mountain date, trying Eastern date as fallback...`);
      snapshot = await gamesRef.where('gameDate', '==', todayStrEastern).get();
    }
    
    // Use Mountain Time date as primary for matching (matches Firestore)
    const todayStr = todayStrMountain;
    
    if (snapshot.empty) {
      console.log('❌ No games found for today');
      res.status(200).send('No games found for today');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} games for today`);
    
    // Convert to array
    const games = [];
    snapshot.forEach(doc => {
      games.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter games that need channel lookup (leagues in our sheet mapping)
    const gamesNeedingChannels = games.filter(game => {
      const sheetMapping = getSheetMapping(game.League, game.Sport);
      if (sheetMapping) {
        console.log(`✅ Game needs channel lookup: ${game['Away Team']} @ ${game['Home Team']} (League: "${game.League}", Sport: "${game.Sport}")`);
      }
      return sheetMapping !== null;
    });
    
    console.log(`📋 ${gamesNeedingChannels.length} games need channel lookup from Google Sheets`);
    
    // Debug: Show sample games
    if (gamesNeedingChannels.length > 0) {
      const sample = gamesNeedingChannels[0];
      console.log(`🔍 Sample game: League="${sample.League}", Sport="${sample.Sport}", Home="${sample['Home Team']}", Away="${sample['Away Team']}", gameDate="${sample.gameDate}"`);
    }
    
    // Pre-load team alias mappings before matching
    await loadTeamAliasMappings();
    
    // Get channel data from Google Sheets
    const channelMap = await getChannelDataFromSheets(gamesNeedingChannels, todayStr);
    console.log(`📊 Channel map size: ${channelMap.size}`);
    
    // Get league-wide channels
    const leagueChannelMap = await getLeagueWideChannels();
    
    // Update games with channel data
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const game of gamesNeedingChannels) {
      let channel = null;
      
      // First, check for team-specific channel data from Google Sheets
      const gameDate = game.gameDate || todayStr;
      const gameLeague = game.League || null;
      const normalizedHome = normalizeTeamName(game['Home Team'] || '', gameLeague);
      const normalizedAway = normalizeTeamName(game['Away Team'] || '', gameLeague);
      
      // Try both possible orders
      const key1 = `${normalizedHome}|${normalizedAway}|${gameDate}`;
      const key2 = `${normalizedAway}|${normalizedHome}|${gameDate}`;
      channel = channelMap.get(key1) || channelMap.get(key2);
      
      // Debug: Show what we're looking for
      if (!channel) {
        console.log(`🔍 Looking for channel: keys="${key1}" or "${key2}"`);
        console.log(`   Available keys in map: ${Array.from(channelMap.keys()).slice(0, 5).join(', ')}${channelMap.size > 5 ? '...' : ''}`);
      }
      
      // If no team-specific channel, check for league-wide channel
      if (!channel && game.League) {
        channel = leagueChannelMap.get(game.League);
        if (channel) {
          console.log(`📺 Using league-wide channel for ${game.League}: ${channel}`);
        }
      }
      
      // Only update if we found a channel and game doesn't already have one from ESPN API
      // (ESPN API channels take precedence, but we override if ESPN didn't provide one)
      if (channel) {
        const docRef = gamesRef.doc(game.id);
        batch.update(docRef, { channel });
        updatedCount++;
        console.log(`✅ Added channel "${channel}" to ${game['Away Team']} @ ${game['Home Team']} (${game.League})`);
      } else {
        console.log(`❌ No channel found for ${game['Away Team']} @ ${game['Home Team']} (League: ${game.League}, Date: ${gameDate})`);
        console.log(`   Normalized: Home="${normalizedHome}", Away="${normalizedAway}"`);
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`🎉 Successfully updated ${updatedCount} games with channel data from Google Sheets`);
    } else {
      console.log('⚠️  No channel data found to update');
    }
    
    // Also sync Top 25 rankings for NCAAM and NCAAW (NCAAF stays hardcoded)
    console.log('\n📊 Syncing Top 25 rankings to games...');
    await syncTop25ToGames('NCAAM');
    await syncTop25ToGames('NCAAW');
    
    res.status(200).send(`Successfully updated ${updatedCount} games with channel data and synced Top 25 rankings`);
    
  } catch (error) {
    console.error('💥 Error in channel lookup:', error);
    res.status(500).send('Error in channel lookup: ' + error.message);
  }
};
