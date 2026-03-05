import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const NBA_STATS_URL = 'https://www.nba.com/stats/players';

async function scrapeNBAPlayerStats() {
  try {
    console.log('🏀 Fetching NBA player stats from NBA.com...');
    console.log(`📡 URL: ${NBA_STATS_URL}\n`);
    
    const response = await fetch(NBA_STATS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // NBA.com embeds JSON data in script tags - extract it directly
    console.log('📊 Extracting JSON data from page...');
    const jsonData = extractJSONFromHTML(html);
    
    if (jsonData && jsonData.leadersData) {
      console.log('✅ Found embedded JSON data');
      return extractStatsFromJSON(jsonData.leadersData);
    }
    
    // Fallback to HTML parsing if JSON not found
    console.log('⚠️  JSON not found, falling back to HTML parsing...');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return extractAllStatsFromNBAHTML(document);
    
  } catch (error) {
    console.error('❌ Error scraping NBA stats:', error.message);
    throw error;
  }
}

function extractAllStatsFromNBAHTML(document) {
  const allStats = {
    seasonLeaders: {
      pointsPerGame: [],
      reboundsPerGame: [],
      assistsPerGame: [],
      blocksPerGame: [],
      stealsPerGame: []
    },
    forwards: {
      pointsPerGame: [],
      assistsPerGame: []
    },
    guards: {
      pointsPerGame: [],
      assistsPerGame: []
    },
    rookies: {
      pointsPerGame: [],
      doubleDoubles: []
    },
    seasonTotals: {
      mostTotalPoints: [],
      mostPointsInGame: [],
      mostAssistsInGame: [],
      mostStealsInGame: [],
      mostBlocksInGame: [],
      highestPct3PT: [],
      highestPctMidRange: []
    }
  };
  
  // Find all tables on the page
  const tables = document.querySelectorAll('table');
  console.log(`Found ${tables.length} tables on the page`);
  
  // Also try to find sections by headings first
  const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="heading"], [class*="title"], [class*="Heading"]'));
  
  // Process each table
  let tableIndex = 0;
  for (const table of tables) {
    tableIndex++;
    
    // Get context - look for nearby headings
    let contextHeading = null;
    let contextText = '';
    
    // Look backwards for headings
    let element = table.previousElementSibling;
    let searchDepth = 0;
    while (element && searchDepth < 15) {
      const tagName = element.tagName?.toUpperCase() || '';
      if (tagName.match(/^H[1-6]$/) || element.className?.toLowerCase().includes('heading') || element.className?.toLowerCase().includes('title')) {
        contextHeading = element.textContent.trim();
        break;
      }
      // Also check parent elements
      if (element.parentElement) {
        const parentTag = element.parentElement.tagName?.toUpperCase() || '';
        if (parentTag.match(/^H[1-6]$/)) {
          contextHeading = element.parentElement.textContent.trim();
          break;
        }
      }
      element = element.previousElementSibling;
      searchDepth++;
    }
    
    // Get surrounding text for context
    const tableParent = table.parentElement;
    if (tableParent) {
      contextText = tableParent.textContent.substring(0, 500).toLowerCase();
    }
    
    // Extract players from this table
    const players = extractPlayersFromTable(table);
    
    if (players.length > 0) {
      console.log(`Table ${tableIndex}: Found ${players.length} players, context: "${contextHeading || 'none'}"`);
      
      // Try to identify the stat category
      const category = identifyStatCategory(contextHeading, table, players, contextText, tableIndex);
      
      if (category && allStats[category.section] && allStats[category.section][category.stat]) {
        // Only add if this category is empty
        if (allStats[category.section][category.stat].length === 0) {
          allStats[category.section][category.stat] = players;
          console.log(`  → Assigned to ${category.section}.${category.stat}`);
        }
      } else if (!category) {
        // If we can't identify, try to infer from values and table position
        const firstValue = players[0]?.value;
        
        // First 5 tables are usually season leaders (PPG, RPG, APG, BPG, SPG)
        if (tableIndex <= 5) {
          if (firstValue >= 10 && firstValue <= 50 && allStats.seasonLeaders.pointsPerGame.length === 0) {
            allStats.seasonLeaders.pointsPerGame = players;
            console.log(`  → Inferred as PPG (value: ${firstValue})`);
          } else if (firstValue >= 5 && firstValue <= 20 && allStats.seasonLeaders.reboundsPerGame.length === 0) {
            allStats.seasonLeaders.reboundsPerGame = players;
            console.log(`  → Inferred as RPG (value: ${firstValue})`);
          } else if (firstValue >= 5 && firstValue <= 15 && allStats.seasonLeaders.assistsPerGame.length === 0) {
            allStats.seasonLeaders.assistsPerGame = players;
            console.log(`  → Inferred as APG (value: ${firstValue})`);
          } else if (firstValue >= 1 && firstValue <= 5 && allStats.seasonLeaders.blocksPerGame.length === 0) {
            allStats.seasonLeaders.blocksPerGame = players;
            console.log(`  → Inferred as BPG (value: ${firstValue})`);
          } else if (firstValue >= 1 && firstValue <= 5 && allStats.seasonLeaders.stealsPerGame.length === 0) {
            allStats.seasonLeaders.stealsPerGame = players;
            console.log(`  → Inferred as SPG (value: ${firstValue})`);
          }
        }
        // Tables 6-10 might be forwards/guards/rookies
        else if (tableIndex >= 6 && tableIndex <= 15) {
          if (firstValue >= 10 && firstValue <= 50 && allStats.forwards.pointsPerGame.length === 0) {
            allStats.forwards.pointsPerGame = players;
            console.log(`  → Inferred as Forwards PPG (value: ${firstValue})`);
          } else if (firstValue >= 5 && firstValue <= 15 && allStats.forwards.assistsPerGame.length === 0) {
            allStats.forwards.assistsPerGame = players;
            console.log(`  → Inferred as Forwards APG (value: ${firstValue})`);
          } else if (firstValue >= 10 && firstValue <= 50 && allStats.guards.pointsPerGame.length === 0) {
            allStats.guards.pointsPerGame = players;
            console.log(`  → Inferred as Guards PPG (value: ${firstValue})`);
          } else if (firstValue >= 5 && firstValue <= 15 && allStats.guards.assistsPerGame.length === 0) {
            allStats.guards.assistsPerGame = players;
            console.log(`  → Inferred as Guards APG (value: ${firstValue})`);
          } else if (firstValue >= 10 && firstValue <= 30 && allStats.rookies.pointsPerGame.length === 0) {
            allStats.rookies.pointsPerGame = players;
            console.log(`  → Inferred as Rookies PPG (value: ${firstValue})`);
          } else if (firstValue >= 0 && firstValue <= 10 && Number.isInteger(firstValue) && allStats.rookies.doubleDoubles.length === 0) {
            allStats.rookies.doubleDoubles = players;
            console.log(`  → Inferred as Rookies DD (value: ${firstValue})`);
          }
        }
        // Later tables are usually season totals
        else if (tableIndex >= 20) {
          if (firstValue >= 100 && firstValue <= 1000 && allStats.seasonTotals.mostTotalPoints.length === 0) {
            allStats.seasonTotals.mostTotalPoints = players;
            console.log(`  → Inferred as Most Total Points (value: ${firstValue})`);
          } else if (firstValue >= 30 && firstValue <= 100 && allStats.seasonTotals.mostPointsInGame.length === 0) {
            allStats.seasonTotals.mostPointsInGame = players;
            console.log(`  → Inferred as Most Points in Game (value: ${firstValue})`);
          } else if (firstValue >= 10 && firstValue <= 30 && allStats.seasonTotals.mostAssistsInGame.length === 0) {
            allStats.seasonTotals.mostAssistsInGame = players;
            console.log(`  → Inferred as Most Assists in Game (value: ${firstValue})`);
          } else if (firstValue >= 3 && firstValue <= 10 && allStats.seasonTotals.mostStealsInGame.length === 0) {
            allStats.seasonTotals.mostStealsInGame = players;
            console.log(`  → Inferred as Most Steals in Game (value: ${firstValue})`);
          } else if (firstValue >= 3 && firstValue <= 15 && allStats.seasonTotals.mostBlocksInGame.length === 0) {
            allStats.seasonTotals.mostBlocksInGame = players;
            console.log(`  → Inferred as Most Blocks in Game (value: ${firstValue})`);
          } else if (firstValue >= 50 && firstValue <= 100 && allStats.seasonTotals.highestPct3PT.length === 0) {
            allStats.seasonTotals.highestPct3PT = players;
            console.log(`  → Inferred as Highest % 3PT (value: ${firstValue})`);
          } else if (firstValue >= 10 && firstValue <= 50 && allStats.seasonTotals.highestPctMidRange.length === 0) {
            allStats.seasonTotals.highestPctMidRange = players;
            console.log(`  → Inferred as Highest % Mid Range (value: ${firstValue})`);
          }
        }
      }
    }
  }
  
  return allStats;
}

