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
const SHEET_NAME = 'NCAAF'; // Sheet 1

// Initialize Google Sheets API
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// ESPN's API endpoint for College Football standings
const ESPN_NCAAF_API = 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings';

// NCAA API endpoint for Top 25 rankings
const NCAA_RANKINGS_API = 'https://ncaa-api.henrygd.me/rankings/football/fbs/associated-press';

// Team name variations mapping for better matching
const TEAM_NAME_VARIATIONS = {
  'james madison': ['james madison', 'jmu', 'james madison dukes'],
  'jmu': ['james madison', 'jmu', 'james madison dukes'],
  'miami (fl)': ['miami (fl)', 'miami', 'miami fl', 'miami florida', 'miami hurricanes'],
  'miami': ['miami (fl)', 'miami', 'miami fl', 'miami florida', 'miami hurricanes'],
  'miami fl': ['miami (fl)', 'miami', 'miami fl', 'miami florida', 'miami hurricanes'],
  'southern california': ['southern california', 'usc', 'usc trojans'],
  'usc': ['southern california', 'usc', 'usc trojans']
};

// Get all variations for a team name
function getTeamNameVariations(name) {
  const normalized = name.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
  for (const [key, variations] of Object.entries(TEAM_NAME_VARIATIONS)) {
    if (variations.includes(normalized)) {
      return variations;
    }
  }
  return [normalized];
}

// Helper function to normalize team names for matching
function normalizeTeamName(name) {
  if (!name) return '';
  // Remove first-place votes like "(54)" or "(11)"
  let normalized = name.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
  
  // Check for known variations
  for (const [key, variations] of Object.entries(TEAM_NAME_VARIATIONS)) {
    if (variations.includes(normalized)) {
      return key; // Return the canonical name
    }
  }
  
  return normalized;
}

// Hardcoded Top 25 rankings (most up-to-date)
const HARDCODED_TOP25 = [
  { rank: 1, team: 'Ohio State', record: '11-0', points: 1640, previous: '' },
  { rank: 2, team: 'Indiana', record: '11-0', points: 1587, previous: '' },
  { rank: 3, team: 'Texas A&M', record: '11-0', points: 1522, previous: '' },
  { rank: 4, team: 'Georgia', record: '10-1', points: 1444, previous: '' },
  { rank: 5, team: 'Oregon', record: '10-1', points: 1326, previous: '' },
  { rank: 6, team: 'Ole Miss', record: '10-1', points: 1320, previous: '' },
  { rank: 7, team: 'Texas Tech', record: '10-1', points: 1295, previous: '' },
  { rank: 8, team: 'Oklahoma', record: '9-2', points: 1169, previous: '' },
  { rank: 9, team: 'Notre Dame', record: '9-2', points: 1117, previous: '' },
  { rank: 10, team: 'Alabama', record: '9-2', points: 1056, previous: '' },
  { rank: 11, team: 'BYU', record: '10-1', points: 1014, previous: '' },
  { rank: 12, team: 'Vanderbilt', record: '9-2', points: 876, previous: '' },
  { rank: 13, team: 'Miami', record: '9-2', points: 849, previous: '' },
  { rank: 14, team: 'Utah', record: '9-2', points: 809, previous: '' },
  { rank: 15, team: 'Michigan', record: '9-2', points: 664, previous: '' },
  { rank: 16, team: 'Texas', record: '8-3', points: 646, previous: '' },
  { rank: 17, team: 'Virginia', record: '9-2', points: 556, previous: '' },
  { rank: 18, team: 'Tennessee', record: '8-3', points: 473, previous: '' },
  { rank: 19, team: 'Southern California', record: '8-3', points: 464, previous: '' },
  { rank: 20, team: 'James Madison', record: '11-1', points: 331, previous: '' },
  { rank: 21, team: 'North Texas', record: '10-1', points: 288, previous: '' },
  { rank: 22, team: 'Tulane', record: '9-2', points: 255, previous: '' },
  { rank: 23, team: 'Georgia Tech', record: '9-2', points: 228, previous: '' },
  { rank: 24, team: 'Pittsburgh', record: '8-3', points: 174, previous: '' },
  { rank: 25, team: 'SMU', record: '8-3', points: 121, previous: '' }
];

// Fetch Top 25 rankings from hardcoded data (overrides API)
async function fetchTop25Rankings() {
  try {
    console.log('Using hardcoded Top 25 rankings...');
    
    const rankingsMap = {};
    
    HARDCODED_TOP25.forEach(item => {
      const teamName = item.team;
      const normalizedName = normalizeTeamName(teamName);
      if (normalizedName) {
        const rankingData = {
          rank: item.rank,
          points: item.points,
          record: item.record,
          previous: item.previous,
          teamName: teamName
        };
        // Store with normalized name
        rankingsMap[normalizedName] = rankingData;
        // Also store with original name variations for better matching
        const originalNormalized = teamName.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
        if (originalNormalized !== normalizedName) {
          rankingsMap[originalNormalized] = rankingData;
        }
        // Store with all known variations for this team
        const teamVariations = getTeamNameVariations(teamName);
        teamVariations.forEach(variation => {
          if (variation !== normalizedName && variation !== originalNormalized) {
            rankingsMap[variation] = rankingData;
          }
        });
      }
    });
    
    console.log(`  Found ${Object.keys(rankingsMap).length} ranked teams from hardcoded data`);
    return rankingsMap;
  } catch (error) {
    console.error('Error processing Top 25 rankings:', error.message);
    return {}; // Return empty map if processing fails
  }
}

