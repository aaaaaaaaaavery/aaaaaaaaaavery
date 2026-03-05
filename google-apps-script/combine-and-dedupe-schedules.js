/**
 * Google Apps Script to combine data from multiple sources and remove duplicates
 * 
 * Instructions:
 * 1. Open your Google Sheet with upcoming schedule data
 * 2. Go to Extensions > Apps Script
 * 3. Create a new script file (or paste this code)
 * 4. Update the configuration section below with your sheet names and ranges
 * 5. Save and run the script
 * 6. Use the custom menu "Schedule Tools" > "Combine and Remove Duplicates"
 * 
 * You can paste data from multiple sources at different times:
 * - Paste 11/4 games from Source 1 into a sheet
 * - Paste 11/5 games from Source 1 into the same or different sheet
 * - Paste 11/4 games from Source 2 into the same or different sheet
 * - Paste 11/5 and 11/6 games from Source 2 into the same or different sheet
 * 
 * The script will read ALL specified ranges, combine them, and remove duplicates.
 */

/**
 * CONFIGURATION - NCAAM and NCAAW settings
 */

// NCAAM Configuration
const NCAAM_CONFIG = {
  // Input sheet: Paste all NCAAM games here (from multiple sources)
  inputSheetName: 'PasteForNCAAMen',
  
  // Output sheet: Combined and deduplicated results go here
  outputSheetName: 'NCAAM',
  
  // Auto-detect: Reads entire sheet (all data from row 2 onwards)
  autoDetectRanges: true,
  
  // Headers row (if you want to copy headers)
  headersRange: 'A1:E1', // Range with headers (Date, Time, Away Team, Home Team, Channel)
  
  // Columns to use for duplicate detection (1-based index: Date=1, Time=2, Away=3, Home=4, Channel=5)
  duplicateCheckColumns: [1, 2, 3, 4], // Date, Time, Away Team, Home Team (excludes Channel)
  
  outputStartRow: 2, // Row to start writing (row 1 should have headers)
};

// NCAAW Configuration
const NCAAW_CONFIG = {
  // Input sheet: Paste all NCAAW games here (from multiple sources)
  inputSheetName: 'PasteForNCAAW',
  
  // Output sheet: Combined and deduplicated results go here
  outputSheetName: 'NCAAW',
  
  // Auto-detect: Reads entire sheet (all data from row 2 onwards)
  autoDetectRanges: true,
  
  // Headers row (if you want to copy headers)
  headersSheetName: 'PasteForNCAAW', // Sheet with headers
  headersRange: 'A1:E1', // Range with headers (Date, Time, Away Team, Home Team, Channel)
  
  // Columns to use for duplicate detection (1-based index: Date=1, Time=2, Away=3, Home=4, Channel=5)
  duplicateCheckColumns: [1, 2, 3, 4], // Date, Time, Away Team, Home Team (excludes Channel)
  
  outputStartRow: 2, // Row to start writing (row 1 should have headers)
};

/**
 * Helper function to process a single configuration
 */
