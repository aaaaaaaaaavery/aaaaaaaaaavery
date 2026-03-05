// future_index.js
// Fetches games from ESPN and NCAA APIs for the next 6 days (not today)
// Writes to sportsGamesFuture collection in Firestore
import { DateTime } from 'luxon';
import admin from 'firebase-admin';
import fetch from 'node-fetch';

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

// Helper function to fetch rankings from NCAA API
async function fetchNCAARankings(leagueKey) {
  try {
    let apiUrl;
    if (leagueKey === 'NCAAM') {
      apiUrl = 'https://ncaa-api.henrygd.me/rankings/basketball-men/d1/associated-press';
    } else if (leagueKey === 'NCAAW') {
      apiUrl = 'https://ncaa-api.henrygd.me/rankings/basketball-women/d1/associated-press';
    } else if (leagueKey === 'NCAAF') {
      apiUrl = 'https://ncaa-api.henrygd.me/rankings/football/fbs/associated-press';
    } else {
      return {};
    }
    
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!response.ok) {
      console.warn(`[NCAA Rankings] Failed to fetch rankings for ${leagueKey}: HTTP ${response.status}`);
      return {};
    }
    
    const data = await response.json();
    const rankingsMap = {};
    
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach(item => {
        const rank = item.RANKING || item.RANK;
        let teamName = item.TEAM || item.SCHOOL || item['SCHOOL (1ST VOTES)'] || '';
        if (teamName) {
          teamName = teamName.replace(/\s*\(\d+\)\s*$/, '').trim();
        }
        if (teamName && rank) {
          const normalizedName = teamName.toLowerCase().trim();
          rankingsMap[normalizedName] = parseInt(rank) || null;
        }
      });
    }
    
    return rankingsMap;
  } catch (error) {
    console.error(`[NCAA Rankings] Error fetching rankings for ${leagueKey}:`, error.message);
    return {};
  }
}

