/**
 * Google Apps Script to automatically convert Top 25 team names in Google Sheets
 * to match Firestore team names for proper ranking matching
 * 
 * Instructions:
 * 1. Open your Top 25 Google Sheet: https://docs.google.com/spreadsheets/d/1IoUR6NrMU6HtEu0tr8rxiZg3CDJCTxZ1k4xxL_ZENsw/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Save the script
 * 6. The script will run automatically whenever the sheet is edited
 * 7. You can also manually run it from the "Team Name Converter" menu
 */

// NCAAW Top 25 team name mappings
// Maps team names from NCAA API to Firestore team names
const NCAAW_TOP25_MAP = {
  // Add NCAAW mappings here
  // Format: 'NCAA API Team Name': 'Firestore Team Name'
};

// NCAAM Top 25 team name mappings
// Maps team names from NCAA API to Firestore team names
const NCAAM_TOP25_MAP = {
  // Add NCAAM mappings here
  // Format: 'NCAA API Team Name': 'Firestore Team Name'
};

// NCAAF Top 25 team name mappings
// Maps team names from NCAA API to Firestore team names
const NCAAF_TOP25_MAP = {
  // Add NCAAF mappings here
  // Format: 'NCAA API Team Name': 'Firestore Team Name'
};

/**
 * Automatically converts team names when a cell is edited
 * Only converts the "Team" column (column B) in Top 25 sheets
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const range = e.range;
  const editedRow = range.getRow();
  const editedCol = range.getColumn();
  
  // Only process if editing NCAAF, NCAAM, or NCAAW sheets
  if (sheetName !== 'NCAAF' && sheetName !== 'NCAAM' && sheetName !== 'NCAAW') {
    return;
  }
  
  // Only convert if editing column B (Team column)
  // Skip header row (row 1)
  if (editedCol !== 2 || editedRow === 1) {
    return;
  }
  
  const editedValue = range.getValue();
  
  if (!editedValue || typeof editedValue !== 'string') {
    return;
  }
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = {};
  if (sheetName === 'NCAAF') {
    mappingToUse = NCAAF_TOP25_MAP;
  } else if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_TOP25_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_TOP25_MAP;
  }
  
  // Check if the edited value needs conversion
  const mappedValue = mappingToUse[editedValue.trim()];
  
  if (mappedValue && mappedValue !== editedValue) {
    range.setValue(mappedValue);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted: ${editedValue} → ${mappedValue}`, 
      'Team Name Converted', 
      3
    );
  }
}

/**
 * Manual function to convert all team names in the current sheet
 * Converts the "Team" column (column B) starting from row 2
 */