function extractPlayersFromTable(table) {
  const players = [];
  const rows = table.querySelectorAll('tr');
  
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td, th'));
    
    if (cells.length >= 2) {
      // Look for player name link (NBA.com uses links like /stats/player/...)
      const links = row.querySelectorAll('a[href*="/stats/player/"]');
      
      if (links.length > 0) {
        const nameLink = links[0];
        const name = nameLink.textContent.trim();
        
        if (!name) continue;
        
        // Find team abbreviation - it's usually right after the player name link
        let team = 'Unknown';
        
        // Common NBA team abbreviations
        const validTeams = ['LAL', 'OKC', 'PHI', 'CLE', 'DEN', 'SAS', 'NYK', 'DET', 'LAC', 'IND', 'CHA', 'ATL', 'MIA', 'ORL', 'WAS', 'BOS', 'BKN', 'TOR', 'CHI', 'MIL', 'MIN', 'UTA', 'POR', 'GSW', 'GS', 'PHX', 'SAC', 'HOU', 'MEM', 'NOP', 'DAL'];
        
        // Look for team in the cells after the name link
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const cellText = cell.textContent.trim();
          
          // Check if this cell contains a valid team abbreviation
          if (validTeams.includes(cellText)) {
            team = cellText;
            break;
          }
          
          // Also check if the cell text contains a team abbreviation
          for (const validTeam of validTeams) {
            if (cellText === validTeam || cellText.endsWith(validTeam) || cellText.startsWith(validTeam)) {
              team = validTeam;
              break;
            }
          }
          if (team !== 'Unknown') break;
        }
        
        // Fallback: try regex on row text
        if (team === 'Unknown') {
          const rowText = row.textContent || '';
          const teamMatch = rowText.match(/\b([A-Z]{2,3})\b/);
          if (teamMatch) {
            const potentialTeam = teamMatch[1];
            if (validTeams.includes(potentialTeam)) {
              team = potentialTeam;
            }
          }
        }
        
        // Extract stat value and rank
        let statValue = null;
        let rank = null;
        
        // Check first cell for rank (usually "1.", "2.", etc.)
        if (cells[0]) {
          const firstCellText = cells[0].textContent.trim();
          const rankMatch = firstCellText.match(/^(\d+)\.?\s*$/);
          if (rankMatch) {
            rank = parseInt(rankMatch[1]);
          }
        }
        
        // Look for stat value in cells
        // The structure is typically: Rank | Player Name | Team | Stat Value
        // Or: Player Name | Team | Stat Value
        
        // Try the last cell first (most common structure)
        if (cells.length > 0) {
          const lastCell = cells[cells.length - 1];
          const lastText = lastCell.textContent.trim();
          const lastNum = parseFloat(lastText);
          
          // Check if last cell is a number and not the rank/name/team
          if (!isNaN(lastNum) && lastText !== String(rank) && !lastText.includes(name) && lastText !== team && lastText !== `${rank}.`) {
            statValue = lastNum;
          }
        }
        
        // If not found, search through all cells
        if (statValue === null) {
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const text = cell.textContent.trim();
            
            // Skip if it's the rank, player name, or team
            if (text === String(rank) || text.includes(name) || text === team || text === `${rank}.` || text === '') {
              continue;
            }
            
            // Try to parse as number
            const numValue = parseFloat(text);
            if (!isNaN(numValue) && text.length > 0) {
              // Accept any reasonable number
              // Exclude very small numbers (< 0.1) unless it's a percentage
              if (numValue >= 0.1 || (numValue >= 0 && numValue <= 100 && text.includes('%'))) {
                statValue = numValue;
                break;
              }
            }
          }
        }
        
        if (name && statValue !== null) {
          players.push({
            name: name,
            team: team,
            value: statValue,
            rank: rank || players.length + 1
          });
        }
      }
    }
  }
  
  return players;
}

