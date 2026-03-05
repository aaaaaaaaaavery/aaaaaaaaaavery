import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const NBA_TEAM_STATS_URL = 'https://www.nba.com/stats/teams';

async function scrapeNBATeamStats() {
  try {
    console.log('🏀 Fetching NBA team stats from NBA.com...');
    console.log(`📡 URL: ${NBA_TEAM_STATS_URL}\n`);
    
    const response = await fetch(NBA_TEAM_STATS_URL, {
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
    
    if (jsonData) {
      console.log('✅ Found JSON data, keys:', Object.keys(jsonData));
      
      // Try to find leadersData in various locations
      const leadersData = jsonData.leadersData || 
                         jsonData.props?.leadersData ||
                         jsonData.pageProps?.leadersData;
      
      if (leadersData) {
        console.log('✅ Found leadersData');
        return extractTeamStatsFromJSON(leadersData);
      } else {
        console.log('⚠️  No leadersData found in JSON structure');
        console.log('Available keys:', Object.keys(jsonData));
        if (jsonData.props) {
          console.log('Props keys:', Object.keys(jsonData.props));
        }
      }
    }
    
    // Fallback to HTML parsing if JSON not found
    console.log('⚠️  JSON not found, falling back to HTML parsing...');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return extractTeamStatsFromHTML(document);
    
  } catch (error) {
    console.error('❌ Error scraping NBA team stats:', error.message);
    throw error;
  }
}

function extractJSONFromHTML(html) {
  // Look for the JSON data in script tags - try multiple patterns
  const patterns = [
    /window\.__NEXT_DATA__\s*=\s*({[\s\S]+?});/,
    /__NEXT_DATA__\s*=\s*({[\s\S]+?});/,
    /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/,
    /<script[^>]*>[\s\S]*?__NEXT_DATA__[\s\S]*?({[\s\S]+?})[\s\S]*?<\/script>/
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        const jsonData = JSON.parse(jsonStr);
        const pageProps = jsonData.props?.pageProps || jsonData;
        
        // Check if leadersData exists
        if (pageProps.leadersData) {
          return pageProps;
        }
        
        // For team stats, the structure might be different - return pageProps anyway
        return pageProps;
      } catch (e) {
        // Try next pattern
        continue;
      }
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

function extractTeamStatsFromJSON(leadersData) {
  if (!leadersData) {
    console.log('⚠️  No leadersData provided');
    return createEmptyTeamStats();
  }
  
  const allStats = createEmptyTeamStats();

  if (!leadersData || !leadersData.items) {
    return allStats;
  }

  for (const section of leadersData.items) {
    if (!section.items) continue;

    const sectionTitle = (section.title || '').toLowerCase();
    const sectionUid = (section.uid || '').toLowerCase();
    

    for (const category of section.items) {
      const categoryTitle = (category.title || '').toLowerCase();
      const statName = category.name || '';
      const teamStats = category.teamstats || [];

      if (teamStats.length === 0) continue;

      let mappedCategory = mapCategoryToTeamStat(sectionTitle, sectionUid, categoryTitle, statName, category);

      if (mappedCategory) {
        if (allStats[mappedCategory.section] && allStats[mappedCategory.section][mappedCategory.stat]) {
          if (allStats[mappedCategory.section][mappedCategory.stat].length === 0) {
            const teams = teamStats.map(t => ({
              name: t.TEAM_NAME || t.name || 'Unknown',
              value: getStatValue(t, statName),
              rank: t.RANK || t.rank || 0
            }));

            allStats[mappedCategory.section][mappedCategory.stat] = teams;
            console.log(`✅ Extracted ${categoryTitle}: ${teams.length} teams`);
          }
        }
      }
    }
  }

  return allStats;
}

function mapCategoryToTeamStat(sectionTitle, sectionUid, categoryTitle, statName, category = {}) {
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
    if ((categoryTitle.includes('three point percentage') || categoryTitle.includes('three point %')) && statName === 'FG3_PCT') {
      return { section: 'seasonLeaders', stat: 'threePointPercentage' };
    }
    if ((categoryTitle.includes('free throw percentage') || categoryTitle.includes('free throw %')) && statName === 'FT_PCT') {
      return { section: 'seasonLeaders', stat: 'freeThrowPercentage' };
    }
  }
  
  // Scoring section
  if (sectionTitle.includes('scoring') || sectionUid.includes('scoring')) {
    if (categoryTitle.includes('% of points three pointer') || categoryTitle.includes('% of points 3pt')) {
      return { section: 'scoring', stat: 'pctPoints3PT' };
    }
    if (categoryTitle.includes('% of points in the paint')) {
      return { section: 'scoring', stat: 'pctPointsInPaint' };
    }
    if (categoryTitle.includes('% of points mid-range')) {
      return { section: 'scoring', stat: 'pctPointsMidRange' };
    }
  }
  
  // Bench section
  if (sectionTitle.includes('bench') || sectionUid.includes('bench')) {
    if (categoryTitle.includes('total points')) {
      return { section: 'bench', stat: 'totalPoints' };
    }
    if (categoryTitle.includes('net rating')) {
      return { section: 'bench', stat: 'netRating' };
    }
  }
  
  // Stats in Wins section
  if (sectionTitle.includes('stats in wins') || sectionUid.includes('wins')) {
    if (categoryTitle.includes('offensive rating')) {
      return { section: 'statsInWins', stat: 'offensiveRating' };
    }
    if (categoryTitle.includes('defensive rating')) {
      return { section: 'statsInWins', stat: 'defensiveRating' };
    }
    if (categoryTitle.includes('efg%') || categoryTitle.includes('effective field goal')) {
      return { section: 'statsInWins', stat: 'effectiveFieldGoalPercentage' };
    }
  }
  
  // Regular Season Totals
  if (sectionTitle.includes('regular season') || sectionUid.includes('totals') || categoryTitle.includes('most')) {
    if (categoryTitle.includes('most points') && statName === 'PTS') {
      return { section: 'regularSeasonTotals', stat: 'mostPoints' };
    }
    if (categoryTitle.includes('most assists') && statName === 'AST') {
      return { section: 'regularSeasonTotals', stat: 'mostAssists' };
    }
    if (categoryTitle.includes('most steals') && statName === 'STL') {
      return { section: 'regularSeasonTotals', stat: 'mostSteals' };
    }
    if (categoryTitle.includes('most blocks') && statName === 'BLK') {
      return { section: 'regularSeasonTotals', stat: 'mostBlocks' };
    }
    if (categoryTitle.includes('most three pointer') || categoryTitle.includes('most 3pt')) {
      return { section: 'regularSeasonTotals', stat: 'mostThreePointers' };
    }
    if (categoryTitle.includes('most post assists')) {
      return { section: 'regularSeasonTotals', stat: 'mostPostAssists' };
    }
  }
  
  // Advanced section
  if (sectionTitle.includes('advanced') || sectionUid.includes('advanced')) {
    if (categoryTitle.includes('net rating')) {
      return { section: 'advanced', stat: 'netRating' };
    }
    if (categoryTitle.includes('pace')) {
      return { section: 'advanced', stat: 'pace' };
    }
    if (categoryTitle.includes('offensive rating')) {
      return { section: 'advanced', stat: 'offensiveRating' };
    }
    if (categoryTitle.includes('defensive rating')) {
      return { section: 'advanced', stat: 'defensiveRating' };
    }
  }
  
  // Miscellaneous section
  if (sectionTitle.includes('miscellaneous') || sectionUid.includes('misc')) {
    if (categoryTitle.includes('fast break points per game') || (categoryTitle.includes('fast break points') && !categoryTitle.includes('total'))) {
      return { section: 'miscellaneous', stat: 'fastBreakPointsPerGame' };
    }
    if (categoryTitle.includes('2nd chance points per game') || (categoryTitle.includes('2nd chance points') && !categoryTitle.includes('total'))) {
      return { section: 'miscellaneous', stat: 'secondChancePointsPerGame' };
    }
    if (categoryTitle.includes('points in the paint per game') || (categoryTitle.includes('points in the paint') && !categoryTitle.includes('total'))) {
      return { section: 'miscellaneous', stat: 'pointsInPaintPerGame' };
    }
  }
  
  // Player Tracking - Drives (check UID first for accuracy)
  if (sectionUid.includes('drives') || (sectionTitle.includes('drives') && sectionTitle.includes('tracking'))) {
    if (statName === 'DRIVES' || categoryTitle.includes('drives per game')) {
      return { section: 'trackingDrives', stat: 'drivesPerGame' };
    }
    if (statName === 'DRIVE_POINTS' || categoryTitle.includes('drive points per game')) {
      return { section: 'trackingDrives', stat: 'drivePointsPerGame' };
    }
    if (statName === 'DRIVE_FG_PCT' || categoryTitle.includes('field goal percentage on drives')) {
      return { section: 'trackingDrives', stat: 'fieldGoalPercentageOnDrives' };
    }
  }
  
  // Player Tracking - Shooting (check UID first)
  if (sectionUid.includes('shooting_tracking') || (sectionUid.includes('shooting') && sectionTitle.includes('tracking'))) {
    if (statName === 'PULL_UP_PTS' || categoryTitle.includes('pull up points per game')) {
      return { section: 'trackingShooting', stat: 'pullUpPointsPerGame' };
    }
    if (statName === 'CATCH_SHOOT_PTS' || categoryTitle.includes('catch & shoot points per game') || categoryTitle.includes('catch and shoot points per game')) {
      return { section: 'trackingShooting', stat: 'catchAndShootPointsPerGame' };
    }
    if (statName === 'ELBOW_TOUCH_PTS' || categoryTitle.includes('elbow points per game')) {
      return { section: 'trackingShooting', stat: 'elbowPointsPerGame' };
    }
  }
  
  // Player Tracking - Passing (check UID first)
  if (sectionUid.includes('passing_tracking') || (sectionUid.includes('passing') && sectionTitle.includes('tracking'))) {
    if (statName === 'PASSES_MADE' || categoryTitle.includes('passes per game')) {
      return { section: 'trackingPassing', stat: 'passesPerGame' };
    }
    if (statName === 'AST_POINTS_CREATED' || categoryTitle.includes('points from assists per game')) {
      return { section: 'trackingPassing', stat: 'pointsFromAssistsPerGame' };
    }
    if (statName === 'POTENTIAL_AST' || categoryTitle.includes('potential assists')) {
      return { section: 'trackingPassing', stat: 'potentialAssists' };
    }
  }
  
  // Player Tracking - Speed (check UID first)
  if (sectionUid.includes('speed') || (sectionTitle.includes('speed') && sectionTitle.includes('tracking'))) {
    if (statName === 'PACE' || categoryTitle.includes('pace')) {
      return { section: 'trackingSpeed', stat: 'pace' };
    }
    if (statName === 'DIST_MILES' || categoryTitle.includes('miles per game')) {
      return { section: 'trackingSpeed', stat: 'milesPerGame' };
    }
  }
  
  // Hustle section (check UID first)
  if (sectionUid.includes('hustle') || sectionTitle.includes('hustle')) {
    if (statName === 'DEFLECTIONS' || categoryTitle.includes('deflections per game')) {
      return { section: 'hustle', stat: 'deflectionsPerGame' };
    }
    if (statName === 'LOOSE_BALLS_RECOVERED' || categoryTitle.includes('loose balls rec per game') || categoryTitle.includes('loose balls recovered')) {
      return { section: 'hustle', stat: 'looseBallsRecPerGame' };
    }
    if (statName === 'SCREEN_ASSISTS' || categoryTitle.includes('screen assists per game')) {
      return { section: 'hustle', stat: 'screenAssistsPerGame' };
    }
  }
  
  // Clutch section (check UID first)
  if (sectionUid.includes('clutch') || sectionTitle.includes('clutch')) {
    if (statName === 'W' && categoryTitle.includes('clutch wins')) {
      return { section: 'clutch', stat: 'clutchWins' };
    }
    if (statName === 'FT_PCT' && sectionUid.includes('clutch')) {
      return { section: 'clutch', stat: 'freeThrowPercentage' };
    }
  }
  
  // Tracking sections (fallback)
  if (sectionTitle.includes('tracking') || sectionUid.includes('tracking')) {
    if (categoryTitle.includes('drives')) {
      return { section: 'tracking', stat: 'drives' };
    }
    if (categoryTitle.includes('pull up points')) {
      return { section: 'tracking', stat: 'pullUpPoints' };
    }
    if (categoryTitle.includes('catch & shoot points') || categoryTitle.includes('catch and shoot')) {
      return { section: 'tracking', stat: 'catchAndShootPoints' };
    }
  }
  
  return null;
}

function getStatValue(team, statName) {
  const value = team[statName] || 
                team[statName.toUpperCase()] ||
                team.value ||
                team.statValue ||
                0;
  
  return parseFloat(value) || 0;
}

function createEmptyTeamStats() {
  return {
    seasonLeaders: {
      pointsPerGame: [],
      reboundsPerGame: [],
      assistsPerGame: [],
      blocksPerGame: [],
      stealsPerGame: [],
      fieldGoalPercentage: [],
      threePointPercentage: [],
      freeThrowPercentage: []
    },
    scoring: {
      pctPoints3PT: [],
      pctPointsInPaint: [],
      pctPointsMidRange: []
    },
    bench: {
      totalPoints: [],
      netRating: []
    },
    statsInWins: {
      offensiveRating: [],
      defensiveRating: [],
      effectiveFieldGoalPercentage: []
    },
    regularSeasonTotals: {
      mostPoints: [],
      mostAssists: [],
      mostSteals: [],
      mostBlocks: [],
      mostThreePointers: [],
      mostPostAssists: []
    },
    advanced: {
      netRating: [],
      pace: [],
      offensiveRating: [],
      defensiveRating: []
    },
    miscellaneous: {
      fastBreakPointsPerGame: [],
      secondChancePointsPerGame: [],
      pointsInPaintPerGame: []
    },
    tracking: {
      drives: [],
      pullUpPoints: [],
      catchAndShootPoints: []
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
      potentialAssists: []
    },
    trackingSpeed: {
      pace: [],
      milesPerGame: []
    },
    hustle: {
      deflectionsPerGame: [],
      looseBallsRecPerGame: [],
      screenAssistsPerGame: []
    },
    clutch: {
      clutchWins: [],
      freeThrowPercentage: []
    }
  };
}

function extractTeamStatsFromHTML(document) {
  // Fallback HTML parsing if JSON extraction fails
  console.log('⚠️  HTML parsing not fully implemented - using JSON extraction');
  return createEmptyTeamStats();
}

// Main function to get all team stats
async function getAllTeamStats(limit = 5) {
  try {
    const allStats = await scrapeNBATeamStats();
    
    if (!allStats) {
      console.error('❌ Failed to scrape team stats');
      return null;
    }
    
    // Display the stats
    console.log('\n📊 NBA TEAM STATISTICS\n');
    console.log('='.repeat(70));
    
    // Season Leaders
    if (Object.values(allStats.seasonLeaders).some(arr => arr.length > 0)) {
      console.log('\n\n🏆 SEASON LEADERS');
      console.log('-'.repeat(70));
      
      if (allStats.seasonLeaders.pointsPerGame.length > 0) {
        console.log('\n📈 Points Per Game:');
        allStats.seasonLeaders.pointsPerGame.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value.toFixed(1)} PPG`);
        });
      }
      
      if (allStats.seasonLeaders.reboundsPerGame.length > 0) {
        console.log('\n🏀 Rebounds Per Game:');
        allStats.seasonLeaders.reboundsPerGame.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value.toFixed(1)} RPG`);
        });
      }
      
      if (allStats.seasonLeaders.assistsPerGame.length > 0) {
        console.log('\n🎯 Assists Per Game:');
        allStats.seasonLeaders.assistsPerGame.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value.toFixed(1)} APG`);
        });
      }
      
      if (allStats.seasonLeaders.blocksPerGame.length > 0) {
        console.log('\n🛡️ Blocks Per Game:');
        allStats.seasonLeaders.blocksPerGame.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value.toFixed(1)} BPG`);
        });
      }
      
      if (allStats.seasonLeaders.stealsPerGame.length > 0) {
        console.log('\n⚡ Steals Per Game:');
        allStats.seasonLeaders.stealsPerGame.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value.toFixed(1)} SPG`);
        });
      }
      
      if (allStats.seasonLeaders.fieldGoalPercentage.length > 0) {
        console.log('\n🎯 Field Goal Percentage:');
        allStats.seasonLeaders.fieldGoalPercentage.slice(0, limit).forEach((t, i) => {
          const percentage = t.value < 1 ? (t.value * 100).toFixed(1) : t.value.toFixed(1);
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${percentage}%`);
        });
      }
    }
    
    // Scoring
    if (Object.values(allStats.scoring).some(arr => arr.length > 0)) {
      console.log('\n\n🎯 SCORING');
      console.log('-'.repeat(70));
      
      if (allStats.scoring.pctPoints3PT.length > 0) {
        console.log('\n📊 % of Points 3PT:');
        allStats.scoring.pctPoints3PT.slice(0, limit).forEach((t, i) => {
          const percentage = t.value < 1 ? (t.value * 100).toFixed(1) : t.value.toFixed(1);
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${percentage}%`);
        });
      }
      
      if (allStats.scoring.pctPointsInPaint.length > 0) {
        console.log('\n🎨 % of Points in the Paint:');
        allStats.scoring.pctPointsInPaint.slice(0, limit).forEach((t, i) => {
          const percentage = t.value < 1 ? (t.value * 100).toFixed(1) : t.value.toFixed(1);
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${percentage}%`);
        });
      }
      
      if (allStats.scoring.pctPointsMidRange.length > 0) {
        console.log('\n📐 % of Points Mid-Range:');
        allStats.scoring.pctPointsMidRange.slice(0, limit).forEach((t, i) => {
          const percentage = t.value < 1 ? (t.value * 100).toFixed(1) : t.value.toFixed(1);
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${percentage}%`);
        });
      }
    }
    
    // Regular Season Totals
    if (Object.values(allStats.regularSeasonTotals).some(arr => arr.length > 0)) {
      console.log('\n\n📊 REGULAR SEASON TOTALS');
      console.log('-'.repeat(70));
      
      if (allStats.regularSeasonTotals.mostPoints.length > 0) {
        console.log('\n🔥 Most Points:');
        allStats.regularSeasonTotals.mostPoints.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value} PTS`);
        });
      }
      
      if (allStats.regularSeasonTotals.mostAssists.length > 0) {
        console.log('\n🎯 Most Assists:');
        allStats.regularSeasonTotals.mostAssists.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value} AST`);
        });
      }
      
      if (allStats.regularSeasonTotals.mostSteals.length > 0) {
        console.log('\n⚡ Most Steals:');
        allStats.regularSeasonTotals.mostSteals.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value} STL`);
        });
      }
      
      if (allStats.regularSeasonTotals.mostBlocks.length > 0) {
        console.log('\n🛡️ Most Blocks:');
        allStats.regularSeasonTotals.mostBlocks.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value} BLK`);
        });
      }
      
      if (allStats.regularSeasonTotals.mostThreePointers.length > 0) {
        console.log('\n🏀 Most Three Pointers:');
        allStats.regularSeasonTotals.mostThreePointers.slice(0, limit).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.name.padEnd(30)} ${t.value} 3PT`);
        });
      }
    }
    
    return allStats;
    
  } catch (error) {
    console.error('❌ Error getting team stats:', error.message);
    return null;
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('scrape-nba-team-stats')) {
  getAllTeamStats(5)
    .then((stats) => {
      if (stats) {
        console.log('\n✅ Successfully scraped all NBA team statistics');
      }
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { scrapeNBATeamStats, getAllTeamStats };

