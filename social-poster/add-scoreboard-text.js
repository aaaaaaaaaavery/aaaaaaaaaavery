const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

/**
 * Add scoreboard text to the THPORTH stadium image
 */
async function addScoreboardText(inputPath, outputPath) {
  try {
    console.log(`📖 Loading image: ${inputPath}`);
    
    // Load the image
    const image = await loadImage(inputPath);
    
    // Create canvas with same dimensions as image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(image, 0, 0);
    
    // Scoreboard text data
    const scoreboardRows = [
      "2p EST, NCAAW, 4 Texas vs. 3 UCLA, TruTV",
      "3p ET, UCL, Bayern v. Arsenal, Para. +",
      "5p ET, NBA, Pistons v. Celtics, ESPN",
      "9:30p ET, NCAAM, 12 Gonzaga v. 7 Michigan, TNT"
    ];
    
    // Calculate scoreboard position (adjust these based on your image)
    // The scoreboard is in the center, black area with grid
    // We'll position text in each of the 4 rows
    
    const imageWidth = image.width;
    const imageHeight = image.height;
    
    // Estimate scoreboard position (you may need to adjust these)
    // Scoreboard is typically in upper-middle area
    const scoreboardX = imageWidth * 0.15; // Left edge of scoreboard
    const scoreboardY = imageHeight * 0.25; // Top of scoreboard area
    const scoreboardWidth = imageWidth * 0.7; // Width of scoreboard
    const rowHeight = (imageHeight * 0.15) / 4; // Height per row (adjust based on scoreboard size)
    
    // Font settings
    const fontSize = Math.min(imageWidth / 25, 24); // Scale font with image size
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#ffffff'; // White text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Add text shadow for readability
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw each row
    scoreboardRows.forEach((text, index) => {
      const y = scoreboardY + (index * rowHeight) + (rowHeight * 0.3); // Center text in row
      const x = scoreboardX + (scoreboardWidth * 0.05); // Small padding from left
      
      // Truncate text if too long to fit
      const maxWidth = scoreboardWidth * 0.9;
      let displayText = text;
      const metrics = ctx.measureText(text);
      
      if (metrics.width > maxWidth) {
        // Try to fit by reducing font or truncating
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        displayText = truncated + '...';
      }
      
      ctx.fillText(displayText, x, y);
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Image saved to: ${outputPath}`);
    console.log(`📐 Image dimensions: ${image.width}x${image.height}`);
    console.log(`📝 Added ${scoreboardRows.length} rows to scoreboard`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Interactive mode - allows manual position adjustment
async function addScoreboardTextInteractive(inputPath, outputPath) {
  try {
    console.log(`📖 Loading image: ${inputPath}`);
    
    const image = await loadImage(inputPath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(image, 0, 0);
    
    const scoreboardRows = [
      "2p EST, NCAAW, 4 Texas vs. 3 UCLA, TruTV",
      "3p ET, UCL, Bayern v. Arsenal, Para. +",
      "5p ET, NBA, Pistons v. Celtics, ESPN",
      "9:30p ET, NCAAM, 12 Gonzaga v. 7 Michigan, TNT"
    ];
    
    // Default positions (you can adjust these)
    const positions = {
      x: image.width * 0.15,        // Left edge of scoreboard
      y: image.height * 0.25,       // Top of scoreboard
      width: image.width * 0.7,     // Scoreboard width
      rowSpacing: image.height * 0.0375, // Space between rows
      fontSize: Math.min(image.width / 25, 24),
      padding: image.width * 0.05  // Left padding
    };
    
    // Allow override via environment variables or command line
    if (process.env.SCOREBOARD_X) positions.x = parseFloat(process.env.SCOREBOARD_X);
    if (process.env.SCOREBOARD_Y) positions.y = parseFloat(process.env.SCOREBOARD_Y);
    if (process.env.SCOREBOARD_FONT_SIZE) positions.fontSize = parseFloat(process.env.SCOREBOARD_FONT_SIZE);
    if (process.env.SCOREBOARD_ROW_SPACING) positions.rowSpacing = parseFloat(process.env.SCOREBOARD_ROW_SPACING);
    
    ctx.font = `bold ${positions.fontSize}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Shadow for readability
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    scoreboardRows.forEach((text, index) => {
      const y = positions.y + (index * positions.rowSpacing);
      const x = positions.x + positions.padding;
      
      // Check if text fits
      const maxWidth = positions.width - (positions.padding * 2);
      let displayText = text;
      const metrics = ctx.measureText(text);
      
      if (metrics.width > maxWidth) {
        // Scale down font if needed
        let testFontSize = positions.fontSize;
        while (ctx.measureText(text).width > maxWidth && testFontSize > 12) {
          testFontSize -= 1;
          ctx.font = `bold ${testFontSize}px Arial`;
        }
        displayText = text;
      }
      
      ctx.fillText(displayText, x, y);
    });
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Image saved to: ${outputPath}`);
    console.log(`📐 Dimensions: ${image.width}x${image.height}`);
    console.log(`📍 Scoreboard position: x=${positions.x.toFixed(0)}, y=${positions.y.toFixed(0)}`);
    console.log(`📏 Font size: ${positions.fontSize}px`);
    console.log(`\n💡 If text position is wrong, adjust with:`);
    console.log(`   SCOREBOARD_X=${positions.x} SCOREBOARD_Y=${positions.y} node add-scoreboard-text.js input.png output.png`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node add-scoreboard-text.js <input-image> <output-image>');
    console.log('');
    console.log('Adds scoreboard text to THPORTH stadium image');
    console.log('');
    console.log('Environment variables for position adjustment:');
    console.log('  SCOREBOARD_X=<number>        X position of scoreboard');
    console.log('  SCOREBOARD_Y=<number>        Y position of scoreboard');
    console.log('  SCOREBOARD_FONT_SIZE=<num>   Font size in pixels');
    console.log('  SCOREBOARD_ROW_SPACING=<num> Space between rows');
    console.log('');
    console.log('Example:');
    console.log('  node add-scoreboard-text.js stadium.png stadium-with-text.png');
    console.log('  SCOREBOARD_Y=150 node add-scoreboard-text.js stadium.png output.png');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1];
  
  addScoreboardTextInteractive(inputPath, outputPath)
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { addScoreboardText, addScoreboardTextInteractive };

