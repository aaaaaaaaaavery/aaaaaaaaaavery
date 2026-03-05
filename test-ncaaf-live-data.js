import fetch from 'node-fetch';

// Get today's date in YYYYMMDD format
const today = new Date();
const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');

const ESPN_NCAAF_SCOREBOARD_API = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${dateStr}`;

async function testNCAAFLiveData() {
  try {
    console.log(`\n📊 Fetching NCAAF live data for ${dateStr}...\n`);
    console.log(`URL: ${ESPN_NCAAF_SCOREBOARD_API}\n`);
    
    const response = await fetch(ESPN_NCAAF_SCOREBOARD_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.events || data.events.length === 0) {
      console.log('❌ No games found for today.');
      return;
    }
    
    console.log(`✅ Found ${data.events.length} games\n`);
    console.log('='.repeat(80));
    
    data.events.forEach((event, index) => {
      const competition = event.competitions[0];
      const status = competition.status;
      const competitors = competition.competitors;
      
      const awayTeam = competitors.find(c => c.homeAway === 'away');
      const homeTeam = competitors.find(c => c.homeAway === 'home');
      
      console.log(`\n${index + 1}. ${event.name}`);
      console.log(`   ${awayTeam.team.displayName} @ ${homeTeam.team.displayName}`);
      console.log(`   Score: ${awayTeam.score} - ${homeTeam.score}`);
      console.log(`   Status: ${status.type.description} ${status.displayClock ? `(${status.displayClock})` : ''}`);
      console.log(`   Period: ${status.period}`);
      
      if (competition.broadcasts && competition.broadcasts.length > 0) {
        const broadcastNames = competition.broadcasts[0].names || [];
        console.log(`   Broadcast: ${broadcastNames.join(', ')}`);
      }
      
      // Show live status
      if (status.type.state === 'in') {
        console.log(`   🟢 LIVE - ${status.displayClock} remaining in Q${status.period}`);
      } else if (status.type.state === 'pre') {
        const gameDate = new Date(competition.date);
        console.log(`   ⏰ Scheduled: ${gameDate.toLocaleString()}`);
      } else if (status.type.state === 'post') {
        console.log(`   ✅ Final`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Successfully retrieved live NCAAF data from ESPN API!\n`);
    
  } catch (error) {
    console.error('❌ Error fetching NCAAF live data:', error.message);
  }
}

testNCAAFLiveData();