async function scrapeNCAAFStandings() {
  try {
    console.log('Fetching NCAAF standings from ESPN API...');
    
    // Fetch Top 25 rankings first
    const rankingsMap = await fetchTop25Rankings();
    
    const response = await axios.get(ESPN_NCAAF_API, {
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
            
            // Parse overall record (format: "W-L" or "W-L-T")
            const overallRecord = getStatValue(11); // "6-0" or "5-2-1"
            const recordParts = overallRecord.split('-');
            const wins = recordParts[0] || '0';
            const losses = recordParts[1] || '0';
            
            // Parse conference record
            const confRecord = getStatValue(59); // "4-0" format
            const confParts = confRecord.split('-');
            const confWins = confParts[0] || '0';
            const confLosses = confParts[1] || '0';
            
            // Try to match with Top 25 rankings
            const normalizedTeamName = normalizeTeamName(mascotName);
            const normalizedFullName = normalizeTeamName(teamName);
            let ranking = null;
            let rankingPoints = null;
            let rankingPrevious = null;
            
            // Get all possible name variations for this team
            const teamVariations = [...new Set([
              ...getTeamNameVariations(mascotName),
              ...getTeamNameVariations(teamName),
              normalizedTeamName,
              normalizedFullName
            ])];
            
            // Try matching by short name first, then full name, then all variations
            for (const variation of teamVariations) {
              if (rankingsMap[variation]) {
                ranking = rankingsMap[variation].rank;
                rankingPoints = rankingsMap[variation].points;
                rankingPrevious = rankingsMap[variation].previous;
                console.log(`  ✓ Matched "${mascotName}" (${variation}) to Top 25 rank ${ranking}`);
                break;
              }
            }
            
            // If still no match, try reverse lookup - check if any ranked team matches this team
            if (!ranking) {
              for (const [rankedTeamName, rankedData] of Object.entries(rankingsMap)) {
                const rankedVariations = getTeamNameVariations(rankedData.teamName);
                for (const teamVar of teamVariations) {
                  if (rankedVariations.includes(teamVar)) {
                    ranking = rankedData.rank;
                    rankingPoints = rankedData.points;
                    rankingPrevious = rankedData.previous;
                    console.log(`  ✓ Matched "${mascotName}" via reverse lookup with "${rankedData.teamName}" (rank ${ranking})`);
                    break;
                  }
                }
                if (ranking) break;
              }
            }
            
            // Special handling for team display names in Top 25
            let displayTeamName = mascotName;
            if (normalizedTeamName === 'james madison' || normalizedFullName === 'james madison' || 
                normalizedTeamName === 'jmu' || normalizedFullName === 'jmu') {
              displayTeamName = 'JMU'; // Display as JMU in Top 25
              // Hard code JMU record as 11-1
              overallRecord = '11-1';
              wins = '11';
              losses = '1';
            }
            
            const teamData = {
              Team: displayTeamName, // Use display name for Top 25
              FullName: teamName,
              OriginalTeam: mascotName, // Keep original for reference
              Conference: conferenceName,
              Wins: wins,
              Losses: losses,
              ConfWins: confWins,
              ConfLosses: confLosses,
              OverallRecord: overallRecord,
              ConfRecord: confRecord,
              Record: overallRecord, // Use overall record for Top 25 display
              Top25Rank: ranking || null,
              Top25Points: rankingPoints || null,
              Top25Previous: rankingPrevious || null,
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.OverallRecord} (${teamData.ConfRecord} conf) - ${teamData.Conference}`);
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
    console.error('Error scraping NCAAF standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

// Save Top 25 rankings to Google Sheets first (from NCAA API directly)
async function saveTop25ToGoogleSheets() {
  try {
    console.log('\n📊 Saving Top 25 rankings to Google Sheets...');
    
    const sheets = await getSheetsClient();
    
    // Use hardcoded Top 25 data
    const top25Teams = HARDCODED_TOP25.map(item => ({
      rank: item.rank,
      team: item.team
    }));
    
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

// Save Top 25 rankings to Firestore (using hardcoded data)
async function saveTop25ToFirestore() {
  try {
    console.log('\n📊 Saving Top 25 rankings to Firestore (using hardcoded data)...');
    
    // Use hardcoded Top 25 data
    const top25Teams = HARDCODED_TOP25.map(item => ({
      rank: item.rank,
      team: item.team,
      points: item.points,
      record: item.record,
      previous: item.previous
    }));
    
    // Write to Firestore
    const collectionRef = db.collection('NCAAFStandings');
    let writeBatch = db.batch();
    let count = 0;
    
    for (const team of top25Teams) {
      // Special handling for team display names
      let teamName = team.team;
      let teamRecord = team.record;
      
      // JMU display name
      if (teamName.toLowerCase().includes('james madison') || teamName.toLowerCase() === 'jmu') {
        teamName = 'JMU';
        teamRecord = '11-1'; // Hard code JMU record
      }
      
      // Miami (FL) display name
      if (teamName.toLowerCase() === 'miami') {
        teamName = 'Miami (FL)';
      }
      
      // USC display name
      if (teamName.toLowerCase().includes('southern california') || teamName.toLowerCase() === 'usc') {
        teamName = 'USC';
      }
      
      const docRef = collectionRef.doc(teamName.replace(/\s+/g, '_'));
      writeBatch.set(docRef, {
        Team: teamName,
        Top25Rank: team.rank,
        Top25Points: team.points,
        Top25Previous: team.previous,
        Record: teamRecord,
        OverallRecord: teamRecord, // Also set OverallRecord
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
    
    const collectionRef = db.collection('NCAAFStandings');
    
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
      const cacheKey = `standings_cache_NCAAF`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared NCAAF standings cache');
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
    const standings = await scrapeNCAAFStandings();
    await saveToFirestore(standings);
    
    console.log('\n✅ NCAAF standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update NCAAF standings');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { scrapeNCAAFStandings };

// Run if called directly
if (require.main === module) {
  main();
}

