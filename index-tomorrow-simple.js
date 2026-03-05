// index-tomorrow-simple.js
const { DateTime } = require('luxon');
const { google } = require('googleapis');
const fetch = require('node-fetch');


const TOMORROW_SPREADSHEET_ID = process.env.TOMORROW_SPREADSHEET_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const API_REQUEST_DELAY_MS = 1500;


// Allowed leagues with sport-specific filtering
const ALLOWED_LEAGUE_KEYWORDS = {
  // Soccer-specific leagues
  'Soccer': [
    "Euro Women", "Europe: Conference League - League phase", "Leagues Cup", "Europa League", "North & Central America: Leagues Cup - Play Offs",
    "Conference League", "Portugal: Super Cup", "UEFA Champions League", "Europe: Champions League - League phase",
    "World: Friendly International",
    "England: Premier League", "England: EFL Cup", "Italy: Coppa Italia",
    "Turkey: Super Lig", "Europe: Europa League - Qualification", "Europe: Europa League - League phase", "Europe: Champions League Women - Qualification - Second stage",
    "Europe: Conference League - Qualification", "Germany: Bundesliga", "Portugal: Liga Portugal", "Italy: Serie A",
    "France: Ligue 1", "South America: Copa Libertadores - Play Offs", "Brazil: Serie A Betano", "World: World Cup U20",
    "South America: Copa Sudamericana - Play Offs", "Europe: Champions League - Qualification",
    "Germany: DFB Pokal", "Africa: World Cup - Qualification", "Asia: World Cup - Qualification - Fourth stage", 
    "Asia: Asian Cup - Qualification - Third round", "Europe: World Cup - Qualification",  
    "North & Central America: World Cup - Qualification - Third stage", "World: Club Friendly", "Spain: LaLiga", "USA: NWSL Women", "USA: MLS", "Mexico: Liga MX", "Mexico: Liga MX - Apertura", "Mexico: Liga MX - Clausura", "Saudi Arabia: Saudi Professional League",
    "England: Championship", "World: World Cup U20 - Play Offs", "USA: USL Championship", "Europe: Champions League Women - League phase", "Scotland: Premiership", "England: WSL", "Netherlands: Eredivisie", "North & Central America: Campeones Cup", "Argentina: Torneo Betano - Clausura", "Argentina: Torneo Betano - Apertura", "Scotland: Scottish Cup"
  ],
  // Basketball-specific leagues
  'Basketball': [
    "NBA", "USA: WNBA", "World: AmeriCup", "USA: NBA - Pre-season",
    "World: World Cup - Qualification"
  ],
  // Baseball-specific leagues
  'Baseball': [
    "USA: MLB"
  ],
  // American Football-specific leagues
  'American Football': [
    "USA: NFL", "USA: NCAA"
  ],
  // Ice Hockey-specific leagues
  'Ice Hockey': [
    "USA: NHL"
  ]
};


const sportsToFetch = [
  { name: 'Soccer', slug: 'soccer', id: 1 },
  { name: 'Basketball', slug: 'basketball', id: 2 },
  { name: 'Baseball', slug: 'baseball', id: 3 },
  { name: 'American Football', slug: 'american-football', id: 12 },
  { name: 'Ice Hockey', slug: 'hockey', id: 4 }
];


async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  console.log('Google Sheets API authenticated.');
  return sheets;
}


async function fetchRapidApiData(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}


async function createOrGetSheet(spreadsheetId, sheetName) {
  const sheets = await authenticateGoogleSheets();
  
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties.title'
    });
    
    const sheetExists = spreadsheet.data.sheets.some(
      sheet => sheet.properties.title === sheetName
    );
    
    if (sheetExists) {
      console.log(`Sheet "${sheetName}" already exists. Using existing tab.`);
      return sheets;
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      }
    });
    
    console.log(`Created new sheet: "${sheetName}"`);
    return sheets;
  } catch (err) {
    console.error('Error in createOrGetSheet:', err.message);
    throw err;
  }
}


