// debug-nfl-api.js
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

async function debugNFLAPI() {
  try {
    console.log('--- Debugging NFL API Call ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Test the exact API call you showed me
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_id=5&day=-1&locale=en_INT&timezone=-4&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);

    console.log('\n=== FULL API RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\n=== SUMMARY ===`);
      console.log(`Found ${data.DATA.length} tournaments:`);
      
      data.DATA.forEach((tour, index) => {
        console.log(`\n${index + 1}. "${tour.NAME}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        if (tour.NAME === 'USA: NFL') {
          console.log(`🎯 FOUND "USA: NFL" LEAGUE!`);
          
          if (tour.EVENTS && tour.EVENTS.length > 0) {
            tour.EVENTS.forEach((event, eventIndex) => {
              const homeTeam = event.HOME_NAME;
              const awayTeam = event.AWAY_NAME;
              const status = event.STAGE;
              const homeScore = event.HOME_SCORE_CURRENT || 0;
              const awayScore = event.AWAY_SCORE_CURRENT || 0;
              
              console.log(`\n  ${eventIndex + 1}. ${homeTeam} vs ${awayTeam}`);
              console.log(`     Status: ${status}`);
              console.log(`     Score: ${homeScore}:${awayScore}`);
              
              if (status === 'FINISHED') {
                console.log(`     ✅ FINISHED GAME WITH FINAL SCORES`);
              }
            });
          }
        }
      });
    } else {
      console.log('No data found in API response.');
    }

  } catch (err) {
    console.error('Error debugging NFL API:', err.message);
  }
}

debugNFLAPI();
