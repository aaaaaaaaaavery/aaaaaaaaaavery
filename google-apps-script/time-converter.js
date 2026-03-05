/**
 * Google Apps Script to convert UTC timestamps in "Start Time" column to EST/EDT
 * This script automatically converts ISO 8601 timestamps (UTC) to Eastern Time
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Add this script (you can keep other scripts if they exist)
 * 4. Save the script
 * 5. The script will run automatically when the sheet is edited
 */

/**
 * Main function that triggers when the sheet is edited
 * This will convert UTC timestamps in the "Start Time" column to EST/EDT
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();
  
  // Only process if header row or Start Time column is edited
  // Find the Start Time column (column E, index 5)
  const startTimeColIndex = 5; // Column E (Sport=1, Game ID=2, League=3, Matchup=4, Start Time=5)
  
  // If the edit is in the Start Time column or anywhere in the row, process it
  if (row > 1) { // Skip header row
    convertTimeColumn(sheet, row);
  }
}

/**
 * Convert all UTC timestamps in Start Time column to EST/EDT
 * This function processes all rows at once for better performance
 */
function convertTimeColumn(sheet, startRow = 2) {
  try {
    const startTimeColIndex = 5; // Column E (Start Time)
    const lastRow = sheet.getLastRow();
    
    Logger.log('convertTimeColumn: lastRow=' + lastRow + ', startRow=' + startRow);
    
    if (lastRow < 2) {
      Logger.log('No data rows found (lastRow < 2)');
      return; // No data rows
    }
    
    // Get all Start Time values from row 2 to last row
    const startTimeRange = sheet.getRange(startRow, startTimeColIndex, lastRow - startRow + 1, 1);
    const startTimeValues = startTimeRange.getValues();
    
    Logger.log('Found ' + startTimeValues.length + ' rows in Start Time column');
    
    const convertedValues = [];
    let hasChanges = false;
    let emptyCount = 0;
    let convertedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < startTimeValues.length; i++) {
      const cellValue = startTimeValues[i][0];
      const rowNum = startRow + i;
      
      // Skip empty cells
      if (!cellValue || cellValue === '' || cellValue === null || cellValue === undefined) {
        convertedValues.push(['']);
        emptyCount++;
        continue;
      }
      
      Logger.log('Row ' + rowNum + ': cellValue type=' + typeof cellValue + ', value=' + cellValue);
      
      // Check if it's already formatted as EST time (contains AM/PM)
      // More specific check to avoid false positives
      if (typeof cellValue === 'string' && 
          (cellValue.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/i))) {
        // Already converted (e.g., "9:45 PM"), skip
        convertedValues.push([cellValue]);
        skippedCount++;
        Logger.log('Row ' + rowNum + ': Already formatted as EST, skipping: ' + cellValue);
        continue;
      }
      
      // Try to parse as ISO 8601 timestamp (UTC)
      // Format examples: "2025-11-07T21:45:00.000Z" or "2025-11-07T21:45:00Z"
      let date;
      let parseSuccess = false;
      
      if (typeof cellValue === 'string') {
        // Check if it's an ISO 8601 string (contains 'T' and ends with 'Z' or has timezone)
        const isISOString = cellValue.includes('T') && 
                           (cellValue.endsWith('Z') || cellValue.includes('+') || cellValue.match(/-\d{2}:\d{2}$/));
        
        if (isISOString) {
          try {
            date = new Date(cellValue);
            parseSuccess = !isNaN(date.getTime());
            if (parseSuccess) {
              Logger.log('Row ' + rowNum + ': Parsed ISO string to date: ' + date.toISOString() + ' -> ' + cellValue);
            }
          } catch (e) {
            Logger.log('Row ' + rowNum + ': Error parsing ISO string: ' + e.toString());
          }
        } else {
          // Try parsing anyway in case it's a valid date string
          date = new Date(cellValue);
          parseSuccess = !isNaN(date.getTime());
          if (parseSuccess) {
            Logger.log('Row ' + rowNum + ': Parsed as date string: ' + date.toISOString());
          }
        }
      } else if (cellValue instanceof Date) {
        // Already a Date object
        date = cellValue;
        parseSuccess = !isNaN(date.getTime());
        if (parseSuccess) {
          Logger.log('Row ' + rowNum + ': Cell is already a Date object: ' + date.toISOString());
        }
      } else if (typeof cellValue === 'number') {
        // Might be a timestamp in seconds or milliseconds
        date = new Date(cellValue > 10000000000 ? cellValue : cellValue * 1000); // Assume seconds if < 10000000000
        parseSuccess = !isNaN(date.getTime());
        if (parseSuccess) {
          Logger.log('Row ' + rowNum + ': Parsed number to date: ' + date.toISOString());
        }
      }
      
      // Check if date is valid
      if (!parseSuccess || isNaN(date.getTime())) {
        convertedValues.push([cellValue]);
        skippedCount++;
        Logger.log('Row ' + rowNum + ': Could not parse as date, skipping. Value: "' + cellValue + '", Type: ' + typeof cellValue);
        continue;
      }
      
      // Convert UTC to Eastern Time (EST/EDT) and format as "h:mm AM/PM" (e.g., "9:45 PM")
      // Utilities.formatDate automatically handles EST/EDT (daylight saving)
      // Important: The date object is already in UTC (from ISO string), so we can format it directly
      const formattedTime = Utilities.formatDate(date, 'America/New_York', 'h:mm a');
      
      Logger.log('Row ' + rowNum + ': Converting ' + cellValue + ' (UTC) to ' + formattedTime + ' (EST/EDT)');
      
      convertedValues.push([formattedTime]);
      hasChanges = true;
      convertedCount++;
    }
    
    Logger.log('Summary: empty=' + emptyCount + ', converted=' + convertedCount + ', skipped=' + skippedCount + ', hasChanges=' + hasChanges);
    
    // Write converted values back if there were changes
    if (hasChanges) {
      startTimeRange.setValues(convertedValues);
      Logger.log('Wrote ' + convertedCount + ' converted timestamps to Start Time column');
    } else {
      Logger.log('No changes to write - all cells were empty or already formatted');
    }
    
  } catch (error) {
    Logger.log('Error converting time column: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
  }
}


