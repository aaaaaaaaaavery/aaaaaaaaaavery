// find-commanders-eagles.js
import { DateTime } from 'luxon';
import fetch from 'node-fetch';

const RAPIDAPI_KEY = "1c6421f9acmshe820d0c9faf1cf5p165f88jsnc42711af762d";
const RAPIDAPI_HOST = "flashlive-sports.p.rapidapi.com";
const API_REQUEST_DELAY_MS = 1500;

async function fetchRapidApiData(url, headers) {
  await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! ${response.status}: ${errorText} @ ${url}`);
  }
  return await response.json();
}

async function findCommandersEagles() {
  try {
    console.log('--- Searching for Commanders vs Eagles from YESTERDAY ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Get yesterday's date
    const yesterdayInEastern = DateTime.now().setZone('America/New_York').minus({ days: 1 });
    const yesterdayStr = yesterdayInEastern.toISODate();
    console.log(`Searching for Commanders vs Eagles on: ${yesterdayStr}`);

    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${yesterdayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} football tournaments for yesterday:`);
      
      let foundGame = false;
      
      data.DATA.forEach((tour, index) => {
        const leagueName = tour.NAME;
        console.log(`\n${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        if (tour.EVENTS && tour.EVENTS.length > 0) {
          tour.EVENTS.forEach((event, eventIndex) => {
            const homeTeam = event.HOME_NAME;
            const awayTeam = event.AWAY_NAME;
            const status = event.STAGE;
            const homeScore = event.HOME_SCORE_CURRENT || 0;
            const awayScore = event.AWAY_SCORE_CURRENT || 0;
            const startTime = new Date(event.START_TIME * 1000).toLocaleString();
            
            console.log(`   ${eventIndex + 1}. ${homeTeam} vs ${awayTeam}`);
            console.log(`      Start Time: ${startTime}`);
            console.log(`      Status: ${status}`);
            console.log(`      Score: ${homeScore}:${awayScore}`);
            
            // Look for Commanders and Eagles
            if ((homeTeam.toLowerCase().includes('commanders') || awayTeam.toLowerCase().includes('commanders')) &&
                (homeTeam.toLowerCase().includes('eagles') || awayTeam.toLowerCase().includes('eagles'))) {
              foundGame = true;
              console.log(`\n🎯 FOUND COMMANDERS VS EAGLES GAME!`);
              console.log(`   League: ${leagueName}`);
              console.log(`   ${homeTeam} vs ${awayTeam}`);
              console.log(`   Final Score: ${homeScore}:${awayScore}`);
              console.log(`   Status: ${status}`);
              
              if (status === 'FINISHED' || status === 'COMPLETED') {
                console.log(`   ✅ COMPLETED GAME WITH FINAL SCORES`);
              }
            }
            
            // Also look for any NFL-related teams
            const nflTeams = ['commanders', 'eagles', 'cowboys', 'giants', 'patriots', 'bills', 'dolphins', 'jets', 'ravens', 'bengals', 'browns', 'steelers', 'texans', 'colts', 'jaguars', 'titans', 'broncos', 'chiefs', 'raiders', 'chargers', 'cardinals', 'rams', '49ers', 'seahawks', 'falcons', 'panthers', 'saints', 'buccaneers', 'bears', 'lions', 'packers', 'vikings'];
            
            const isNFLTeam = nflTeams.some(team => 
              homeTeam.toLowerCase().includes(team) || awayTeam.toLowerCase().includes(team)
            );
            
            if (isNFLTeam) {
              console.log(`   🏈 NFL TEAM DETECTED: ${homeTeam} vs ${awayTeam} in league "${leagueName}"`);
            }
          });
        }
      });
      
      if (!foundGame) {
        console.log(`\n❌ Commanders vs Eagles game not found for yesterday (${yesterdayStr})`);
        console.log(`\nLet me check if there are any NFL teams in the available games...`);
      }
      
    } else {
      console.log('No data found for yesterday.');
    }

  } catch (err) {
    console.error('Error searching for Commanders vs Eagles:', err.message);
  }
}

findCommandersEagles();
