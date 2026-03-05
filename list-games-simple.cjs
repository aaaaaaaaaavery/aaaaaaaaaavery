const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listGames(dateStr) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`DATE: ${dateStr}`);
    console.log('='.repeat(80));
    
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await gamesRef.where('gameDate', '==', dateStr).get();
    
    if (snapshot.empty) {
      console.log('\nNo games found for this date.\n');
      return;
    }
    
    const games = [];
    snapshot.forEach(doc => {
      games.push(doc.data());
    });
    
    // Group by league
    const gamesByLeague = {};
    games.forEach(game => {
      const league = game.League || game.league || 'Unknown League';
      if (!gamesByLeague[league]) {
        gamesByLeague[league] = [];
      }
      gamesByLeague[league].push({
        gameId: game['Game ID'] || 'NO GAME ID',
        awayTeam: game['Away Team'] || game.awayTeam || 'TBD',
        homeTeam: game['Home Team'] || game.homeTeam || 'TBD',
        status: game['Match Status'] || 'NO STATUS',
        awayScore: game['Away Score'] || '',
        homeScore: game['Home Score'] || ''
      });
    });
    
    // Sort leagues alphabetically
    const sortedLeagues = Object.keys(gamesByLeague).sort();
    
    // Print games by league
    sortedLeagues.forEach(league => {
      console.log(`\n${league}`);
      console.log('-'.repeat(80));
      
      gamesByLeague[league].forEach((game, index) => {
        const scoreStr = (game.awayScore && game.homeScore) ? ` (${game.awayScore}-${game.homeScore})` : '';
        console.log(`  ${game.gameId.padEnd(40)} ${game.awayTeam} vs ${game.homeTeam}${scoreStr} [${game.status}]`);
      });
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Total: ${games.length} games across ${sortedLeagues.length} leagues\n`);
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Get date from command line argument or use today
const args = process.argv.slice(2);
let dateStr;

if (args.length > 0) {
  dateStr = args[0];
} else {
  const now = DateTime.now().setZone('America/Denver');
  dateStr = now.toISODate();
}

// Run
listGames(dateStr)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