/**
 * onChange trigger - fires when sheet content changes (including API writes)
 * This is needed because onEdit doesn't fire when data is written via API
 */
function onChange(e) {
  const sheet = e.source.getActiveSheet();
  // Process all rows to convert any new timestamps
  convertTimeColumn(sheet, 2);
}

/**
 * Debug function - check what's in the Start Time column
 * Run this to see what data is actually there
 */
function debugStartTimeColumn() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const startTimeColIndex = 5; // Column E (Start Time)
  const lastRow = sheet.getLastRow();
  
  Logger.log('=== DEBUG: Start Time Column ===');
  Logger.log('Last row: ' + lastRow);
  
  if (lastRow < 2) {
    Logger.log('No data rows found');
    return;
  }
  
  // Check first few rows
  for (let row = 1; row <= Math.min(lastRow, 10); row++) {
    const cell = sheet.getRange(row, startTimeColIndex);
    const value = cell.getValue();
    const displayValue = cell.getDisplayValue();
    const formula = cell.getFormula();
    
    Logger.log('Row ' + row + ':');
    Logger.log('  Value: ' + value);
    Logger.log('  Type: ' + typeof value);
    Logger.log('  Display: ' + displayValue);
    Logger.log('  Formula: ' + formula);
    Logger.log('  A1 notation: ' + cell.getA1Notation());
  }
  
  // Also check what index.js should be writing (column headers)
  Logger.log('=== Column Headers ===');
  const headerRow = sheet.getRange(1, 1, 1, 10).getValues()[0];
  for (let i = 0; i < headerRow.length; i++) {
    Logger.log('Column ' + (i + 1) + ': ' + headerRow[i]);
  }
}

/**
 * Manual conversion function - run this to convert all times at once
 * Useful for initial setup or if automatic conversion isn't working
 * 
 * IMPORTANT: After running index.js, wait 60 seconds, then run this function
 */
function convertAllTimes() {
  const sheet = SpreadsheetApp.getActiveSheet();
  convertTimeColumn(sheet, 2);
  Logger.log('Converted all timestamps in Start Time column to EST/EDT');
}

/**
 * Set up onChange trigger (run this once to install the trigger)
 * This ensures conversion happens even when data is written via API
 */
function setUpOnChangeTrigger() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const spreadsheet = sheet.getParent();
  
  // Delete existing onChange triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onChange') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new onChange trigger
  ScriptApp.newTrigger('onChange')
    .onChange()
    .create();
  
  Logger.log('onChange trigger installed successfully');
}

