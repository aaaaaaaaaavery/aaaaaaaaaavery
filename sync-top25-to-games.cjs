const admin = require('firebase-admin');
const { getDisplayNameFromSupplemental, doTeamNamesMatch, getAllTeamNameVariations, loadMappingsFromFirestore } = require('./supplemental-team-mappings-util.cjs');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Team display name mappings (from index.html getTeamDisplayName)
const TEAM_DISPLAY_MAP = {
  NCAAM: {
    "Oklahoma State": "OK State",
    "Arkansas Baptist": "Ark Baptist",
    "NC Greensboro": "UNC-Greensb",
    "Missouri Southern State": "MO So. State",
    "Penn State-York": "Penn St-York",
    "UMBC Retrievers": "UMBC",
    "Converse Valkyries": "Converse",
    "East Tennessee St": "E Tenn State",
    "Caldwell College": "Caldwell",
    "Georgia Southern": "GA Southern",
    "EWU Phantoms": "East West U",
    "SIU Edwardsville": "SIU-Edwardsv",
    "Siu Edwardsville": "SIU-E",
    "Mount St. Mary's": "Mt. St. Mary's",
    "St. Joseph's (Brooklyn)": "St. Joseph's",
    "N. Carolina A&T": "NC A&T",
    "South Carolina": "S Carolina",
    "West Coast Baptist": "W Coast Bapt",
    "Utah Valley State": "Utah Valley St",
    "CBS Ambassadors": "CBS",
    "San Diego State": "San Diego St",
    "San Diego Toreros": "San Diego",
    "San Francisco State": "SF State",
    "UC Santa Barbara": "UCSB",
    "New Mexico State": "NM State",
    "Humboldt State": "Humboldt",
    "Dominican Penguins": "Dominican",
    "Sacramento State": "Sac State",
    "Long Beach State": "LB State",
    "Gilbert Buccaneers": "Park U",
    "Louisiana Tech": "LA Tech"
  },
  NCAAF: {
    "Massachusetts": "UMass"
  },
  NCAAW: {
    "SMU Mustangs": "SMU",
    "Southern Illinois": "So. Illinois",
    "Tennessee Volunteers": "Tennessee",
    "Richmond Spiders": "Richmond",
    "Cincinnati Bearcats": "Cincinnati",
    "New Haven Chargers": "New Haven",
    "Mercyhurst Lakers": "Mercyhurst",
    "Michigan State": "Michigan St",
    "Albany Great Danes": "UAlbany",
    "Kennesaw State": "Kennesaw St",
    "Florida Atlantic": "FAU",
    "Florida Mem.": "FL Memorial",
    "Lipscomb Bisons": "Lipscomb",
    "Virginia Cavaliers": "Virginia",
    "Saint Josephs Hawks": "St Joseph's",
    "St. Peters": "St. Peter's",
    "Illinois Fighting Illini": "Illinois",
    "SE Missouri State": "SE MO State",
    "Providence Friars": "Providence",
    "Houston Christian": "Hou Christian",
    "LSU Tigers": "LSU",
    "Michigan Wolverines": "Michigan",
    "Westminster UT": "Westminster",
    "Colorado State": "Colorado St",
    "Arkansas Razorbacks": "Arkansas",
    "Carroll College": "Carrol Coll.",
    "USC Trojans": "USC",
    "Frostburg State Bobcats": "Frostburg St",
    "Merrimack Warriors": "Merrimack",
    "Bethesda University": "Bethesda",
    "Saint Marys Gaels": "Saint Mary's",
    "Northern New Mexico": "N New Mexico",
    "Northern Colorado": "N Colorado",
    "Westminster Blue Jays": "Westminster",
    "Western Illinois": "W Illinois",
    "Houston Cougars": "Houston"
  }
};

// Get team display name (from index.html getTeamDisplayName logic)
function getTeamDisplayName(name, league = null) {
  if (!name) return '';
  
  // Remove " W" suffix if present (for NWSL)
  let p = name.endsWith(" W") ? name.slice(0, -2) : name;
  
  // If league is specified and has mappings, use league-specific mapping
  if (league && TEAM_DISPLAY_MAP[league]) {
    return TEAM_DISPLAY_MAP[league][p] || p;
  }
  
  // Otherwise, try all leagues (fallback for backward compatibility)
  for (const leagueMap of Object.values(TEAM_DISPLAY_MAP)) {
    if (leagueMap[p]) {
      return leagueMap[p];
    }
  }
  
  // Return original name if no mapping found
  return p;
}

// Cache for supplemental mappings (loaded once)
let supplementalMappingsCache = null;

// Load supplemental mappings once (cached)
async function loadSupplementalMappingsCache(leagueKey) {
  if (supplementalMappingsCache && supplementalMappingsCache[leagueKey]) {
    return supplementalMappingsCache[leagueKey];
  }
  
  if (!supplementalMappingsCache) {
    supplementalMappingsCache = {};
  }
  
  try {
    const canonical = await getDisplayNameFromSupplemental('', leagueKey);
    // Just loading to populate cache - the util handles caching internally
    supplementalMappingsCache[leagueKey] = true;
  } catch (e) {
    // Ignore - mappings may not be available
  }
  
  return true;
}

