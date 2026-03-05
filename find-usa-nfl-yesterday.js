// find-usa-nfl-yesterday.js
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

async function findUSANFLYesterday() {
  try {
    console.log('--- Searching for "USA: NFL" from YESTERDAY ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Get yesterday's date
    const yesterdayInEastern = DateTime.now().setZone('America/New_York').minus({ days: 1 });
    const yesterdayStr = yesterdayInEastern.toISODate();
    console.log(`Searching for "USA: NFL" on: ${yesterdayStr}`);

    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${yesterdayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} football tournaments for yesterday:`);
      
      let foundUSANFL = false;
      
      data.DATA.forEach((tour, index) => {
        const leagueName = tour.NAME;
        console.log(`${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        // Check specifically for "USA: NFL"
        if (leagueName === 'USA: NFL') {
          foundUSANFL = true;
          console.log(`\n🎯 FOUND "USA: NFL" LEAGUE!`);
          
          if (tour.EVENTS && tour.EVENTS.length > 0) {
            console.log(`\nNFL Games found:`);
            tour.EVENTS.forEach((event, eventIndex) => {
              const status = event.STAGE;
              const homeScore = event.HOME_SCORE_CURRENT || 0;
              const awayScore = event.AWAY_SCORE_CURRENT || 0;
              const startTime = new Date(event.START_TIME * 1000).toLocaleString();
              
              console.log(`\n${eventIndex + 1}. ${event.HOME_NAME} vs ${event.AWAY_NAME}`);
              console.log(`   Start Time: ${startTime}`);
              console.log(`   Status: ${status}`);
              console.log(`   Final Score: ${homeScore}:${awayScore}`);
              
              if (status === 'FINISHED' || status === 'COMPLETED') {
                console.log(`   ✅ COMPLETED GAME WITH FINAL SCORES`);
              } else {
                console.log(`   ⏳ Game not yet completed`);
              }
            });
          } else {
            console.log(`   No events found in USA: NFL league`);
          }
        }
      });
      
      if (!foundUSANFL) {
        console.log(`\n❌ No "USA: NFL" league found for yesterday (${yesterdayStr})`);
        console.log(`\nAvailable leagues were:`);
        data.DATA.forEach((tour, index) => {
          console.log(`   ${index + 1}. "${tour.NAME}"`);
        });
      }
      
    } else {
      console.log('No data found for yesterday.');
    }

  } catch (err) {
    console.error('Error searching for USA: NFL:', err.message);
  }
}

findUSANFLYesterday();
