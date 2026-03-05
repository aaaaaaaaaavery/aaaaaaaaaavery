const axios = require('axios');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize Firebase Admin (reuse existing credentials)
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Google Sheets configuration
const TOP25_SPREADSHEET_ID = '1IoUR6NrMU6HtEu0tr8rxiZg3CDJCTxZ1k4xxL_ZENsw';
const SHEET_NAME = 'NCAAW'; // Sheet 3

// Initialize Google Sheets API
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// ESPN's API endpoint for Women's College Basketball standings
const ESPN_NCAAW_API = 'https://site.api.espn.com/apis/v2/sports/basketball/womens-college-basketball/standings';

// NCAA API endpoint for Top 25 rankings
const NCAA_RANKINGS_API = 'https://ncaa-api.henrygd.me/rankings/basketball-women/d1/associated-press';

// Helper function to normalize team names for matching
function normalizeTeamName(name) {
  if (!name) return '';
  // Remove first-place votes like "(35)" or "(16)"
  return name.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
}

// Fetch Top 25 rankings from NCAA API
async function fetchTop25Rankings() {
  try {
    console.log('Fetching Top 25 rankings from NCAA API...');
    const response = await axios.get(NCAA_RANKINGS_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const rankingsMap = {};
    if (response.data && response.data.data) {
      response.data.data.forEach(item => {
        const rank = item.RANKING || item.RANK;
        const teamName = item.TEAM || item.SCHOOL || item['SCHOOL (1ST VOTES)'] || '';
        const normalizedName = normalizeTeamName(teamName);
        if (normalizedName && rank) {
          rankingsMap[normalizedName] = {
            rank: rank,
            points: item.POINTS || '',
            teamName: teamName
          };
        }
      });
      console.log(`  Found ${Object.keys(rankingsMap).length} ranked teams`);
    }
    return rankingsMap;
  } catch (error) {
    console.error('Error fetching Top 25 rankings:', error.message);
    return {}; // Return empty map if rankings fetch fails
  }
}

async function scrapeNCAAWStandings() {
  try {
    console.log('Fetching NCAAW standings from ESPN API...');
    
    // Fetch Top 25 rankings first
    const rankingsMap = await fetchTop25Rankings();
    
    const response = await axios.get(ESPN_NCAAW_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // ESPN API returns standings organized by conferences
    if (data && data.children) {
      for (const conference of data.children) {
        const conferenceName = conference.name;
        
        if (conference.standings && conference.standings.entries) {
          for (const entry of conference.standings.entries) {
            const team = entry.team;
            const stats = entry.stats;
            
            // Extract team name
            const teamName = team.displayName || team.name;
            const mascotName = team.shortDisplayName || team.name;
            
            // Extract stats
            const getStatValue = (statIndex) => {
              return stats[statIndex] ? stats[statIndex].displayValue : '0';
            };
            
            // For college basketball, the stats structure is:
            // Index 12: overall record (name="overall", displayValue="W-L")
            // Index 77: conference record (name="vs. Conf.", displayValue="W-L")
            // Index 11: wins (individual)
            // Index 4: losses (individual)
            
            // Get overall record from index 12
            const overallRecord = getStatValue(12) || '0-0';
            const recordParts = overallRecord.split('-');
            const wins = recordParts[0] || '0';
            const losses = recordParts[1] || '0';
            
            // Get conference record from index 77
            const confRecord = getStatValue(77) || '0-0';
            const confParts = confRecord.split('-');
            const confWins = confParts[0] || '0';
            const confLosses = confParts[1] || '0';
            
            // Try to match with Top 25 rankings
            const normalizedTeamName = normalizeTeamName(mascotName);
            const normalizedFullName = normalizeTeamName(teamName);
            let ranking = null;
            let rankingPoints = null;
            
            // Try matching by short name first, then full name
            if (rankingsMap[normalizedTeamName]) {
              ranking = rankingsMap[normalizedTeamName].rank;
              rankingPoints = rankingsMap[normalizedTeamName].points;
            } else if (rankingsMap[normalizedFullName]) {
              ranking = rankingsMap[normalizedFullName].rank;
              rankingPoints = rankingsMap[normalizedFullName].points;
            }
            
            const teamData = {
              Team: mascotName,
              FullName: teamName,
              Conference: conferenceName,
              Wins: wins,
              Losses: losses,
              ConfWins: confWins,
              ConfLosses: confLosses,
              OverallRecord: overallRecord,
              ConfRecord: confRecord,
              Top25Rank: ranking || null,
              Top25Points: rankingPoints || null,
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Wins}-${teamData.Losses} (${teamData.ConfWins}-${teamData.ConfLosses} conf) - ${teamData.Conference}`);
          }
        }
      }
      
      // Sort standings by conference, then by wins (descending), then by losses (ascending)
      standings.sort((a, b) => {
        // First sort by conference
        if (a.Conference !== b.Conference) {
          return a.Conference.localeCompare(b.Conference);
        }
        // Then by wins (higher wins first)
        const winsA = parseInt(a.Wins) || 0;
        const winsB = parseInt(b.Wins) || 0;
        if (winsA !== winsB) {
          return winsB - winsA;
        }
        // Then by losses (fewer losses first)
        const lossesA = parseInt(a.Losses) || 0;
        const lossesB = parseInt(b.Losses) || 0;
        return lossesA - lossesB;
      });
      
      // Log conferences
      console.log('\nStandings by Conference:');
      let currentConference = '';
      standings.forEach(team => {
        if (team.Conference !== currentConference) {
          currentConference = team.Conference;
          console.log(`\n${currentConference}:`);
        }
        console.log(`  ${team.Team}: ${team.OverallRecord} (${team.ConfRecord})`);
      });
    }
    
    console.log(`\nScraped ${standings.length} teams`);
    
    return standings;
    
  } catch (error) {
    console.error('Error scraping NCAAW standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Save Top 25 rankings to Google Sheets first (from NCAA API directly)
async function saveTop25ToGoogleSheets() {
  try {
    console.log('\n📊 Saving Top 25 rankings to Google Sheets...');
    
    const sheets = await getSheetsClient();
    
    // Fetch Top 25 rankings directly from NCAA API
    const response = await axios.get(NCAA_RANKINGS_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const top25Teams = [];
    if (response.data && response.data.data) {
      response.data.data.forEach(item => {
        const rank = item.RANKING || item.RANK;
        let teamName = item.TEAM || item.SCHOOL || item['SCHOOL (1ST VOTES)'] || '';
        // Remove first-place votes in parentheses (e.g., "Team Name (35)" -> "Team Name")
        if (teamName) {
          teamName = teamName.replace(/\s*\(\d+\)\s*$/, '').trim();
        }
        if (teamName && rank) {
          top25Teams.push({
            rank: rank,
            team: teamName
          });
        }
      });
    }
    
    // Sort by rank to ensure order
    top25Teams.sort((a, b) => {
      const rankA = parseInt(a.rank) || 999;
      const rankB = parseInt(b.rank) || 999;
      return rankA - rankB;
    });
    
    // Prepare data for Google Sheets (only Rank and Team - user will adjust team names)
    const sheetHeader = ['Rank', 'Team'];
    const sheetRows = top25Teams.map(team => [
      team.rank || '',
      team.team || ''
    ]);
    
    // Write to Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: TOP25_SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [sheetHeader, ...sheetRows]
      }
    });
    
    console.log(`✅ Successfully wrote ${top25Teams.length} Top 25 teams to Google Sheets (${SHEET_NAME} tab)`);
    
    return top25Teams; // Return the teams for Firestore saving
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    throw error;
  }
}

// Save Top 25 rankings to Firestore (from NCAA API directly)
async function saveTop25ToFirestore() {
  try {
    console.log('\n📊 Saving Top 25 rankings to Firestore...');
    
    // Fetch Top 25 rankings directly from NCAA API
    const response = await axios.get(NCAA_RANKINGS_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const top25Teams = [];
    if (response.data && response.data.data) {
      response.data.data.forEach(item => {
        const rank = item.RANKING || item.RANK;
        let teamName = item.TEAM || item.SCHOOL || item['SCHOOL (1ST VOTES)'] || '';
        // Remove first-place votes in parentheses (e.g., "Team Name (35)" -> "Team Name")
        if (teamName) {
          teamName = teamName.replace(/\s*\(\d+\)\s*$/, '').trim();
        }
        if (teamName && rank) {
          top25Teams.push({
            rank: parseInt(rank) || null,
            team: teamName,
            points: item.POINTS || null
          });
        }
      });
    }
    
    // Sort by rank to ensure order
    top25Teams.sort((a, b) => {
      const rankA = parseInt(a.rank) || 999;
      const rankB = parseInt(b.rank) || 999;
      return rankA - rankB;
    });
    
    // Write to Firestore
    const collectionRef = db.collection('NCAAWStandings');
    let writeBatch = db.batch();
    let count = 0;
    
    for (const team of top25Teams) {
      const docRef = collectionRef.doc(team.team.replace(/\s+/g, '_'));
      writeBatch.set(docRef, {
        Team: team.team,
        Top25Rank: team.rank,
        Top25Points: team.points,
        lastUpdated: new Date().toISOString()
      }, { merge: true }); // Use merge to preserve existing data
      count++;
      
      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await writeBatch.commit();
        writeBatch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % 500 !== 0) {
      await writeBatch.commit();
    }
    
    console.log(`✅ Successfully saved ${count} Top 25 teams to Firestore`);
    
  } catch (error) {
    console.error('Error saving Top 25 to Firestore:', error);
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('NCAAWStandings');
    
    // Add new data (use merge to preserve Top 25 data)
    let writeBatch = db.batch();
    let count = 0;
    
    for (const team of standings) {
      const docRef = collectionRef.doc(team.Team.replace(/\s+/g, '_'));
      writeBatch.set(docRef, {
        ...team,
        lastUpdated: new Date().toISOString()
      }, { merge: true }); // Use merge to preserve Top 25 data
      count++;
      
      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await writeBatch.commit();
        writeBatch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % 500 !== 0) {
      await writeBatch.commit();
    }
    
    console.log(`Successfully saved ${count} teams to Firestore`);
    
    // Clear cache for this league (if running in browser context)
    if (typeof localStorage !== 'undefined') {
      const cacheKey = `standings_cache_NCAAW`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared NCAAW standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    // Save Top 25 to Google Sheets first (from NCAA API directly)
    await saveTop25ToGoogleSheets();
    
    // Save Top 25 to Firestore (from NCAA API directly)
    await saveTop25ToFirestore();
    
    // Then scrape standings and save to Firestore
    const standings = await scrapeNCAAWStandings();
    await saveToFirestore(standings);
    
    console.log('\n✅ NCAAW standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update NCAAW standings');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { scrapeNCAAWStandings };

// Run if called directly
if (require.main === module) {
  main();
}