function processConfig(config) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const allRows = [];
    
    // Read data from input sheet (auto-detect entire sheet)
    const inputSheet = spreadsheet.getSheetByName(config.inputSheetName);
    if (!inputSheet) {
      throw new Error(`Input sheet "${config.inputSheetName}" not found`);
    }
    
    const lastRow = inputSheet.getLastRow();
    const lastCol = inputSheet.getLastColumn();
    
    if (lastRow <= 1 || lastCol === 0) {
      throw new Error(`No data found in "${config.inputSheetName}"`);
    }
    
    // Skip header row, read from row 2 onwards
    const data = inputSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const validRows = data.filter(row => row[0] !== ''); // Filter empty rows
    
    if (validRows.length === 0) {
      throw new Error(`No valid data rows found in "${config.inputSheetName}"`);
    }
    
    allRows.push(...validRows);
    Logger.log(`Read ${validRows.length} rows from ${config.inputSheetName}`);
    
    // Remove duplicates based on specified columns
    const uniqueRows = removeDuplicates(allRows, config.duplicateCheckColumns);
    Logger.log(`After deduplication: ${uniqueRows.length} unique rows`);
    
    // Sort rows chronologically by date (column 1)
    const sortedRows = sortByDate(uniqueRows);
    Logger.log(`After sorting: ${sortedRows.length} rows sorted chronologically`);
    
    // Get or create output sheet
    let outputSheet = spreadsheet.getSheetByName(config.outputSheetName);
    if (!outputSheet) {
      outputSheet = spreadsheet.insertSheet(config.outputSheetName);
      Logger.log(`Created output sheet: ${config.outputSheetName}`);
    }
    
    // Clear existing data (if any)
    const lastOutputRow = outputSheet.getLastRow();
    if (lastOutputRow > 1) {
      outputSheet.getRange(2, 1, lastOutputRow - 1, outputSheet.getLastColumn()).clear();
    }
    
    // Copy headers if specified
    if (config.headersSheetName && config.headersRange) {
      const headersSheet = spreadsheet.getSheetByName(config.headersSheetName);
      if (headersSheet) {
        try {
          const headers = headersSheet.getRange(config.headersRange).getValues()[0];
          outputSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } catch (e) {
          Logger.log(`Warning: Could not read headers from ${config.headersRange}: ${e.message}`);
        }
      }
    }
    
    // Write sorted unique rows to output
    if (sortedRows.length > 0) {
      outputSheet.getRange(config.outputStartRow, 1, sortedRows.length, sortedRows[0].length)
        .setValues(sortedRows);
    }
    
    return {
      inputCount: validRows.length,
      outputCount: sortedRows.length,
      duplicatesRemoved: validRows.length - uniqueRows.length
    };
    
  } catch (error) {
    Logger.log(`Error processing ${config.inputSheetName}: ${error.message}`);
    throw error;
  }
}

/**
 * Main function to combine and deduplicate NCAAM schedules
 */
