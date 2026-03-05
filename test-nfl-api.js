// test-nfl-api.js
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

async function testNFLAPI() {
  try {
    console.log('--- Testing NFL API ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Test with today's date
    const todayInEastern = DateTime.now().setZone('America/New_York');
    const todayStr = todayInEastern.toISODate();
    console.log(`Testing with today's date: ${todayStr}`);

    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${todayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} tournaments:`);
      data.DATA.forEach((tour, index) => {
        console.log(`${index + 1}. ${tour.NAME} (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        if (tour.EVENTS && tour.EVENTS.length > 0) {
          tour.EVENTS.forEach((event, eventIndex) => {
            console.log(`   ${eventIndex + 1}. ${event.HOME_NAME} vs ${event.AWAY_NAME} (${event.STAGE})`);
          });
        }
      });
    } else {
      console.log('No data found for today.');
    }

    // Also test with yesterday
    const yesterdayStr = todayInEastern.minus({ days: 1 }).toISODate();
    console.log(`\n--- Testing with yesterday's date: ${yesterdayStr} ---`);
    
    const yesterdayUrl = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${yesterdayStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
    const yesterdayData = await fetchRapidApiData(yesterdayUrl, rapidApiHeaders);
    
    if (yesterdayData.DATA && yesterdayData.DATA.length > 0) {
      console.log(`Found ${yesterdayData.DATA.length} tournaments for yesterday:`);
      yesterdayData.DATA.forEach((tour, index) => {
        console.log(`${index + 1}. ${tour.NAME} (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
      });
    } else {
      console.log('No data found for yesterday.');
    }

  } catch (err) {
    console.error('Error testing NFL API:', err.message);
  }
}

testNFLAPI();
