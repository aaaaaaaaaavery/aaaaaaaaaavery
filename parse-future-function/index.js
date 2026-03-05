// parse-future-games.js
const fs = require('fs');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1I7U4ayautLhfZnU_qUs8ccQY1kgZqdZ7Ck3xAYyfxHM';
const SHEET_NAME = 'Sheet1';

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  console.log('Google Sheets API authenticated.');
  return sheets;
}

async function parseAndWriteGames() {
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
    
    // Prepare data for Google Sheets
    const sheetRows = games.map(g => [
      g.sport,
      g.gameId,
      g.league,
      g.matchup,
      g.startTime,
      g.homeTeam,
      g.awayTeam
    ]);
    
    const sheetHeader = [
      'Sport', 'Game ID', 'League', 'Matchup', 'Start Time', 'Home Team', 'Away Team'
    ];
    
    // Write to Google Sheets
    const sheets = await authenticateGoogleSheets();
    
    console.log(`Writing ${sheetRows.length} games to ${SHEET_NAME}...`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [sheetHeader, ...sheetRows]
      }
    });
    
    console.log(`Successfully wrote ${sheetRows.length} games to ${SHEET_NAME}.`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Cloud Function export
exports.parseFutureGames = async (req, res) => {
  try {
    await parseAndWriteGames();
    res.status(200).send('Successfully parsed and wrote future games to Google Sheets.');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Failed to parse future games.');
  }
};
