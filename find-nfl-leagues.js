// find-nfl-leagues.js
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

async function findNFLLeagues() {
  try {
    console.log('--- Searching for NFL leagues across multiple days ---');
    
    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Check the last 7 days to find any NFL games
    const todayInEastern = DateTime.now().setZone('America/New_York');
    
    for (let i = 1; i <= 7; i++) {
      const dateToCheck = todayInEastern.minus({ days: i });
      const dateStr = dateToCheck.toISODate();
      console.log(`\n--- Checking ${dateStr} (${i} day${i > 1 ? 's' : ''} ago) ---`);
      
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=football&date=${dateStr}&locale=en_INT&sport_id=5&timezone=-4&indent_days=0`;
      
      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        
        if (data.DATA && data.DATA.length > 0) {
          data.DATA.forEach((tour) => {
            const leagueName = tour.NAME;
            
            // Look for NFL-related keywords
            const isNFL = leagueName.toLowerCase().includes('nfl') || 
                         leagueName.toLowerCase().includes('national football league') ||
                         leagueName.toLowerCase().includes('usa: nfl') ||
                         leagueName.toLowerCase().includes('american football') ||
                         leagueName.toLowerCase().includes('nfl regular season') ||
                         leagueName.toLowerCase().includes('nfl playoffs');
            
            if (isNFL) {
              console.log(`🎯 FOUND NFL LEAGUE: "${leagueName}"`);
              
              if (tour.EVENTS && tour.EVENTS.length > 0) {
                tour.EVENTS.forEach((event) => {
                  const status = event.STAGE;
                  const homeScore = event.HOME_SCORE_CURRENT || 0;
                  const awayScore = event.AWAY_SCORE_CURRENT || 0;
                  console.log(`   ${event.HOME_NAME} vs ${event.AWAY_NAME} (${status}) - ${homeScore}:${awayScore}`);
                });
              }
            } else {
              // Show all leagues for context
              console.log(`   "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
            }
          });
        } else {
          console.log(`   No data found for ${dateStr}`);
        }
      } catch (err) {
        console.error(`   Error fetching ${dateStr}:`, err.message);
      }
    }
    
    console.log('\n=== SEARCH COMPLETE ===');
    console.log('If no NFL leagues were found, it might mean:');
    console.log('1. NFL season hasn\'t started yet');
    console.log('2. NFL games are under a different league name');
    console.log('3. NFL games are in a different sport category');

  } catch (err) {
    console.error('Error searching for NFL leagues:', err.message);
  }
}

findNFLLeagues();
