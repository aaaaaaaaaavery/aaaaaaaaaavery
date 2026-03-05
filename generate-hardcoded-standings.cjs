const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Map of league keys to Firestore collection names (matching frontend collectionMap)
const LEAGUE_COLLECTION_MAP = {
  'PremierLeague': 'EPLStandings',
  'LaLiga': 'LaLigaStandings',
  'SerieA': 'SerieAStandings',
  'Bundesliga': 'BundesligaStandings',
  'Ligue1': 'Ligue1Standings',
  'MLS': 'MLSStandings',
  'LigaMX': 'LigaMXStandings',
  'NWSL': 'NWSLStandings',
  'UEFAEuropaLeague': 'UEFAEuropaLeagueStandings',
  'UEFAConferenceLeague': 'UEFAConferenceLeagueStandings',
  'NFL': 'NFLStandings',
  'MLB': 'MLBStandings',
  'NBA': 'NBAStandings',
  'NHL': 'NHLStandings',
  'NCAAF': 'NCAAFStandings',
  'NCAAM': 'NCAAMStandings',
  'NCAAW': 'NCAAWStandings',
  'UEFAChampionsLeague': 'standings', // Uses generic standings collection with league field
  'AFCChampionsLeague': 'AFCChampionsLeagueStandings',
  'WNBA': 'standings', // Uses generic standings collection with league field
  'FormulaOne': 'F1DriverStandings', // F1 has special handling
  'FACup': 'FACupStandings',
  'PGATour': 'PGATourStandings',
  'LPGATour': 'LPGATourStandings',
  'UFC': 'UFCStandings',
  'Boxing': 'BoxingStandings',
  'NASCARCupSeries': 'NASCARCupSeriesStandings',
  'Tennis': 'TennisStandings',
  'LIVGolf': 'LIVGolfStandings',
  'IndyCar': 'IndyCarStandings',
  'MotoGP': 'MotoGPStandings',
  'TrackAndField': 'TrackAndFieldStandings',
  'Soccer': 'SoccerStandings',
  'NCAABaseball': 'NCAABaseballStandings',
  'NCAASoftball': 'NCAASoftballStandings',
  'WorldCupU17': 'WorldCupU17Standings',
  'WorldCupU17PlayOffs': 'WorldCupU17PlayOffsStandings'
};

// Map for generic standings collection (uses league field)
const GENERIC_STANDINGS_LEAGUES = {
  'UEFAChampionsLeague': 'UEFAChampionsLeague',
  'WNBA': 'WNBA'
};

// Firestore key mapping (for generic standings collection)
const FIRESTORE_KEY_MAP = {
  'UEFAChampionsLeague': 'UEFAChampionsLeague',
  'WNBA': 'WNBA'
};

/**
 * Serialize Firestore data to plain JavaScript objects
 */
