// Script to fetch team names from ESPN API for specific leagues
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// ESPN API league configurations
const LEAGUE_CONFIGS = [
  //{ leagueCode: 'uefa.europa', displayName: 'UEFA Europa League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.europa/standings' },
  //{ leagueCode: 'uefa.europa.conf', displayName: 'UEFA Europa Conference League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.europa.conf/standings' },
  //{ leagueCode: 'uefa.nations', displayName: 'UEFA Nations League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.nations/standings' },
  //{ leagueCode: 'uefa.wchampions', displayName: 'UEFA Women\'s Champions League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.wchampions/standings' },
  //{ leagueCode: 'eng.w.1', displayName: 'Women\'s Super League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.w.1/standings' },
  //{ leagueCode: 'eng.fa', displayName: 'FA Cup', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.fa/standings' },
  //{ leagueCode: 'eng.league_cup', displayName: 'EFL Cup', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.league_cup/standings' },
  //{ leagueCode: 'ita.coppa_italia', displayName: 'Coppa Italia', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/ita.coppa_italia/standings' },
  //{ leagueCode: 'esp.copa_del_rey', displayName: 'Copa del Rey', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/esp.copa_del_rey/standings' },
  //{ leagueCode: 'ita.super_cup', displayName: 'Italian Super Cup', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/ita.super_cup/standings' },
  //{ leagueCode: 'ger.dfb_pokal', displayName: 'DFB-Pokal', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/ger.dfb_pokal/standings' },
  //{ leagueCode: 'fra.coupe_de_france', displayName: 'Coupe de France', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/fra.coupe_de_france/standings' },
  //{ leagueCode: 'arg.1', displayName: 'Argentine Primera Division', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/arg.1/standings' },
  //{ leagueCode: 'bra.1', displayName: 'Brasileirão', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/bra.1/standings' },
  //{ leagueCode: 'por.1', displayName: 'Liga Portugal', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/por.1/standings' },
  //{ leagueCode: 'bel.1', displayName: 'Belgian Pro League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/bel.1/standings' },
  //{ leagueCode: 'sco.1', displayName: 'Scottish Premiership', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/sco.1/standings' },
  //{ leagueCode: 'ksa.1', displayName: 'Saudi Pro League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/ksa.1/standings' },
  //{ leagueCode: 'esp.1', displayName: 'LaLiga', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings' },
  //{ leagueCode: 'tur.1', displayName: 'Super Lig', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/tur.1/standings' },
  { leagueCode: 'por.taca.portugal', displayName: 'Taça de Portugal', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/por.taca.portugal/standings' },
];

async function fetchESPNData(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

async function extractTeamNames(leagueConfig) {
  try {
    console.log(`Fetching ${leagueConfig.displayName}...`);
    
    const data = await fetchESPNData(leagueConfig.endpoint);
    const teams = new Set();
    
    // ESPN API returns standings organized by groups/conferences
    if (data && data.children) {
      for (const group of data.children) {
        if (group.standings && group.standings.entries) {
          for (const entry of group.standings.entries) {
            const team = entry.team;
            
            // Extract team name - prefer displayName, fallback to shortDisplayName or name
            const teamName = team.displayName || team.shortDisplayName || team.name;
            
            if (teamName && typeof teamName === 'string' && teamName.trim()) {
              teams.add(teamName.trim());
            }
          }
        }
      }
    }
    
    const teamArray = Array.from(teams).sort();
    console.log(`  Found ${teamArray.length} teams\n`);
    return teamArray;
    
  } catch (error) {
    console.error(`  Error fetching ${leagueConfig.displayName}:`, error.message);
    return [];
  }
}

async function fetchAllTeamNames() {
  console.log('Fetching team names from ESPN API...\n');
  
  const teamsByLeague = {};
  
  for (const leagueConfig of LEAGUE_CONFIGS) {
    const teams = await extractTeamNames(leagueConfig);
    teamsByLeague[leagueConfig.displayName] = teams;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  const report = generateReport(teamsByLeague);
  
  // Write to file
  const reportPath = path.join(process.cwd(), 'espn-team-names-report.txt');
  fs.writeFileSync(reportPath, report, 'utf8');
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
  console.log('\n' + report);
}

function generateReport(teamsByLeague) {
  let report = '';
  report += '========================================\n';
  report += 'TEAM NAMES REPORT - ESPN API\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += '========================================\n\n';
  
  const leagueOrder = LEAGUE_CONFIGS.map(config => config.displayName);
  
  for (const league of leagueOrder) {
    const teams = teamsByLeague[league] || [];
    report += `\n${'='.repeat(50)}\n`;
    report += `${league.toUpperCase()}\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Total Teams: ${teams.length}\n\n`;
    
    if (teams.length === 0) {
      report += '  (No teams found)\n';
    } else {
      teams.forEach((team, index) => {
        report += `${(index + 1).toString().padStart(3, ' ')}. ${team}\n`;
      });
    }
  }
  
  report += `\n\n${'='.repeat(50)}\n`;
  report += 'SUMMARY\n';
  report += `${'='.repeat(50)}\n`;
  
  let totalTeams = 0;
  for (const league of leagueOrder) {
    const count = (teamsByLeague[league] || []).length;
    totalTeams += count;
    report += `${league.padEnd(35)} ${count.toString().padStart(3)} teams\n`;
  }
  
  report += `${'-'.repeat(50)}\n`;
  report += `${'TOTAL'.padEnd(35)} ${totalTeams.toString().padStart(3)} teams\n`;
  
  return report;
}

// Run the script
fetchAllTeamNames().catch(console.error);
