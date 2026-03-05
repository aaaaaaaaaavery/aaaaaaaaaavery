const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Google Sheets configuration
const TOP25_SPREADSHEET_ID = '1IoUR6NrMU6HtEu0tr8rxiZg3CDJCTxZ1k4xxL_ZENsw';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// League to collection mapping
const LEAGUE_TO_COLLECTION_MAP = {
  'NCAAM': 'NCAAMStandings',
  'NCAAW': 'NCAAWStandings'
};

// Initialize Google Sheets API
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: SCOPES
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// Normalize team name for matching (lowercase, remove special chars, trim)
// CRITICAL: "Michigan State", "Michigan St.", "Michigan St" are all the SAME team - normalize to "michigan state"
// "Michigan" (without St/State) is a DIFFERENT team - stays as "michigan"
function normalizeTeamName(name) {
  if (!name) return '';
  // Remove first-place votes like "(35)" or "(16)"
  let normalized = name.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
  
  // Remove special characters and normalize whitespace
  normalized = normalized
    .replace(/[^\w\s]/g, '') // Remove special characters (including periods)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // CRITICAL: Normalize all "Michigan St" variants to "michigan state" so they all match
  // "Michigan St", "Michigan St.", "Michigan State" → "michigan state"
  if (/^michigan\s+st$/.test(normalized)) {
    return 'michigan state'; // "Michigan St" or "Michigan St." → "michigan state"
  }
  if (normalized === 'michigan state') {
    return 'michigan state'; // "Michigan State" → "michigan state"
  }
  
  // "Michigan" (exact, no St/State) stays as "michigan" - different team
  return normalized;
}

// Read Top 25 rankings from Google Sheets
async function readTop25FromSheet(sheetName) {
  try {
    console.log(`\n📖 Reading Top 25 rankings from ${sheetName} sheet...`);
    
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: TOP25_SPREADSHEET_ID,
      range: `${sheetName}!A:B` // Rank and Team columns
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.log(`No data found in ${sheetName} sheet`);
      return [];
    }
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    const rankings = [];
    for (const row of dataRows) {
      if (row.length < 2 || !row[0] || !row[1]) continue; // Skip incomplete rows
      
      const rank = parseInt(row[0]);
      const teamName = String(row[1]).trim();
      
      if (isNaN(rank) || !teamName) continue; // Skip invalid rows
      
      rankings.push({
        rank: rank,
        team: teamName
      });
    }
    
    console.log(`  Found ${rankings.length} Top 25 rankings in ${sheetName}`);
    return rankings;
    
  } catch (error) {
    console.error(`Error reading ${sheetName} sheet:`, error.message);
    return [];
  }
}