function identifyStatCategory(heading, table, players, contextText = '', tableIndex = 0) {
  const headingLower = (heading || '').toLowerCase();
  const tableText = (table?.textContent || '').toLowerCase();
  const combinedText = (headingLower + ' ' + tableText + ' ' + contextText).toLowerCase();
  const firstValue = players[0]?.value || 0;
  
  // Season Leaders section - check based on value ranges and context
  if (headingLower.includes('season leaders') || headingLower.includes('points per game') || tableIndex <= 5) {
    if (combinedText.includes('points per game') || (firstValue >= 10 && firstValue <= 50 && !combinedText.includes('total'))) {
      return { section: 'seasonLeaders', stat: 'pointsPerGame' };
    }
    if (combinedText.includes('rebounds per game') || (firstValue >= 5 && firstValue <= 20 && !combinedText.includes('assist'))) {
      return { section: 'seasonLeaders', stat: 'reboundsPerGame' };
    }
    if (combinedText.includes('assists per game') || (firstValue >= 5 && firstValue <= 15 && !combinedText.includes('rebound'))) {
      return { section: 'seasonLeaders', stat: 'assistsPerGame' };
    }
    if (combinedText.includes('blocks per game') || (firstValue >= 1 && firstValue <= 5 && !combinedText.includes('steal'))) {
      return { section: 'seasonLeaders', stat: 'blocksPerGame' };
    }
    if (combinedText.includes('steals per game') || (firstValue >= 1 && firstValue <= 5 && !combinedText.includes('block'))) {
      return { section: 'seasonLeaders', stat: 'stealsPerGame' };
    }
  }
  
  // Forwards section
  if (headingLower.includes('forwards')) {
    if (tableText.includes('points per game') || players[0]?.value >= 10 && players[0]?.value <= 50) {
      return { section: 'forwards', stat: 'pointsPerGame' };
    }
    if (tableText.includes('assists per game') || (players[0]?.value >= 0 && players[0]?.value <= 15)) {
      return { section: 'forwards', stat: 'assistsPerGame' };
    }
  }
  
  // Guards section
  if (headingLower.includes('guards')) {
    if (tableText.includes('points per game') || players[0]?.value >= 10 && players[0]?.value <= 50) {
      return { section: 'guards', stat: 'pointsPerGame' };
    }
    if (tableText.includes('assists per game') || (players[0]?.value >= 0 && players[0]?.value <= 15)) {
      return { section: 'guards', stat: 'assistsPerGame' };
    }
  }
  
  // Rookies section
  if (headingLower.includes('rookies')) {
    if (tableText.includes('points per game') || players[0]?.value >= 10 && players[0]?.value <= 50) {
      return { section: 'rookies', stat: 'pointsPerGame' };
    }
    if (tableText.includes('double doubles') || (players[0]?.value >= 0 && players[0]?.value <= 10 && Number.isInteger(players[0]?.value))) {
      return { section: 'rookies', stat: 'doubleDoubles' };
    }
  }
  
  // Season totals section - check for "most" or "highest" patterns
  if (combinedText.includes('most total points') || (firstValue >= 100 && firstValue <= 1000 && combinedText.includes('total'))) {
    return { section: 'seasonTotals', stat: 'mostTotalPoints' };
  }
  if (combinedText.includes('most points in a game') || (firstValue >= 30 && firstValue <= 100 && combinedText.includes('game'))) {
    return { section: 'seasonTotals', stat: 'mostPointsInGame' };
  }
  if (combinedText.includes('most assists in a game') || (firstValue >= 10 && firstValue <= 30 && combinedText.includes('assist') && combinedText.includes('game'))) {
    return { section: 'seasonTotals', stat: 'mostAssistsInGame' };
  }
  if (combinedText.includes('most steals in a game') || (firstValue >= 3 && firstValue <= 10 && combinedText.includes('steal') && combinedText.includes('game'))) {
    return { section: 'seasonTotals', stat: 'mostStealsInGame' };
  }
  if (combinedText.includes('most blocks in a game') || (firstValue >= 3 && firstValue <= 15 && combinedText.includes('block') && combinedText.includes('game'))) {
    return { section: 'seasonTotals', stat: 'mostBlocksInGame' };
  }
  if (combinedText.includes('highest') && combinedText.includes('3pt') && (firstValue >= 50 && firstValue <= 100)) {
    return { section: 'seasonTotals', stat: 'highestPct3PT' };
  }
  if (combinedText.includes('highest') && combinedText.includes('mid range') && (firstValue >= 10 && firstValue <= 50)) {
    return { section: 'seasonTotals', stat: 'highestPctMidRange' };
  }
  
  return null;
}

