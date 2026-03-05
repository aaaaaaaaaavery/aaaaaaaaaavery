// Cloud Function entry point for channel lookup
const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// League mapping
const LEAGUE_TO_COLLECTION_MAP = {
  'USA: NFL': 'NFL',
  'USA: NBA': 'NBA',
  'USA: NBA - Pre-season': 'NBA',
  'USA: MLB': 'MLB',
  'USA: NHL': 'NHL',
  'USA: NHL - Pre-season': 'NHL',
  'USA: MLS': 'MLS',
  'Germany: Bundesliga': 'Bundesliga',
  'Italy: Serie A': 'SerieA',
  'France: Ligue 1': 'Ligue1',
  'Netherlands: Eredivisie': 'Eredivisie',
  'Portugal: Primeira Liga': 'PrimeiraLiga',
  'Mexico: Liga MX': 'LigaMX',
  'Brazil: Serie A': 'SerieA',
  'England: Premier League': 'PremierLeague',
  'Spain: LaLiga': 'LaLiga',
  'Argentina: Torneo Betano - Clausura': 'ArgentinePrimeraDivision',
  'Brazil: Serie A Betano': 'Brasileirao',
  'Europe: Champions League - League phase': 'UEFAChampionsLeague',
  'Europe: Champions League': 'UEFAChampionsLeague',
  'UEFA Champions League': 'UEFAChampionsLeague',
  'Champions League': 'UEFAChampionsLeague',
  'Europe: Europa League - League phase': 'UEFAEuropaLeague',
  'Europe: Europa League': 'UEFAEuropaLeague',
  'Europe: Conference League - League phase': 'UEFAConferenceLeague',
  'Europe: Conference League': 'UEFAConferenceLeague'
};

// Normalize team names for matching
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

// Get channel data from upcoming schedule collections
async function getChannelDataForGames(games, todayStr) {
  const channelMap = new Map(); // Key: "homeTeam|awayTeam|date", Value: channel
  
    console.log(`🔍 DEBUG: Starting getChannelDataForGames with ${games.length} games`);
    
    // Test the mapping directly
    console.log(`🔍 TEST: Mapping for "Europe: Champions League - League phase": ${LEAGUE_TO_COLLECTION_MAP["Europe: Champions League - League phase"]}`);
    
    try {
      // Group games by league to minimize queries
      const gamesByLeague = {};
      for (const game of games) {
        const collectionName = LEAGUE_TO_COLLECTION_MAP[game.League];
        if (collectionName) {
          if (!gamesByLeague[collectionName]) {
            gamesByLeague[collectionName] = [];
          }
          gamesByLeague[collectionName].push(game);
        } else {
          console.log(`❌ No collection mapping for league: "${game.League}"`);
        }
      }
    
    // Query each relevant collection
    for (const [collectionName, leagueGames] of Object.entries(gamesByLeague)) {
      try {
        const upcomingRef = db.collection(collectionName);
        const snapshot = await upcomingRef
          .where('date', '==', todayStr)
          .get();
        
        if (!snapshot.empty) {
          console.log(`🔍 Querying ${collectionName} for date ${todayStr} - found ${snapshot.size} documents`);
          
          for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.channel) {
              const homeTeam = data.home || '';
              const awayTeam = data.away || '';
              
              // Create keys for both possible orders
              const key1 = `${normalizeTeamName(homeTeam)}|${normalizeTeamName(awayTeam)}|${data.date}`;
              const key2 = `${normalizeTeamName(awayTeam)}|${normalizeTeamName(homeTeam)}|${data.date}`;
              channelMap.set(key1, data.channel);
              channelMap.set(key2, data.channel);
              console.log(`📋 ${collectionName}: ${data.home} vs ${data.away} (${data.date}) → keys: ${key1}, ${key2}`);
            } else {
              console.log(`⚠️ ${collectionName}: ${data.home} vs ${data.away} (${data.date}) - NO CHANNEL`);
            }
          }
          console.log(`Found ${snapshot.size} upcoming games with channel data in ${collectionName}`);
        } else {
          console.log(`❌ No documents found in ${collectionName} for date ${todayStr}`);
          // Debug: Let's see what dates are actually in the collection
          if (collectionName === 'UEFAChampionsLeague') {
            console.log(`🔍 DEBUG: Checking what dates exist in ${collectionName}...`);
            const allDocs = await db.collection(collectionName).limit(5).get();
            allDocs.forEach(doc => {
              const data = doc.data();
              console.log(`🔍 Sample doc: ${data.home} vs ${data.away} - date: "${data.date}"`);
            });
          }
        }
      } catch (err) {
        console.error(`Error querying ${collectionName} for channel data:`, err.message);
      }
    }
    
    console.log(`Total channel entries found: ${channelMap.size}`);
  } catch (error) {
    console.error('Error fetching channel data:', error);
  }
  
  return channelMap;
}

