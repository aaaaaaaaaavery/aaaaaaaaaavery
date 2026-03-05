// test-yesterday-only.js
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

async function testYesterdayOnly() {
  try {
    console.log('--- Testing YESTERDAY ONLY for completed games ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Get yesterday's date
    const yesterdayInEastern = DateTime.now().setZone('America/New_York').minus({ days: 1 });
    const yesterdayStr = yesterdayInEastern.toISODate();
    console.log(`Testing with YESTERDAY's date: ${yesterdayStr}`);

    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${yesterdayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} football tournaments for YESTERDAY:`);
      
      let totalGames = 0;
      let completedGames = 0;
      
      data.DATA.forEach((tour, index) => {
        console.log(`\n${index + 1}. "${tour.NAME}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        if (tour.EVENTS && tour.EVENTS.length > 0) {
          tour.EVENTS.forEach((event, eventIndex) => {
            totalGames++;
            const status = event.STAGE;
            const hasScores = event.HOME_SCORE_CURRENT !== undefined && event.AWAY_SCORE_CURRENT !== undefined;
            const homeScore = event.HOME_SCORE_CURRENT || 0;
            const awayScore = event.AWAY_SCORE_CURRENT || 0;
            
            console.log(`   ${eventIndex + 1}. ${event.HOME_NAME} vs ${event.AWAY_NAME}`);
            console.log(`      Status: ${status}`);
            console.log(`      Score: ${homeScore}:${awayScore}`);
            
            // Check if this is a completed game with final scores
            if (status === 'FINISHED' || status === 'COMPLETED' || (hasScores && homeScore > 0 || awayScore > 0)) {
              completedGames++;
              console.log(`      *** COMPLETED GAME WITH FINAL SCORES ***`);
            }
          });
        }
      });
      
      console.log(`\n=== SUMMARY ===`);
      console.log(`Total games found: ${totalGames}`);
      console.log(`Completed games with scores: ${completedGames}`);
      
      if (completedGames > 0) {
        console.log(`\n✅ SUCCESS: Found ${completedGames} completed games with final scores for yesterday!`);
      } else {
        console.log(`\n⚠️ No completed games found for yesterday. All games are still scheduled.`);
      }
      
    } else {
      console.log('No data found for yesterday.');
    }

  } catch (err) {
    console.error('Error testing yesterday:', err.message);
  }
}

testYesterdayOnly();
