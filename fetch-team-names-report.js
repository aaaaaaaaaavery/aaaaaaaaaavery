// Script to fetch team names from ESPN API for specific leagues
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// ESPN API league configurations
const LEAGUE_CONFIGS = [
  { displayName: 'Premier League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings' },
  { displayName: 'Serie A', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/ita.1/standings' },
  { displayName: 'Bundesliga', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings' },
  { displayName: 'Ligue 1', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/fra.1/standings' },
  { displayName: 'MLS', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings' },
  { displayName: 'Liga MX', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/mex.1/standings' },
  { displayName: 'NWSL', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/usa.nwsl/standings' },
  { displayName: 'UEFA Champions League', endpoint: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings' }
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
  const reportPath = path.join(process.cwd(), 'team-names-report.txt');
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
  
  const leagueOrder = [
    'Premier League',
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    'MLS',
    'Liga MX',
    'NWSL',
    'UEFA Champions League'
  ];
  
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
    report += `${league.padEnd(30)} ${count.toString().padStart(3)} teams\n`;
  }
  
  report += `${'-'.repeat(50)}\n`;
  report += `${'TOTAL'.padEnd(30)} ${totalTeams.toString().padStart(3)} teams\n`;
  
  return report;
}

// Run the script
fetchAllTeamNames().catch(console.error);