async function getAllStats(limit = 5) {
  try {
    const allStats = await scrapeNBAPlayerStats();
    
    console.log('\n📊 NBA Player Statistics - All Categories\n');
    console.log('='.repeat(70));
    
    // Season Leaders
    console.log('\n🏆 SEASON LEADERS');
    console.log('-'.repeat(70));
    
    if (allStats.seasonLeaders.pointsPerGame.length > 0) {
      console.log('\n📈 Points Per Game:');
      allStats.seasonLeaders.pointsPerGame.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
      });
    }
    
    if (allStats.seasonLeaders.reboundsPerGame.length > 0) {
      console.log('\n🏀 Rebounds Per Game:');
      allStats.seasonLeaders.reboundsPerGame.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} RPG`);
      });
    }
    
    if (allStats.seasonLeaders.assistsPerGame.length > 0) {
      console.log('\n🎯 Assists Per Game:');
      allStats.seasonLeaders.assistsPerGame.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} APG`);
      });
    }
    
    if (allStats.seasonLeaders.blocksPerGame.length > 0) {
      console.log('\n🚫 Blocks Per Game:');
      allStats.seasonLeaders.blocksPerGame.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} BPG`);
      });
    }
    
    if (allStats.seasonLeaders.stealsPerGame.length > 0) {
      console.log('\n✋ Steals Per Game:');
      allStats.seasonLeaders.stealsPerGame.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} SPG`);
      });
    }
    
    if (allStats.seasonLeaders.fieldGoalPercentage.length > 0) {
      console.log('\n🎯 Field Goal Percentage:');
      allStats.seasonLeaders.fieldGoalPercentage.slice(0, limit).forEach((p, i) => {
        const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
      });
    }
    
    if (allStats.seasonLeaders.threePointersMade.length > 0) {
      console.log('\n🏀 Three Pointers Made:');
      allStats.seasonLeaders.threePointersMade.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} 3PM`);
      });
    }
    
    if (allStats.seasonLeaders.threePointPercentage.length > 0) {
      console.log('\n📊 Three Point Percentage:');
      allStats.seasonLeaders.threePointPercentage.slice(0, limit).forEach((p, i) => {
        const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
      });
    }
    
    if (allStats.seasonLeaders.fantasyPointsPerGame.length > 0) {
      console.log('\n✨ Fantasy Points Per Game:');
      allStats.seasonLeaders.fantasyPointsPerGame.slice(0, limit).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} FPPG`);
      });
    }
    
    // Forwards
    if (allStats.forwards.pointsPerGame.length > 0 || allStats.forwards.assistsPerGame.length > 0) {
      console.log('\n\n👔 FORWARDS');
      console.log('-'.repeat(70));
      
      if (allStats.forwards.pointsPerGame.length > 0) {
        console.log('\n📈 Points Per Game:');
        allStats.forwards.pointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.forwards.assistsPerGame.length > 0) {
        console.log('\n🎯 Assists Per Game:');
        allStats.forwards.assistsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} APG`);
        });
      }
    }
    
    // Guards
    if (allStats.guards.pointsPerGame.length > 0 || allStats.guards.assistsPerGame.length > 0) {
      console.log('\n\n🏃 GUARDS');
      console.log('-'.repeat(70));
      
      if (allStats.guards.pointsPerGame.length > 0) {
        console.log('\n📈 Points Per Game:');
        allStats.guards.pointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.guards.assistsPerGame.length > 0) {
        console.log('\n🎯 Assists Per Game:');
        allStats.guards.assistsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} APG`);
        });
      }
    }
    
    // Rookies
    if (allStats.rookies.pointsPerGame.length > 0 || allStats.rookies.doubleDoubles.length > 0) {
      console.log('\n\n⭐ ROOKIES');
      console.log('-'.repeat(70));
      
      if (allStats.rookies.pointsPerGame.length > 0) {
        console.log('\n📈 Points Per Game:');
        allStats.rookies.pointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.rookies.doubleDoubles.length > 0) {
        console.log('\n📊 Double Doubles:');
        allStats.rookies.doubleDoubles.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} DD`);
        });
      }
    }
    
    // Season Totals
    if (Object.values(allStats.seasonTotals).some(arr => arr.length > 0)) {
      console.log('\n\n📊 SEASON TOTALS');
      console.log('-'.repeat(70));
      
      if (allStats.seasonTotals.mostTotalPoints.length > 0) {
        console.log('\n🔥 Most Total Points:');
        allStats.seasonTotals.mostTotalPoints.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} PTS`);
        });
      }
      
      if (allStats.seasonTotals.mostPointsInGame.length > 0) {
        console.log('\n💥 Most Points in a Game:');
        allStats.seasonTotals.mostPointsInGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} PTS`);
        });
      }
      
      if (allStats.seasonTotals.mostAssistsInGame.length > 0) {
        console.log('\n🎯 Most Assists in a Game:');
        allStats.seasonTotals.mostAssistsInGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} AST`);
        });
      }
      
      if (allStats.seasonTotals.mostStealsInGame.length > 0) {
        console.log('\n✋ Most Steals in a Game:');
        allStats.seasonTotals.mostStealsInGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} STL`);
        });
      }
      
      if (allStats.seasonTotals.mostBlocksInGame.length > 0) {
        console.log('\n🚫 Most Blocks in a Game:');
        allStats.seasonTotals.mostBlocksInGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} BLK`);
        });
      }
      
      if (allStats.seasonTotals.highestPct3PT.length > 0) {
        console.log('\n🎯 Highest % of PTS 3PT:');
        allStats.seasonTotals.highestPct3PT.slice(0, limit).forEach((p, i) => {
          // Convert decimal to percentage (0.847 -> 84.7%)
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
      
      if (allStats.seasonTotals.highestPctMidRange.length > 0) {
        console.log('\n📐 Highest % of PTS Mid Range:');
        allStats.seasonTotals.highestPctMidRange.slice(0, limit).forEach((p, i) => {
          // Convert decimal to percentage (0.282 -> 28.2%)
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
    }
    
    // Advanced Stats
    if (Object.values(allStats.advanced).some(arr => arr.length > 0)) {
      console.log('\n\n📈 ADVANCED');
      console.log('-'.repeat(70));
      
      if (allStats.advanced.trueShootingPercentage.length > 0) {
        console.log('\n🎯 True Shooting Percentage:');
        allStats.advanced.trueShootingPercentage.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
      
      if (allStats.advanced.usagePercentage.length > 0) {
        console.log('\n⚡ Usage Percentage:');
        allStats.advanced.usagePercentage.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
      
      if (allStats.advanced.offensiveReboundPercentage.length > 0) {
        console.log('\n🏀 Offensive Rebound %:');
        allStats.advanced.offensiveReboundPercentage.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
    }
    
    // Miscellaneous
    if (Object.values(allStats.miscellaneous).some(arr => arr.length > 0)) {
      console.log('\n\n📋 MISCELLANEOUS');
      console.log('-'.repeat(70));
      
      if (allStats.miscellaneous.fastBreakPointsPerGame.length > 0) {
        console.log('\n⚡ Fast Break Points Per Game:');
        allStats.miscellaneous.fastBreakPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.miscellaneous.secondChancePointsPerGame.length > 0) {
        console.log('\n🔄 2nd Chance Points Per Game:');
        allStats.miscellaneous.secondChancePointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.miscellaneous.pointsInPaintPerGame.length > 0) {
        console.log('\n🎨 Points in the Paint Per Game:');
        allStats.miscellaneous.pointsInPaintPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
    }
    
    // Player Tracking - Drives
    if (Object.values(allStats.trackingDrives).some(arr => arr.length > 0)) {
      console.log('\n\n🚗 PLAYER TRACKING - DRIVES');
      console.log('-'.repeat(70));
      
      if (allStats.trackingDrives.drivesPerGame.length > 0) {
        console.log('\n🏃 Drives Per Game:');
        allStats.trackingDrives.drivesPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)}`);
        });
      }
      
      if (allStats.trackingDrives.drivePointsPerGame.length > 0) {
        console.log('\n💥 Drive Points Per Game:');
        allStats.trackingDrives.drivePointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.trackingDrives.fieldGoalPercentageOnDrives.length > 0) {
        console.log('\n🎯 Field Goal % on Drives:');
        allStats.trackingDrives.fieldGoalPercentageOnDrives.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
    }
    
    // Player Tracking - Shooting
    if (Object.values(allStats.trackingShooting).some(arr => arr.length > 0)) {
      console.log('\n\n🏀 PLAYER TRACKING - SHOOTING');
      console.log('-'.repeat(70));
      
      if (allStats.trackingShooting.pullUpPointsPerGame.length > 0) {
        console.log('\n📈 Pull Up Points Per Game:');
        allStats.trackingShooting.pullUpPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.trackingShooting.catchAndShootPointsPerGame.length > 0) {
        console.log('\n🎯 Catch & Shoot Points Per Game:');
        allStats.trackingShooting.catchAndShootPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.trackingShooting.elbowPointsPerGame.length > 0) {
        console.log('\n📍 Elbow Points Per Game:');
        allStats.trackingShooting.elbowPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
    }
    
    // Player Tracking - Passing
    if (Object.values(allStats.trackingPassing).some(arr => arr.length > 0)) {
      console.log('\n\n📤 PLAYER TRACKING - PASSING');
      console.log('-'.repeat(70));
      
      if (allStats.trackingPassing.passesPerGame.length > 0) {
        console.log('\n📊 Passes Per Game:');
        allStats.trackingPassing.passesPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)}`);
        });
      }
      
      if (allStats.trackingPassing.pointsFromAssistsPerGame.length > 0) {
        console.log('\n🎯 Points From Assists Per Game:');
        allStats.trackingPassing.pointsFromAssistsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.trackingPassing.potentialAssistsPerGame.length > 0) {
        console.log('\n⚡ Potential Assists Per Game:');
        allStats.trackingPassing.potentialAssistsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} APG`);
        });
      }
    }
    
    // Player Tracking - Speed
    if (Object.values(allStats.trackingSpeed).some(arr => arr.length > 0)) {
      console.log('\n\n🏃 PLAYER TRACKING - SPEED');
      console.log('-'.repeat(70));
      
      if (allStats.trackingSpeed.distanceRunMilesPerGame.length > 0) {
        console.log('\n📏 Distance Run Miles Per Game:');
        allStats.trackingSpeed.distanceRunMilesPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} mi`);
        });
      }
      
      if (allStats.trackingSpeed.distanceRunTotalMiles.length > 0) {
        console.log('\n📏 Distance Run Total Miles:');
        allStats.trackingSpeed.distanceRunTotalMiles.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} mi`);
        });
      }
    }
    
    // Clutch
    if (Object.values(allStats.clutch).some(arr => arr.length > 0)) {
      console.log('\n\n⏰ CLUTCH');
      console.log('-'.repeat(70));
      
      if (allStats.clutch.totalPoints.length > 0) {
        console.log('\n🔥 Total Points:');
        allStats.clutch.totalPoints.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value} PTS`);
        });
      }
      
      if (allStats.clutch.freeThrowPercentage.length > 0) {
        console.log('\n🎯 Free Throw Percentage:');
        allStats.clutch.freeThrowPercentage.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
    }
    
    // Scoring
    if (Object.values(allStats.scoring).some(arr => arr.length > 0)) {
      console.log('\n\n🎯 SCORING');
      console.log('-'.repeat(70));
      
      if (allStats.scoring.pctPoints3PT.length > 0) {
        console.log('\n📊 % of Points 3PT:');
        allStats.scoring.pctPoints3PT.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
      
      if (allStats.scoring.pctPointsInPaint.length > 0) {
        console.log('\n🎨 % of Points in the Paint:');
        allStats.scoring.pctPointsInPaint.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
      
      if (allStats.scoring.pctPointsMidRange.length > 0) {
        console.log('\n📐 % of Points Mid-Range:');
        allStats.scoring.pctPointsMidRange.slice(0, limit).forEach((p, i) => {
          const percentage = p.value < 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1);
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${percentage}%`);
        });
      }
    }
    
    // Bio Stats
    if (Object.values(allStats.bioStats).some(arr => arr.length > 0)) {
      console.log('\n\n👤 BIO STATS');
      console.log('-'.repeat(70));
      
      if (allStats.bioStats.internationalPointsPerGame.length > 0) {
        console.log('\n🌍 International Points Per Game:');
        allStats.bioStats.internationalPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.bioStats.secondRoundersPointsPerGame.length > 0) {
        console.log('\n📝 2nd Rounders Points Per Game:');
        allStats.bioStats.secondRoundersPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.bioStats.undraftedPointsPerGame.length > 0) {
        console.log('\n⭐ Undrafted Points Per Game:');
        allStats.bioStats.undraftedPointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
    }
    
    // Centers
    if (Object.values(allStats.centers).some(arr => arr.length > 0)) {
      console.log('\n\n🏀 CENTERS');
      console.log('-'.repeat(70));
      
      if (allStats.centers.pointsPerGame.length > 0) {
        console.log('\n📈 Points Per Game:');
        allStats.centers.pointsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.centers.assistsPerGame.length > 0) {
        console.log('\n🎯 Assists Per Game:');
        allStats.centers.assistsPerGame.slice(0, limit).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name.padEnd(30)} (${p.team}) ${p.value.toFixed(1)} APG`);
        });
      }
    }
    
    return allStats;
    
  } catch (error) {
    console.error('❌ Error getting stats:', error.message);
    return null;
  }
}

