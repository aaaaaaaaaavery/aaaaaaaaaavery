const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const LOGOS_DIR = path.join(__dirname, 'logos');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = require('fs').createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrapeFlashscoreLogos() {
  console.log('🚀 Starting Flashscore logo scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Loading Flashscore NBA standings page...');
    await page.goto('https://www.flashscoreusa.com/basketball/usa/nba/standings/#/MHnOejlI/standings/overall/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(3000);
    
    console.log('🔍 Extracting team data...');
    
    // Extract team data - Flashscore uses specific selectors
    const teams = await page.evaluate(() => {
      const teamData = [];
      
      // Try multiple strategies to find teams
      // Strategy 1: Look for table rows with team data
      const rows = document.querySelectorAll('table tbody tr, [class*="standings"] tr, [class*="table"] tr');
      
      rows.forEach(row => {
        // Find team name (usually in a link or span)
        const nameElement = row.querySelector('a[href*="/team/"], a[href*="/basketball"], [class*="name"], [class*="team"]') || 
                           row.querySelector('td:first-child, td:nth-child(2)');
        
        if (!nameElement) return;
        
        const teamName = nameElement.textContent?.trim();
        if (!teamName || teamName.length < 3) return;
        
        // Find logo image
        const imgElement = row.querySelector('img');
        let logoUrl = null;
        
        if (imgElement) {
          logoUrl = imgElement.src || 
                   imgElement.getAttribute('data-src') || 
                   imgElement.getAttribute('data-lazy-src');
        }
        
        // Flashscore logo pattern: https://static.flashscore.com/res/image/data/...
        if (logoUrl && logoUrl.includes('flashscore.com') && logoUrl.includes('res/image')) {
          // Avoid duplicates
          const exists = teamData.find(t => t.name === teamName);
          if (!exists) {
            teamData.push({
              name: teamName,
              logoUrl: logoUrl
            });
          }
        }
      });
      
      // Strategy 2: Look for all images with team logos
      if (teamData.length < 20) {
        const images = document.querySelectorAll('img[src*="flashscore.com/res/image"]');
        images.forEach(img => {
          const parent = img.closest('tr, [class*="team"], [class*="standings"]');
          if (parent) {
            const nameEl = parent.querySelector('a, [class*="name"]');
            const teamName = nameEl?.textContent?.trim();
            if (teamName && teamName.length > 2) {
              const exists = teamData.find(t => t.name === teamName);
              if (!exists) {
                teamData.push({
                  name: teamName,
                  logoUrl: img.src
                });
              }
            }
          }
        });
      }
      
      return teamData;
    });
    
    console.log(`📊 Found ${teams.length} teams`);
    
    if (teams.length === 0) {
      console.log('⚠️  No teams found. The page structure may have changed.');
      console.log('💡 Alternative: Use a logo API or download manually from team websites');
      return;
    }
    
    // Create logos directory
    await fs.mkdir(LOGOS_DIR, { recursive: true });
    
    // Download logos
    console.log('⬇️  Downloading logos...');
    const downloaded = [];
    
    for (const team of teams) {
      try {
        // Clean team name for filename
        const filename = team.name
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase()
          .replace(/_+/g, '_');
        
        const filepath = path.join(LOGOS_DIR, `${filename}.png`);
        
        // Skip if already exists
        try {
          await fs.access(filepath);
          console.log(`⏭️  Skipping ${team.name} (already exists)`);
          downloaded.push({ name: team.name, filename: `${filename}.png`, status: 'exists' });
          continue;
        } catch {
          // File doesn't exist, proceed
        }
        
        await downloadImage(team.logoUrl, filepath);
        console.log(`✅ Downloaded ${team.name}`);
        downloaded.push({ name: team.name, filename: `${filename}.png`, status: 'downloaded' });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to download ${team.name}:`, error.message);
        downloaded.push({ name: team.name, filename: null, status: 'failed', error: error.message });
      }
    }
    
    // Save team mapping JSON
    const mapping = downloaded
      .filter(t => t.filename)
      .map(t => ({
        name: t.name,
        filename: t.filename,
        status: t.status
      }));
    
    await fs.writeFile(
      path.join(LOGOS_DIR, 'team-mapping.json'),
      JSON.stringify(mapping, null, 2)
    );
    
    console.log('\n✅ Logo scraping complete!');
    console.log(`📁 Logos saved to: ${LOGOS_DIR}`);
    console.log(`📊 Successfully downloaded: ${downloaded.filter(t => t.status === 'downloaded').length}`);
    console.log(`📋 Total teams: ${downloaded.length}`);
    
  } catch (error) {
    console.error('❌ Error scraping logos:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Alternative: Use known logo sources
async function getLogosFromKnownSources() {
  console.log('💡 Alternative logo sources:');
  console.log('   1. Team websites (official logos)');
  console.log('   2. SportsLogo.net');
  console.log('   3. ESPN API (if available)');
  console.log('   4. Manual download and organize');
}

if (require.main === module) {
  scrapeFlashscoreLogos()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      getLogosFromKnownSources();
      process.exit(1);
    });
}

module.exports = { scrapeFlashscoreLogos };