exports.pollLiveGamesHandler = async function(req, res) {
  console.log('--- pollLiveGamesHandler started (TOMORROW ONLY) ---');

  try {
    const sheets = await authenticateGoogleSheets();
    console.log('Google Sheets API authenticated.');

    const rapidApiHeaders = {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST
    };

    const nowInEastern = DateTime.now().setZone('America/New_York');
    const dateToFetch = nowInEastern.plus({ days: 1 }).toISODate(); // TOMORROW
    console.log(`Fetching games for TOMORROW: ${dateToFetch}`);

    const allGames = [];

    for (const sport of sportsToFetch) {
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${dateToFetch}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;

      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        const tournaments = data.DATA || [];

        for (const tour of tournaments) {
          const events = tour.EVENTS || [];
          for (const event of events) {
            const game = {
              'Sport': tour.SPORT_NAME || sport.name,
              'Game ID': event.EVENT_ID,
              'League': tour.NAME,
              'Matchup': `${event.HOME_NAME} vs ${event.AWAY_NAME}`,
              'Start Time': event.START_TIME ? new Date(event.START_TIME * 1000).toISOString() : '',
              'Home Team': event.HOME_NAME,
              'Away Team': event.AWAY_NAME,
              'Home Score': event.HOME_SCORE_CURRENT || '',
              'Away Score': event.AWAY_SCORE_CURRENT || '',
              'Status': event.STAGE || '',
              'Current Lap': event.RACE_RESULTS_LAP_DISTANCE || '',
              'Match Status': event.STAGE_TYPE || '',
              'Stage': event.STAGE || '',
              'GameTime': event.GAME_TIME || '',
              'StageStartTime': event.STAGE_START_TIME || '',
              'StartTime': event.START_TIME || '',
              'StageType': event.STAGE_TYPE || '',
              'Last Updated': new Date().toISOString()
            };
            allGames.push(game);
          }
        }
      } catch (err) {
        console.error(`Error fetching ${sport.name} for ${dateToFetch}: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
    }

    console.log(`Fetched ${allGames.length} total games for tomorrow.`);

    // Filter games
    const gamesForSheets = allGames.filter(g => {
      const allowedLeaguesForSport = ALLOWED_LEAGUE_KEYWORDS[g.Sport] || [];
      const isAllowedLeague = allowedLeaguesForSport.includes(g.League);
      const hasValidTeams = g['Home Team'] && g['Away Team'];
      const hasStartTime = g['Start Time'];
      const hasGameId = g['Game ID'];
      
      const isUTeamGame = g.League === 'World: Friendly International' && 
        (/\bU\d+\b/.test(g['Home Team']) || /\bU\d+\b/.test(g['Away Team']));
      
      const isFinished = (g['Match Status'] || '').toUpperCase().includes('FINISHED');
      
      return isAllowedLeague && hasValidTeams && hasStartTime && hasGameId && !isUTeamGame && !isFinished;
    });

    console.log(`Filtered ${gamesForSheets.length} games for tomorrow.`);

    // Prepare data for Google Sheets
    const sheetRows = gamesForSheets.map(g => [
      g.Sport,
      g['Game ID'],
      g.League,
      g.Matchup,
      g['Start Time'],
      g['Home Team'],
      g['Away Team'],
      g['Home Score'],
      g['Away Score'],
      g.Status,
      g['Current Lap'],
      g['Match Status'],
      g.Stage,
      g.GameTime,
      g.StageStartTime,
      g.StartTime,
      g.StageType,
      g['Last Updated']
    ]);

    const sheetHeader = [
      'Sport', 'Game ID', 'League', 'Matchup', 'Start Time', 'Home Team', 'Away Team',
      'Home Score', 'Away Score', 'Status', 'Current Lap', 'Match Status', 'Stage',
      'GameTime', 'StageStartTime', 'StartTime', 'StageType', 'Last Updated'
    ];

    // Write to "Day 1" tab
    const sheetName = 'Day 1';
    await createOrGetSheet(TOMORROW_SPREADSHEET_ID, sheetName);

    console.log(`Writing to ${sheetName} tab...`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: TOMORROW_SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [sheetHeader, ...sheetRows]
      }
    });

    console.log(`Successfully wrote ${sheetRows.length} rows to ${sheetName}.`);

    res.status(200).send(`Wrote ${sheetRows.length} games to Day 1 tab.`);
  } catch (err) {
    console.error('--- pollLiveGamesHandler FAILED ---', err);
    res.status(500).send('Tomorrow fetch failed.');
  }
}

