// index-tomorrow-commonjs.js - Fetches upcoming 7 days games and writes to Google Sheets only
const { DateTime } = require('luxon');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const express = require('express');

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
    "USA: WNBA - Play Offs"
  ],
  // American Football-specific leagues
  'American Football': [
    "NFL", "USA: NFL", "USA: NCAA", "USA: NFL - Pre-season", "Canada: CFL"
  ],
  // Tennis-specific leagues
  'Tennis': [
    "USA: Cleveland WTA, hard",
    "USA: US Open ATP, hard", "USA: US Open WTA, hard"
  ],
  // Auto Racing specific leagues
  'Auto Racing': [
    "NASCAR Cup Series"
  ],
  // Cricket-specific leagues
  'Cricket': [
    "World: ICC World Cup Women", "World: Twenty20 International", "World: Test Series"
  ],
  // Hockey-specific leagues
  'Hockey': [
    "USA: NHL", "USA: NHL - Pre-season", "Canada: OHL", "USA: NCAA"
  ],
  // Golf-specific leagues
  'Golf': [
    "World: Ryder Cup"
  ]
};

const sportsToFetch = [
  { slug: 'soccer', id: 1, name: 'Soccer' },
  { slug: 'tennis', id: 2, name: 'Tennis' },
  { slug: 'basketball', id: 3, name: 'Basketball' },
  { slug: 'hockey', id: 4, name: 'Hockey' },
  { slug: 'football', id: 5, name: 'American Football' },
  { slug: 'baseball', id: 6, name: 'Baseball' },
  { slug: 'rugby_union', id: 8, name: 'Rugby Union' },
  { slug: 'volleyball', id: 12, name: 'Volleyball' },
  { slug: 'cricket', id: 13, name: 'Cricket' },
  { slug: 'boxing', id: 16, name: 'Boxing' },
  { slug: 'beach_volleyball', id: 17, name: 'Beach Volleyball' },
  { slug: 'aussie_rules', id: 18, name: 'Aussie Rules' },
  { slug: 'rugby_league', id: 19, name: 'Rugby League' },
  { slug: 'water_polo', id: 22, name: 'Water Polo' },
  { slug: 'golf', id: 23, name: 'Golf' },
  { slug: 'mma', id: 28, name: 'MMA' },
  { slug: 'motorsport', id: 31, name: 'Motorsport' },
  { slug: 'autoracing', id: 32, name: 'Autoracing' },
  { slug: 'motoracing', id: 33, name: 'Motoracing' },
  { slug: 'cycling', id: 34, name: 'Cycling' },
  { slug: 'horse_racing', id: 35, name: 'Horse Racing' },
  { slug: 'winter_sports', id: 37, name: 'Winter Sports' },
  { slug: 'ski_jumping', id: 38, name: 'Ski Jumping' },
  { slug: 'alpine_skiing', id: 39, name: 'Alpine Skiing' },
  { slug: 'cross_country', id: 40, name: 'Cross Country' }
];

let sheets;
async function authenticateGoogleSheets() {
  if (sheets) return;
  const googleAuth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await googleAuth.getClient();
  sheets = google.sheets({ version: 'v4', auth: authClient });
  console.log('Google Sheets API authenticated.');
}

async function fetchRapidApiData(url, headers) {
  await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! ${response.status}: ${errorText} @ ${url}`);
  }
  return await response.json();
}

// Helper function to create or get a sheet tab
async function createOrGetSheet(spreadsheetId, sheetName) {
  try {
    // Check if the sheet already exists
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    const sheetsList = response.data.sheets;
    const existingSheet = sheetsList.find(s => s.properties.title === sheetName);

    if (existingSheet) {
      console.log(`Sheet "${sheetName}" already exists. Using existing tab.`);
      return sheetName;
    }

    // If the sheet doesn't exist, create it
    console.log(`Sheet "${sheetName}" not found. Creating a new tab...`);
    const request = {
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      }
    };
    await sheets.spreadsheets.batchUpdate(request);
    console.log(`Successfully created new sheet with title "${sheetName}".`);
    return sheetName;
  } catch (err) {
    console.error(`Error in createOrGetSheet: ${err.message}`);
    throw err;
  }
}

exports.fetchUpcoming7Days = async (req, res) => {
  try {
    console.log('--- fetchUpcoming7DaysHandler started. ---');
    
    await authenticateGoogleSheets();

    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    const nowInMountain = DateTime.now().setZone('America/Denver');
    let totalGamesWritten = 0;

    // Loop through days 1-7 (tomorrow through 7 days from now)
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const dateStr = nowInMountain.plus({ days: dayOffset }).toISODate();
      const sheetName = `Day ${dayOffset}`; // Tab names: Day 1, Day 2, etc.
      
      console.log(`Fetching games for ${dateStr} (Day ${dayOffset})...`);

      // Create or get the sheet tab
      await createOrGetSheet(TOMORROW_SPREADSHEET_ID, sheetName);

      const allGames = [];

      for (const sport of sportsToFetch) {
        const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${dateStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;

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
                'Last Updated': new Date().toISOString(),
                'gameDate': dateStr
              };
              allGames.push(game);
            }
          }
        } catch (err) {
          console.error(`Error fetching ${sport.name} for ${dateStr}: ${err.message}`);
        }
      }

      console.log(`Fetched ${allGames.length} games from RapidAPI for ${dateStr}.`);

      // Filter games based on allowed leagues
      const gamesForSheets = allGames.filter(g => {
        const allowedLeaguesForSport = ALLOWED_LEAGUE_KEYWORDS[g.Sport] || [];
        const isAllowedLeague = allowedLeaguesForSport.includes(g.League);
        const hasValidTeams = g['Home Team'] && g['Away Team'];
        const hasStartTime = g['Start Time'];
        const hasGameId = g['Game ID'];
        
        // Filter out games with "U" followed by numbers (e.g., U20, U23, U19) for World: Friendly International
        const isUTeamGame = g.League === 'World: Friendly International' && 
          (/\bU\d+\b/.test(g['Home Team']) || /\bU\d+\b/.test(g['Away Team']));
        
        return isAllowedLeague && hasValidTeams && hasStartTime && hasGameId && !isUTeamGame;
      });

      console.log(`Filtered ${gamesForSheets.length} games for ${sheetName}.`);

      // Prepare data for Google Sheets
      const sheetRows = gamesForSheets.map(g => [
        g.Sport, g['Game ID'], g.League, g.Matchup,
        g['Start Time'], g['Home Team'], g['Away Team'],
        g['Home Score'], g['Away Score'], g.Status,
        g['Match Status'], g['Last Updated']
      ]);

      const sheetHeader = [
        'Sport', 'Game ID', 'League', 'Matchup',
        'Start Time', 'Home Team', 'Away Team',
        'Home Score', 'Away Score', 'Status',
        'Match Status', 'Last Updated'
      ];

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
      totalGamesWritten += sheetRows.length;
    }

    console.log(`=== Completed: Wrote ${totalGamesWritten} total games across 7 days ===`);

    res.status(200).send(`Wrote ${totalGamesWritten} total games across 7 days to Google Sheet.`);
  } catch (err) {
    console.error('--- fetchUpcoming7DaysHandler FAILED ---', err);
    res.status(500).send('Upcoming 7 days fetch failed.');
  }
};