function combineAndRemoveDuplicatesNCAAM() {
  try {
    const result = processConfig(NCAAM_CONFIG);
    
    const message = `✅ NCAAM: Successfully combined and deduplicated!\n\n` +
      `Input rows: ${result.inputCount}\n` +
      `Unique rows: ${result.outputCount}\n` +
      `Duplicates removed: ${result.duplicatesRemoved}`;
    
    SpreadsheetApp.getUi().alert('NCAAM Combine Complete', message, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log(message);
    
  } catch (error) {
    const errorMsg = `❌ NCAAM Error: ${error.message}`;
    Logger.log(errorMsg);
    SpreadsheetApp.getUi().alert('NCAAM Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Main function to combine and deduplicate NCAAW schedules
 */
function combineAndRemoveDuplicatesNCAAW() {
  try {
    const result = processConfig(NCAAW_CONFIG);
    
    const message = `✅ NCAAW: Successfully combined and deduplicated!\n\n` +
      `Input rows: ${result.inputCount}\n` +
      `Unique rows: ${result.outputCount}\n` +
      `Duplicates removed: ${result.duplicatesRemoved}`;
    
    SpreadsheetApp.getUi().alert('NCAAW Combine Complete', message, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log(message);
    
  } catch (error) {
    const errorMsg = `❌ NCAAW Error: ${error.message}`;
    Logger.log(errorMsg);
    SpreadsheetApp.getUi().alert('NCAAW Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Process both NCAAM and NCAAW
 */
function combineAndRemoveDuplicates() {
  combineAndRemoveDuplicatesNCAAM();
  combineAndRemoveDuplicatesNCAAW();
}

/**
 * Remove duplicates from rows based on specified columns
 * @param {Array<Array>} rows - Array of rows (each row is an array)
 * @param {Array<number>} checkColumns - 1-based column indices to check for duplicates
 * @returns {Array<Array>} - Array of unique rows
 */
function removeDuplicates(rows, checkColumns) {
  const seen = new Map();
  const uniqueRows = [];
  
  for (const row of rows) {
    // Create a key from the specified columns
    const key = checkColumns.map(colIndex => {
      const value = row[colIndex - 1]; // Convert to 0-based index
      return value !== null && value !== undefined ? String(value).trim() : '';
    }).join('|');
    
    // Only add if we haven't seen this key before
    if (!seen.has(key)) {
      seen.set(key, true);
      uniqueRows.push(row);
    }
  }
  
  return uniqueRows;
}

/**
 * Parse a date value (string or Date object) to a Date object
 * @param {string|Date} dateValue - Date string in MM/DD/YYYY format or Date object
 * @returns {Date} - Date object, or null if invalid
 */
function parseDate(dateValue) {
  if (!dateValue) {
    return null;
  }
  
  // If it's already a Date object, return it
  if (dateValue instanceof Date) {
    // Validate it's a valid date
    if (isNaN(dateValue.getTime())) {
      return null;
    }
    return dateValue;
  }
  
  // If it's a string, parse it
  if (typeof dateValue === 'string') {
    const parts = dateValue.trim().split('/');
    if (parts.length !== 3) {
      return null;
    }
    
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      return null;
    }
    
    // Create date object (month is 0-indexed in JavaScript Date)
    const date = new Date(year, month - 1, day);
    
    // Validate the date was created correctly
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    
    return date;
  }
  
  return null;
}

/**
 * Sort rows chronologically by date (column 1, index 0)
 * @param {Array<Array>} rows - Array of rows (each row is an array)
 * @returns {Array<Array>} - Array of rows sorted by date
 */
function sortByDate(rows) {
  return rows.sort((a, b) => {
    const dateA = parseDate(a[0]); // Column 1 (Date) is at index 0
    const dateB = parseDate(b[0]);
    
    // If either date is invalid, put invalid dates at the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // Compare dates
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Creates a custom menu when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Schedule Tools')
    .addItem('Combine NCAAM', 'combineAndRemoveDuplicatesNCAAM')
    .addItem('Combine NCAAW', 'combineAndRemoveDuplicatesNCAAW')
    .addSeparator()
    .addItem('Combine Both (NCAAM + NCAAW)', 'combineAndRemoveDuplicates')
    .addToUi();
}

/**
 * Trigger function that runs automatically when a cell is edited
 * Detects which input sheet was edited and runs the appropriate combine function
 * 
 * NOTE: The function name "onEdit" is a special reserved name in Google Apps Script
 * that automatically creates a trigger. You don't need to manually set up a trigger
 * for this function - it will run automatically on any edit.
 * 
 * However, if you want to set up an installable trigger for more control:
 * 1. Go to Extensions > Apps Script
 * 2. Click on the clock icon (Triggers) in the left sidebar
 * 3. Click "+ Add Trigger" at the bottom right
 * 4. Choose function: onEdit
 * 5. Choose event source: From spreadsheet
 * 6. Choose event type: On edit
 * 7. Click Save
 * 
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e - The edit event (optional for manual testing)
 */
function onEdit(e) {
  // Handle case where function is called manually (without event parameter)
  if (!e || !e.source) {
    Logger.log('onEdit called without event parameter - this function only works with automatic triggers');
    return;
  }
  
  // Prevent infinite loops by checking if we're already processing
  const processingFlag = PropertiesService.getScriptProperties().getProperty('processingCombine');
  if (processingFlag === 'true') {
    return;
  }
  
  try {
    const sheet = e.source.getActiveSheet();
    if (!sheet) {
      return;
    }
    
    const sheetName = sheet.getName();
    
    // Only process if the edited sheet is one of our input sheets
    // Skip if editing output sheets to prevent loops
    if (sheetName === NCAAM_CONFIG.outputSheetName || sheetName === NCAAW_CONFIG.outputSheetName) {
      return;
    }
    
    // Debounce: Check if edit was too recent (within last 5 seconds)
    // This prevents multiple runs when user pastes large amounts of data
    // Gives user time to sort data before processing
    const lastEditKey = sheetName === NCAAM_CONFIG.inputSheetName ? 'lastNCAAMEdit' : 'lastNCAAWEdit';
    const lastEditTime = PropertiesService.getScriptProperties().getProperty(lastEditKey);
    const now = new Date().getTime();
    
    if (lastEditTime && (now - parseInt(lastEditTime)) < 5000) {
      // Edit was too recent, skip this run
      return;
    }
    
    // Set processing flag and timestamp
    PropertiesService.getScriptProperties().setProperty('processingCombine', 'true');
    PropertiesService.getScriptProperties().setProperty(lastEditKey, now.toString());
    
    // Wait 5 seconds before processing to allow user to sort data
    Utilities.sleep(5000);
    
    // Process the appropriate sheet
    if (sheetName === NCAAM_CONFIG.inputSheetName) {
      combineAndRemoveDuplicatesNCAAM();
    } else if (sheetName === NCAAW_CONFIG.inputSheetName) {
      combineAndRemoveDuplicatesNCAAW();
    }
    
  } catch (error) {
    Logger.log(`Error in onEdit trigger: ${error.message}`);
  } finally {
    // Clear processing flag after a short delay
    Utilities.sleep(1000); // Wait 1 second
    PropertiesService.getScriptProperties().deleteProperty('processingCombine');
  }
}

/**
 * Test function to verify configuration
 */
function testConfiguration() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let message = 'Configuration Test Results:\n\n';
    
    // Test NCAAM
    message += '=== NCAAM ===\n';
    const ncaamInput = spreadsheet.getSheetByName(NCAAM_CONFIG.inputSheetName);
    if (ncaamInput) {
      const lastRow = ncaamInput.getLastRow();
      const lastCol = ncaamInput.getLastColumn();
      message += `✅ Input: "${NCAAM_CONFIG.inputSheetName}" - Found ${lastRow - 1} data rows, ${lastCol} columns\n`;
    } else {
      message += `❌ Input: "${NCAAM_CONFIG.inputSheetName}" - Sheet not found\n`;
    }
    
    const ncaamOutput = spreadsheet.getSheetByName(NCAAM_CONFIG.outputSheetName);
    if (ncaamOutput) {
      message += `✅ Output: "${NCAAM_CONFIG.outputSheetName}" - Sheet exists\n`;
    } else {
      message += `⚠️ Output: "${NCAAM_CONFIG.outputSheetName}" - Will be created\n`;
    }
    
    message += '\n=== NCAAW ===\n';
    const ncaawInput = spreadsheet.getSheetByName(NCAAW_CONFIG.inputSheetName);
    if (ncaawInput) {
      const lastRow = ncaawInput.getLastRow();
      const lastCol = ncaawInput.getLastColumn();
      message += `✅ Input: "${NCAAW_CONFIG.inputSheetName}" - Found ${lastRow - 1} data rows, ${lastCol} columns\n`;
    } else {
      message += `❌ Input: "${NCAAW_CONFIG.inputSheetName}" - Sheet not found\n`;
    }
    
    const ncaawOutput = spreadsheet.getSheetByName(NCAAW_CONFIG.outputSheetName);
    if (ncaawOutput) {
      message += `✅ Output: "${NCAAW_CONFIG.outputSheetName}" - Sheet exists\n`;
    } else {
      message += `⚠️ Output: "${NCAAW_CONFIG.outputSheetName}" - Will be created\n`;
    }
    
    SpreadsheetApp.getUi().alert('Configuration Test', message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Configuration Error', `❌ ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}


