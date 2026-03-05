// Script to extract team names from Firestore sportsGames collection
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function extractTeamNames() {
  try {
    console.log('Fetching games from Firestore...\n');
    
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await gamesRef.get();
    
    if (snapshot.empty) {
      console.log('No games found in Firestore.');
      return;
    }
    
    console.log(`Found ${snapshot.size} games\n`);
    
    const teamsByLeague = {};
    
    snapshot.forEach(doc => {
      const game = doc.data();
      const league = game.League || 'Unknown';
      const homeTeam = game['Home Team'];
      const awayTeam = game['Away Team'];
      
      if (!teamsByLeague[league]) {
        teamsByLeague[league] = new Set();
      }
      
      if (homeTeam) teamsByLeague[league].add(homeTeam);
      if (awayTeam) teamsByLeague[league].add(awayTeam);
    });
    
    // Print results
    console.log('========================================');
    console.log('TEAMS BY LEAGUE (from Firestore)');
    console.log('========================================\n');
    
    const sortedLeagues = Object.keys(teamsByLeague).sort();
    
    for (const league of sortedLeagues) {
      const teams = Array.from(teamsByLeague[league]).sort();
      console.log(`\n--- ${league} (${teams.length} teams) ---`);
      teams.forEach(team => console.log(`  ${team}`));
    }
    
    // Also output as CSV for easy import to Google Sheets
    console.log('\n\n========================================');
    console.log('CSV FORMAT (League, Team Name)');
    console.log('========================================\n');
    console.log('League,Team Name');
    
    for (const league of sortedLeagues) {
      const teams = Array.from(teamsByLeague[league]).sort();
      teams.forEach(team => {
        // Escape commas in team/league names for CSV
        const escapedLeague = league.includes(',') ? `"${league}"` : league;
        const escapedTeam = team.includes(',') ? `"${team}"` : team;
        console.log(`${escapedLeague},${escapedTeam}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

extractTeamNames();

