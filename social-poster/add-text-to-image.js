const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

/**
 * Add text to an image
 * 
 * Usage:
 *   node add-text-to-image.js input.png "Your Text" output.png
 *   node add-text-to-image.js input.png "Your Text" output.png --x 100 --y 200 --size 48 --color "#00ff41"
 */
async function addTextToImage(inputPath, text, outputPath, options = {}) {
  try {
    console.log(`📖 Loading image: ${inputPath}`);
    
    // Load the image
    const image = await loadImage(inputPath);
    
    // Create canvas with same dimensions as image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(image, 0, 0);
    
    // Text options with defaults
    const {
      x = image.width / 2,           // Center by default
      y = image.height / 2,          // Center by default
      fontSize = 48,
      fontFamily = 'Arial',
      fontWeight = 'bold',
      color = '#ffffff',
      textAlign = 'center',           // 'left', 'center', 'right'
      textBaseline = 'middle',        // 'top', 'middle', 'bottom'
      strokeColor = null,             // Optional outline color
      strokeWidth = 0,                // Outline width
      shadow = false,                 // Add shadow/glow
      shadowColor = color,
      shadowBlur = 20,
      maxWidth = null,                // Auto-wrap text if exceeds width
      backgroundColor = null,          // Optional background box
      padding = 10                    // Padding for background box
    } = options;
    
    // Set font
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    
    // Add shadow/glow if requested
    if (shadow) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Calculate text dimensions
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // Draw background box if requested
    if (backgroundColor) {
      const boxX = textAlign === 'center' ? x - textWidth / 2 - padding :
                   textAlign === 'right' ? x - textWidth - padding :
                   x - padding;
      const boxY = textBaseline === 'middle' ? y - textHeight / 2 - padding :
                   textBaseline === 'bottom' ? y - textHeight - padding :
                   y - padding;
      const boxWidth = textWidth + (padding * 2);
      const boxHeight = textHeight + (padding * 2);
      
      ctx.fillStyle = backgroundColor;
      ctx.globalAlpha = 0.8; // Semi-transparent
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = color; // Reset to text color
    }
    
    // Draw stroke/outline if requested
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, x, y);
    }
    
    // Draw the text
    ctx.fillText(text, x, y);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Handle text wrapping if maxWidth is specified
    if (maxWidth && textWidth > maxWidth) {
      // Simple word wrapping (you can enhance this)
      const words = text.split(' ');
      let line = '';
      let lineY = y;
      
      ctx.shadowBlur = shadow ? shadowBlur : 0;
      
      words.forEach((word, index) => {
        const testLine = line + word + ' ';
        const testMetrics = ctx.measureText(testLine);
        
        if (testMetrics.width > maxWidth && index > 0) {
          // Draw current line
          if (strokeColor && strokeWidth > 0) {
            ctx.strokeText(line, x, lineY);
          }
          ctx.fillText(line, x, lineY);
          line = word + ' ';
          lineY += fontSize * 1.2; // Line height
        } else {
          line = testLine;
        }
      });
      
      // Draw last line
      if (strokeColor && strokeWidth > 0) {
        ctx.strokeText(line, x, lineY);
      }
      ctx.fillText(line, x, lineY);
    }
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Image saved to: ${outputPath}`);
    console.log(`📐 Dimensions: ${image.width}x${image.height}`);
    console.log(`📝 Text: "${text}"`);
    console.log(`📍 Position: (${x}, ${y})`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node add-text-to-image.js <input-image> <text> <output-image> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --x <number>              X position (default: center)');
    console.log('  --y <number>              Y position (default: center)');
    console.log('  --size <number>           Font size (default: 48)');
    console.log('  --color <hex>             Text color (default: #ffffff)');
    console.log('  --font <name>             Font family (default: Arial)');
    console.log('  --align <left|center|right> Text alignment (default: center)');
    console.log('  --stroke <color>          Outline color');
    console.log('  --stroke-width <number>   Outline width');
    console.log('  --shadow                  Add glow/shadow effect');
    console.log('  --shadow-color <hex>      Shadow color');
    console.log('  --shadow-blur <number>    Shadow blur amount');
    console.log('  --bg <color>              Background box color');
    console.log('  --padding <number>        Background padding');
    console.log('  --max-width <number>      Auto-wrap text at width');
    console.log('');
    console.log('Examples:');
    console.log('  node add-text-to-image.js photo.jpg "Hello" output.png');
    console.log('  node add-text-to-image.js photo.jpg "Title" output.png --x 100 --y 50 --size 72 --color "#00ff41" --shadow');
    console.log('  node add-text-to-image.js photo.jpg "Bottom Text" output.png --y 900 --align center --bg "#000000" --padding 20');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const text = args[1];
  const outputPath = args[2];
  
  // Parse options
  const options = {};
  for (let i = 3; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--x':
        options.x = parseFloat(value);
        break;
      case '--y':
        options.y = parseFloat(value);
        break;
      case '--size':
        options.fontSize = parseInt(value);
        break;
      case '--color':
        options.color = value;
        break;
      case '--font':
        options.fontFamily = value;
        break;
      case '--align':
        options.textAlign = value;
        break;
      case '--stroke':
        options.strokeColor = value;
        break;
      case '--stroke-width':
        options.strokeWidth = parseInt(value);
        break;
      case '--shadow':
        options.shadow = true;
        i--; // No value for this flag
        break;
      case '--shadow-color':
        options.shadowColor = value;
        break;
      case '--shadow-blur':
        options.shadowBlur = parseInt(value);
        break;
      case '--bg':
        options.backgroundColor = value;
        break;
      case '--padding':
        options.padding = parseInt(value);
        break;
      case '--max-width':
        options.maxWidth = parseInt(value);
        break;
    }
  }
  
  addTextToImage(inputPath, text, outputPath, options)
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { addTextToImage };

