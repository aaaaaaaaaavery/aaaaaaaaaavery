// parse-future-csv.js
const fs = require('fs');

async function parseAndOutputCSV() {
  try {
    console.log('Reading index-future.txt...');
    const rawData = fs.readFileSync('index-future.txt', 'utf8');
    const data = JSON.parse(rawData);
    
    console.log('Parsing games...');
    const games = [];
    
    for (const tournament of data.DATA) {
      const sport = tournament.SPORT_NAME || 'Unknown';
      const league = tournament.NAME;
      
      for (const event of tournament.EVENTS || []) {
        const game = {
          sport: sport,
          gameId: event.EVENT_ID,
          league: league,
          matchup: `${event.HOME_NAME} vs ${event.AWAY_NAME}`,
          startTime: event.START_TIME ? new Date(event.START_TIME * 1000).toISOString() : '',
          homeTeam: event.HOME_NAME,
          awayTeam: event.AWAY_NAME
        };
        games.push(game);
      }
    }
    
    console.log(`Found ${games.length} games`);
    
    // Create CSV output
    const csvHeader = 'Sport,Game ID,League,Matchup,Start Time,Home Team,Away Team';
    const csvRows = games.map(g => 
      `"${g.sport}","${g.gameId}","${g.league}","${g.matchup}","${g.startTime}","${g.homeTeam}","${g.awayTeam}"`
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Write to file
    fs.writeFileSync('future-games.csv', csvContent);
    console.log('CSV file created: future-games.csv');
    
    // Also output to console
    console.log('\n--- CSV OUTPUT ---');
    console.log(csvContent);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the script
parseAndOutputCSV();

