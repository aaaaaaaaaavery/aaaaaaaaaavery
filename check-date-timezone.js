// check-date-timezone.js
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

async function checkDateTimezone() {
  try {
    console.log('--- Checking Date and Timezone Issues ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Check current time and dates
    const now = DateTime.now();
    const nowEastern = DateTime.now().setZone('America/New_York');
    const yesterdayEastern = nowEastern.minus({ days: 1 });
    const twoDaysAgoEastern = nowEastern.minus({ days: 2 });
    
    console.log(`Current UTC time: ${now.toISO()}`);
    console.log(`Current Eastern time: ${nowEastern.toISO()}`);
    console.log(`Yesterday Eastern: ${yesterdayEastern.toISO()}`);
    console.log(`Two days ago Eastern: ${twoDaysAgoEastern.toISO()}`);
    
    console.log(`\nYesterday date string: ${yesterdayEastern.toISODate()}`);
    console.log(`Two days ago date string: ${twoDaysAgoEastern.toISODate()}`);
    
    // Test multiple dates to find the Commanders vs Eagles game
    const datesToCheck = [
      { date: yesterdayEastern.toISODate(), label: 'Yesterday' },
      { date: twoDaysAgoEastern.toISODate(), label: 'Two days ago' },
      { date: nowEastern.toISODate(), label: 'Today' }
    ];
    
    for (const { date, label } of datesToCheck) {
      console.log(`\n--- Checking ${label} (${date}) ---`);
      
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${date}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
      
      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        
        if (data.DATA && data.DATA.length > 0) {
          console.log(`Found ${data.DATA.length} tournaments for ${date}:`);
          
          data.DATA.forEach((tour, index) => {
            const leagueName = tour.NAME;
            console.log(`  ${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
            
            // Look for any NFL-related league names
            if (leagueName.toLowerCase().includes('nfl') || 
                leagueName.toLowerCase().includes('national football') ||
                leagueName === 'USA: NFL') {
              console.log(`    🎯 FOUND NFL LEAGUE: "${leagueName}"`);
              
              if (tour.EVENTS && tour.EVENTS.length > 0) {
                tour.EVENTS.forEach((event, eventIndex) => {
                  const homeTeam = event.HOME_NAME;
                  const awayTeam = event.AWAY_NAME;
                  const status = event.STAGE;
                  const homeScore = event.HOME_SCORE_CURRENT || 0;
                  const awayScore = event.AWAY_SCORE_CURRENT || 0;
                  
                  console.log(`      ${eventIndex + 1}. ${homeTeam} vs ${awayTeam} (${status}) - ${homeScore}:${awayScore}`);
                  
                  if ((homeTeam.toLowerCase().includes('commanders') || awayTeam.toLowerCase().includes('commanders')) &&
                      (homeTeam.toLowerCase().includes('eagles') || awayTeam.toLowerCase().includes('eagles'))) {
                    console.log(`        🎯 FOUND COMMANDERS VS EAGLES!`);
                  }
                });
              }
            }
          });
        } else {
          console.log(`  No data found for ${date}`);
        }
      } catch (err) {
        console.error(`  Error fetching ${date}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error checking dates:', err.message);
  }
}

checkDateTimezone();
