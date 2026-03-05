const { generateSocialImage } = require('./index');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase if credentials are available
let db;
function initializeFirebase() {
  if (db) return db;
  
  try {
    if (!admin.apps.length) {
      // Try to initialize with application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'
      });
    }
    db = admin.firestore();
    return db;
  } catch (error) {
    console.warn('⚠️  Firebase not initialized (this is OK for mock previews):', error.message);
    return null;
  }
}

// Get today's featured games (same logic as index.js)
async function getTodaysFeaturedGames() {
  const db = initializeFirebase();
  if (!db) {
    return [];
  }
  
  const today = DateTime.now().setZone('America/New_York').toISODate();
  
  try {
    const featuredRef = db.collection('artifacts/flashlive-daily-scraper/public/data/Featured');
    const snapshot = await featuredRef.where('gameDate', '==', today).get();
    
    if (snapshot.empty) {
      return [];
    }
    
    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      games.push({
        id: doc.id,
        ...data,
        homeTeam: data['Home Team'] || data.homeTeam || '',
        awayTeam: data['Away Team'] || data.awayTeam || '',
        league: data.League || data.league || '',
        channel: data.Channel || data.channel || '',
        startTime: data['Start Time'] || data.startTime,
        timeString: data.timeString || ''
      });
    });
    
    games.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.startTime && b.startTime) {
        return a.startTime.toMillis() - b.startTime.toMillis();
      }
      return 0;
    });
    
    return games;
  } catch (error) {
    console.warn('⚠️  Error fetching games:', error.message);
    return [];
  }
}

// Mock games for preview if no real games exist
const mockGames = [
  {
    id: 'mock1',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    league: 'NBA',
    channel: 'ESPN',
    timeString: '8:00 PM',
    order: 0
  },
  {
    id: 'mock2',
    homeTeam: 'Cowboys',
    awayTeam: 'Eagles',
    league: 'NFL',
    channel: 'FOX',
    timeString: '4:25 PM',
    order: 1
  },
  {
    id: 'mock3',
    homeTeam: 'Yankees',
    awayTeam: 'Red Sox',
    league: 'MLB',
    channel: 'YES Network',
    timeString: '7:05 PM',
    order: 2
  }
];

async function previewDesign(themeName = 'neon', useMockData = false) {
  try {
    console.log(`🎨 Generating preview with ${themeName} theme...`);
    
    let games;
    
    if (useMockData) {
      console.log('📝 Using mock data for preview');
      games = mockGames;
    } else {
      console.log('📅 Fetching real featured games...');
      games = await getTodaysFeaturedGames();
      
      if (games.length === 0) {
        console.log('⚠️  No real games found, using mock data instead');
        games = mockGames;
      }
    }
    
    console.log(`📊 Generating image for ${games.length} games...`);
    
    // Generate image
    const imageBuffer = await generateSocialImage(games, themeName);
    
    // Save to file
    const outputDir = path.join(__dirname, 'previews');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = Date.now();
    const filename = `preview-${themeName}-${timestamp}.png`;
    const latestFilename = `preview-${themeName}-latest.png`;
    const filepath = path.join(outputDir, filename);
    const latestFilepath = path.join(outputDir, latestFilename);
    
    // Save both timestamped and latest version
    await fs.writeFile(filepath, imageBuffer);
    await fs.writeFile(latestFilepath, imageBuffer);
    
    console.log(`✅ Preview saved to: ${filepath}`);
    console.log(`✅ Also saved as: ${latestFilepath}`);
    console.log(`📁 Open the file to see your design!`);
    console.log(`🌐 Or open preview-html.html in a browser`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Error generating preview:', error);
    throw error;
  }
}

// Generate previews for all themes
async function previewAllThemes(useMockData = false) {
  const themes = ['neon', 'cyberpunk', 'electric', 'classic'];
  const files = [];
  
  console.log('🎨 Generating previews for all themes...\n');
  
  for (const theme of themes) {
    try {
      const filepath = await previewDesign(theme, useMockData);
      files.push({ theme, filepath });
      console.log(''); // Empty line between themes
    } catch (error) {
      console.error(`Failed to generate ${theme} preview:`, error.message);
    }
  }
  
  console.log('\n✨ All previews generated!');
  console.log('\n📋 Generated files:');
  files.forEach(({ theme, filepath }) => {
    console.log(`   ${theme}: ${filepath}`);
  });
  
  return files;
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const theme = args[0] || 'neon';
  const useMock = args.includes('--mock') || args.includes('-m');
  const allThemes = args.includes('--all') || args.includes('-a');
  
  if (allThemes) {
    previewAllThemes(useMock)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  } else {
    previewDesign(theme, useMock)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  }
}

module.exports = { previewDesign, previewAllThemes };

