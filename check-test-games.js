import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function getTodayGames() {
  const todayStr = '2025-10-29';
  const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames_TEST');
  
  // Get all games and filter by gameDate
  const snapshot = await gamesRef.get();
  
  console.log(`Total documents in collection: ${snapshot.size}\n`);
  
  if (snapshot.empty) {
    console.log('No games found.');
    return;
  }
  
  const gamesByLeague = {};
  const gamesByDate = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const gameDate = data.gameDate || 'NO_DATE';
    const league = data.League || 'Unknown';
    
    // Track games by date
    if (!gamesByDate[gameDate]) {
      gamesByDate[gameDate] = 0;
    }
    gamesByDate[gameDate]++;
    
    // Only include games for today
    if (gameDate !== todayStr) {
      return;
    }
    
    if (!gamesByLeague[league]) {
      gamesByLeague[league] = [];
    }
    
    gamesByLeague[league].push({
      homeTeam: data['Home Team'] || '',
      awayTeam: data['Away Team'] || '',
      startTime: data['Start Time']?.toDate ? data['Start Time'].toDate().toISOString() : '',
      homeScore: data['Home Score'] || '',
      awayScore: data['Away Score'] || '',
      status: data['Match Status'] || ''
    });
  });
  
  console.log('Games by date:');
  Object.keys(gamesByDate).sort().forEach(date => {
    console.log(`  ${date}: ${gamesByDate[date]} games`);
  });
  console.log('');
  
  // Sort leagues alphabetically
  const sortedLeagues = Object.keys(gamesByLeague).sort();
  
  sortedLeagues.forEach(league => {
    console.log(`\n=== ${league} ===`);
    // Sort games by start time
    gamesByLeague[league].sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return new Date(a.startTime) - new Date(b.startTime);
    });
    
    gamesByLeague[league].forEach(game => {
      const scoreStr = game.homeScore && game.awayScore ? ` (${game.homeScore}-${game.awayScore})` : '';
      const statusStr = game.status ? ` [${game.status}]` : '';
      const timeStr = game.startTime ? new Date(game.startTime).toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit' }) : 'NO TIME';
      console.log(`${timeStr} - ${game.awayTeam} @ ${game.homeTeam}${scoreStr}${statusStr}`);
    });
    console.log(`Total: ${gamesByLeague[league].length} games`);
  });
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total games: ${snapshot.size}`);
  console.log(`Total leagues: ${sortedLeagues.length}`);
}

getTodayGames().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