// Cloud Function handler
exports.channelLookupHandler = async (req, res) => {
  try {
    console.log('🚀 Starting channel lookup process...');
    
    // Get today's date in UTC to match stored dates
    const nowInUTC = DateTime.now().setZone('utc');
    const todayStr = nowInUTC.toISODate();
    console.log(`Today's date (UTC): ${todayStr}`);
    
    // Get today's games from sportsGames
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await gamesRef.where('gameDate', '==', todayStr).get();
    
    if (snapshot.empty) {
      console.log('❌ No games found for today');
      res.status(200).send('No games found for today');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} games for today`);
    
    // Debug: Check what games we found and their league names
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.League && data.League.includes('Champions League')) {
        console.log(`🔍 UEFA Game: ${data['Away Team']} @ ${data['Home Team']} - League: "${data.League}" - gameDate: "${data.gameDate}"`);
      }
    });
    
    // Get channel data
    const games = [];
    snapshot.forEach(doc => {
      games.push({ id: doc.id, ...doc.data() });
    });
    
    const channelMap = await getChannelDataForGames(games, todayStr);
    console.log(`📊 Channel map size: ${channelMap.size}`);
    
    // Update games with channel data
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const game of games) {
      const homeTeam = game['Home Team'] || '';
      const awayTeam = game['Away Team'] || '';
      const normalizedHome = normalizeTeamName(homeTeam);
      const normalizedAway = normalizeTeamName(awayTeam);
      
      // Try multiple matching strategies
      let channel = null;
      
      // Strategy 1: Exact match with today's date
      const key1 = `${normalizedHome}|${normalizedAway}|${todayStr}`;
      const key2 = `${normalizedAway}|${normalizedHome}|${todayStr}`;
      channel = channelMap.get(key1) || channelMap.get(key2);
      
      // Strategy 2: Match without date (in case dates don't match exactly)
      if (!channel) {
        const keyNoDate1 = `${normalizedHome}|${normalizedAway}`;
        const keyNoDate2 = `${normalizedAway}|${normalizedHome}`;
        for (const [mapKey, mapChannel] of channelMap.entries()) {
          if (mapKey.startsWith(keyNoDate1) || mapKey.startsWith(keyNoDate2)) {
            channel = mapChannel;
            break;
          }
        }
      }
      
      // Strategy 3: Partial team name matching
      if (!channel) {
        for (const [mapKey, mapChannel] of channelMap.entries()) {
          const [mapHome, mapAway] = mapKey.split('|');
          if ((mapHome.includes(normalizedHome) || normalizedHome.includes(mapHome)) &&
              (mapAway.includes(normalizedAway) || normalizedAway.includes(mapAway))) {
            channel = mapChannel;
            break;
          }
        }
      }
      
      if (channel) {
        const docRef = gamesRef.doc(game.id);
        batch.update(docRef, { channel });
        updatedCount++;
        console.log(`✅ Added channel "${channel}" to ${game['Away Team']} @ ${game['Home Team']}`);
      } else {
        console.log(`❌ No channel found for ${game['Away Team']} @ ${game['Home Team']} (League: ${game.League})`);
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`🎉 Successfully updated ${updatedCount} games with channel data`);
      res.status(200).send(`Successfully updated ${updatedCount} games with channel data`);
    } else {
      console.log('⚠️  No channel data found to update');
      res.status(200).send('No channel data found to update');
    }
    
  } catch (error) {
    console.error('💥 Error in channel lookup:', error);
    res.status(500).send('Error in channel lookup: ' + error.message);
  }
};
