/**
 * Google Apps Script for Upcoming Schedule Sheets
 * 
 * This script reads from the Master Team Mappings sheet and automatically
 * converts team names in the upcoming schedule to FlashLive API format.
 * 
 * Instructions:
 * 1. Open your upcoming schedule Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Update the MASTER_SHEET_ID and LEAGUE_KEY constants below
 * 6. Save the script
 * 7. The script will run automatically whenever the sheet is edited
 */

// ===== CONFIGURATION =====
// Update these values for your specific sheet:

// The Google Sheet ID for the Master Team Mappings document (separate document)
const MASTER_SHEET_ID = '1eCKaS3oI6ivWrX-selR5P5HUUJDH10fv-Zz7Cc4C0f4';

// The league key for this sheet (NCAAF, NCAAM, NCAAW, etc.)
// This should match the tab name in the master mappings document
const LEAGUE_KEY = 'NCAAF'; // Change this to match your league (must match tab name)

// ===== END CONFIGURATION =====

/**
 * Load master team name mappings from the master sheet
 * Returns: { 'Any Variation': 'Display Name', ... }
 * 
 * Structure:
 * - Column A: Display Name (canonical)
 * - Columns B+: All name variations (FlashLive, Manual, NCAA API, etc.)
 */
function loadMasterMappings() {
  try {
    const masterSheet = SpreadsheetApp.openById(MASTER_SHEET_ID);
    // Each league has its own tab - use the league key as the tab name
    const masterTab = masterSheet.getSheetByName(LEAGUE_KEY);
    
    if (!masterTab) {
      Logger.log(`Master Team Mappings tab "${LEAGUE_KEY}" not found. Please create it first.`);
      return {};
    }
    
    const data = masterTab.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log(`No data found in ${LEAGUE_KEY} tab`);
      return {};
    }
    
    // Skip header row
    const mappings = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const canonicalName = row[0]?.toString().trim();
      if (!canonicalName) continue;
      
      // Map all variations (columns B+) to the canonical name
      for (let j = 1; j < row.length; j++) {
        const variation = row[j]?.toString().trim();
        if (variation) {
          mappings[variation] = canonicalName;
        }
      }
      
      // Also map canonical name to itself
      mappings[canonicalName] = canonicalName;
    }
    
    Logger.log(`Loaded ${Object.keys(mappings).length} team name mappings for ${LEAGUE_KEY}`);
    return mappings;
  } catch (error) {
    Logger.log(`Error loading master mappings: ${error.toString()}`);
    return {};
  }
}

/**
 * Convert a team name to FlashLive API format using master mappings
 * @param {string} teamName - The team name to convert
 * @returns {string} - The FlashLive API format name
 */
function convertToFlashLiveName(teamName) {
  if (!teamName) return '';
  
  const mappings = loadMasterMappings();
  const trimmedName = teamName.trim();
  
  // Try exact match first
  if (mappings[trimmedName]) {
    return mappings[trimmedName];
  }
  
  // Try case-insensitive match
  const nameLower = trimmedName.toLowerCase();
  for (const [variation, canonical] of Object.entries(mappings)) {
    if (variation.toLowerCase() === nameLower) {
      return canonical;
    }
  }
  
  // If no mapping found, return original name
  return trimmedName;
}

/**
 * Automatically convert team names in the current sheet
 * This function is called when the sheet is edited
 */
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    
    // Define which columns contain team names (adjust as needed)
    // Example: Column A = Away Team, Column B = Home Team
    const teamNameColumns = [1, 2]; // Columns A and B (1-indexed)
    
    if (!teamNameColumns.includes(range.getColumn())) {
      return; // Not a team name column, skip
    }
    
    const row = range.getRow();
    if (row === 1) {
      return; // Skip header row
    }
    
    const currentValue = range.getValue()?.toString().trim();
    if (!currentValue) {
      return; // Empty cell, skip
    }
    
    const flashLiveName = convertToFlashLiveName(currentValue);
    
    // Only update if the name changed
    if (flashLiveName !== currentValue) {
      range.setValue(flashLiveName);
      Logger.log(`Converted "${currentValue}" to "${flashLiveName}"`);
    }
  } catch (error) {
    Logger.log(`Error in onEdit: ${error.toString()}`);
  }
}

/**
 * Manual function to convert all team names in the sheet
 * Run this from the Apps Script editor if you want to convert all names at once
 */
function convertAllTeamNames() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length < 2) {
      Logger.log('No data to convert');
      return;
    }
    
    const mappings = loadMasterMappings();
    let updateCount = 0;
    
    // Define which columns contain team names (adjust as needed)
    const teamNameColumns = [1, 2]; // Columns A and B (1-indexed)
    
    // Skip header row
    for (let i = 1; i < values.length; i++) {
      for (const colIndex of teamNameColumns) {
        const col = colIndex - 1; // Convert to 0-indexed
        if (col >= values[i].length) continue;
        
        const currentValue = values[i][col]?.toString().trim();
        if (!currentValue) continue;
        
        // Try to find mapping
        let flashLiveName = mappings[currentValue];
        if (!flashLiveName) {
          // Try case-insensitive
          const nameLower = currentValue.toLowerCase();
          for (const [variation, canonical] of Object.entries(mappings)) {
            if (variation.toLowerCase() === nameLower) {
              flashLiveName = canonical;
              break;
            }
          }
        }
        
        if (flashLiveName && flashLiveName !== currentValue) {
          values[i][col] = flashLiveName;
          updateCount++;
        }
      }
    }
    
    if (updateCount > 0) {
      dataRange.setValues(values);
      Logger.log(`Converted ${updateCount} team names`);
    } else {
      Logger.log('No team names needed conversion');
    }
  } catch (error) {
    Logger.log(`Error in convertAllTeamNames: ${error.toString()}`);
  }
}

