/**
 * Google Apps Script to format columns across all sheets in a spreadsheet
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Modify the formatColumn function to set your desired formatting
 * 5. Run formatAllColumns() function
 */

function formatAllColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  // Define formatting for each column (0-indexed: A=0, B=1, C=2, etc.)
  const columnFormats = {
    0: { // Column A
      numberFormat: '@', // Text format
      backgroundColor: '#ffffff',
      fontFamily: 'Arial',
      fontSize: 10,
      bold: false
    },
    1: { // Column B
      numberFormat: '@', // Text format
      backgroundColor: '#ffffff',
      fontFamily: 'Arial',
      fontSize: 10,
      bold: false
    },
    2: { // Column C
      numberFormat: '@', // Text format
      backgroundColor: '#ffffff',
      fontFamily: 'Arial',
      fontSize: 10,
      bold: false
    },
    // Add more columns as needed (D=3, E=4, F=5, etc.)
  };
  
  sheets.forEach((sheet, sheetIndex) => {
    console.log(`Formatting sheet: ${sheet.getName()}`);
    
    Object.keys(columnFormats).forEach(colIndex => {
      const col = parseInt(colIndex);
      const format = columnFormats[colIndex];
      const range = sheet.getRange(1, col + 1, sheet.getMaxRows(), 1);
      
      // Apply number format
      if (format.numberFormat) {
        range.setNumberFormat(format.numberFormat);
      }
      
      // Apply background color
      if (format.backgroundColor) {
        range.setBackground(format.backgroundColor);
      }
      
      // Apply font family
      if (format.fontFamily) {
        range.setFontFamily(format.fontFamily);
      }
      
      // Apply font size
      if (format.fontSize) {
        range.setFontSize(format.fontSize);
      }
      
      // Apply bold
      if (format.bold !== undefined) {
        range.setFontWeight(format.bold ? 'bold' : 'normal');
      }
    });
    
    console.log(`✓ Formatted ${sheet.getName()}`);
  });
  
  console.log('✅ All columns formatted across all sheets!');
}

/**
 * Format a specific column across all sheets
 * @param {number} columnIndex - Column index (0=A, 1=B, 2=C, etc.)
 * @param {Object} format - Formatting options
 */
function formatColumnAcrossAllSheets(columnIndex, format) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  sheets.forEach(sheet => {
    const range = sheet.getRange(1, columnIndex + 1, sheet.getMaxRows(), 1);
    
    if (format.numberFormat) {
      range.setNumberFormat(format.numberFormat);
    }
    if (format.backgroundColor) {
      range.setBackground(format.backgroundColor);
    }
    if (format.fontFamily) {
      range.setFontFamily(format.fontFamily);
    }
    if (format.fontSize) {
      range.setFontSize(format.fontSize);
    }
    if (format.bold !== undefined) {
      range.setFontWeight(format.bold ? 'bold' : 'normal');
    }
    if (format.horizontalAlignment) {
      range.setHorizontalAlignment(format.horizontalAlignment);
    }
    if (format.verticalAlignment) {
      range.setVerticalAlignment(format.verticalAlignment);
    }
  });
}

// Example: Format column A as text across all sheets
function formatColumnA() {
  formatColumnAcrossAllSheets(0, {
    numberFormat: '@', // Text format
    backgroundColor: '#ffffff',
    fontSize: 10
  });
}

// Example: Format column B as date across all sheets
function formatColumnB() {
  formatColumnAcrossAllSheets(1, {
    numberFormat: 'MM/DD/YYYY',
    backgroundColor: '#ffffff',
    fontSize: 10
  });
}

// Example: Format column C as time across all sheets
function formatColumnC() {
  formatColumnAcrossAllSheets(2, {
    numberFormat: 'HH:MM AM/PM',
    backgroundColor: '#ffffff',
    fontSize: 10
  });
}

