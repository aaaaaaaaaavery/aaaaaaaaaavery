/**
 * Google Apps Script to automatically convert team names in Google Sheets
 * to match FlashLive API format
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Save the script
 * 6. The script will run automatically whenever the sheet is edited
 */

// NCAAM specific team name mappings
const NCAAM_MAP = {
  'St. John\'s (N.Y)': 'St. John\'s'
};

// NCAAW specific team name mappings
const NCAAW_MAP = {
  'Iowa Hawkeyes': 'Iowa',
  'Michigan Wolverines': 'Michigan',
  'Tennessee Volunteers': 'Tennessee',
  'Oklahoma Sooners': 'Oklahoma',
  'LSU Tigers': 'LSU'
};

/**
 * Automatically converts team names when cells are edited
 * This function is triggered automatically by Google Sheets
 */
function onEdit(e) {
  // Prevent infinite loops by checking if we're already processing
  const processing = PropertiesService.getScriptProperties().getProperty('processing');
  if (processing === 'true') {
    return;
  }
  
  // Check if processing flag is stale (older than 30 seconds)
  const processingTime = PropertiesService.getScriptProperties().getProperty('processingTime');
  if (processingTime) {
    const timeDiff = Date.now() - parseInt(processingTime);
    if (timeDiff > 30000) {
      // Stale flag, reset it
      PropertiesService.getScriptProperties().deleteProperty('processing');
      PropertiesService.getScriptProperties().deleteProperty('processingTime');
    } else if (processing === 'true') {
      return;
    }
  }
  
  try {
    PropertiesService.getScriptProperties().setProperty('processing', 'true');
    PropertiesService.getScriptProperties().setProperty('processingTime', Date.now().toString());
    
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const sheetName = sheet.getName();
    
    // Get the mapping to use based on sheet name
    let mappingToUse = null;
    if (sheetName === 'NCAAM') {
      mappingToUse = NCAAM_MAP;
    } else if (sheetName === 'NCAAW') {
      mappingToUse = NCAAW_MAP;
    } else {
      // If no mapping found for this sheet, skip processing
      return;
    }
    
    // Get all values from the edited range (handles single cells and paste operations)
    const values = range.getValues();
    const numRows = values.length;
    const numCols = values[0].length;
    let hasChanges = false;
    const newValues = [];
    
    // Process each cell in the range
    for (let row = 0; row < numRows; row++) {
      const newRow = [];
      for (let col = 0; col < numCols; col++) {
        const cellValue = values[row][col];
        
        // Check if the cell value matches any team name in our map
        if (cellValue && typeof cellValue === 'string') {
          const trimmedValue = cellValue.trim();
          const mappedValue = mappingToUse[trimmedValue];
          
          if (mappedValue && mappedValue !== trimmedValue) {
            newRow.push(mappedValue);
            hasChanges = true;
            Logger.log(`Converted "${trimmedValue}" to "${mappedValue}" in sheet "${sheetName}"`);
          } else {
            newRow.push(cellValue);
          }
        } else {
          newRow.push(cellValue);
        }
      }
      newValues.push(newRow);
    }
    
    // Write back all changes at once if any were made
    if (hasChanges) {
      range.setValues(newValues);
    }
  } catch (error) {
    Logger.log(`Error in onEdit: ${error.toString()}`);
    // Don't throw - just log the error so the script doesn't break
  } finally {
    PropertiesService.getScriptProperties().setProperty('processing', 'false');
    PropertiesService.getScriptProperties().deleteProperty('processingTime');
  }
}

/**
 * Reset the processing flag if it gets stuck
 * Run this manually if onEdit stops working
 */
function resetProcessingFlag() {
  PropertiesService.getScriptProperties().deleteProperty('processing');
  PropertiesService.getScriptProperties().deleteProperty('processingTime');
  Logger.log('Processing flag reset');
}

/**
 * Manual function to convert ALL team names in the entire active sheet
 * Run this once after installing the script to convert existing data
 * Go to Extensions > Apps Script > Select "convertAllTeamNames" > Click Run
 */
function convertAllTeamNames() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  let changesCount = 0;
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = null;
  if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_MAP;
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'This sheet is not NCAAM or NCAAW. No conversion performed.', 
      'Sheet Not Supported', 
      3
    );
    return;
  }
  
  // Loop through all cells
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      const cellValue = values[row][col];
      
      if (cellValue && typeof cellValue === 'string') {
        const trimmedValue = cellValue.trim();
        const mappedValue = mappingToUse[trimmedValue];
        
        if (mappedValue && mappedValue !== trimmedValue) {
          values[row][col] = mappedValue;
          changesCount++;
        }
      }
    }
  }
  
  // Write changes back
  if (changesCount > 0) {
    dataRange.setValues(values);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${changesCount} team names`, 
      'Conversion Complete', 
      5
    );
    Logger.log(`Converted ${changesCount} team names in sheet "${sheetName}"`);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion', 
      'Already Up to Date', 
      3
    );
  }
}

/**
 * Manual function to convert ALL team names across ALL sheets
 * Use this to convert existing data in all sheets at once
 * Go to Extensions > Apps Script > Select "convertAllSheetsTeamNames" > Click Run
 */
function convertAllSheetsTeamNames() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  let totalChanges = 0;
  let sheetsProcessed = 0;
  
  for (const sheet of sheets) {
    try {
      const sheetName = sheet.getName();
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let sheetChanges = 0;
      
      // Determine which mapping to use based on sheet name
      let mappingToUse = null;
      if (sheetName === 'NCAAM') {
        mappingToUse = NCAAM_MAP;
      } else if (sheetName === 'NCAAW') {
        mappingToUse = NCAAW_MAP;
      } else {
        // Skip sheets that aren't NCAAM or NCAAW
        continue;
      }
      
      // Loop through all cells in this sheet
      for (let row = 0; row < values.length; row++) {
        for (let col = 0; col < values[row].length; col++) {
          const cellValue = values[row][col];
          
          if (cellValue && typeof cellValue === 'string') {
            const trimmedValue = cellValue.trim();
            const mappedValue = mappingToUse[trimmedValue];
            
            if (mappedValue && mappedValue !== trimmedValue) {
              values[row][col] = mappedValue;
              sheetChanges++;
            }
          }
        }
      }
      
      // Write changes back to this sheet if any were made
      if (sheetChanges > 0) {
        dataRange.setValues(values);
        Logger.log(`Sheet "${sheetName}": Converted ${sheetChanges} team names`);
      }
      
      totalChanges += sheetChanges;
      sheetsProcessed++;
      
      // Add delay between sheets to avoid quota exceeded errors
      // Wait 4 seconds between each sheet (except after the last one)
      if (sheetsProcessed < sheets.length) {
        Utilities.sleep(4000);
      }
      
    } catch (error) {
      Logger.log(`Error processing sheet "${sheet.getName()}": ${error.message}`);
      // Still add delay even on error to avoid quota issues
      if (sheetsProcessed < sheets.length) {
        Utilities.sleep(4000);
      }
    }
  }
  
  // Show final results
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
  
  let changesCount = 0;
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = null;
  if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_MAP;
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'This sheet is not NCAAM or NCAAW. No conversion performed.', 
      'Sheet Not Supported', 
      3
    );
    return;
  }
  
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
  ui.createMenu('Team Name Converter')
    .addItem('Convert All Team Names (Current Sheet)', 'convertAllTeamNames')
    .addItem('Convert All Team Names (ALL SHEETS)', 'convertAllSheetsTeamNames')
    .addItem('Convert Selected Range', 'convertSelectedRange')
    .addToUi();
}