function convertAllTeamNames() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();
  
  // Only process if editing NCAAF, NCAAM, or NCAAW sheets
  if (sheetName !== 'NCAAF' && sheetName !== 'NCAAM' && sheetName !== 'NCAAW') {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'This function only works on NCAAF, NCAAM, or NCAAW sheets', 
      'Invalid Sheet', 
      3
    );
    return;
  }
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = {};
  if (sheetName === 'NCAAF') {
    mappingToUse = NCAAF_TOP25_MAP;
  } else if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_TOP25_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_TOP25_MAP;
  }
  
  // Get all data in column B (Team column)
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names found to convert', 
      'No Data', 
      3
    );
    return;
  }
  
  // Get all team names (skip header row)
  const teamRange = sheet.getRange(2, 2, lastRow - 1, 1);
  const teamValues = teamRange.getValues();
  
  let changesCount = 0;
  
  // Convert each team name
  for (let i = 0; i < teamValues.length; i++) {
    const teamName = teamValues[i][0];
    
    if (teamName && typeof teamName === 'string') {
      const mappedValue = mappingToUse[teamName.trim()];
      
      if (mappedValue && mappedValue !== teamName) {
        teamValues[i][0] = mappedValue;
        changesCount++;
      }
    }
  }
  
  // Write changes back
  if (changesCount > 0) {
    teamRange.setValues(teamValues);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${changesCount} team names in ${sheetName}`, 
      'Conversion Complete', 
      5
    );
    Logger.log(`Converted ${changesCount} team names in ${sheetName}`);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion', 
      'Already Up to Date', 
      3
    );
  }
}

/**
 * Manual function to convert team names in all Top 25 sheets
 */
function convertAllSheetsTeamNames() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['NCAAF', 'NCAAM', 'NCAAW'];
  let totalChanges = 0;
  let sheetsProcessed = 0;
  
  for (const sheetName of sheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log(`Sheet ${sheetName} not found, skipping...`);
      continue;
    }
    
    // Determine which mapping to use
    let mappingToUse = {};
    if (sheetName === 'NCAAF') {
      mappingToUse = NCAAF_TOP25_MAP;
    } else if (sheetName === 'NCAAM') {
      mappingToUse = NCAAM_TOP25_MAP;
    } else if (sheetName === 'NCAAW') {
      mappingToUse = NCAAW_TOP25_MAP;
    }
    
    // Get all data in column B (Team column)
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      Logger.log(`No team names found in ${sheetName}, skipping...`);
      continue;
    }
    
    // Get all team names (skip header row)
    const teamRange = sheet.getRange(2, 2, lastRow - 1, 1);
    const teamValues = teamRange.getValues();
    
    let changesCount = 0;
    
    // Convert each team name
    for (let i = 0; i < teamValues.length; i++) {
      const teamName = teamValues[i][0];
      
      if (teamName && typeof teamName === 'string') {
        const mappedValue = mappingToUse[teamName.trim()];
        
        if (mappedValue && mappedValue !== teamName) {
          teamValues[i][0] = mappedValue;
          changesCount++;
        }
      }
    }
    
    // Write changes back
    if (changesCount > 0) {
      teamRange.setValues(teamValues);
      totalChanges += changesCount;
      sheetsProcessed++;
      Logger.log(`Converted ${changesCount} team names in ${sheetName}`);
    }
  }
  
  if (totalChanges > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${totalChanges} team names across ${sheetsProcessed} sheets`, 
      'All Sheets Conversion Complete', 
      5
    );
    Logger.log(`Total: Converted ${totalChanges} team names across ${sheetsProcessed} sheets`);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion across all sheets', 
      'All Sheets Already Up to Date', 
      3
    );
  }
}

/**
 * Manual function to convert team names in a specific range
 * Select the cells you want to convert, then run this function
 */
function convertSelectedRange() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();
  const range = sheet.getActiveRange();
  const values = range.getValues();
  
  // Only process if editing NCAAF, NCAAM, or NCAAW sheets
  if (sheetName !== 'NCAAF' && sheetName !== 'NCAAM' && sheetName !== 'NCAAW') {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'This function only works on NCAAF, NCAAM, or NCAAW sheets', 
      'Invalid Sheet', 
      3
    );
    return;
  }
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = {};
  if (sheetName === 'NCAAF') {
    mappingToUse = NCAAF_TOP25_MAP;
  } else if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_TOP25_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_TOP25_MAP;
  }
  
  let changesCount = 0;
  
  // Loop through selected cells
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      const cellValue = values[row][col];
      
      if (cellValue && typeof cellValue === 'string') {
        const mappedValue = mappingToUse[cellValue.trim()];
        
        if (mappedValue && mappedValue !== cellValue) {
          values[row][col] = mappedValue;
          changesCount++;
        }
      }
    }
  }
  
  // Write changes back
  if (changesCount > 0) {
    range.setValues(values);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${changesCount} team names in selection`, 
      'Conversion Complete', 
      5
    );
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion in selection', 
      'Already Up to Date', 
      3
    );
  }
}

/**
 * Creates a custom menu when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Top 25 Team Name Converter')
    .addItem('Convert All Team Names (Current Sheet)', 'convertAllTeamNames')
    .addItem('Convert All Team Names (ALL SHEETS)', 'convertAllSheetsTeamNames')
    .addItem('Convert Selected Range', 'convertSelectedRange')
    .addToUi();
}

