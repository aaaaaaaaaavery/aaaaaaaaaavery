// check-other-sports.js
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

async function checkOtherSports() {
  try {
    console.log('--- Checking Other Sports for NFL Games ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    const yesterdayEastern = DateTime.now().setZone('America/New_York').minus({ days: 1 });
    const yesterdayStr = yesterdayEastern.toISODate();
    console.log(`Checking other sports for: ${yesterdayStr}`);

    // Try different sport categories that might contain NFL
    const sportsToCheck = [
      { slug: 'american-football', id: 5, name: 'American Football' },
      { slug: 'football', id: 5, name: 'Football' },
      { slug: 'nfl', id: 5, name: 'NFL' },
      { slug: 'gridiron', id: 5, name: 'Gridiron' }
    ];
    
    for (const sport of sportsToCheck) {
      console.log(`\n--- Checking sport: ${sport.name} (${sport.slug}, id: ${sport.id}) ---`);
      
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${yesterdayStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;
      
      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        
        if (data.DATA && data.DATA.length > 0) {
          console.log(`Found ${data.DATA.length} tournaments for ${sport.name}:`);
          
          data.DATA.forEach((tour, index) => {
            const leagueName = tour.NAME;
            console.log(`  ${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
            
            // Look for NFL-related content
            if (leagueName.toLowerCase().includes('nfl') || 
                leagueName.toLowerCase().includes('national football') ||
                leagueName === 'USA: NFL' ||
                leagueName.toLowerCase().includes('commanders') ||
                leagueName.toLowerCase().includes('eagles')) {
              console.log(`    🎯 FOUND NFL-RELATED LEAGUE: "${leagueName}"`);
              
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
          console.log(`  No data found for ${sport.name}`);
        }
      } catch (err) {
        console.error(`  Error fetching ${sport.name}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error checking other sports:', err.message);
  }
}

checkOtherSports();
