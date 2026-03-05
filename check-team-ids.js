// Script to check what team ID fields are available in the FlashLive API
import { DateTime } from 'luxon';
import fetch from 'node-fetch';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'your-api-key-here';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'flashlive-sports.p.rapidapi.com';

async function fetchRapidApiData(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function checkTeamIds() {
  const rapidApiHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  };

  const nowInMountain = DateTime.now().setZone('America/Denver');
  const todayStr = nowInMountain.toISODate();
  
  console.log(`Checking event structure for date: ${todayStr}\n`);

  // Just check NFL for now
  const sport = { slug: 'football', id: 5, name: 'American Football' };
  const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${todayStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;

  try {
    console.log(`Fetching ${sport.name}...`);
    const data = await fetchRapidApiData(url, rapidApiHeaders);
    const tournaments = data.DATA || [];

    console.log(`Found ${tournaments.length} tournaments\n`);

    for (const tour of tournaments) {
      const events = tour.EVENTS || [];
      console.log(`League: ${tour.NAME} - ${events.length} events`);
      
      if (events.length > 0) {
        // Show the first event's structure
        console.log('\n=== FIRST EVENT STRUCTURE ===');
        console.log(JSON.stringify(events[0], null, 2));
        console.log('\n=== EVENT KEYS ===');
        console.log(Object.keys(events[0]));
        break;
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

checkTeamIds();

