// Script to extract team names from FlashLive API grouped by league
import { DateTime } from 'luxon';
import fetch from 'node-fetch';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'your-api-key-here';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'flashlive-sports.p.rapidapi.com';

const sportsToFetch = [
  { slug: 'soccer', id: 1, name: 'Soccer' },
  { slug: 'basketball', id: 3, name: 'Basketball' },
  { slug: 'hockey', id: 4, name: 'Hockey' },
  { slug: 'football', id: 5, name: 'American Football' },
  { slug: 'baseball', id: 6, name: 'Baseball' }
];

async function fetchRapidApiData(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function extractTeamNames() {
  const rapidApiHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  };

  const nowInMountain = DateTime.now().setZone('America/Denver');
  const todayStr = nowInMountain.toISODate();
  
  console.log(`Fetching games for date: ${todayStr}\n`);

  const teamsByLeague = {};

  for (const sport of sportsToFetch) {
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${todayStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;

    try {
      console.log(`Fetching ${sport.name}...`);
      const data = await fetchRapidApiData(url, rapidApiHeaders);
      const tournaments = data.DATA || [];

      for (const tour of tournaments) {
        const leagueName = tour.NAME;
        const events = tour.EVENTS || [];
        
        if (!teamsByLeague[leagueName]) {
          teamsByLeague[leagueName] = new Set();
        }

        for (const event of events) {
          if (event.HOME_NAME) {
            teamsByLeague[leagueName].add(event.HOME_NAME);
          }
          if (event.AWAY_NAME) {
            teamsByLeague[leagueName].add(event.AWAY_NAME);
          }
        }
      }

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      console.error(`Error fetching ${sport.name}: ${err.message}`);
    }
  }

  // Print results
  console.log('\n========================================');
  console.log('TEAMS BY LEAGUE');
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
}

extractTeamNames().catch(console.error);

