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
const SUPPLEMENTAL_MAPPINGS_SHEET_ID = '1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys';
const SUPPLEMENTAL_MAPPINGS_SHEET_NAME = 'Sheet1'; // Default sheet name, adjust if needed

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: SCOPES
  });
  
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// Normalize league key from Column A to match what getTeamDisplayName() expects
// This allows "DFB Pokal", "DFB-Pokal", "Germany: DFB Pokal" etc. to map to DFBPokal
// CONCACAF Champions Cup: frontend uses CONCACAFChampionsCup as league key
function normalizeLeagueKey(league) {
  if (!league) return league;
  const trimmed = String(league).trim();
  const normalizedMap = {
    'DFB Pokal': 'DFBPokal',
    'DFB-Pokal': 'DFBPokal',
    'Germany: DFB Pokal': 'DFBPokal',
    'German: DFB Pokal': 'DFBPokal',
    'CONCACAF Champions Cup': 'CONCACAFChampionsCup',
    'Concacaf Champions Cup': 'CONCACAFChampionsCup',
    'North & Central America: Concacaf Champions Cup': 'CONCACAFChampionsCup'
  };
  return normalizedMap[trimmed] || trimmed;
}

// Load supplemental team name mappings from Google Sheets
async function loadSupplementalTeamMappings() {
  console.log('Loading supplemental team name mappings from Google Sheets...');
  
  const sheets = await authenticateGoogleSheets();
  
  try {
    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SUPPLEMENTAL_MAPPINGS_SHEET_ID,
      range: `${SUPPLEMENTAL_MAPPINGS_SHEET_NAME}!A:Z`
    });
    
    const rows = response.data.values || [];
    if (rows.length < 2) {
      console.log('No supplemental mappings found (less than 2 rows including header)');
      return {};
    }
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    // Structure: { league: { variation: displayName, ... }, ... }
    const mappings = {};
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Column A: League (normalize to match frontend league keys)
      const rawLeague = row[0] ? String(row[0]).trim() : '';
      const league = normalizeLeagueKey(rawLeague) || rawLeague;
      if (!league) continue;
      
      // Column B: Display name
      const displayName = row[1] ? String(row[1]).trim() : '';
      if (!displayName) continue;
      
      // Initialize league mapping if not exists
      if (!mappings[league]) {
        mappings[league] = {};
      }
      
      // Column C+: Variations
      // Map all variations (including display name) to the display name
      const variations = [displayName]; // Include display name itself
      
      for (let col = 2; col < row.length; col++) {
        const variation = row[col] ? String(row[col]).trim() : '';
        if (variation) {
          variations.push(variation);
        }
      }
      
      // Create bidirectional mapping: each variation maps to display name
      // Also create cross-mapping: each variation maps to all other variations
      variations.forEach(variation => {
        if (variation) {
          mappings[league][variation] = displayName;
          
          // Also map each variation to all other variations (for matching)
          variations.forEach(otherVariation => {
            if (otherVariation !== variation && otherVariation) {
              // Store as an array of equivalent names
              if (!mappings[league][`_equivalents_${variation}`]) {
                mappings[league][`_equivalents_${variation}`] = [];
              }
              if (!mappings[league][`_equivalents_${variation}`].includes(otherVariation)) {
                mappings[league][`_equivalents_${variation}`].push(otherVariation);
              }
            }
          });
        }
      });
    }
    
    console.log(`✅ Loaded supplemental mappings for ${Object.keys(mappings).length} leagues`);
    Object.keys(mappings).forEach(league => {
      const variationCount = Object.keys(mappings[league]).filter(k => !k.startsWith('_equivalents_')).length;
      console.log(`  - ${league}: ${variationCount} unique team mappings`);
    });
    
    return mappings;
  } catch (error) {
    console.error('Error loading supplemental team mappings:', error);
    throw error;
  }
}

// Get display name for a team using supplemental mappings
function getDisplayNameFromSupplemental(teamName, league) {
  if (!teamName || !league) return teamName;
  
  const leagueMappings = this.mappings[league];
  if (!leagueMappings) return teamName;
  
  // Try exact match first
  if (leagueMappings[teamName]) {
    return leagueMappings[teamName];
  }
  
  // Try case-insensitive match
  const teamNameLower = teamName.toLowerCase();
  for (const [variation, displayName] of Object.entries(leagueMappings)) {
    if (!variation.startsWith('_equivalents_') && variation.toLowerCase() === teamNameLower) {
      return displayName;
    }
  }
  
  // Try normalized match (remove special chars, normalize whitespace)
  const normalized = teamName
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  for (const [variation, displayName] of Object.entries(leagueMappings)) {
    if (!variation.startsWith('_equivalents_')) {
      const normalizedVariation = variation
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (normalizedVariation === normalized) {
        return displayName;
      }
    }
  }
  
  return teamName;
}

// Check if two team names match using supplemental mappings
function doTeamNamesMatch(teamName1, teamName2, league) {
  if (!teamName1 || !teamName2 || !league) return false;
  
  if (teamName1 === teamName2) return true;
  
  const leagueMappings = this.mappings[league];
  if (!leagueMappings) return false;
  
  // Get display names for both
  const displayName1 = getDisplayNameFromSupplemental.call(this, teamName1, league);
  const displayName2 = getDisplayNameFromSupplemental.call(this, teamName2, league);
  
  // If they map to the same display name, they match
  if (displayName1 === displayName2 && displayName1 !== teamName1 && displayName2 !== teamName2) {
    return true;
  }
  
  // Check if teamName1 is in teamName2's equivalents
  const equivalents1 = leagueMappings[`_equivalents_${teamName1}`] || [];
  if (equivalents1.includes(teamName2)) return true;
  
  const equivalents2 = leagueMappings[`_equivalents_${teamName2}`] || [];
  if (equivalents2.includes(teamName1)) return true;
  
  // Check normalized match
  const normalize = (name) => name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalize(teamName1) === normalize(teamName2);
}

// Store mappings in Firestore for easy access by other scripts
async function storeMappingsInFirestore(mappings) {
  console.log('Storing supplemental mappings in Firestore...');
  
  const mappingsRef = db.collection('artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings');
  
  // Clear existing mappings
  const existingSnapshot = await mappingsRef.get();
  if (!existingSnapshot.empty) {
    const batch = db.batch();
    existingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared ${existingSnapshot.size} existing mappings`);
  }
  
  // Store new mappings
  const batch = db.batch();
  Object.keys(mappings).forEach(league => {
    const docRef = mappingsRef.doc(league);
    batch.set(docRef, {
      league,
      mappings: mappings[league],
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`✅ Stored mappings for ${Object.keys(mappings).length} leagues in Firestore`);
}

// Main function
async function main() {
  try {
    const mappings = await loadSupplementalTeamMappings();
    await storeMappingsInFirestore(mappings);
    
    console.log('\n✅ Supplemental team mappings loaded and stored successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading supplemental team mappings:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  loadSupplementalTeamMappings,
  storeMappingsInFirestore,
  getDisplayNameFromSupplemental,
  doTeamNamesMatch
};

// Run if executed directly
if (require.main === module) {
  main();
}

