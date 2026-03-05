const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Create logos directory if it doesn't exist
const LOGOS_DIR = path.join(__dirname, 'logos');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrapeNBALogos() {
  console.log('🚀 Starting NBA logo scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a longer timeout for page load
    await page.goto('https://www.flashscoreusa.com/basketball/usa/nba/standings/#/MHnOejlI/standings/overall/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('📄 Page loaded, extracting team data...');
    
    // Wait for standings table to load
    await page.waitForSelector('table, [class*="standings"], [class*="team"]', { timeout: 30000 });
    
    // Extract team names and logo URLs
    const teams = await page.evaluate(() => {
      const teamData = [];
      
      // Try multiple selectors to find team data
      const selectors = [
        'table tbody tr',
        '[class*="standings"] tr',
        '[class*="team"]',
        'a[href*="/team/"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el, index) => {
            // Try to find team name
            const nameEl = el.querySelector('a, [class*="name"], [class*="team"]') || el;
            const teamName = nameEl?.textContent?.trim();
            
            // Try to find logo
            const imgEl = el.querySelector('img');
            const logoUrl = imgEl?.src || imgEl?.getAttribute('data-src');
            
            if (teamName && logoUrl && !teamName.match(/^\d+$/)) {
              // Avoid duplicate entries
              const exists = teamData.find(t => t.name === teamName);
              if (!exists && teamName.length > 2) {
                teamData.push({
                  name: teamName,
                  logoUrl: logoUrl
                });
              }
            }
          });
          
          if (teamData.length >= 30) break; // NBA has 30 teams
        }
      }
      
      return teamData;
    });
    
    console.log(`📊 Found ${teams.length} teams`);
    
    // Create logos directory
    await fs.mkdir(LOGOS_DIR, { recursive: true });
    
    // Download logos
    console.log('⬇️  Downloading logos...');
    for (const team of teams) {
      try {
        // Clean team name for filename
        const filename = team.name
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase();
        
        const filepath = path.join(LOGOS_DIR, `${filename}.png`);
        
        // Skip if already exists
        try {
          await fs.access(filepath);
          console.log(`⏭️  Skipping ${team.name} (already exists)`);
          continue;
        } catch {
          // File doesn't exist, proceed with download
        }
        
        await downloadImage(team.logoUrl, filepath);
        console.log(`✅ Downloaded ${team.name}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to download ${team.name}:`, error.message);
      }
    }
    
    // Save team mapping JSON
    const mapping = teams.map(t => ({
      name: t.name,
      filename: t.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '.png'
    }));
    
    await fs.writeFile(
      path.join(LOGOS_DIR, 'team-mapping.json'),
      JSON.stringify(mapping, null, 2)
    );
    
    console.log('✅ Logo scraping complete!');
    console.log(`📁 Logos saved to: ${LOGOS_DIR}`);
    
  } catch (error) {
    console.error('❌ Error scraping logos:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Alternative: Scrape from Flashscore API or use a known logo source
async function getLogosFromAlternativeSource() {
  console.log('🔄 Trying alternative logo source...');
  
  // Flashscore uses CDN for logos, pattern is usually:
  // https://static.flashscore.com/res/image/data/[hash]/[team-id].png
  
  // For now, we'll create a script that can be run to get logos
  // You can also manually download from team websites or use a logo API
}

if (require.main === module) {
  scrapeNBALogos()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { scrapeNBALogos };

