// find-nfl-fixed.js
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

async function findNFLFixed() {
  try {
    console.log('--- Finding NFL Games (Fixed) ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    const yesterdayEastern = DateTime.now().setZone('America/New_York').minus({ days: 1 });
    const yesterdayStr = yesterdayEastern.toISODate();
    console.log(`Searching for NFL games on: ${yesterdayStr}`);

    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${yesterdayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);

    console.log('Raw API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} tournaments for yesterday:`);
      
      data.DATA.forEach((tour, index) => {
        const leagueName = tour.NAME;
        console.log(`\n${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        if (leagueName === 'USA: NFL') {
          console.log(`🎯 FOUND "USA: NFL" LEAGUE!`);
          
          if (tour.EVENTS && tour.EVENTS.length > 0) {
            tour.EVENTS.forEach((event, eventIndex) => {
              const homeTeam = event.HOME_NAME;
              const awayTeam = event.AWAY_NAME;
              const status = event.STAGE;
              const homeScore = event.HOME_SCORE_CURRENT || 0;
              const awayScore = event.AWAY_SCORE_CURRENT || 0;
              const startTime = new Date(event.START_TIME * 1000).toLocaleString();
              
              console.log(`\n  ${eventIndex + 1}. ${homeTeam} vs ${awayTeam}`);
              console.log(`     Start Time: ${startTime}`);
              console.log(`     Status: ${status}`);
              console.log(`     Final Score: ${homeScore}:${awayScore}`);
              
              if (status === 'FINISHED') {
                console.log(`     ✅ COMPLETED GAME WITH FINAL SCORES`);
                
                // This is the data we want to store in Firestore
                const gameData = {
                  'Sport': 'American Football',
                  'Game ID': event.EVENT_ID,
                  'League': 'USA: NFL',
                  'Matchup': `${homeTeam} vs ${awayTeam}`,
                  'Start Time': new Date(event.START_TIME * 1000),
                  'Home Team': homeTeam,
                  'Away Team': awayTeam,
                  'Home Score': homeScore,
                  'Away Score': awayScore,
                  'Status': status,
                  'Match Status': event.STAGE_TYPE || '',
                  'Last Updated': new Date().toISOString(),
                  'gameDate': yesterdayStr,
                  'Final': true
                };
                
                console.log(`     📊 Game Data for Firestore:`, JSON.stringify(gameData, null, 2));
              }
            });
          }
        }
      });
      
    } else {
      console.log('No data found for yesterday.');
    }

  } catch (err) {
    console.error('Error finding NFL games:', err.message);
  }
}

findNFLFixed();