// Update Firestore standings collection with Top 25 rankings
async function updateStandingsWithTop25(leagueKey, rankings) {
  try {
    console.log(`\n🔄 Updating ${leagueKey} standings with Top 25 rankings...`);
    
    const collectionName = LEAGUE_TO_COLLECTION_MAP[leagueKey];
    if (!collectionName) {
      console.error(`Unknown league: ${leagueKey}`);
      return;
    }
    
    const collectionRef = db.collection(collectionName);
    
    // Get all teams from standings collection
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
      console.log(`No teams found in ${collectionName} collection`);
      return;
    }
    
    // Create a map of normalized team names to rankings for fast lookup
    const rankingsMap = {};
    for (const ranking of rankings) {
      const normalized = normalizeTeamName(ranking.team);
      rankingsMap[normalized] = ranking.rank;
      
      // Also store the original team name for exact matching
      rankingsMap[ranking.team.toLowerCase()] = ranking.rank;
    }
    
    // Update teams with Top 25 rankings
    const batch = db.batch();
    let updateCount = 0;
    let matchedCount = 0;
    
    snapshot.docs.forEach(doc => {
      const teamData = doc.data();
      const teamName = teamData.Team || '';
      
      if (!teamName) return;
      
      // Try to find matching ranking
      const normalizedTeamName = normalizeTeamName(teamName);
      
      // CRITICAL: Explicit check to prevent "Michigan" from matching "Michigan St." variants
      // If teamName is exactly "Michigan" (case-insensitive), it must ONLY match "Michigan"
      const isExactMichigan = teamName.trim().toLowerCase() === 'michigan';
      const isMichiganStateVariant = /michigan\s+(st\.?|state)/i.test(teamName);
      
      let rank = rankingsMap[normalizedTeamName] || rankingsMap[teamName.toLowerCase()];
      
      // If no exact match, try exact matching only (NO partial/substring matching)
      if (!rank) {
        for (const ranking of rankings) {
          const normalizedRanking = normalizeTeamName(ranking.team);
          
          // ENFORCE: "Michigan" can NEVER match "Michigan St." variants
          const rankingIsExactMichigan = ranking.team.trim().toLowerCase() === 'michigan';
          const rankingIsMichiganStateVariant = /michigan\s+(st\.?|state)/i.test(ranking.team);
          
          // Block match if one is "Michigan" and other is "Michigan St." variant
          if (isExactMichigan && rankingIsMichiganStateVariant) {
            continue; // Skip - "Michigan" cannot match "Michigan St."
          }
          if (isMichiganStateVariant && rankingIsExactMichigan) {
            continue; // Skip - "Michigan St." cannot match "Michigan"
          }
          
          // Only match if names are exactly equal after normalization
          if (normalizedTeamName === normalizedRanking) {
            rank = ranking.rank;
            matchedCount++;
            break;
          }
        }
      } else {
        // Double-check: if we found a match, verify it's not a false match
        // (e.g., "Michigan" matching "Michigan St.")
        const matchedRanking = rankings.find(r => {
          const norm = normalizeTeamName(r.team);
          return norm === normalizedTeamName || r.team.toLowerCase() === teamName.toLowerCase();
        });
        
        if (matchedRanking) {
          const matchedIsExactMichigan = matchedRanking.team.trim().toLowerCase() === 'michigan';
          const matchedIsMichiganStateVariant = /michigan\s+(st\.?|state)/i.test(matchedRanking.team);
          
          // Block if one is "Michigan" and other is "Michigan St." variant
          if ((isExactMichigan && matchedIsMichiganStateVariant) ||
              (isMichiganStateVariant && matchedIsExactMichigan)) {
            rank = null; // Clear the false match
          } else {
            matchedCount++;
          }
        } else {
          matchedCount++;
        }
      }
      
      // Update the team document with Top25Rank
      const currentRank = teamData.Top25Rank || null;
      if (rank !== currentRank) {
        batch.update(doc.ref, {
          Top25Rank: rank || null,
          lastUpdated: new Date().toISOString()
        });
        updateCount++;
        
        if (rank) {
          console.log(`  ✅ ${teamName}: Rank ${rank}${currentRank !== null ? ` (was ${currentRank})` : ''}`);
        } else if (currentRank !== null) {
          console.log(`  🗑️ ${teamName}: Removed rank (was ${currentRank})`);
        }
      }
    });
    
    // Commit batch updates
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Updated ${updateCount} teams with Top 25 rankings (${matchedCount} matched)`);
    } else {
      console.log(`\nℹ️ No teams needed updating (${matchedCount} already matched)`);
    }
    
  } catch (error) {
    console.error(`Error updating ${leagueKey} standings:`, error);
    throw error;
  }
}

// Import Top 25 rankings for a specific league
async function importTop25ForLeague(leagueKey) {
  try {
    console.log(`\n📊 Importing Top 25 rankings for ${leagueKey}...`);
    
    // Read rankings from Google Sheets
    const rankings = await readTop25FromSheet(leagueKey);
    
    if (rankings.length === 0) {
      console.log(`No rankings found for ${leagueKey}, skipping...`);
      return;
    }
    
    // Update Firestore standings collection
    await updateStandingsWithTop25(leagueKey, rankings);
    
    console.log(`✅ Successfully imported Top 25 rankings for ${leagueKey}`);
    
  } catch (error) {
    console.error(`❌ Failed to import Top 25 rankings for ${leagueKey}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Top 25 rankings import from Google Sheets...\n');
    
    // Import for all NCAA leagues (NCAAF is hardcoded, so only import NCAAM and NCAAW)
    await importTop25ForLeague('NCAAM');
    await importTop25ForLeague('NCAAW');
    
    console.log('\n✅ Top 25 rankings import completed!');
    console.log('\n💡 Next step: Run sync-top25-to-games.cjs to sync rankings to game documents');
    
  } catch (error) {
    console.error('\n❌ Error importing Top 25 rankings:', error);
    process.exit(1);
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { importTop25ForLeague };

