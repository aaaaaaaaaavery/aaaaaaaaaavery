import admin from 'firebase-admin';

// Get Firestore instance
// Note: This assumes Firebase is already initialized in the calling script
function getDb() {
  return admin.firestore();
}

// Cache for mappings
let mappingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Load supplemental mappings from Firestore
async function loadMappingsFromFirestore() {
  const now = Date.now();
  
  // Return cached mappings if still valid
  if (mappingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return mappingsCache;
  }
  
  try {
    const db = getDb();
    const mappingsRef = db.collection('artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings');
    const snapshot = await mappingsRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️ No supplemental team mappings found in Firestore');
      mappingsCache = {};
      cacheTimestamp = now;
      return mappingsCache;
    }
    
    const mappings = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.league && data.mappings) {
        mappings[data.league] = data.mappings;
      }
    });
    
    mappingsCache = mappings;
    cacheTimestamp = now;
    
    return mappings;
  } catch (error) {
    console.error('Error loading supplemental mappings from Firestore:', error);
    return mappingsCache || {};
  }
}

// Normalize team name for matching
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get display name for a team using supplemental mappings
export async function getDisplayNameFromSupplemental(teamName, league) {
  if (!teamName || !league) return teamName;
  
  const mappings = await loadMappingsFromFirestore();
  const leagueMappings = mappings[league];
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
  
  // Try normalized match
  const normalized = normalizeTeamName(teamName);
  for (const [variation, displayName] of Object.entries(leagueMappings)) {
    if (!variation.startsWith('_equivalents_')) {
      const normalizedVariation = normalizeTeamName(variation);
      if (normalizedVariation === normalized) {
        return displayName;
      }
    }
  }
  
  return teamName;
}

// Check if two team names match using supplemental mappings
export async function doTeamNamesMatch(teamName1, teamName2, league) {
  if (!teamName1 || !teamName2 || !league) return false;
  
  if (teamName1 === teamName2) return true;
  
  const mappings = await loadMappingsFromFirestore();
  const leagueMappings = mappings[league];
  if (!leagueMappings) {
    // Fallback to normalized comparison
    return normalizeTeamName(teamName1) === normalizeTeamName(teamName2);
  }
  
  // Get display names for both
  const displayName1 = await getDisplayNameFromSupplemental(teamName1, league);
  const displayName2 = await getDisplayNameFromSupplemental(teamName2, league);
  
  // If they map to the same display name, they match
  if (displayName1 === displayName2 && displayName1 !== teamName1 && displayName2 !== teamName2) {
    return true;
  }
  
  // Check if teamName1 is in teamName2's equivalents
  const equivalents1 = leagueMappings[`_equivalents_${teamName1}`] || [];
  if (equivalents1.includes(teamName2)) return true;
  
  const equivalents2 = leagueMappings[`_equivalents_${teamName2}`] || [];
  if (equivalents2.includes(teamName1)) return true;
  
  // Check normalized match as fallback
  return normalizeTeamName(teamName1) === normalizeTeamName(teamName2);
}

// Get all variations for a team name (including the team name itself and display name)
export async function getAllTeamNameVariations(teamName, league) {
  if (!teamName || !league) return [teamName];
  
  const mappings = await loadMappingsFromFirestore();
  const leagueMappings = mappings[league];
  if (!leagueMappings) return [teamName];
  
  const variations = new Set([teamName]);
  
  // Get display name
  const displayName = await getDisplayNameFromSupplemental(teamName, league);
  if (displayName && displayName !== teamName) {
    variations.add(displayName);
  }
  
  // Get equivalents
  const equivalents = leagueMappings[`_equivalents_${teamName}`] || [];
  equivalents.forEach(eq => variations.add(eq));
  
  // Also check if this team name is an equivalent of another
  for (const [key, value] of Object.entries(leagueMappings)) {
    if (key.startsWith('_equivalents_')) {
      const baseName = key.replace('_equivalents_', '');
      if (value.includes(teamName)) {
        variations.add(baseName);
        const baseDisplayName = leagueMappings[baseName];
        if (baseDisplayName) {
          variations.add(baseDisplayName);
        }
      }
    }
  }
  
  return Array.from(variations);
}

export { normalizeTeamName };

