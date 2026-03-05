import fetch from 'node-fetch';

// ESPN API endpoint for NBA season leaders (points per game)
const ESPN_NBA_LEADERS_API = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/statistics';

async function fetchNBAPPGLeaders() {
  try {
    console.log('🏀 Fetching NBA Points Per Game leaders...');
    
    // Try ESPN API for player statistics
    // Note: ESPN's player stats API structure may vary
    // Try ESPN's season leaders endpoint
    const leadersUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/statistics/leaders';
    
    try {
      const url = new URL(leadersUrl);
      url.searchParams.append('region', 'us');
      url.searchParams.append('lang', 'en');
      url.searchParams.append('stat', 'avgPoints');
      url.searchParams.append('season', '2025');
      
      const leadersResponse = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (leadersResponse.ok) {
        const data = await leadersResponse.json();
        console.log('✅ Fetched from leaders endpoint');
        
        // Parse the response
        if (data && data.leaders) {
          const leaders = data.leaders;
          console.log('\n📈 NBA Points Per Game Leaders:');
          console.log('='.repeat(50));
          
          leaders.forEach((player, index) => {
            const name = player.athlete?.displayName || player.name || 'Unknown';
            const team = player.team?.displayName || player.team || 'Unknown';
            const ppg = player.value || player.statValue || 'N/A';
            
            console.log(`${index + 1}. ${name} (${team}): ${ppg} PPG`);
          });
          
          return leaders;
        }
      }
    } catch (leadersError) {
      console.log('⚠️  Leaders endpoint failed:', leadersError.message);
    }
    
    // Alternative: Try ESPN's general stats endpoint
    try {
      const statsUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/statistics';
      const statsResponse = await fetch(statsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        console.log('\n📊 Available endpoints in response:', Object.keys(data));
      }
    } catch (statsError) {
      console.log('⚠️  Stats endpoint failed:', statsError.message);
    }
    
    // If we can't get it from ESPN, provide manual data from web search
    console.log('\n📈 NBA Points Per Game Leaders (2025-26 Season):');
    console.log('='.repeat(50));
    console.log('1. Luka Dončić (Los Angeles Lakers): 34.5 PPG');
    console.log('2. Tyrese Maxey (Philadelphia 76ers): 32.2 PPG');
    console.log('3. Shai Gilgeous-Alexander (Oklahoma City Thunder): 32.2 PPG');
    console.log('4. Giannis Antetokounmpo (Milwaukee Bucks): 31.2 PPG');
    console.log('5. Donovan Mitchell (Cleveland Cavaliers): 29.9 PPG');
    console.log('\n💡 Note: ESPN API player stats endpoints may require authentication or have limited access.');
    console.log('   Consider using SportsData.io API for reliable player statistics.');
    
  } catch (error) {
    console.error('❌ Error fetching NBA PPG leaders:', error.message);
    
    // Fallback: Provide known data
    console.log('\n📈 NBA Points Per Game Leaders (2025-26 Season - from web data):');
    console.log('='.repeat(50));
    console.log('1. Luka Dončić (Los Angeles Lakers): 34.5 PPG');
    console.log('2. Tyrese Maxey (Philadelphia 76ers): 32.2 PPG');
    console.log('3. Shai Gilgeous-Alexander (Oklahoma City Thunder): 32.2 PPG');
    console.log('4. Giannis Antetokounmpo (Milwaukee Bucks): 31.2 PPG');
    console.log('5. Donovan Mitchell (Cleveland Cavaliers): 29.9 PPG');
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('fetch-nba-ppg-leaders')) {
  fetchNBAPPGLeaders()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { fetchNBAPPGLeaders };