function serializeFirestoreData(data) {
  if (!data) return null;
  
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        // Firestore Timestamp
        result[key] = value.toDate().toISOString();
      } else if (value._seconds !== undefined) {
        // Firestore Timestamp (alternative format)
        result[key] = new Date(value._seconds * 1000).toISOString();
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => serializeFirestoreData(item));
      } else {
        result[key] = serializeFirestoreData(value);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Normalize field names to match frontend expectations
 */
function normalizeFieldNames(rowObject, leagueKey) {
  const normalized = { ...rowObject };
  
  // Common field name mappings
  const fieldMappings = {
    // Team/Player/Driver names
    'Team': ['Team', 'Player', 'Golfer', 'Driver', 'Rider', 'Fighter', 'Name', 'Athlete'],
    'Rank': ['Rank', 'Rk', 'Ranking', 'Position', 'Pos'],
    'Points': ['Points', 'Pts', 'Score', 'Total Points'],
    'MP': ['MP', 'MatchesPlayed', 'Matches', 'GP', 'Games Played', 'Games'],
    'Wins': ['Wins', 'W', 'Win', 'Victories'],
    'Losses': ['Losses', 'L', 'Loss'],
    'Draws': ['Draws', 'D', 'Draw', 'Ties', 'T'],
    'PCT': ['PCT', 'Win%', 'Win Percentage', 'Percentage'],
    'GF': ['GF', 'Goals For', 'GoalsFor'],
    'GA': ['GA', 'Goals Against', 'GoalsAgainst'],
    'GD': ['GD', 'Goal Difference', 'GoalDiff', 'Diff']
  };
  
  // Apply mappings - always try to find the best match
  for (const [targetField, sourceFields] of Object.entries(fieldMappings)) {
    // First check if target field already exists and has a value
    if (normalized[targetField] && normalized[targetField] !== '' && normalized[targetField] !== null && normalized[targetField] !== undefined) {
      continue; // Already has a value
    }
    
    // Try to find a match from source fields (case-insensitive)
    for (const sourceField of sourceFields) {
      // Check exact match first
      if (normalized[sourceField] !== undefined && normalized[sourceField] !== null && normalized[sourceField] !== '') {
        normalized[targetField] = normalized[sourceField];
        break;
      }
      
      // Check case-insensitive match
      const sourceFieldLower = sourceField.toLowerCase();
      for (const key in normalized) {
        if (key.toLowerCase() === sourceFieldLower && normalized[key] !== undefined && normalized[key] !== null && normalized[key] !== '') {
          normalized[targetField] = normalized[key];
          break;
        }
      }
      if (normalized[targetField]) break;
    }
  }
  
  // League-specific normalizations
  if (leagueKey === 'UFC' || leagueKey === 'Boxing') {
    // UFC/Boxing: Rank, Fighter, Record (weight divisions as headers, men/women tabs)
    if (!normalized.Team && normalized.Fighter) {
      normalized.Team = normalized.Fighter;
    }
    if (!normalized.Team && normalized.Name) {
      normalized.Team = normalized.Name;
    }
    // Preserve Record field - map various formats
    if (!normalized.Record) {
      normalized.Record = normalized['Record'] || normalized['W-L'] || normalized['Wins-Losses'] || normalized['W/L'] || '';
    }
    // Ensure Fighter field exists (for frontend display)
    if (!normalized.Fighter && normalized.Team) {
      normalized.Fighter = normalized.Team;
    }
    // Preserve Division/Weight Class field for grouping (check multiple possible field names)
    if (!normalized.Division) {
      normalized.Division = normalized['Division'] || normalized['Weight Class'] || normalized['WeightClass'] || normalized['Classification'] || normalized['Weight'] || '';
    }
    // Also preserve original field names for compatibility
    if (rowObject['Weight Class'] && !normalized['Weight Class']) {
      normalized['Weight Class'] = rowObject['Weight Class'];
    }
    if (rowObject['WeightClass'] && !normalized['WeightClass']) {
      normalized['WeightClass'] = rowObject['WeightClass'];
    }
    if (rowObject['Classification'] && !normalized['Classification']) {
      normalized['Classification'] = rowObject['Classification'];
    }
  }
  
  if (leagueKey === 'IndyCar' || leagueKey === 'NASCARCupSeries' || leagueKey === 'FormulaOne') {
    // IndyCar, NASCAR, FormulaOne: Rank, Driver, Points
    if (!normalized.Team && normalized.Driver) {
      normalized.Team = normalized.Driver;
    }
    if (!normalized.Team && normalized.Name) {
      normalized.Team = normalized.Name;
    }
    // Ensure Points is mapped (Pts -> Points)
    if (!normalized.Points && normalized.Pts) {
      normalized.Points = normalized.Pts;
    }
  }
  
  if (leagueKey === 'MotoGP') {
    // MotoGP: Rank, Rider, Points (use Rider field, not Team)
    // Map Name/Rider to Rider field (frontend expects Rider)
    if (normalized.Rider) {
      // Keep Rider as-is
    } else if (normalized.Name) {
      normalized.Rider = normalized.Name;
    } else if (normalized.Team) {
      normalized.Rider = normalized.Team;
    }
    // Also keep Team for backward compatibility, but prefer Rider
    if (!normalized.Team && normalized.Rider) {
      normalized.Team = normalized.Rider;
    }
    // Ensure Points is mapped (Pts -> Points)
    if (!normalized.Points && normalized.Pts) {
      normalized.Points = normalized.Pts;
    }
  }
  
  if (leagueKey === 'PGATour' || leagueKey === 'LPGATour') {
    // PGA Tour, LPGA Tour: Rank, Name, Avg. Pts
    if (!normalized.Team && normalized.Name) {
      normalized.Team = normalized.Name;
    }
    if (!normalized.Team && normalized.Golfer) {
      normalized.Team = normalized.Golfer;
    }
    if (!normalized.Team && normalized.Player) {
      normalized.Team = normalized.Player;
    }
    // Map "Avg. Pts" or "Avg Pts" to Points, but also keep original field name for display
    if (normalized['Avg. Pts'] || normalized['Avg Pts'] || normalized['Avg Pts.']) {
      normalized.Points = normalized['Avg. Pts'] || normalized['Avg Pts'] || normalized['Avg Pts.'];
      normalized['Avg. Pts'] = normalized.Points; // Keep for frontend display
    }
    if (!normalized.Points && normalized.Pts) {
      normalized.Points = normalized.Pts;
    }
  }
  
  if (leagueKey === 'Tennis') {
    // Tennis: Rank, Name, Pts (ATP/WTA tabs)
    if (!normalized.Team && normalized.Name) {
      normalized.Team = normalized.Name;
    }
    if (!normalized.Team && normalized.Player) {
      normalized.Team = normalized.Player;
    }
    // Ensure Points is mapped (Pts -> Points)
    if (!normalized.Points && normalized.Pts) {
      normalized.Points = normalized.Pts;
    }
  }
  
  return normalized;
}

/**
 * Fetch standings for a specific league from Firestore
 */
async function fetchStandingsForLeague(leagueKey, collectionName, firestoreKey) {
  try {
    let teams = [];
    
    if (collectionName === 'standings' && firestoreKey) {
      // Generic standings collection - query by league field
      const snapshot = await db.collection('standings')
        .where('league', '==', firestoreKey)
        .get();
      
      if (!snapshot.empty) {
        teams = snapshot.docs.map(doc => serializeFirestoreData(doc.data()));
      }
    } else {
      // Collection-based standings
      // First check for CSV format (data document with headers/rows)
      const dataDoc = await db.collection(collectionName).doc('data').get();
      
      if (dataDoc.exists) {
        const csvData = dataDoc.data();
        if (csvData.headers && csvData.rows) {
          // Log CSV headers for debugging
          console.log(`📋 ${leagueKey} CSV headers:`, csvData.headers);
          
          // Convert CSV format to array of objects
          const convertedRows = csvData.rows.map(rowObj => {
            // rowObj is an object with numeric string keys like { "0": "value1", "1": "value2" }
            const numKeys = Object.keys(rowObj).map(k => parseInt(k)).sort((a, b) => a - b);
            const rowArray = numKeys.map(key => rowObj[key.toString()] || '');
            
            // Convert array to object using headers
            const rowObject = {};
            csvData.headers.forEach((header, index) => {
              rowObject[header] = rowArray[index] || '';
            });
            
            // Normalize field names to match frontend expectations
            return normalizeFieldNames(rowObject, leagueKey);
          });
          teams = convertedRows;
        }
      } else {
        // Fallback: try individual documents format
        const snapshot = await db.collection(collectionName).get();
        
        if (!snapshot.empty) {
          teams = snapshot.docs.map(doc => serializeFirestoreData(doc.data()));
        }
      }
    }
    
    return teams;
  } catch (error) {
    console.error(`Error fetching ${leagueKey} standings:`, error);
    return [];
  }
}

/**
 * Generate hardcoded standings JavaScript code
 */
async function generateHardcodedStandings() {
  console.log('📊 Generating hardcoded standings from Firestore...\n');
  
  // Leagues that are hardcoded directly in HTML and should NOT be overwritten
  const HARDCODED_LEAGUES = ['Tennis', 'Boxing', 'LPGATour', 'UFC', 'NCAAF', 'MLS', 'NWSL', 'PGATour'];
  
  const allStandings = {};
  
  // Fetch standings for all leagues (except hardcoded ones)
  for (const [leagueKey, collectionName] of Object.entries(LEAGUE_COLLECTION_MAP)) {
    // Skip leagues that are hardcoded directly in HTML
    if (HARDCODED_LEAGUES.includes(leagueKey)) {
      console.log(`⏭️  ${leagueKey}: Skipped (hardcoded directly in HTML)`);
      continue;
    }
    const firestoreKey = FIRESTORE_KEY_MAP[leagueKey] || leagueKey;
    
    // Special handling for Tennis (ATP + WTA)
    if (leagueKey === 'Tennis') {
      const atpTeams = await fetchStandingsForLeague(leagueKey, collectionName, firestoreKey);
      // Try to fetch WTA data (might be in separate document or collection)
      let wtaTeams = [];
      try {
        const wtaDataDoc = await db.collection(collectionName).doc('data-wta').get();
        if (wtaDataDoc.exists) {
          const wtaCsvData = wtaDataDoc.data();
          if (wtaCsvData.headers && wtaCsvData.rows) {
            wtaTeams = wtaCsvData.rows.map(rowObj => {
              const numKeys = Object.keys(rowObj).map(k => parseInt(k)).sort((a, b) => a - b);
              const rowArray = numKeys.map(key => rowObj[key.toString()] || '');
              const rowObject = {};
              wtaCsvData.headers.forEach((header, index) => {
                rowObject[header] = rowArray[index] || '';
              });
              const normalized = normalizeFieldNames(rowObject, leagueKey);
              normalized.Gender = 'WTA';
              return normalized;
            });
          }
        }
      } catch (wtaError) {
        console.error('Error fetching WTA data:', wtaError);
      }
      
      // Mark ATP teams
      atpTeams.forEach(team => { team.Gender = 'ATP'; });
      
      // Combine ATP and WTA
      const allTennisTeams = [...atpTeams, ...wtaTeams];
      if (allTennisTeams.length > 0) {
        allStandings[leagueKey] = allTennisTeams;
        console.log(`✅ ${leagueKey}: ${atpTeams.length} ATP + ${wtaTeams.length} WTA = ${allTennisTeams.length} total`);
      } else {
        console.log(`⚠️  ${leagueKey}: No data found`);
      }
    }
    // Special handling for UFC and Boxing (men + women)
    else if (leagueKey === 'UFC' || leagueKey === 'Boxing') {
      const menTeams = await fetchStandingsForLeague(leagueKey, collectionName, firestoreKey);
      // Try to fetch women's data
      let womenTeams = [];
      try {
        const womenDataDoc = await db.collection(collectionName).doc('data-women').get();
        if (womenDataDoc.exists) {
          const womenCsvData = womenDataDoc.data();
          if (womenCsvData.headers && womenCsvData.rows) {
            womenTeams = womenCsvData.rows.map(rowObj => {
              const numKeys = Object.keys(rowObj).map(k => parseInt(k)).sort((a, b) => a - b);
              const rowArray = numKeys.map(key => rowObj[key.toString()] || '');
              const rowObject = {};
              womenCsvData.headers.forEach((header, index) => {
                rowObject[header] = rowArray[index] || '';
              });
              const normalized = normalizeFieldNames(rowObject, leagueKey);
              normalized.Gender = 'F';
              return normalized;
            });
          }
        }
      } catch (womenError) {
        console.error(`Error fetching ${leagueKey} women data:`, womenError);
      }
      
      // Mark men's teams
      menTeams.forEach(team => { team.Gender = 'M'; });
      
      // Combine men and women
      const allCombatTeams = [...menTeams, ...womenTeams];
      if (allCombatTeams.length > 0) {
        allStandings[leagueKey] = allCombatTeams;
        console.log(`✅ ${leagueKey}: ${menTeams.length} men + ${womenTeams.length} women = ${allCombatTeams.length} total`);
      } else {
        console.log(`⚠️  ${leagueKey}: No data found`);
      }
    }
    // Standard leagues
    else {
      const teams = await fetchStandingsForLeague(leagueKey, collectionName, firestoreKey);
      
      if (teams.length > 0) {
        allStandings[leagueKey] = teams;
        console.log(`✅ ${leagueKey}: ${teams.length} teams`);
      } else {
        console.log(`⚠️  ${leagueKey}: No data found`);
      }
    }
  }
  
  // Also fetch F1 Constructor standings separately
  try {
    const f1ConstructorSnapshot = await db.collection('F1ConstructorStandings').get();
    if (!f1ConstructorSnapshot.empty) {
      const f1Constructors = f1ConstructorSnapshot.docs.map(doc => serializeFirestoreData(doc.data()));
      allStandings['F1ConstructorStandings'] = f1Constructors;
      console.log(`✅ F1ConstructorStandings: ${f1Constructors.length} constructors`);
    }
  } catch (error) {
    console.error('Error fetching F1 Constructor standings:', error);
  }
  
  // Generate JavaScript code
  let jsCode = '\n    // ============================================\n';
  jsCode += '    // HARDCODED STANDINGS DATA (Generated by scrapers)\n';
  jsCode += '    // ============================================\n';
  jsCode += '    // This data is read from Firestore once per day when scrapers run\n';
  jsCode += '    // All users get the same hardcoded data - no Firestore reads per user\n';
  jsCode += '    // ============================================\n\n';
  jsCode += '    const HARDCODED_STANDINGS = ' + JSON.stringify(allStandings, null, 4) + ';\n\n';
  
  return jsCode;
}

/**
 * Update HTML file with hardcoded standings
 */
async function updateHTMLWithStandings() {
  const htmlPath = path.join(__dirname, 'index (1).html');
  
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML file not found: ${htmlPath}`);
  }
  
  // Leagues that are hardcoded directly in HTML and should NOT be overwritten.
  const HARDCODED_LEAGUES = ['Tennis', 'Boxing', 'LPGATour', 'UFC', 'NCAAF', 'MLS', 'NWSL', 'PGATour'];
  
  // Read HTML file
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Generate hardcoded standings code from Firestore
  const newStandings = await generateHardcodedStandings();
  
  // Find the marker or create one if it doesn't exist
  const markerStart = '// HARDCODED_STANDINGS_START';
  const markerEnd = '// HARDCODED_STANDINGS_END';
  
  if (htmlContent.includes(markerStart) && htmlContent.includes(markerEnd)) {
    // Extract existing hardcoded standings to preserve hardcoded leagues
    const startIndex = htmlContent.indexOf(markerStart);
    const endIndex = htmlContent.indexOf(markerEnd);
    const existingSection = htmlContent.substring(startIndex, endIndex);
    
    // Try to extract existing HARDCODED_STANDINGS object
    let existingStandings = {};
    try {
      // Find the HARDCODED_STANDINGS object in the existing section
      const standingsMatch = existingSection.match(/const HARDCODED_STANDINGS = ({[\s\S]*?});/);
      if (standingsMatch) {
        const standingsStr = standingsMatch[1];
        // Use JSON.parse after cleaning up any trailing commas
        const cleanedStr = standingsStr.replace(/,(\s*[}\]])/g, '$1');
        existingStandings = JSON.parse(cleanedStr);
      }
    } catch (e) {
      console.warn('⚠️  Could not parse existing standings, will overwrite:', e.message);
    }
    
    // Parse new standings from Firestore
    let newStandingsObj = {};
    try {
      const newStandingsMatch = newStandings.match(/const HARDCODED_STANDINGS = ({[\s\S]*?});/);
      if (newStandingsMatch) {
        const newStandingsStr = newStandingsMatch[1];
        // Use JSON.parse after cleaning up any trailing commas
        const cleanedStr = newStandingsStr.replace(/,(\s*[}\]])/g, '$1');
        newStandingsObj = JSON.parse(cleanedStr);
      }
    } catch (e) {
      console.warn('⚠️  Could not parse new standings:', e.message);
    }
    
    // Merge: preserve hardcoded leagues, update others from Firestore
    const mergedStandings = { ...newStandingsObj };
    for (const league of HARDCODED_LEAGUES) {
      if (existingStandings[league]) {
        mergedStandings[league] = existingStandings[league];
        console.log(`✅ Preserved hardcoded ${league} standings (${Array.isArray(existingStandings[league]) ? existingStandings[league].length : 'N/A'} entries)`);
      }
    }
    
    // Generate merged JavaScript code
    let mergedCode = '\n    // ============================================\n';
    mergedCode += '    // HARDCODED STANDINGS DATA (Generated by scrapers)\n';
    mergedCode += '    // ============================================\n';
    mergedCode += '    // This data is read from Firestore once per day when scrapers run\n';
    mergedCode += '    // All users get the same hardcoded data - no Firestore reads per user\n';
    mergedCode += '    // ============================================\n\n';
    mergedCode += '    const HARDCODED_STANDINGS = ' + JSON.stringify(mergedStandings, null, 4) + ';\n\n';
    
    // Replace existing hardcoded standings
    htmlContent = htmlContent.substring(0, startIndex) + 
                  markerStart + '\n' + mergedCode + markerEnd + '\n' + 
                  htmlContent.substring(endIndex + markerEnd.length);
    console.log('\n✅ Updated existing hardcoded standings in HTML (preserved hardcoded leagues)');
  } else {
    // Find a good place to insert (after LEAGUE_DATA_CONFIG, before other scripts)
    const insertMarker = 'const LEAGUE_DATA_CONFIG = {';
    const insertIndex = htmlContent.indexOf(insertMarker);
    
    if (insertIndex === -1) {
      throw new Error('Could not find insertion point in HTML file');
    }
    
    // Find the end of LEAGUE_DATA_CONFIG object
    let braceCount = 0;
    let foundStart = false;
    let configEndIndex = insertIndex;
    
    for (let i = insertIndex; i < htmlContent.length; i++) {
      if (htmlContent[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (htmlContent[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          configEndIndex = i + 1;
          break;
        }
      }
    }
    
    // Insert after LEAGUE_DATA_CONFIG
    htmlContent = htmlContent.substring(0, configEndIndex) + 
                  '\n\n    ' + markerStart + '\n' + standingsCode + '    ' + markerEnd + '\n' + 
                  htmlContent.substring(configEndIndex);
    console.log('\n✅ Inserted hardcoded standings into HTML');
  }
  
  // Write updated HTML file
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('\n✅ Successfully updated HTML file with hardcoded standings');
}

// Run if executed directly
if (require.main === module) {
  updateHTMLWithStandings()
    .then(() => {
      console.log('\n✅ Hardcoded standings generation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error generating hardcoded standings:', error);
      process.exit(1);
    });
}

module.exports = { updateHTMLWithStandings, generateHardcodedStandings };