// Main function to fetch future games
async function fetchFutureGames() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Future Games Fetcher started');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
  
  const db = initializeFirebase();
  const gamesRef = db.collection('sportsGamesFuture');
  
  // Get dates for next 6 days (not today)
  // Assuming today is 1/22/2026, fetch for 1/23, 1/24, 1/25, 1/26, 1/27, 1/28
  const nowInMountain = DateTime.now().setZone('America/Denver');
  const datesToFetch = [];
  
  for (let i = 1; i <= 6; i++) {
    const futureDate = nowInMountain.plus({ days: i });
    datesToFetch.push({
      isoDate: futureDate.toISODate(),
      espnDate: futureDate.toFormat('yyyyMMdd'),
      ncaaDate: futureDate.toFormat('yyyy/MM/dd')
    });
  }
  
  console.log(`[Future Games] Fetching games for dates: ${datesToFetch.map(d => d.isoDate).join(', ')}`);
  
  // Mapping from ESPN league names to display names
  const ESPN_LEAGUE_DISPLAY_NAME_MAP = {
    'NFL': 'USA: NFL',
    'NCAAF': 'USA: NCAA',
    'NBA': 'USA: NBA',
    'WNBA': 'USA: WNBA',
    'MLB': 'USA: MLB',
    'NHL': 'USA: NHL',
    'MLS': 'USA: MLS',
    'NWSL': 'USA: NWSL Women',
    'Premier League': 'England: Premier League',
    'La Liga': 'Spain: LaLiga',
    'Bundesliga': 'Germany: Bundesliga',
    'Serie A': 'Italy: Serie A',
    'Ligue 1': 'France: Ligue 1',
    'Eredivisie': 'Netherlands: Eredivisie',
    'Liga Portugal': 'Portugal: Liga Portugal',
    'Belgian Pro League': 'Belgium: Jupiler Pro League',
    'Scottish Premiership': 'Scotland: Premiership',
    'Brasileirao': 'Brazil: Serie A Betano',
    'EFL Championship': 'England: Championship',
    'EFL League One': 'England: League One',
    'EFL League Two': 'England: League Two',
    'National League': 'England: National League',
    'LaLiga 2': 'Spain: LaLiga 2',
    '2. Bundesliga': 'Germany: 2. Bundesliga',
    'Serie B': 'Italy: Serie B',
    'Ligue 2': 'Ligue 2',
    'UEFA Champions League': 'UEFA Champions League',
    'AFC Champions League': 'Asia: AFC Elite',
    'UEFA Europa League': 'Europa League',
    'UEFA Conference League': 'Conference League',
    'UEFA Nations League': 'UEFA Nations League',
    'CAF Nations League': 'CAF Nations League',
    'FA Cup': 'England: FA Cup',
    'Carabao Cup': 'England: EFL Cup',
    'Copa del Rey': 'Spain: Copa del Rey',
    'Coppa Italia': 'Italy: Coppa Italia',
    'Italian Super Cup': 'Italian Super Cup',
    'DFB-Pokal': 'Germany: DFB Pokal',
    'Coupe de France': 'France: Coupe de France',
    'Trofeo de Campeones': 'Trofeo de Campeones',
    'Taça de Portugal': 'Taça de Portugal',
    'Saudi Pro League': 'Saudi Arabia: Saudi Professional League',
    'Liga MX': 'Mexico: Liga MX',
    'Japanese J.League': 'Japan: J.League',
    'Chinese Super League': 'China: Super League',
    'Australian A-League Men': 'Australia: A-League Men',
    'Turkish Super Lig': 'Turkey: Super Lig',
    'Greek Super League': 'Greece: Super League',
    'Russian Premier League': 'Russia: Premier League',
    'Gambrinus Liga': 'Czech Republic: Gambrinus Liga',
    'Austrian Bundesliga': 'Austria: Bundesliga',
    'Swiss Super League': 'Switzerland: Super League',
    'Danish Superliga': 'Denmark: Superliga',
    'Swedish Allsvenskan': 'Sweden: Allsvenskan',
    'Norwegian Eliteserien': 'Norway: Eliteserien',
    'Finnish Veikkausliga': 'Finland: Veikkausliga',
    'ATP': 'ATP',
    'WTA': 'WTA',
    'PGA Tour': 'PGA Tour',
    'LPGA Tour': 'LPGA Tour',
    'PGA Champions': 'PGA Champions',
    'LIV Golf': 'LIV Golf',
    'DP World Tour': 'DP World Tour',
    'Korn Ferry': 'Korn Ferry',
    'Formula 1': 'Formula 1',
    'NASCAR Truck Series': 'NASCAR Truck Series',
    'UFC': 'UFC',
    'Bellator': 'Bellator',
    'Boxing': 'Boxing',
    'NCAA Women\'s Volleyball': 'NCAA Women\'s Volleyball',
    'NCAAM': 'USA: NCAA',
    'NCAAW': 'USA: NCAA Women'
  };
  
  // ESPN API leagues configuration (same as index.js)
  const ESPN_LEAGUES = [
    // American Football
    { sport: 'football', league: 'nfl', leagueName: 'NFL' },
    { sport: 'football', league: 'college-football', leagueName: 'NCAAF' },
    
    // Basketball
    { sport: 'basketball', league: 'nba', leagueName: 'NBA' },
    { sport: 'basketball', league: 'wnba', leagueName: 'WNBA' },
    
    // Baseball
    { sport: 'baseball', league: 'mlb', leagueName: 'MLB' },
    
    // Hockey
    { sport: 'hockey', league: 'nhl', leagueName: 'NHL' },
    
    // Soccer - Major Leagues
    { sport: 'soccer', league: 'usa.1', leagueName: 'MLS' },
    { sport: 'soccer', league: 'usa.nwsl', leagueName: 'NWSL' },
    { sport: 'soccer', league: 'eng.1', leagueName: 'Premier League' },
    { sport: 'soccer', league: 'esp.1', leagueName: 'La Liga' },
    { sport: 'soccer', league: 'ger.1', leagueName: 'Bundesliga' },
    { sport: 'soccer', league: 'ita.1', leagueName: 'Serie A' },
    { sport: 'soccer', league: 'fra.1', leagueName: 'Ligue 1' },
    { sport: 'soccer', league: 'ned.1', leagueName: 'Eredivisie' },
    { sport: 'soccer', league: 'por.1', leagueName: 'Liga Portugal' },
    { sport: 'soccer', league: 'bel.1', leagueName: 'Belgian Pro League' },
    { sport: 'soccer', league: 'sco.1', leagueName: 'Scottish Premiership' },
    { sport: 'soccer', league: 'arg.1', leagueName: 'Argentine Primera' },
    { sport: 'soccer', league: 'bra.1', leagueName: 'Brasileirao' },
    { sport: 'soccer', league: 'eng.2', leagueName: 'EFL Championship' },
    
    // Soccer - Additional Leagues
    { sport: 'soccer', league: 'ksa.1', leagueName: 'Saudi Pro League' },
    { sport: 'soccer', league: 'mex.1', leagueName: 'Liga MX' },
    { sport: 'soccer', league: 'tur.1', leagueName: 'Turkish Super Lig' },
    
    // Soccer - UEFA Competitions
    { sport: 'soccer', league: 'uefa.champions', leagueName: 'UEFA Champions League' },
    { sport: 'soccer', league: 'uefa.europa', leagueName: 'UEFA Europa League' },
    { sport: 'soccer', league: 'uefa.europa.conf', leagueName: 'UEFA Conference League' },
    { sport: 'soccer', league: 'uefa.nations', leagueName: 'UEFA Nations League' },
    { sport: 'soccer', league: 'uefa.euroq', leagueName: 'UEFA Euro Qualifiers' },
    { sport: 'soccer', league: 'uefa.wchampions', leagueName: 'UEFA Women\'s Champions League' },
    
    // Soccer - CAF Competitions
    { sport: 'soccer', league: 'caf.nations', leagueName: 'CAF Nations League' },
    { sport: 'soccer', league: 'caf.nations_qual', leagueName: 'CAF Nations League Qualifiers' },
    
    // Soccer - CONMEBOL Competitions
    { sport: 'soccer', league: 'conmebol.libertadores', leagueName: 'Copa Libertadores' },
    
    // Soccer - AFC Competitions
    { sport: 'soccer', league: 'afc.asian.cup', leagueName: 'AFC Asian Cup' },
    { sport: 'soccer', league: 'afc.champions', leagueName: 'AFC Champions League' },
    
    // Soccer - CONCACAF Competitions
    { sport: 'soccer', league: 'concacaf.nations.league', leagueName: 'CONCACAF Nations League' },
    { sport: 'soccer', league: 'fifa.worldq.concacaf', leagueName: 'FIFA World Cup Qualifiers - CONCACAF' },
    { sport: 'soccer', league: 'concacaf.champions', leagueName: 'CONCACAF Champions Cup' },
    
    // Soccer - Women's Leagues
    { sport: 'soccer', league: 'eng.w.1', leagueName: 'Women\'s Super League' },
    
    // Soccer - National Teams
    { sport: 'soccer', league: 'usa', leagueName: 'USMNT' },
    { sport: 'soccer', league: 'usa.w', leagueName: 'USWNT' },
    
    // Soccer - Other Competitions
    { sport: 'soccer', league: 'eng.fa', leagueName: 'FA Cup' },
    { sport: 'soccer', league: 'eng.league_cup', leagueName: 'Carabao Cup' },
    { sport: 'soccer', league: 'esp.copa_del_rey', leagueName: 'Copa del Rey' },
    { sport: 'soccer', league: 'ita.coppa_italia', leagueName: 'Coppa Italia' },
    { sport: 'soccer', league: 'ita.super_cup', leagueName: 'Italian Super Cup' },
    { sport: 'soccer', league: 'ger.dfb_pokal', leagueName: 'DFB-Pokal' },
    { sport: 'soccer', league: 'fra.coupe_de_france', leagueName: 'Coupe de France' },
    { sport: 'soccer', league: 'por.taca.portugal', leagueName: 'Taça de Portugal' },
    { sport: 'soccer', league: 'arg.trofeo_de_la_campeones', leagueName: 'Trofeo de Campeones' },
    
    // Racing
    { sport: 'racing', league: 'f1', leagueName: 'Formula 1' },
    { sport: 'racing', league: 'nascar-cup', leagueName: 'NASCAR Cup Series' },
    { sport: 'racing', league: 'nascar-xfinity', leagueName: 'NASCAR Xfinity Series' },
    { sport: 'racing', league: 'nascar-truck', leagueName: 'NASCAR Truck Series' },
    { sport: 'racing', league: 'indycar', leagueName: 'IndyCar' },
    
    // MMA
    { sport: 'mma', league: 'ufc', leagueName: 'UFC' },
    { sport: 'mma', league: 'bellator', leagueName: 'Bellator' },
    
    // Volleyball
    { sport: 'volleyball', league: 'womens-college-volleyball', leagueName: 'NCAA Women\'s Volleyball' }
  ];
  
  const allGames = [];
  let totalFetched = 0;
  const uniqueGames = new Set();
  
  // Helper function to create unique game key
  const getGameKey = (league, homeTeam, awayTeam, date) => {
    return `${league}|${(homeTeam || '').toLowerCase().trim()}|${(awayTeam || '').toLowerCase().trim()}|${date}`;
  };
  
  // Generate deterministic Game ID
  const generateDeterministicGameId = (source, league, homeTeam, awayTeam, date) => {
    const normalizedHome = (homeTeam || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedAway = (awayTeam || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedLeague = (league || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const dateStr = date.replace(/-/g, '');
    return `${source}-${normalizedLeague}-${normalizedAway}-${normalizedHome}-${dateStr}`;
  };
  
  // Rate limiter for ESPN API
  let lastESPNRequestTime = 0;
  const MIN_TIME_BETWEEN_ESPN_REQUESTS = 500;
  
  // Helper function to normalize team name for ranking lookup
  const normalizeTeamNameForRanking = (name) => {
    return (name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };
  
  // Helper function to get team ranking
  const getTeamRanking = (teamName, rankingsMap) => {
    if (!rankingsMap || !teamName) return null;
    const normalized = normalizeTeamNameForRanking(teamName);
    return rankingsMap[normalized] || null;
  };
  
  // Fetch rankings once for all NCAA games
  const ncaamRankings = await fetchNCAARankings('NCAAM');
  const ncaawRankings = await fetchNCAARankings('NCAAW');
  const ncaafRankings = await fetchNCAARankings('NCAAF');
  
  // Convert rankings maps to Maps for easier lookup
  const ncaamRankingsMap = new Map(Object.entries(ncaamRankings));
  const ncaawRankingsMap = new Map(Object.entries(ncaawRankings));
  const ncaafRankingsMap = new Map(Object.entries(ncaafRankings));
  
  // Fetch from ESPN API for each date
  for (const dateInfo of datesToFetch) {
    const { isoDate, espnDate } = dateInfo;
    console.log(`[ESPN] Fetching games for ${isoDate} (${espnDate})...`);
    
    for (const { sport, league, leagueName } of ESPN_LEAGUES) {
      try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - lastESPNRequestTime;
        if (timeSinceLastRequest < MIN_TIME_BETWEEN_ESPN_REQUESTS) {
          const waitTime = MIN_TIME_BETWEEN_ESPN_REQUESTS - timeSinceLastRequest;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        lastESPNRequestTime = Date.now();
        
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${espnDate}`;
        console.log(`[ESPN] Fetching ${leagueName} for ${isoDate}...`);
        
        let response;
        let retries = 3;
        let backoffTime = 1000;
        
        while (retries > 0) {
          response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
            retries--;
            if (retries > 0) {
              console.warn(`[ESPN] ${leagueName} (${isoDate}): HTTP ${response.status} - retrying in ${backoffTime/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              backoffTime *= 2;
              continue;
            }
          }
          break;
        }
        
        if (!response.ok) {
          console.warn(`[ESPN] ${leagueName} (${isoDate}): HTTP ${response.status} - skipping`);
          continue;
        }
        
        const data = await response.json();
        const events = data.events || [];
        
        for (const event of events) {
          let competitions = [];
          if (sport === 'tennis' && event.groupings && event.groupings.length > 0) {
            for (const grouping of event.groupings) {
              if (grouping.competitions && Array.isArray(grouping.competitions)) {
                competitions.push(...grouping.competitions);
              }
            }
          } else {
            competitions = event.competitions || [];
          }
          
          if (competitions.length === 0) continue;
          
          // For tennis, process each competition separately
          if (sport === 'tennis') {
            for (const competition of competitions) {
              if (!competition) continue;
              
              const competitionType = competition.type?.text || '';
              if (league === 'atp' && !competitionType.includes("Men's")) continue;
              if (league === 'wta' && !competitionType.includes("Women's")) continue;
              
              const competitors = competition.competitors || [];
              const awayTeam = competitors.find(c => c.homeAway === 'away');
              const homeTeam = competitors.find(c => c.homeAway === 'home');
              
              if (!awayTeam || !homeTeam) continue;
              
              const homeTeamName = homeTeam.athlete?.displayName || homeTeam.athlete?.shortName || homeTeam.athlete?.fullName || homeTeam.team?.displayName || '';
              const awayTeamName = awayTeam.athlete?.displayName || awayTeam.athlete?.shortName || awayTeam.athlete?.fullName || awayTeam.team?.displayName || '';
              
              const tournamentName = event.name || '';
              
              const homeLinescores = homeTeam.linescores || [];
              const awayLinescores = awayTeam.linescores || [];
              
              const homeSetScores = homeLinescores.map(set => {
                if (typeof set === 'object' && set !== null) {
                  return set.value || 0;
                }
                return typeof set === 'number' ? set : 0;
              });
              const awaySetScores = awayLinescores.map(set => {
                if (typeof set === 'object' && set !== null) {
                  return set.value || 0;
                }
                return typeof set === 'number' ? set : 0;
              });
              
              const status = competition.status || {};
              const gameDate = competition.date ? new Date(competition.date) : new Date();
              
              if (!competition.date) continue;
              const competitionGameDateForStorage = DateTime
                .fromISO(competition.date, { zone: 'utc' })
                .setZone('America/New_York')
                .toISODate();
              
              const isoDateMountain = DateTime.fromISO(isoDate, { zone: 'America/Denver' });
              const isoDateEastern = isoDateMountain.setZone('America/New_York').toISODate();
              
              if (competitionGameDateForStorage !== isoDateEastern) continue;
              
              const competitionGameKey = getGameKey(leagueName, homeTeamName, awayTeamName, competitionGameDateForStorage);
              if (uniqueGames.has(competitionGameKey)) continue;
              uniqueGames.add(competitionGameKey);
              
              const broadcasts = competition.broadcasts?.[0]?.names || [];
              const channel = broadcasts.length > 0 ? broadcasts[0] : '';
              
              let matchStatus = 'SCHEDULED';
              if (status.type?.state === 'in') matchStatus = 'IN PROGRESS';
              else if (status.type?.state === 'post') matchStatus = 'FINAL';
              
              const gameDateUTC = DateTime.fromJSDate(gameDate, { zone: 'utc' });
              const gameDateMountain = gameDateUTC.setZone('America/Denver');
              
              let displayTime = '';
              const period = status.period || '';
              let displayClock = status.displayClock || '';
              
              if (matchStatus === 'IN PROGRESS' && (period || displayClock)) {
                displayTime = displayClock || period || '';
              } else {
                displayTime = gameDateMountain.toFormat('h:mm a');
              }
              
              const sportDisplayName = 'Tennis';
              const leagueDisplayName = ESPN_LEAGUE_DISPLAY_NAME_MAP[leagueName] || leagueName;
              
              const competitionId = competition.id || `${event.id}-${competitions.indexOf(competition)}`;
              const gameId = `espn-${league}-${competitionId}`;
              
              const gameData = {
                'League': leagueDisplayName,
                'Sport': sportDisplayName,
                'Home Team': homeTeamName,
                'Away Team': awayTeamName,
                'Home Score': '',
                'Away Score': '',
                'Match Status': matchStatus,
                'Channel': channel,
                'channel': channel,
                'Start Time': admin.firestore.Timestamp.fromDate(gameDate),
                'gameDate': competitionGameDateForStorage,
                'Matchup': `${awayTeamName} vs ${homeTeamName}`,
                'Game ID': gameId,
                'canonicalGameKey': competitionGameKey,
                'Last Updated': admin.firestore.FieldValue.serverTimestamp(),
                'source': 'ESPN_LIVE',
                'period': period,
                'displayClock': displayClock,
                'displayTime': displayTime,
                'Tournament': tournamentName,
                'Competition Type': competitionType,
                'Home Set Scores': homeSetScores,
                'Away Set Scores': awaySetScores,
                'Home Linescores': homeLinescores,
                'Away Linescores': awayLinescores
              };
              
              allGames.push(gameData);
            }
            continue;
          }
          
          // For non-tennis sports
          const firstCompetition = competitions[0];
          const firstCompetitors = firstCompetition.competitors || [];
          const firstAwayTeam = firstCompetitors.find(c => c.homeAway === 'away');
          const firstHomeTeam = firstCompetitors.find(c => c.homeAway === 'home');
          
          if (!firstAwayTeam || !firstHomeTeam) continue;
          
          const firstHomeTeamName = firstHomeTeam.team?.displayName || '';
          const firstAwayTeamName = firstAwayTeam.team?.displayName || '';
          
          if (!firstCompetition.date) continue;
          const gameDateForStorage = DateTime
            .fromISO(firstCompetition.date, { zone: 'utc' })
            .setZone('America/New_York')
            .toISODate();
          
          const isoDateMountain = DateTime.fromISO(isoDate, { zone: 'America/Denver' });
          const isoDateEastern = isoDateMountain.setZone('America/New_York').toISODate();
          
          if (gameDateForStorage !== isoDateEastern) continue;
          
          const eventGameKey = getGameKey(leagueName, firstHomeTeamName, firstAwayTeamName, gameDateForStorage);
          if (uniqueGames.has(eventGameKey)) continue;
          uniqueGames.add(eventGameKey);
          
          const allChannels = new Set();
          let primaryCompetition = null;
          let primaryStatus = null;
          let primaryDisplayTime = '';
          
          for (const competition of competitions) {
            if (!competition) continue;
            
            const competitors = competition.competitors || [];
            const awayTeam = competitors.find(c => c.homeAway === 'away');
            const homeTeam = competitors.find(c => c.homeAway === 'home');
            
            if (!awayTeam || !homeTeam) continue;
            
            const status = competition.status || {};
            const gameDate = competition.date ? new Date(competition.date) : new Date();
            
            const broadcasts = competition.broadcasts?.[0]?.names || [];
            if (broadcasts.length > 0) {
              broadcasts.forEach(broadcastName => {
                if (broadcastName && broadcastName.trim()) {
                  allChannels.add(broadcastName.trim());
                }
              });
            }
            
            if (!primaryCompetition || (status.type?.state === 'in' && primaryStatus?.type?.state !== 'in')) {
              primaryCompetition = competition;
              primaryStatus = status;
              
              const gameDateUTC = DateTime.fromJSDate(gameDate, { zone: 'utc' });
              const gameDateMountain = gameDateUTC.setZone('America/Denver');
              
              let matchStatus = 'SCHEDULED';
              if (status.type?.state === 'in') matchStatus = 'IN PROGRESS';
              else if (status.type?.state === 'post') matchStatus = 'FINAL';
              
              const period = status.period || '';
              let displayClock = status.displayClock || '';
              
              if (sport === 'football' && (leagueName === 'NFL' || leagueName === 'NCAAF')) {
                if (status.clock !== undefined && status.clock !== null) {
                  const clockSeconds = typeof status.clock === 'number' ? status.clock : parseInt(status.clock);
                  if (!isNaN(clockSeconds) && clockSeconds >= 0) {
                    const minutes = Math.floor(clockSeconds / 60);
                    const seconds = clockSeconds % 60;
                    displayClock = `${minutes}:${String(seconds).padStart(2, '0')}`;
                  }
                }
              }
              
              if (matchStatus === 'IN PROGRESS' && (period || displayClock)) {
                const periodNum = period ? parseInt(period) : null;
                const isZeroClock = (displayClock === '0.0' || displayClock === '0:00' || displayClock === '0' || displayClock === '');
                
                if (sport === 'soccer') {
                  let minutes = null;
                  
                  if (displayClock && displayClock.includes(':')) {
                    const [mins] = displayClock.split(':').map(Number);
                    if (!isNaN(mins)) minutes = mins;
                  } else if (displayClock && !isNaN(parseInt(displayClock))) {
                    minutes = parseInt(displayClock);
                  }
                  
                  if (minutes === null && status.clock !== undefined && status.clock !== null) {
                    const clockValue = status.clock;
                    if (typeof clockValue === 'string' && clockValue.includes(':')) {
                      const [mins] = clockValue.split(':').map(Number);
                      if (!isNaN(mins)) minutes = mins;
                    } else if (typeof clockValue === 'number') {
                      minutes = Math.floor(clockValue / 60);
                    }
                  }
                  
                  let stoppageTime = null;
                  if (displayClock && (displayClock.includes('+') || displayClock.includes("'"))) {
                    const stoppageMatch = displayClock.match(/(\d+)[\'+]?\+(\d+)/);
                    if (stoppageMatch) {
                      minutes = parseInt(stoppageMatch[1]);
                      stoppageTime = parseInt(stoppageMatch[2]);
                    }
                  }
                  
                  if (stoppageTime === null && status.addedTime !== undefined && status.addedTime !== null) {
                    stoppageTime = parseInt(status.addedTime) || 0;
                  }
                  
                  if (minutes !== null) {
                    if (stoppageTime !== null && stoppageTime > 0) {
                      primaryDisplayTime = `${minutes}'+${stoppageTime}`;
                    } else {
                      primaryDisplayTime = `${minutes}'`;
                    }
                  } else if (periodNum === 1 && isZeroClock) {
                    primaryDisplayTime = 'Half';
                  } else {
                    primaryDisplayTime = displayClock || period || '';
                  }
                } else {
                  const isFootballHalftime = (sport === 'football' && (leagueName === 'NFL' || leagueName === 'NCAAF') && periodNum === 2 && isZeroClock);
                  const isBasketballHalftime = (sport === 'basketball' && (leagueName === 'NBA' || leagueName === 'WNBA') && periodNum === 2 && isZeroClock);
                  const isNHLFirstIntermission = (sport === 'hockey' && leagueName === 'NHL' && periodNum === 1 && isZeroClock);
                  const isNHLSecondIntermission = (sport === 'hockey' && leagueName === 'NHL' && periodNum === 2 && isZeroClock);
                  
                  if (isFootballHalftime || isBasketballHalftime) {
                    primaryDisplayTime = 'Half';
                  } else if (isNHLFirstIntermission) {
                    primaryDisplayTime = '1st Int.';
                  } else if (isNHLSecondIntermission) {
                    primaryDisplayTime = '2nd Int.';
                  } else {
                    let periodStr = '';
                    if (period) {
                      const periodNum = parseInt(period);
                      if (!isNaN(periodNum)) {
                        if (periodNum === 1) periodStr = '1st';
                        else if (periodNum === 2) periodStr = '2nd';
                        else if (periodNum === 3) periodStr = '3rd';
                        else if (periodNum === 4) periodStr = '4th';
                        else if (periodNum > 4) periodStr = `${periodNum}th`;
                        else periodStr = period;
                      } else {
                        periodStr = period;
                      }
                    }
                    
                    if (periodStr && displayClock) {
                      primaryDisplayTime = `${periodStr} ${displayClock}`;
                    } else if (periodStr) {
                      primaryDisplayTime = periodStr;
                    } else if (displayClock) {
                      primaryDisplayTime = displayClock;
                    }
                  }
                }
              }
              
              if (!primaryDisplayTime) {
                primaryDisplayTime = gameDateMountain.toFormat('h:mm a');
              }
            }
          }
          
          if (!primaryCompetition) continue;
          
          const primaryCompetitors = primaryCompetition.competitors || [];
          const primaryAwayTeam = primaryCompetitors.find(c => c.homeAway === 'away');
          const primaryHomeTeam = primaryCompetitors.find(c => c.homeAway === 'home');
          
          if (!primaryAwayTeam || !primaryHomeTeam) continue;
          
          const primaryGameDate = primaryCompetition.date ? new Date(primaryCompetition.date) : new Date();
          
          let matchStatus = 'SCHEDULED';
          if (primaryStatus?.type?.state === 'in') matchStatus = 'IN PROGRESS';
          else if (primaryStatus?.type?.state === 'post') matchStatus = 'FINAL';
          
          const channelFromAPI = allChannels.size > 0 ? Array.from(allChannels)[0] : '';
          const channel = channelFromAPI;
          
          let sportDisplayName = 'Other';
          if (sport === 'football') {
            sportDisplayName = 'American Football';
          } else if (sport === 'basketball') {
            sportDisplayName = 'Basketball';
          } else if (sport === 'baseball') {
            sportDisplayName = 'Baseball';
          } else if (sport === 'hockey') {
            sportDisplayName = 'Hockey';
          } else if (sport === 'soccer') {
            sportDisplayName = 'Soccer';
          } else if (sport === 'tennis') {
            sportDisplayName = 'Tennis';
          } else if (sport === 'golf') {
            sportDisplayName = 'Golf';
          } else if (sport === 'racing') {
            sportDisplayName = 'Auto Racing';
          } else if (sport === 'mma') {
            sportDisplayName = 'MMA';
          } else if (sport === 'boxing') {
            sportDisplayName = 'Boxing';
          }
          
          const displayTime = primaryDisplayTime;
          const period = primaryStatus?.period || '';
          let displayClock = primaryStatus?.displayClock || '';
          
          if (sport === 'football' && (leagueName === 'NFL' || leagueName === 'NCAAF')) {
            if (primaryStatus?.clock !== undefined && primaryStatus?.clock !== null) {
              const clockSeconds = typeof primaryStatus.clock === 'number' ? primaryStatus.clock : parseInt(primaryStatus.clock);
              if (!isNaN(clockSeconds) && clockSeconds >= 0) {
                const minutes = Math.floor(clockSeconds / 60);
                const seconds = clockSeconds % 60;
                displayClock = `${minutes}:${String(seconds).padStart(2, '0')}`;
              }
            }
          }
          
          const leagueDisplayName = ESPN_LEAGUE_DISPLAY_NAME_MAP[leagueName] || leagueName;
          
          let gameTime = '';
          if (matchStatus === 'IN PROGRESS' && displayClock && (leagueName === 'NFL' || leagueName === 'NCAAF')) {
            gameTime = displayClock;
          }
          
          let homeTeamRanking = null;
          let awayTeamRanking = null;
          if (leagueName === 'NCAAF') {
            homeTeamRanking = getTeamRanking(firstHomeTeamName, ncaafRankingsMap);
            awayTeamRanking = getTeamRanking(firstAwayTeamName, ncaafRankingsMap);
          }
          
          const gameData = {
            'League': leagueDisplayName,
            'Sport': sportDisplayName,
            'Home Team': firstHomeTeamName,
            'Away Team': firstAwayTeamName,
            'Home Score': primaryHomeTeam.score || '',
            'Away Score': primaryAwayTeam.score || '',
            'Match Status': matchStatus,
            'Channel': channel,
            'channel': channel,
            'Start Time': admin.firestore.Timestamp.fromDate(primaryGameDate),
            'gameDate': gameDateForStorage,
            'Matchup': `${firstAwayTeamName} vs ${firstHomeTeamName}`,
            'Game ID': event.id 
              ? `espn-${league}-${event.id}`
              : generateDeterministicGameId('espn', leagueName, firstHomeTeamName, firstAwayTeamName, gameDateForStorage),
            'canonicalGameKey': getGameKey(leagueDisplayName, firstHomeTeamName, firstAwayTeamName, gameDateForStorage),
            'Last Updated': admin.firestore.FieldValue.serverTimestamp(),
            'source': 'ESPN_LIVE',
            'period': period,
            'displayClock': displayClock,
            'displayTime': displayTime,
            'GameTime': gameTime || null,
            'Stage': period ? `${period}${period === '1' ? 'ST' : period === '2' ? 'ND' : period === '3' ? 'RD' : 'TH'}_QUARTER` : '',
            'Home Team Ranking': homeTeamRanking,
            'Away Team Ranking': awayTeamRanking
          };
          
          allGames.push(gameData);
        }
        
        console.log(`[ESPN] ${leagueName} (${isoDate}): Found ${events.length} games`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (err) {
        console.error(`[ESPN] Error fetching ${leagueName} for ${isoDate}:`, err.message);
      }
    }
  }
  
  // Fetch NCAA API data for NCAAM and NCAAW
  for (const dateInfo of datesToFetch) {
    const { isoDate, ncaaDate } = dateInfo;
    console.log(`[NCAA API] Fetching NCAAM and NCAAW for ${isoDate}...`);
    
    // Fetch NCAAM
    try {
      const ncaamUrl = `https://ncaa-api.henrygd.me/scoreboard/basketball-men/d1/${ncaaDate}`;
      const ncaamResponse = await fetch(ncaamUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (ncaamResponse.ok) {
        const ncaamData = await ncaamResponse.json();
        if (ncaamData.games && Array.isArray(ncaamData.games)) {
          for (const gameItem of ncaamData.games) {
            const game = gameItem.game;
            if (!game) continue;
            
            let numericGameId = game.id || null;
            if (!numericGameId && game.url) {
              const urlMatch = game.url.match(/\/game\/(\d+)/);
              if (urlMatch) {
                numericGameId = urlMatch[1];
              }
            }
            
            const awayTeam = game.away;
            const homeTeam = game.home;
            if (!awayTeam || !homeTeam) continue;
            
            const awayTeamName = awayTeam.names?.short || awayTeam.names?.full || awayTeam.names?.seo || '';
            const homeTeamName = homeTeam.names?.short || homeTeam.names?.full || homeTeam.names?.seo || '';
            if (!awayTeamName || !homeTeamName) continue;
            
            const awayScore = awayTeam.score || '';
            const homeScore = homeTeam.score || '';
            const gameState = (game.gameState || '').toUpperCase();
            const finalMessage = (game.finalMessage || '').toUpperCase();
            const currentPeriod = game.currentPeriod || '';
            const startTimeEpochSeconds = game.startTimeEpoch ? Number(game.startTimeEpoch) : null;
            const startTimeMillis = Number.isFinite(startTimeEpochSeconds) ? startTimeEpochSeconds * 1000 : null;
            
            if (!startTimeMillis) continue;
            const gameDateForStorage = DateTime
              .fromMillis(startTimeMillis, { zone: 'utc' })
              .setZone('America/New_York')
              .toISODate();
            
            const isoDateMountain = DateTime.fromISO(isoDate, { zone: 'America/Denver' });
            const isoDateEastern = isoDateMountain.setZone('America/New_York').toISODate();
            
            if (gameDateForStorage !== isoDateEastern) continue;
            
            let matchStatus = 'SCHEDULED';
            if (finalMessage === 'FINAL' || gameState === 'FINAL') {
              matchStatus = 'FINAL';
            } else if (gameState.includes('LIVE') || gameState.includes('IN_PROGRESS') || homeScore > 0 || awayScore > 0) {
              if (!finalMessage.includes('FINAL') && !gameState.includes('FINAL')) {
                matchStatus = 'IN PROGRESS';
              }
            }
            
            const contestClock = game.contestClock || '';
            let displayTime = '';
            
            const periodNum = currentPeriod ? (parseInt(currentPeriod) || (currentPeriod.includes('1') ? 1 : (currentPeriod.includes('2') ? 2 : null))) : null;
            const isZeroClock = (contestClock === '0.0' || contestClock === '0:00' || contestClock === '0' || contestClock === '');
            
            if (periodNum === 2 && isZeroClock) {
              matchStatus = 'FINAL';
              displayTime = 'F';
            } else if (matchStatus === 'IN PROGRESS' && (currentPeriod || contestClock)) {
              const isHalftime = (periodNum === 1 && isZeroClock);
              
              if (isHalftime) {
                displayTime = 'Half';
              } else {
                let periodStr = currentPeriod || '';
                
                if (periodStr && /^\d+$/.test(periodStr)) {
                  const periodNum = parseInt(periodStr);
                  if (periodNum === 1) periodStr = '1st';
                  else if (periodNum === 2) periodStr = '2nd';
                  else if (periodNum === 3) periodStr = '3rd';
                  else if (periodNum === 4) periodStr = '4th';
                  else if (periodNum > 4) periodStr = `${periodNum}th`;
                }
                
                if (periodStr && contestClock) {
                  displayTime = `${periodStr} ${contestClock}`;
                } else if (periodStr) {
                  displayTime = periodStr;
                } else if (contestClock) {
                  displayTime = contestClock;
                }
              }
            }
            
            if (!displayTime && matchStatus !== 'FINAL' && startTimeMillis) {
              const startTimeMountain = DateTime.fromMillis(startTimeMillis).setZone('America/Denver');
              displayTime = startTimeMountain.toFormat('h:mm a');
            } else if (!displayTime && matchStatus === 'FINAL') {
              displayTime = 'F';
            } else if (!displayTime) {
              displayTime = '';
            }
            
            const leagueDisplayName = ESPN_LEAGUE_DISPLAY_NAME_MAP['NCAAM'] || 'USA: NCAA';
            
            const homeTeamRanking = getTeamRanking(homeTeamName, ncaamRankingsMap);
            const awayTeamRanking = getTeamRanking(awayTeamName, ncaamRankingsMap);
            
            const gameKey = getGameKey(leagueDisplayName, homeTeamName, awayTeamName, gameDateForStorage);
            
            if (uniqueGames.has(gameKey)) {
              console.log(`[NCAA API] Skipping duplicate NCAAM game: ${awayTeamName} vs ${homeTeamName} on ${gameDateForStorage}`);
              continue;
            }
            uniqueGames.add(gameKey);
            
            const gameData = {
              'League': leagueDisplayName,
              'Sport': 'Basketball',
              'Home Team': homeTeamName,
              'Away Team': awayTeamName,
              'Home Score': homeScore.toString(),
              'Away Score': awayScore.toString(),
              'Match Status': matchStatus,
              'Channel': '',
              'channel': '',
              'Start Time': startTimeMillis ? admin.firestore.Timestamp.fromMillis(startTimeMillis) : admin.firestore.Timestamp.now(),
              'gameDate': gameDateForStorage,
              'Matchup': `${awayTeamName} vs ${homeTeamName}`,
              'Game ID': numericGameId 
                ? `ncaa-ncaam-${numericGameId}`
                : generateDeterministicGameId('ncaa-ncaam', 'NCAAM', homeTeamName, awayTeamName, gameDateForStorage),
              'canonicalGameKey': gameKey,
              'NCAA Numeric ID': numericGameId || null,
              'Last Updated': admin.firestore.FieldValue.serverTimestamp(),
              'source': 'NCAA_LIVE',
              'period': currentPeriod || '',
              'displayClock': contestClock,
              'Current Period': currentPeriod,
              'displayTime': displayTime,
              'Home Team Ranking': homeTeamRanking,
              'Away Team Ranking': awayTeamRanking
            };
            
            allGames.push(gameData);
          }
          console.log(`[NCAA API] NCAAM (${isoDate}): Found ${ncaamData.games.length} games`);
        }
      }
    } catch (err) {
      console.error(`[NCAA API] Error fetching NCAAM for ${isoDate}:`, err.message);
    }
    
    // Fetch NCAAW
    try {
      const ncaawUrl = `https://ncaa-api.henrygd.me/scoreboard/basketball-women/d1/${ncaaDate}`;
      const ncaawResponse = await fetch(ncaawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (ncaawResponse.ok) {
        const ncaawData = await ncaawResponse.json();
        if (ncaawData.games && Array.isArray(ncaawData.games)) {
          for (const gameItem of ncaawData.games) {
            const game = gameItem.game;
            if (!game) continue;
            
            const awayTeam = game.away;
            const homeTeam = game.home;
            if (!awayTeam || !homeTeam) continue;
            
            const awayTeamName = awayTeam.names?.short || awayTeam.names?.full || awayTeam.names?.seo || '';
            const homeTeamName = homeTeam.names?.short || homeTeam.names?.full || homeTeam.names?.seo || '';
            if (!awayTeamName || !homeTeamName) continue;
            
            const awayScore = awayTeam.score || '';
            const homeScore = homeTeam.score || '';
            const gameState = (game.gameState || '').toUpperCase();
            const finalMessage = (game.finalMessage || '').toUpperCase();
            const currentPeriod = game.currentPeriod || '';
            const startTimeEpochSeconds = game.startTimeEpoch ? Number(game.startTimeEpoch) : null;
            const startTimeMillis = Number.isFinite(startTimeEpochSeconds) ? startTimeEpochSeconds * 1000 : null;
            
            if (!startTimeMillis) continue;
            const gameDateForStorage = DateTime
              .fromMillis(startTimeMillis, { zone: 'utc' })
              .setZone('America/New_York')
              .toISODate();
            
            const isoDateMountain = DateTime.fromISO(isoDate, { zone: 'America/Denver' });
            const isoDateEastern = isoDateMountain.setZone('America/New_York').toISODate();
            
            if (gameDateForStorage !== isoDateEastern) continue;
            
            let matchStatus = 'SCHEDULED';
            if (finalMessage === 'FINAL' || gameState === 'FINAL') {
              matchStatus = 'FINAL';
            } else if (gameState.includes('LIVE') || gameState.includes('IN_PROGRESS') || homeScore > 0 || awayScore > 0) {
              if (!finalMessage.includes('FINAL') && !gameState.includes('FINAL')) {
                matchStatus = 'IN PROGRESS';
              }
            }
            
            const contestClock = game.contestClock || '';
            let displayTime = '';
            
            if (matchStatus === 'IN PROGRESS' && (currentPeriod || contestClock)) {
              const periodNum = currentPeriod ? (parseInt(currentPeriod) || (currentPeriod.includes('2') ? 2 : null)) : null;
              const isHalftime = (periodNum === 2 && 
                                  (contestClock === '0.0' || contestClock === '0:00' || contestClock === '0' || contestClock === ''));
              
              if (isHalftime) {
                displayTime = 'Half';
              } else {
                let periodStr = currentPeriod || '';
                
                if (periodStr && /^\d+$/.test(periodStr)) {
                  const periodNum = parseInt(periodStr);
                  if (periodNum === 1) periodStr = '1st';
                  else if (periodNum === 2) periodStr = '2nd';
                  else if (periodNum === 3) periodStr = '3rd';
                  else if (periodNum === 4) periodStr = '4th';
                  else if (periodNum > 4) periodStr = `${periodNum}th`;
                }
                
                if (periodStr && contestClock) {
                  displayTime = `${periodStr} ${contestClock}`;
                } else if (periodStr) {
                  displayTime = periodStr;
                } else if (contestClock) {
                  displayTime = contestClock;
                }
              }
            }
            
            if (!displayTime && startTimeMillis) {
              const startTimeMountain = DateTime.fromMillis(startTimeMillis).setZone('America/Denver');
              displayTime = startTimeMountain.toFormat('h:mm a');
            } else if (!displayTime) {
              displayTime = '';
            }
            
            const leagueDisplayName = ESPN_LEAGUE_DISPLAY_NAME_MAP['NCAAW'] || 'USA: NCAA Women';
            
            const homeTeamRanking = getTeamRanking(homeTeamName, ncaawRankingsMap);
            const awayTeamRanking = getTeamRanking(awayTeamName, ncaawRankingsMap);
            
            const gameKey = getGameKey(leagueDisplayName, homeTeamName, awayTeamName, gameDateForStorage);
            
            if (uniqueGames.has(gameKey)) {
              console.log(`[NCAA API] Skipping duplicate NCAAW game: ${awayTeamName} vs ${homeTeamName} on ${gameDateForStorage}`);
              continue;
            }
            uniqueGames.add(gameKey);
            
            const gameData = {
              'League': leagueDisplayName,
              'Sport': 'Basketball',
              'Home Team': homeTeamName,
              'Away Team': awayTeamName,
              'Home Score': homeScore.toString(),
              'Away Score': awayScore.toString(),
              'Match Status': matchStatus,
              'Channel': '',
              'channel': '',
              'Start Time': startTimeMillis ? admin.firestore.Timestamp.fromMillis(startTimeMillis) : admin.firestore.Timestamp.now(),
              'gameDate': gameDateForStorage,
              'Matchup': `${awayTeamName} vs ${homeTeamName}`,
              'Game ID': game.id 
                ? `ncaa-ncaaw-${game.id}`
                : generateDeterministicGameId('ncaa-ncaaw', 'NCAAW', homeTeamName, awayTeamName, gameDateForStorage),
              'canonicalGameKey': gameKey,
              'Last Updated': admin.firestore.FieldValue.serverTimestamp(),
              'source': 'NCAA_LIVE',
              'period': currentPeriod || '',
              'displayClock': contestClock,
              'Current Period': currentPeriod,
              'displayTime': displayTime,
              'Home Team Ranking': homeTeamRanking,
              'Away Team Ranking': awayTeamRanking
            };
            
            allGames.push(gameData);
          }
          console.log(`[NCAA API] NCAAW (${isoDate}): Found ${ncaawData.games.length} games`);
        }
      }
    } catch (err) {
      console.error(`[NCAA API] Error fetching NCAAW for ${isoDate}:`, err.message);
    }
  }
  
  console.log(`[Future Games] Total games fetched: ${allGames.length}`);
  
  if (allGames.length === 0) {
    console.warn(`[Future Games] ⚠️ WARNING: No games fetched!`);
    return;
  }
  
  // Write games to Firestore
  console.log(`[Future Games] Writing ${allGames.length} games to sportsGamesFuture collection...`);
  
  const BATCH_SIZE = 500;
  let writeCount = 0;
  
  for (let i = 0; i < allGames.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchGames = allGames.slice(i, i + BATCH_SIZE);
    
    for (const game of batchGames) {
      if (!game['Game ID']) {
        console.warn(`[Future Games] Skipping game without Game ID:`, game['Matchup'] || 'Unknown');
        continue;
      }
      
      const docRef = gamesRef.doc(String(game['Game ID']));
      batch.set(docRef, game, { merge: true });
    }
    
    if (batchGames.length > 0) {
      try {
        await batch.commit();
        writeCount += batchGames.length;
        console.log(`[Future Games] ✅ Committed write batch: ${batchGames.length} games (total written: ${writeCount})`);
      } catch (err) {
        console.error(`[Future Games] ❌ Batch commit failed:`, err.message);
        throw err;
      }
    }
  }
  
  console.log(`[Future Games] ✅ Successfully wrote ${writeCount} games to sportsGamesFuture collection`);
  console.log(`[Future Games] Completed at ${new Date().toISOString()}`);
}

// Run the function
fetchFutureGames()
  .then(() => {
    console.log('Future games fetch completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Future games fetch failed:', error);
    process.exit(1);
  });
