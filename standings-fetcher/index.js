// standings-fetcher/index.js - Using FlashLive API
import { DateTime } from 'luxon';
import admin from 'firebase-admin';
import fetch from 'node-fetch';
import express from 'express';

// Firebase Admin initialization
let db;
function initializeFirebase() {
    if (db) return db;
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
    }
    db = admin.firestore();
    console.log('Firebase Firestore initialized.');
    return db;
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

// League/Tournament mappings - we'll discover these dynamically
const LEAGUE_MAPPINGS = {
    // FlashLive API for soccer leagues
    'Premier League': { sport_id: 1, search_name: 'England: Premier League', api: 'flashlive' },
    'LaLiga': { sport_id: 1, search_name: 'Spain: LaLiga', api: 'flashlive' },
    'Serie A': { sport_id: 1, search_name: 'Italy: Serie A', api: 'flashlive' },
    'Bundesliga': { sport_id: 1, search_name: 'Germany: Bundesliga', api: 'flashlive' },
    'Ligue 1': { sport_id: 1, search_name: 'France: Ligue 1', api: 'flashlive' },
    'MLS': { sport_id: 1, search_name: 'USA: MLS', api: 'flashlive' },
    
    // Google Sheets for American sports (reverted)
    'NFL': { api: 'googlesheets', standingsUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0' },
    'MLB': { api: 'googlesheets', standingsUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0' },
};

// Helper: Fetch from RapidAPI with error handling
async function fetchFromAPI(url, headers) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

// Get tournament IDs for a league
async function getTournamentInfo(sport_id, leagueName) {
    const headers = {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
    };
    
    // Try multiple days to find the tournament
    for (let daysBack = 0; daysBack <= 7; daysBack++) {
        const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_id=${sport_id}&locale=en_INT&timezone=-4&indent_days=${-daysBack}`;
        
        try {
            const data = await fetchFromAPI(url, headers);
            const tournaments = data.DATA || [];
            
            // Find the matching tournament
            const tournament = tournaments.find(t => t.NAME === leagueName);
            
            if (tournament) {
                console.log(`✅ Found ${leagueName} in events from ${daysBack} days ago`);
                return {
                    tournamentId: tournament.TOURNAMENT_ID,
                    seasonId: tournament.TOURNAMENT_SEASON_ID,
                    stageId: tournament.TOURNAMENT_STAGE_ID,
                    hasStandings: tournament.STANDING_INFO === 1
                };
            }
        } catch (error) {
            console.log(`Error checking day ${daysBack}:`, error.message);
        }
        
        // Add small delay between date checks
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`❌ Tournament not found after checking 7 days: ${leagueName}`);
    return null;
}

// Google Sheets API functions
async function fetchGoogleSheetsStandings(leagueKey, leagueConfig) {
    try {
        console.log(`Checking cached standings for ${leagueKey}...`);
        
        // Check if we have fresh data in Firestore (less than 24 hours old)
        const standingsDoc = await db.collection('standings').doc(leagueKey).get();
        
        if (standingsDoc.exists) {
            const data = standingsDoc.data();
            const lastUpdated = data.lastUpdated?.toDate();
            const now = new Date();
            const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
            
            if (hoursSinceUpdate < 24) {
                console.log(`✅ ${leagueKey} standings are fresh (${Math.round(hoursSinceUpdate)} hours old), using cached data`);
                return { success: true, teams: data.data?.length || 0, cached: true };
            } else {
                console.log(`⚠️ ${leagueKey} standings are stale (${Math.round(hoursSinceUpdate)} hours old), but Google Sheets sync should handle updates`);
                return { success: true, teams: data.data?.length || 0, cached: true, stale: true };
            }
        } else {
            console.log(`❌ No cached data found for ${leagueKey}. Google Sheets sync should populate this.`);
            return { success: false, error: 'No cached data found. Google Sheets sync should populate this.' };
        }
        
    } catch (error) {
        console.error(`❌ Error checking cached standings for ${leagueKey}:`, error);
        return { success: false, error: error.message };
    }
}

// ESPN API functions (kept for reference but not used)
async function fetchESPNStandings(leagueKey, leagueConfig) {
    try {
        console.log(`Fetching ESPN standings for ${leagueKey}...`);
        
        // Get the standings URL for ESPN
        const standingsUrl = `http://sports.core.api.espn.com/v2/sports/${leagueConfig.sport}/leagues/${leagueConfig.league}/seasons/2025/types/2/groups/9/standings/0?lang=en&region=us`;
        
        const response = await fetch(standingsUrl);
        if (!response.ok) {
            throw new Error(`ESPN API error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.standings) {
            throw new Error('No standings data found in ESPN response');
        }
        
        // Parse ESPN standings data
        const allRows = [];
        const standings = data.standings;
        
        // ESPN data is organized by numbered keys (0-31 for NFL, 0-29 for MLB)
        for (const key of Object.keys(standings)) {
            const teamData = standings[key];
            if (teamData.team && teamData.records && teamData.records[0]) {
                const overallRecord = teamData.records[0];
                
                // Extract stats from the overall record
                const stats = {};
                if (overallRecord.stats) {
                    overallRecord.stats.forEach(stat => {
                        stats[stat.name] = stat.value;
                    });
                }
                
                // Fetch team details to get the actual team name
                let teamName = `Team ${key}`;
                try {
                    const teamResponse = await fetch(teamData.team.$ref);
                    if (teamResponse.ok) {
                        const teamDetails = await teamResponse.json();
                        teamName = teamDetails.displayName || teamDetails.name || teamName;
                    }
                } catch (teamError) {
                    console.warn(`Could not fetch team details for ${teamData.team.$ref}:`, teamError.message);
                }
                
                // Determine if this is a soccer league (has draws) or US sport (no draws)
                const isSoccerLeague = leagueKey === 'MLS';
                
                allRows.push({
                    Rank: stats.playoffSeed || parseInt(key) + 1,
                    Team: teamName,
                    TeamId: teamData.team.$ref.split('/').pop(),
                    MatchesPlayed: stats.gamesPlayed || 0,
                    Wins: stats.wins || 0,
                    Losses: stats.losses || 0,
                    Draws: isSoccerLeague ? (stats.ties || 0) : 0, // Only soccer has draws
                    Goals: isSoccerLeague ? `${stats.pointsFor || 0}:${stats.pointsAgainst || 0}` : '',
                    Points: stats.points || 0,
                    Group: null,
                    Conference: null,
                    Division: null,
                    TeamImage: '',
                    DynamicColumns: [],
                    // ESPN specific fields
                    WinPercent: stats.winPercent || 0,
                    GamesBehind: stats.gamesBehind || 0,
                    Streak: stats.streak || 0
                });
            }
        }
        
        // Sort by rank
        allRows.sort((a, b) => a.Rank - b.Rank);
        
        // Store in Firestore
        await db.collection('standings').doc(leagueKey).set({
            data: allRows,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            season: '2025',
            league: leagueKey,
            source: 'ESPN API',
            apiType: 'espn'
        });
        
        console.log(`✅ ${leagueKey} ESPN standings updated: ${allRows.length} teams`);
        return { success: true, teams: allRows.length };
        
    } catch (error) {
        console.error(`❌ Error fetching ESPN standings for ${leagueKey}:`, error);
        return { success: false, error: error.message };
    }
}

// Fetch standings for a specific league
async function fetchStandingsForLeague(leagueKey, leagueConfig) {
    console.log(`\nFetching standings for ${leagueKey}...`);
    
    try {
        // Route to appropriate API
        if (leagueConfig.api === 'googlesheets') {
            return await fetchGoogleSheetsStandings(leagueKey, leagueConfig);
        }
        
        if (leagueConfig.api === 'espn') {
            return await fetchESPNStandings(leagueKey, leagueConfig);
        }
        
        // FlashLive API (default)
        // Step 1: Get tournament info
        const tournamentInfo = await getTournamentInfo(leagueConfig.sport_id, leagueConfig.search_name);
        
        if (!tournamentInfo) {
            return { success: false, error: `Tournament not found: ${leagueConfig.search_name}` };
        }
        
        if (!tournamentInfo.hasStandings) {
            return { success: false, error: `No standings available for ${leagueKey}` };
        }
        
        // Step 2: Fetch standings
        const standingsUrl = `https://${RAPIDAPI_HOST}/v1/tournaments/standings?tournament_id=${tournamentInfo.tournamentId}&tournament_season_id=${tournamentInfo.seasonId}&tournament_stage_id=${tournamentInfo.stageId}&standing_type=overall&locale=en_INT`;
        
        const headers = {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        };
        
        const standingsData = await fetchFromAPI(standingsUrl, headers);
        
        // Step 3: Format the data
        const allRows = [];
        const seenTeams = new Set(); // Track teams to avoid duplicates
        const groups = standingsData.DATA || [];
        
        groups.forEach(group => {
            (group.ROWS || []).forEach(row => {
                const teamName = row.TEAM_NAME || '';
                const teamId = row.TEAM_ID || '';
                
                // Skip duplicate teams (use team ID as unique identifier)
                if (seenTeams.has(teamId)) {
                    return;
                }
                seenTeams.add(teamId);
                
                // Parse Conference and Division from team name or group
                let conference = null;
                let division = null;
                
                // For NFL: extract from team name (e.g., "Buffalo Bills" -> AFC East)
                if (leagueKey === 'NFL') {
                    const nflTeamMap = {
                        // AFC East
                        'Buffalo Bills': { conference: 'AFC', division: 'East' },
                        'Miami Dolphins': { conference: 'AFC', division: 'East' },
                        'New England Patriots': { conference: 'AFC', division: 'East' },
                        'New York Jets': { conference: 'AFC', division: 'East' },
                        // AFC North
                        'Baltimore Ravens': { conference: 'AFC', division: 'North' },
                        'Cincinnati Bengals': { conference: 'AFC', division: 'North' },
                        'Cleveland Browns': { conference: 'AFC', division: 'North' },
                        'Pittsburgh Steelers': { conference: 'AFC', division: 'North' },
                        // AFC South
                        'Houston Texans': { conference: 'AFC', division: 'South' },
                        'Indianapolis Colts': { conference: 'AFC', division: 'South' },
                        'Jacksonville Jaguars': { conference: 'AFC', division: 'South' },
                        'Tennessee Titans': { conference: 'AFC', division: 'South' },
                        // AFC West
                        'Denver Broncos': { conference: 'AFC', division: 'West' },
                        'Kansas City Chiefs': { conference: 'AFC', division: 'West' },
                        'Las Vegas Raiders': { conference: 'AFC', division: 'West' },
                        'Los Angeles Chargers': { conference: 'AFC', division: 'West' },
                        // NFC East
                        'Dallas Cowboys': { conference: 'NFC', division: 'East' },
                        'New York Giants': { conference: 'NFC', division: 'East' },
                        'Philadelphia Eagles': { conference: 'NFC', division: 'East' },
                        'Washington Commanders': { conference: 'NFC', division: 'East' },
                        // NFC North
                        'Chicago Bears': { conference: 'NFC', division: 'North' },
                        'Detroit Lions': { conference: 'NFC', division: 'North' },
                        'Green Bay Packers': { conference: 'NFC', division: 'North' },
                        'Minnesota Vikings': { conference: 'NFC', division: 'North' },
                        // NFC South
                        'Atlanta Falcons': { conference: 'NFC', division: 'South' },
                        'Carolina Panthers': { conference: 'NFC', division: 'South' },
                        'New Orleans Saints': { conference: 'NFC', division: 'South' },
                        'Tampa Bay Buccaneers': { conference: 'NFC', division: 'South' },
                        // NFC West
                        'Arizona Cardinals': { conference: 'NFC', division: 'West' },
                        'Los Angeles Rams': { conference: 'NFC', division: 'West' },
                        'San Francisco 49ers': { conference: 'NFC', division: 'West' },
                        'Seattle Seahawks': { conference: 'NFC', division: 'West' }
                    };
                    const teamInfo = nflTeamMap[teamName];
                    if (teamInfo) {
                        conference = teamInfo.conference;
                        division = teamInfo.division;
                    }
                } else if (leagueKey === 'MLB') {
                    const mlbTeamMap = {
                        // AL East
                        'Baltimore Orioles': { conference: 'American', division: 'East' },
                        'Boston Red Sox': { conference: 'American', division: 'East' },
                        'New York Yankees': { conference: 'American', division: 'East' },
                        'Tampa Bay Rays': { conference: 'American', division: 'East' },
                        'Toronto Blue Jays': { conference: 'American', division: 'East' },
                        // AL Central
                        'Chicago White Sox': { conference: 'American', division: 'Central' },
                        'Cleveland Guardians': { conference: 'American', division: 'Central' },
                        'Detroit Tigers': { conference: 'American', division: 'Central' },
                        'Kansas City Royals': { conference: 'American', division: 'Central' },
                        'Minnesota Twins': { conference: 'American', division: 'Central' },
                        // AL West
                        'Houston Astros': { conference: 'American', division: 'West' },
                        'Los Angeles Angels': { conference: 'American', division: 'West' },
                        'Oakland Athletics': { conference: 'American', division: 'West' },
                        'Athletics': { conference: 'American', division: 'West' },
                        'Seattle Mariners': { conference: 'American', division: 'West' },
                        'Texas Rangers': { conference: 'American', division: 'West' },
                        // NL East
                        'Atlanta Braves': { conference: 'National', division: 'East' },
                        'Miami Marlins': { conference: 'National', division: 'East' },
                        'New York Mets': { conference: 'National', division: 'East' },
                        'Philadelphia Phillies': { conference: 'National', division: 'East' },
                        'Washington Nationals': { conference: 'National', division: 'East' },
                        // NL Central
                        'Chicago Cubs': { conference: 'National', division: 'Central' },
                        'Cincinnati Reds': { conference: 'National', division: 'Central' },
                        'Milwaukee Brewers': { conference: 'National', division: 'Central' },
                        'Pittsburgh Pirates': { conference: 'National', division: 'Central' },
                        'St. Louis Cardinals': { conference: 'National', division: 'Central' },
                        // NL West
                        'Arizona Diamondbacks': { conference: 'National', division: 'West' },
                        'Colorado Rockies': { conference: 'National', division: 'West' },
                        'Los Angeles Dodgers': { conference: 'National', division: 'West' },
                        'San Diego Padres': { conference: 'National', division: 'West' },
                        'San Francisco Giants': { conference: 'National', division: 'West' }
                    };
                    const teamInfo = mlbTeamMap[teamName];
                    if (teamInfo) {
                        conference = teamInfo.conference;
                        division = teamInfo.division;
                    }
                }
                
                allRows.push({
                    Rank: row.RANKING || 0,
                    Team: teamName,
                    TeamId: row.TEAM_ID || '',
                    MatchesPlayed: row.MATCHES_PLAYED || 0,
                    Wins: row.WINS || 0,
                    Losses: row.LOSSES || 0,
                    Draws: row.DRAWS || 0,
                    Goals: row.GOALS || '', // Format: "15:8" (scored:conceded)
                    Points: row.POINTS || 0,
                    Group: group.GROUP || null,
                    Conference: conference,
                    Division: division,
                    TeamImage: row.TEAM_IMAGE_PATH || '',
                    DynamicColumns: row.DYNAMIC_COLUMNS_DATA || []
                });
            });
        });
        
        // Step 4: Store in Firestore
        await db.collection('standings').doc(leagueKey).set({
            data: allRows,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            season: '2025',
            league: leagueKey,
            source: 'FlashLive API',
            tournamentInfo: {
                name: leagueConfig.search_name,
                tournamentId: tournamentInfo.tournamentId,
                seasonId: tournamentInfo.seasonId,
                stageId: tournamentInfo.stageId
            }
        });
        
        console.log(`✅ ${leagueKey} standings updated: ${allRows.length} teams`);
        return { success: true, teams: allRows.length };
        
    } catch (error) {
        console.error(`❌ Error fetching ${leagueKey} standings:`, error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// MAIN HANDLER
// ============================================

const fetchAllStandingsHandler = async (req, res) => {
    try {
        console.log('='.repeat(60));
        console.log('--- Fetch All Standings Started ---');
        console.log(`Time: ${DateTime.now().setZone('America/New_York').toISO()}`);
        console.log('='.repeat(60));
        
        initializeFirebase();
        
        const results = {
            timestamp: DateTime.now().setZone('America/New_York').toISO(),
            leagues: {}
        };
        
        // Fetch standings for each league
        for (const [leagueKey, leagueConfig] of Object.entries(LEAGUE_MAPPINGS)) {
            results.leagues[leagueKey] = await fetchStandingsForLeague(leagueKey, leagueConfig);
            
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Calculate summary
        const totalLeagues = Object.keys(results.leagues).length;
        const successful = Object.values(results.leagues).filter(r => r.success).length;
        const failed = Object.values(results.leagues).filter(r => !r.success).length;
        const totalApiCalls = successful * 2; // 2 calls per league (events list + standings)
        
        console.log('\n' + '='.repeat(60));
        console.log('=== Standings Update Complete ===');
        console.log(`Total Leagues: ${totalLeagues}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total API calls made: ${totalApiCalls}`);
        console.log('='.repeat(60));
        
        res.status(200).json({
            message: 'Standings update completed',
            totalApiCalls: totalApiCalls,
            summary: {
                total: totalLeagues,
                successful,
                failed
            },
            results: results
        });
        
    } catch (error) {
        console.error('Error in fetchAllStandingsHandler:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// EXPRESS SERVER
// ============================================

const app = express();
app.use(express.json());

app.post('/updateStandings', fetchAllStandingsHandler);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Standings Fetcher Service (FlashLive API) - Ready');
});

// Test single league endpoint
app.get('/test/:leagueKey', async (req, res) => {
    try {
        initializeFirebase();
        const { leagueKey } = req.params;
        const leagueConfig = LEAGUE_MAPPINGS[leagueKey];
        
        if (!leagueConfig) {
            return res.status(404).json({ 
                error: 'League not found',
                availableLeagues: Object.keys(LEAGUE_MAPPINGS)
            });
        }
        
        const result = await fetchStandingsForLeague(leagueKey, leagueConfig);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Standings Fetcher listening on port ${PORT}`);
    console.log(`Using FlashLive API at ${RAPIDAPI_HOST}`);
});
