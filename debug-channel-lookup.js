// Debug script to check why channel lookup isn't working
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// Normalize team names for matching (same as channel-lookup-index.js)
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

async function debugChannelLookup() {
  try {
    console.log('🔍 Debugging channel lookup...\n');
    
    // Get today's date
    const nowInEastern = new Date();
    const todayStr = nowInEastern.toISOString().split('T')[0];
    console.log(`Today's date: ${todayStr}\n`);
    
    // 1. Check what games exist in sportsGames for today
    console.log('=== CHECKING SPORTSGAMES COLLECTION ===');
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const gamesSnapshot = await gamesRef.where('gameDate', '==', todayStr).get();
    
    console.log(`Found ${gamesSnapshot.size} games for today`);
    
    if (gamesSnapshot.size > 0) {
      console.log('\nFirst few games:');
      let count = 0;
      gamesSnapshot.forEach(doc => {
        if (count < 3) {
          const game = doc.data();
          console.log(`- ${game['Away Team']} @ ${game['Home Team']} (${game.League})`);
          console.log(`  Normalized: ${normalizeTeamName(game['Away Team'])} @ ${normalizeTeamName(game['Home Team'])}`);
          count++;
        }
      });
    }
    
    // 2. Check LaLiga collection for channel data
    console.log('\n=== CHECKING LALIGA COLLECTION ===');
    const laligaRef = db.collection('LaLiga');
    const laligaSnapshot = await laligaRef.where('date', '==', todayStr).get();
    
    console.log(`Found ${laligaSnapshot.size} LaLiga channel entries for today`);
    
    if (laligaSnapshot.size > 0) {
      console.log('\nFirst few channel entries:');
      let count = 0;
      laligaSnapshot.forEach(doc => {
        if (count < 3) {
          const data = doc.data();
          console.log(`- ${data.away} @ ${data.home} (${data.channel})`);
          console.log(`  Normalized: ${normalizeTeamName(data.away)} @ ${normalizeTeamName(data.home)}`);
          count++;
        }
      });
    }
    
    // 3. Test specific matching
    console.log('\n=== TESTING SPECIFIC MATCHES ===');
    const testKey = `${normalizeTeamName('Espanyol')}|${normalizeTeamName('R. Oviedo')}|${todayStr}`;
    console.log(`Looking for key: "${testKey}"`);
    
    // 4. Check if there are any LaLiga games without channels
    console.log('\n=== CHECKING LALIGA GAMES WITHOUT CHANNELS ===');
    const laligaGames = [];
    gamesSnapshot.forEach(doc => {
      const game = doc.data();
      if (game.League === 'Spain: LaLiga') {
        laligaGames.push({ id: doc.id, ...game });
      }
    });
    
    console.log(`Found ${laligaGames.length} LaLiga games`);
    
    for (const game of laligaGames) {
      const key = `${normalizeTeamName(game['Away Team'])}|${normalizeTeamName(game['Home Team'])}|${todayStr}`;
      console.log(`Game: ${game['Away Team']} @ ${game['Home Team']}`);
      console.log(`Key: "${key}"`);
      console.log(`Has channel field: ${game.channel ? 'YES' : 'NO'}`);
      if (game.channel) {
        console.log(`Channel: ${game.channel}`);
      }
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugChannelLookup();
