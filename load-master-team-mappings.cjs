const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize Firebase Admin (if needed for caching)
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Google Sheets configuration for Master Team Name Mappings
const MASTER_MAPPINGS_SPREADSHEET_ID = '1eCKaS3oI6ivWrX-selR5P5HUUJDH10fv-Zz7Cc4C0f4'; // Separate document
// Each league has its own tab (NCAAF, NCAAM, NCAAW, etc.)

// Initialize Google Sheets API
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

/**
 * Load master team name mappings from Google Sheets
 * 
 * Document structure:
 * - Separate Google Sheets document
 * - Each league has its own tab (NCAAF, NCAAM, NCAAW, etc.)
 * 
 * Each tab structure:
 * Row 1: Headers (Display Name, Variation 1, Variation 2, Variation 3, ...)
 * Row 2+: Data rows
 * 
 * Example (NCAAF tab):
 * Display Name | USC Trojans | Southern California | USC | ...
 * USC          | USC Trojans | Southern California | USC | ...
 * 
 * Column A (Display Name) is the CANONICAL name (everything maps to this)
 * Columns B+ contain all name variations (FlashLive, Manual, NCAA API, etc.)
 * 
 * Returns: {
 *   mappings: {
 *     NCAAF: {
 *       'USC Trojans': 'USC',          // Any variation → Display Name
 *       'Southern California': 'USC',
 *       'USC': 'USC'
 *     },
 *     ...
 *   },
 *   displayNames: {
 *     NCAAF: {
 *       'USC': 'USC Trojans'           // Display Name → Full Display Name
 *     },
 *     ...
 *   }
 * }
 */
async function loadMasterTeamMappings() {
  try {
    const sheets = await getSheetsClient();
    const mappings = {};
    const displayNames = {};
    
    // List of league tabs to process
    const leagueTabs = ['NCAAF', 'NCAAM', 'NCAAW'];
    
    for (const leagueTab of leagueTabs) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: MASTER_MAPPINGS_SPREADSHEET_ID,
          range: `${leagueTab}!A:Z`
        });
        
        const rows = response.data.values;
        if (!rows || rows.length < 2) {
          console.log(`⚠️ No data found in ${leagueTab} tab`);
          continue;
        }
        
        // Skip header row
        const dataRows = rows.slice(1);
        const leagueMappings = {};
        const leagueDisplayNames = {};
        
        for (const row of dataRows) {
          if (!row || row.length === 0) continue;
          
          // Column A is the canonical/display name
          const canonicalName = row[0]?.trim();
          if (!canonicalName) continue;
          
          // Store display name mapping
          leagueDisplayNames[canonicalName] = canonicalName;
          
          // Columns B+ are all variations that map to the canonical name
          for (let i = 1; i < row.length; i++) {
            const variation = row[i]?.trim();
            if (variation && variation !== canonicalName) {
              leagueMappings[variation] = canonicalName;
            }
          }
          
          // Also map the canonical name to itself
          leagueMappings[canonicalName] = canonicalName;
        }
        
        mappings[leagueTab] = leagueMappings;
        displayNames[leagueTab] = leagueDisplayNames;
        
        console.log(`✅ Loaded ${Object.keys(leagueMappings).length} mappings for ${leagueTab}`);
      } catch (error) {
        if (error.message && error.message.includes('Unable to parse range')) {
          console.log(`⚠️ Tab ${leagueTab} not found, skipping...`);
        } else {
          console.error(`❌ Error loading ${leagueTab} mappings:`, error.message);
        }
      }
    }
    
    return { mappings, displayNames };
  } catch (error) {
    console.error('❌ Error loading master team mappings:', error);
    throw error;
  }
}

/**
 * Get FlashLive API name (canonical) from any team name variation
 * @param {string} teamName - Any variation of the team name
 * @param {string} leagueKey - League key (NCAAF, NCAAM, NCAAW)
 * @param {object} mappings - Mappings object from loadMasterTeamMappings()
 * @returns {string|null} - Canonical name or null if not found
 */
function getFlashLiveName(teamName, leagueKey, mappings) {
  if (!teamName || !leagueKey || !mappings || !mappings.mappings) {
    return null;
  }
  
  const leagueMappings = mappings.mappings[leagueKey];
  if (!leagueMappings) {
    return null;
  }
  
  // Try exact match first
  if (leagueMappings[teamName]) {
    return leagueMappings[teamName];
  }
  
  // Try case-insensitive match
  const teamNameLower = teamName.toLowerCase();
  for (const [variation, canonical] of Object.entries(leagueMappings)) {
    if (variation.toLowerCase() === teamNameLower) {
      return canonical;
    }
  }
  
  return null;
}

/**
 * Get display name from canonical name
 * @param {string} canonicalName - Canonical team name
 * @param {string} leagueKey - League key (NCAAF, NCAAM, NCAAW)
 * @param {object} mappings - Mappings object from loadMasterTeamMappings()
 * @returns {string|null} - Display name or null if not found
 */
function getDisplayName(canonicalName, leagueKey, mappings) {
  if (!canonicalName || !leagueKey || !mappings || !mappings.displayNames) {
    return null;
  }
  
  const leagueDisplayNames = mappings.displayNames[leagueKey];
  if (!leagueDisplayNames) {
    return null;
  }
  
  return leagueDisplayNames[canonicalName] || null;
}

module.exports = {
  loadMasterTeamMappings,
  getFlashLiveName,
  getDisplayName,
  MASTER_MAPPINGS_SPREADSHEET_ID
};

