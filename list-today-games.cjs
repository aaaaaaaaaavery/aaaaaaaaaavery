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

async function listTodayGames() {
  try {
    const now = DateTime.now().setZone('America/Denver');
    const todayStr = now.toISODate();
    
    console.log(`\n📅 Fetching games for: ${todayStr}\n`);
    console.log('='.repeat(80));
    
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await gamesRef.where('gameDate', '==', todayStr).get();
    
    if (snapshot.empty) {
      console.log('❌ No games found for today.');
      return;
    }
    
    const games = snapshot.docs.map(doc => doc.data());
    
    // Group games by league
    const gamesByLeague = {};
    
    games.forEach(game => {
      const league = game.League || game.league || 'Unknown League';
      const sport = game.Sport || game.sport || 'Unknown Sport';
      
      if (!gamesByLeague[league]) {
        gamesByLeague[league] = {
          sport: sport,
          games: []
        };
      }
      
      gamesByLeague[league].games.push({
        gameId: game['Game ID'] || 'NO GAME ID',
        awayTeam: game['Away Team'] || game.awayTeam || 'TBD',
        homeTeam: game['Home Team'] || game.homeTeam || 'TBD',
        time: game.timeString || game['Start Time'] || 'TBD',
        channel: game.channel || game.Channel || '',
        status: game['Match Status'] || game.StageType || 'SCHEDULED',
        score: game['Away Score'] && game['Home Score'] 
          ? `${game['Away Score']} - ${game['Home Score']}`
          : null
      });
    });
    
    // Sort leagues alphabetically
    const sortedLeagues = Object.keys(gamesByLeague).sort();
    
    // Display games grouped by league
    sortedLeagues.forEach(league => {
      const leagueData = gamesByLeague[league];
      console.log(`\n🏆 ${league} (${leagueData.sport})`);
      console.log('-'.repeat(80));
      
      // Sort games by time
      leagueData.games.sort((a, b) => {
        if (a.time === 'TBD' && b.time !== 'TBD') return 1;
        if (a.time !== 'TBD' && b.time === 'TBD') return -1;
        if (a.time === 'TBD' && b.time === 'TBD') return 0;
        return (a.time || '').localeCompare(b.time || '');
      });
      
      leagueData.games.forEach((game, index) => {
        const statusIcon = game.status && (
          game.status.toUpperCase().includes('LIVE') || 
          game.status.toUpperCase().includes('IN PROGRESS')
        ) ? '🔴' : game.status && (
          game.status.toUpperCase().includes('FINAL') || 
          game.status.toUpperCase().includes('FINISHED')
        ) ? '✅' : '⏰';
        
        const scoreDisplay = game.score ? ` | Score: ${game.score}` : '';
        const channelDisplay = game.channel ? ` | Channel: ${game.channel}` : '';
        
        console.log(`  ${index + 1}. ${statusIcon} ${game.awayTeam} vs ${game.homeTeam}`);
        console.log(`     Time: ${game.time}${scoreDisplay}${channelDisplay}`);
        console.log(`     Game ID: ${game.gameId}`);
        console.log('');
      });
    });
    
    // Summary
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Games: ${games.length}`);
    console.log(`   Total Leagues: ${sortedLeagues.length}`);
    
    // Create a quick reference list of Game IDs by league
    console.log(`\n📋 Quick Reference - Game IDs by League:`);
    console.log('='.repeat(80));
    sortedLeagues.forEach(league => {
      const leagueData = gamesByLeague[league];
      if (leagueData.games.length > 0) {
        console.log(`\n${league}:`);
        leagueData.games.forEach((game, index) => {
          console.log(`  ${index + 1}. ${game.gameId} (${game.awayTeam} vs ${game.homeTeam})`);
        });
      }
    });
    
    console.log('\n💡 Tip: Copy the Game IDs above and paste them into your Featured Games Google Sheet\n');
    
  } catch (error) {
    console.error('❌ Error listing games:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  listTodayGames()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { listTodayGames };