// Normalize team name for matching (lowercase, remove special chars, trim)
// CRITICAL: "Michigan State", "Michigan St.", "Michigan St" are all the SAME team - normalize to "michigan state"
// "Michigan" (without St/State) is a DIFFERENT team - stays as "michigan"
// NOW WITH ALIAS SUPPORT: Uses supplemental mappings to normalize team names
async function normalizeTeamNameWithAliases(name, leagueKey) {
  if (!name) return '';
  
  // First, try to get canonical name from alias mappings
  if (leagueKey && leagueKey !== 'NCAAF') { // NCAAF stays hardcoded
    try {
      await loadSupplementalMappingsCache(leagueKey);
      const canonicalName = await getDisplayNameFromSupplemental(name, leagueKey);
      if (canonicalName && canonicalName !== name) {
        // Use canonical name for normalization
        name = canonicalName;
      }
    } catch (e) {
      // Fall through to basic normalization
    }
  }
  
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

// Synchronous version for backward compatibility (used in rankings map building)
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

// Get canonical name for matching (just returns the team name)
function getCanonicalNameForMatching(teamName, leagueKey) {
  if (!teamName || !leagueKey) return teamName;
  return teamName;
}

// Get all alias variations for a team name (including the name itself)
// Recursively collects ALL variations in the same alias group (like channel-lookup does)
// This works with supplemental mappings from Firestore
async function getAllAliasVariations(name, leagueKey) {
  if (!name || !leagueKey || leagueKey === 'NCAAF') {
    // NCAAF doesn't use alias mappings, return just the name
    return [name];
  }
  
  // Load mappings if not already loaded
  await loadSupplementalMappingsCache(leagueKey);
  
  // Get mappings from the util (it has its own cache)
  const mappings = await loadMappingsFromFirestore();
  const leagueMappings = mappings[leagueKey];
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
          // Also add the display name for the base name
          const baseDisplayName = leagueMappings[baseName];
          if (baseDisplayName && !processed.has(baseDisplayName)) {
            toProcess.push(baseDisplayName);
          }
        }
      }
    }
  }
  
  return Array.from(variations);
}

// Load Top 25 rankings from standings collection
// Returns a map keyed by normalized team name variations (like channel-lookup does)
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
    
    // Build rankings map: store ranking under ALL alias variations (normalized)
    // Key: normalized variation, Value: ranking data
    // This matches how channel-lookup builds its rankingsMap
    const rankingsMap = {};
    
    for (const doc of snapshot.docs) {
      const teamData = doc.data();
      if (teamData.Top25Rank !== null && teamData.Top25Rank !== undefined && teamData.Team) {
        const teamName = teamData.Team;
        
        // Get ALL variations for this team name (all aliases in the same group)
        // Use recursive getAllAliasVariations (same as channel-lookup)
        const allVariations = await getAllAliasVariations(teamName, leagueKey);
        
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
            const normalized = normalizeTeamName(variation);
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
    // Check if it's women's basketball by checking league name variations
    const leagueLower = league.toLowerCase();
    if (leagueLower.includes('women') || leagueLower.includes('womens')) {
      return 'NCAAW';
    } else {
      return 'NCAAM';
    }
  } else if (league === 'USA: NCAA' && sport === 'American Football') {
    return 'NCAAF';
  }
  
  return null;
}

// Sync Top 25 rankings to games
async function syncTop25ToGames(leagueKey) {
  console.log(`\n🔄 Syncing Top 25 rankings for ${leagueKey}...`);
  
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
    // This matches the approach used in channel-lookup-deploy/index.js
    if (awayTeam) {
      // Get ALL variations for this team (all aliases in the same group)
      const awayVariations = await getAllAliasVariations(awayTeam, leagueKey);
      
      // Try each variation - if any normalized variation exists in rankings map, we have a match
      for (const variation of awayVariations) {
        const normalized = normalizeTeamName(variation);
        if (rankingsMap[normalized]) {
          awayRank = rankingsMap[normalized].rank;
          break; // Found match, stop looking
        }
      }
    }
    
    // Match home team: get ALL aliases, check if any normalized alias exists in rankings map
    if (homeTeam) {
      // Get ALL variations for this team (all aliases in the same group)
      const homeVariations = await getAllAliasVariations(homeTeam, leagueKey);
      
      // Try each variation - if any normalized variation exists in rankings map, we have a match
      for (const variation of homeVariations) {
        const normalized = normalizeTeamName(variation);
        if (rankingsMap[normalized]) {
          homeRank = rankingsMap[normalized].rank;
          break; // Found match, stop looking
        }
      }
    }
    
    // Check if we need to update
    // Frontend expects 'Home Team Ranking' and 'Away Team Ranking' (not 'Rank')
    const currentAwayRank = game['Away Team Ranking'] || game['Away Team Rank'] || game['AwayTeamRank'] || null;
    const currentHomeRank = game['Home Team Ranking'] || game['Home Team Rank'] || game['HomeTeamRank'] || null;
    
    if (awayRank !== currentAwayRank || homeRank !== currentHomeRank) {
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      const gameRef = doc.ref;
      const updateData = {};
      
      // Use 'Home Team Ranking' and 'Away Team Ranking' to match frontend expectations
      if (awayRank !== null) {
        updateData['Away Team Ranking'] = awayRank;
        // Keep old field names for backward compatibility
        updateData['Away Team Rank'] = awayRank;
        updateData['AwayTeamRank'] = awayRank;
      } else {
        updateData['Away Team Ranking'] = null;
        updateData['Away Team Rank'] = null;
        updateData['AwayTeamRank'] = null;
      }
      
      if (homeRank !== null) {
        updateData['Home Team Ranking'] = homeRank;
        // Keep old field names for backward compatibility
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

// Main function
async function main() {
  console.log('🚀 Starting Top 25 rankings sync to games...\n');
  
  try {
    // Sync rankings for all NCAA leagues
    await syncTop25ToGames('NCAAF');
    await syncTop25ToGames('NCAAM');
    await syncTop25ToGames('NCAAW');
    
    console.log('\n✅ Top 25 rankings sync completed!');
  } catch (error) {
    console.error('❌ Error syncing Top 25 rankings:', error);
    process.exit(1);
  }
}

// Run the script
main();

