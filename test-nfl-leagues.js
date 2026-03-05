// test-nfl-leagues.js
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

async function testAllFootballLeagues() {
  try {
    console.log('--- Testing All Football Leagues ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Test with today's date
    const todayInEastern = DateTime.now().setZone('America/New_York');
    const todayStr = todayInEastern.toISODate();
    console.log(`Testing with today's date: ${todayStr}`);

    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${todayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;

    const data = await fetchRapidApiData(url, rapidApiHeaders);

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} football tournaments:`);
      data.DATA.forEach((tour, index) => {
        console.log(`${index + 1}. "${tour.NAME}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        // Check if this looks like NFL
        const isNFL = tour.NAME.toLowerCase().includes('nfl') || 
                     tour.NAME.toLowerCase().includes('national football league') ||
                     tour.NAME.toLowerCase().includes('usa: nfl');
        
        if (isNFL) {
          console.log(`   *** THIS LOOKS LIKE NFL! ***`);
        }
        
        if (tour.EVENTS && tour.EVENTS.length > 0) {
          tour.EVENTS.forEach((event, eventIndex) => {
            const status = event.STAGE;
            const hasScores = event.HOME_SCORE_CURRENT !== undefined && event.AWAY_SCORE_CURRENT !== undefined;
            console.log(`   ${eventIndex + 1}. ${event.HOME_NAME} vs ${event.AWAY_NAME} (${status}) ${hasScores ? `- ${event.HOME_SCORE_CURRENT}:${event.AWAY_SCORE_CURRENT}` : ''}`);
          });
        }
      });
    } else {
      console.log('No data found for today.');
    }

    // Also test with a few days back to see if there are any completed games
    console.log(`\n--- Testing with 3 days ago: ${todayInEastern.minus({ days: 3 }).toISODate()} ---`);
    const threeDaysAgoStr = todayInEastern.minus({ days: 3 }).toISODate();
    const threeDaysAgoUrl = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${threeDaysAgoStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    
    try {
      const threeDaysAgoData = await fetchRapidApiData(threeDaysAgoUrl, rapidApiHeaders);
      
      if (threeDaysAgoData.DATA && threeDaysAgoData.DATA.length > 0) {
        console.log(`Found ${threeDaysAgoData.DATA.length} football tournaments for 3 days ago:`);
        threeDaysAgoData.DATA.forEach((tour, index) => {
          console.log(`${index + 1}. "${tour.NAME}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
          
          if (tour.EVENTS && tour.EVENTS.length > 0) {
            tour.EVENTS.forEach((event, eventIndex) => {
              const status = event.STAGE;
              const hasScores = event.HOME_SCORE_CURRENT !== undefined && event.AWAY_SCORE_CURRENT !== undefined;
              console.log(`   ${eventIndex + 1}. ${event.HOME_NAME} vs ${event.AWAY_NAME} (${status}) ${hasScores ? `- ${event.HOME_SCORE_CURRENT}:${event.AWAY_SCORE_CURRENT}` : ''}`);
            });
          }
        });
      } else {
        console.log('No data found for 3 days ago.');
      }
    } catch (err) {
      console.error('Error fetching 3 days ago data:', err.message);
    }

  } catch (err) {
    console.error('Error testing football leagues:', err.message);
  }
}

testAllFootballLeagues();