// Legacy function for backwards compatibility
async function getPPGLeaders(limit = 20) {
  const allStats = await getAllStats(limit);
  return allStats?.seasonLeaders?.pointsPerGame || null;
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('scrape-nba-stats')) {
  getAllStats(5)
    .then((stats) => {
      if (stats) {
        console.log('\n✅ Successfully scraped all NBA player statistics');
      }
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

function extractJSONFromHTML(html) {
  // Look for the JSON data in script tags
  // Pattern: window.__NEXT_DATA__ = { ... }
  const nextDataMatch = html.match(/window\.__NEXT_DATA__\s*=\s*({[\s\S]+?});/);
  if (nextDataMatch) {
    try {
      const jsonData = JSON.parse(nextDataMatch[1]);
      return jsonData.props?.pageProps || jsonData;
    } catch (e) {
      console.log('⚠️  Error parsing __NEXT_DATA__:', e.message);
    }
  }
  
  // Also try to find leadersData directly
  const leadersMatch = html.match(/"leadersData"\s*:\s*({[\s\S]+?}),\s*"quickLinks"/);
  if (leadersMatch) {
    try {
      // Try to extract just the leadersData object
      const jsonStr = '{' + leadersMatch[0] + '}';
      const jsonData = JSON.parse(jsonStr);
      return jsonData;
    } catch (e) {
      // Try a different approach - find the full object
      const fullMatch = html.match(/"leadersData":\s*({[^}]*"items"[\s\S]+?}),\s*"quickLinks"/);
      if (fullMatch) {
        try {
          const jsonStr = '{"leadersData":' + fullMatch[1] + '}';
          return JSON.parse(jsonStr);
        } catch (e2) {
          console.log('⚠️  Error parsing leadersData:', e2.message);
        }
      }
    }
  }
  
  return null;
}

function extractStatsFromJSON(leadersData) {
  const allStats = {
    seasonLeaders: {
      pointsPerGame: [],
      reboundsPerGame: [],
      assistsPerGame: [],
      blocksPerGame: [],
      stealsPerGame: [],
      fieldGoalPercentage: [],
      threePointersMade: [],
      threePointPercentage: [],
      fantasyPointsPerGame: []
    },
    advanced: {
      trueShootingPercentage: [],
      usagePercentage: [],
      offensiveReboundPercentage: []
    },
    miscellaneous: {
      fastBreakPointsPerGame: [],
      secondChancePointsPerGame: [],
      pointsInPaintPerGame: []
    },
    trackingDrives: {
      drivesPerGame: [],
      drivePointsPerGame: [],
      fieldGoalPercentageOnDrives: []
    },
    trackingShooting: {
      pullUpPointsPerGame: [],
      catchAndShootPointsPerGame: [],
      elbowPointsPerGame: []
    },
    trackingPassing: {
      passesPerGame: [],
      pointsFromAssistsPerGame: [],
      potentialAssistsPerGame: []
    },
    trackingSpeed: {
      distanceRunMilesPerGame: [],
      distanceRunTotalMiles: []
    },
    clutch: {
      totalPoints: [],
      freeThrowPercentage: []
    },
    scoring: {
      pctPoints3PT: [],
      pctPointsInPaint: [],
      pctPointsMidRange: []
    },
    bioStats: {
      internationalPointsPerGame: [],
      secondRoundersPointsPerGame: [],
      undraftedPointsPerGame: []
    },
    centers: {
      pointsPerGame: [],
      assistsPerGame: []
    },
    forwards: {
      pointsPerGame: [],
      assistsPerGame: []
    },
    guards: {
      pointsPerGame: [],
      assistsPerGame: []
    },
    rookies: {
      pointsPerGame: [],
      doubleDoubles: []
    },
    seasonTotals: {
      mostTotalPoints: [],
      mostPointsInGame: [],
      mostAssistsInGame: [],
      mostStealsInGame: [],
      mostBlocksInGame: [],
      highestPct3PT: [],
      highestPctMidRange: []
    }
  };
  
  if (!leadersData || !leadersData.items) {
    return allStats;
  }
  
  // Process each section in leadersData
  for (const section of leadersData.items) {
    if (!section.items) continue;
    
    const sectionTitle = (section.title || '').toLowerCase();
    const sectionUid = (section.uid || '').toLowerCase();
    
    // Process each stat category in the section
    for (const category of section.items) {
      const categoryTitle = (category.title || '').toLowerCase();
      const statName = category.name || '';
      const playerStats = category.playerstats || [];
      
      if (playerStats.length === 0) continue;
      
      // Map category titles to our stat structure
      let mappedCategory = mapCategoryToStat(sectionTitle, sectionUid, categoryTitle, statName, category);
      
      // If no match, try lenient matching for season totals and other categories
      if (!mappedCategory) {
        if (categoryTitle.includes('most') || categoryTitle.includes('total') || sectionTitle.includes('forward') || sectionTitle.includes('guard') || sectionTitle.includes('rookie')) {
          mappedCategory = mapCategoryToStat(sectionTitle, sectionUid, categoryTitle, statName, category, true);
        }
      }
      
      if (mappedCategory && allStats[mappedCategory.section] && allStats[mappedCategory.section][mappedCategory.stat]) {
        // Only assign if empty
        if (allStats[mappedCategory.section][mappedCategory.stat].length === 0) {
          const players = playerStats.map(p => ({
            name: p.PLAYER_NAME || p.name || 'Unknown',
            team: p.TEAM_ABBREVIATION || p.team || 'Unknown',
            value: getStatValue(p, statName),
            rank: p.RANK || p.rank || 0
          }));
          
          allStats[mappedCategory.section][mappedCategory.stat] = players;
          console.log(`✅ Extracted ${categoryTitle}: ${players.length} players`);
        }
      } else if (!mappedCategory) {
        // Debug: log unmatched categories
        if (categoryTitle.includes('most') || categoryTitle.includes('total') || sectionTitle.includes('forward') || sectionTitle.includes('guard') || sectionTitle.includes('rookie')) {
          console.log(`⚠️  Unmatched category: "${categoryTitle}" in section "${sectionTitle}" (${sectionUid})`);
        }
      }
    }
  }
  
  return allStats;
}

function getStatValue(player, statName) {
  // Try different possible field names
  const value = player[statName] || 
                player[statName.toUpperCase()] ||
                player.value ||
                player.statValue ||
                0;
  
  return parseFloat(value) || 0;
}

function mapCategoryToStat(sectionTitle, sectionUid, categoryTitle, statName, category = {}, lenient = false) {
  // Season Leaders section
  if (sectionTitle.includes('season leaders') || sectionTitle.includes('traditional') || sectionUid.includes('traditional')) {
    if (categoryTitle.includes('points per game') && statName === 'PTS') {
      return { section: 'seasonLeaders', stat: 'pointsPerGame' };
    }
    if (categoryTitle.includes('rebounds per game') && statName === 'REB') {
      return { section: 'seasonLeaders', stat: 'reboundsPerGame' };
    }
    if (categoryTitle.includes('assists per game') && statName === 'AST') {
      return { section: 'seasonLeaders', stat: 'assistsPerGame' };
    }
    if (categoryTitle.includes('blocks per game') && statName === 'BLK') {
      return { section: 'seasonLeaders', stat: 'blocksPerGame' };
    }
    if (categoryTitle.includes('steals per game') && statName === 'STL') {
      return { section: 'seasonLeaders', stat: 'stealsPerGame' };
    }
    if ((categoryTitle.includes('field goal percentage') || categoryTitle.includes('field goal %')) && statName === 'FG_PCT') {
      return { section: 'seasonLeaders', stat: 'fieldGoalPercentage' };
    }
    if ((categoryTitle.includes('three pointers made') || categoryTitle.includes('three pointer') || categoryTitle.includes('3 pointers')) && statName === 'FG3M') {
      return { section: 'seasonLeaders', stat: 'threePointersMade' };
    }
    if ((categoryTitle.includes('three point percentage') || categoryTitle.includes('three point %') || categoryTitle.includes('3 point percentage')) && statName === 'FG3_PCT') {
      return { section: 'seasonLeaders', stat: 'threePointPercentage' };
    }
    if (categoryTitle.includes('fantasy points per game') && statName === 'FANTASY_POINTS') {
      return { section: 'seasonLeaders', stat: 'fantasyPointsPerGame' };
    }
  }
  
  // Advanced stats section
  if (sectionTitle.includes('advanced') || sectionUid.includes('advanced')) {
    if ((categoryTitle.includes('true shooting percentage') || categoryTitle.includes('true shooting %')) && statName === 'TS_PCT') {
      return { section: 'advanced', stat: 'trueShootingPercentage' };
    }
    if ((categoryTitle.includes('usage percentage') || categoryTitle.includes('usage %')) && statName === 'USG_PCT') {
      return { section: 'advanced', stat: 'usagePercentage' };
    }
    if ((categoryTitle.includes('offensive rebound') || categoryTitle.includes('offensive rebound %')) && statName === 'OREB_PCT') {
      return { section: 'advanced', stat: 'offensiveReboundPercentage' };
    }
  }
  
  // Forwards section
  if (sectionTitle.includes('forwards')) {
    if (categoryTitle.includes('points per game')) {
      return { section: 'forwards', stat: 'pointsPerGame' };
    }
    if (categoryTitle.includes('assists per game')) {
      return { section: 'forwards', stat: 'assistsPerGame' };
    }
  }
  
  // Guards section
  if (sectionTitle.includes('guards')) {
    if (categoryTitle.includes('points per game')) {
      return { section: 'guards', stat: 'pointsPerGame' };
    }
    if (categoryTitle.includes('assists per game')) {
      return { section: 'guards', stat: 'assistsPerGame' };
    }
  }
  
  // Rookies section
  if (sectionTitle.includes('rookies')) {
    if (categoryTitle.includes('points per game')) {
      return { section: 'rookies', stat: 'pointsPerGame' };
    }
    if (categoryTitle.includes('double doubles') || categoryTitle.includes('double-doubles')) {
      return { section: 'rookies', stat: 'doubleDoubles' };
    }
  }
  
  // Season totals - check for boxscores or totals sections
  // These can be in "Season Leaders" section with specific titles
  if (sectionUid.includes('boxscores') || sectionUid.includes('totals') || sectionTitle.includes('season leaders') || categoryTitle.includes('most') || lenient) {
    // Exact title matches first
    if (categoryTitle === 'most total points' || categoryTitle.includes('most total points')) {
      return { section: 'seasonTotals', stat: 'mostTotalPoints' };
    }
    if (categoryTitle === 'most points in a game' || categoryTitle.includes('most points in a game')) {
      return { section: 'seasonTotals', stat: 'mostPointsInGame' };
    }
    if (categoryTitle === 'most assists in a game' || categoryTitle.includes('most assists in a game')) {
      return { section: 'seasonTotals', stat: 'mostAssistsInGame' };
    }
    if (categoryTitle === 'most steals in a game' || categoryTitle.includes('most steals in a game')) {
      return { section: 'seasonTotals', stat: 'mostStealsInGame' };
    }
    if (categoryTitle === 'most blocks in a game' || categoryTitle.includes('most blocks in a game')) {
      return { section: 'seasonTotals', stat: 'mostBlocksInGame' };
    }
    
    // Fallback: pattern matching
    if ((categoryTitle.includes('total points') && !categoryTitle.includes('per game') && statName === 'PTS')) {
      return { section: 'seasonTotals', stat: 'mostTotalPoints' };
    }
    if (categoryTitle.includes('points') && categoryTitle.includes('game') && statName === 'PTS' && (category.permode === 'Totals' || lenient)) {
      return { section: 'seasonTotals', stat: 'mostPointsInGame' };
    }
    if (categoryTitle.includes('assists') && categoryTitle.includes('game') && statName === 'AST' && (category.permode === 'Totals' || lenient)) {
      return { section: 'seasonTotals', stat: 'mostAssistsInGame' };
    }
    if (categoryTitle.includes('steals') && categoryTitle.includes('game') && statName === 'STL' && (category.permode === 'Totals' || lenient)) {
      return { section: 'seasonTotals', stat: 'mostStealsInGame' };
    }
    if (categoryTitle.includes('blocks') && categoryTitle.includes('game') && statName === 'BLK' && (category.permode === 'Totals' || lenient)) {
      return { section: 'seasonTotals', stat: 'mostBlocksInGame' };
    }
  }
  
  // Scoring percentages
  if (sectionUid.includes('scoring') || categoryTitle.includes('highest') || statName === 'PCT_PTS_3PT') {
    if (categoryTitle.includes('3pt') || statName === 'PCT_PTS_3PT') {
      return { section: 'seasonTotals', stat: 'highestPct3PT' };
    }
    if (categoryTitle.includes('mid range') || categoryTitle.includes('mid-range') || statName === 'PCT_PTS_2PT_MR') {
      return { section: 'seasonTotals', stat: 'highestPctMidRange' };
    }
  }
  
  // Miscellaneous section
  if (sectionTitle.includes('miscellaneous') || sectionUid.includes('misc')) {
    if (categoryTitle.includes('fast break points per game') && statName === 'PTS_FB') {
      return { section: 'miscellaneous', stat: 'fastBreakPointsPerGame' };
    }
    if (categoryTitle.includes('2nd chance points per game') && statName === 'PTS_2ND_CHANCE') {
      return { section: 'miscellaneous', stat: 'secondChancePointsPerGame' };
    }
    if (categoryTitle.includes('points in the paint per game') && statName === 'PTS_PAINT') {
      return { section: 'miscellaneous', stat: 'pointsInPaintPerGame' };
    }
  }
  
  // Player Tracking - Drives
  if (sectionTitle.includes('drives') || sectionUid.includes('drives')) {
    if (categoryTitle.includes('drives per game')) {
      return { section: 'trackingDrives', stat: 'drivesPerGame' };
    }
    if (categoryTitle.includes('drive points per game')) {
      return { section: 'trackingDrives', stat: 'drivePointsPerGame' };
    }
    if (categoryTitle.includes('field goal percentage on drives') || categoryTitle.includes('fg% on drives')) {
      return { section: 'trackingDrives', stat: 'fieldGoalPercentageOnDrives' };
    }
  }
  
  // Player Tracking - Shooting
  if (sectionTitle.includes('shooting') || sectionUid.includes('shooting')) {
    if (categoryTitle.includes('pull up points per game') || categoryTitle.includes('pull-up points')) {
      return { section: 'trackingShooting', stat: 'pullUpPointsPerGame' };
    }
    if (categoryTitle.includes('catch & shoot points per game') || categoryTitle.includes('catch and shoot')) {
      return { section: 'trackingShooting', stat: 'catchAndShootPointsPerGame' };
    }
    if (categoryTitle.includes('elbow points per game')) {
      return { section: 'trackingShooting', stat: 'elbowPointsPerGame' };
    }
  }
  
  // Player Tracking - Passing
  if (sectionTitle.includes('passing') || sectionUid.includes('passing')) {
    if (categoryTitle.includes('passes per game')) {
      return { section: 'trackingPassing', stat: 'passesPerGame' };
    }
    if (categoryTitle.includes('points from assists per game')) {
      return { section: 'trackingPassing', stat: 'pointsFromAssistsPerGame' };
    }
    if (categoryTitle.includes('potential assists per game')) {
      return { section: 'trackingPassing', stat: 'potentialAssistsPerGame' };
    }
  }
  
  // Player Tracking - Speed
  if (sectionTitle.includes('speed') || sectionUid.includes('speed')) {
    if (categoryTitle.includes('distance run miles per game') || (categoryTitle.includes('distance run') && categoryTitle.includes('per game'))) {
      return { section: 'trackingSpeed', stat: 'distanceRunMilesPerGame' };
    }
    if (categoryTitle.includes('distance run total miles') || (categoryTitle.includes('distance run') && categoryTitle.includes('total'))) {
      return { section: 'trackingSpeed', stat: 'distanceRunTotalMiles' };
    }
  }
  
  // Clutch section
  if (sectionTitle.includes('clutch') || sectionUid.includes('clutch')) {
    if (categoryTitle.includes('total points') && statName === 'PTS') {
      return { section: 'clutch', stat: 'totalPoints' };
    }
    if ((categoryTitle.includes('free throw percentage') || categoryTitle.includes('ft%')) && statName === 'FT_PCT') {
      return { section: 'clutch', stat: 'freeThrowPercentage' };
    }
  }
  
  // Scoring section (different from seasonTotals scoring percentages)
  if ((sectionTitle.includes('scoring') || sectionUid.includes('scoring')) && !categoryTitle.includes('highest')) {
    if (categoryTitle.includes('% of points 3pt') || categoryTitle.includes('pct points 3pt')) {
      return { section: 'scoring', stat: 'pctPoints3PT' };
    }
    if (categoryTitle.includes('% of points in the paint') || categoryTitle.includes('pct points paint')) {
      return { section: 'scoring', stat: 'pctPointsInPaint' };
    }
    if (categoryTitle.includes('% of points mid-range') || categoryTitle.includes('pct points mid range')) {
      return { section: 'scoring', stat: 'pctPointsMidRange' };
    }
  }
  
  // Bio Stats section
  if (sectionTitle.includes('bio') || sectionUid.includes('bio')) {
    if (categoryTitle.includes('international points per game') && statName === 'PTS') {
      return { section: 'bioStats', stat: 'internationalPointsPerGame' };
    }
    if (categoryTitle.includes('2nd rounders points per game') && statName === 'PTS') {
      return { section: 'bioStats', stat: 'secondRoundersPointsPerGame' };
    }
    if (categoryTitle.includes('undrafted points per game') && statName === 'PTS') {
      return { section: 'bioStats', stat: 'undraftedPointsPerGame' };
    }
  }
  
  // Centers section
  if (sectionTitle.includes('centers') || sectionUid.includes('centers')) {
    if (categoryTitle.includes('points per game') && statName === 'PTS') {
      return { section: 'centers', stat: 'pointsPerGame' };
    }
    if (categoryTitle.includes('assists per game') && statName === 'AST') {
      return { section: 'centers', stat: 'assistsPerGame' };
    }
  }
  
  return null;
}

export { scrapeNBAPlayerStats, getAllStats, getPPGLeaders };
