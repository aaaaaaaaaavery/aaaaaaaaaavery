How to run it:

Terminal at Copy of THPORTHIndex


Deployment

gcloud functions deploy channel-lookup --runtime nodejs18 --trigger-http --allow-unauthenticated --source . --entry-point channelLookupHandler



Manual trigger

curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup







Latest index.js in channel-lookup-deploy folder:

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
  'Mexico: Liga MX - Apertura': 'LigaMX',
  'Spain: LaLiga': 'LaLiga',
  'Argentina: Torneo Betano - Clausura': 'ArgentinePrimeraDivision',
  'Europe: Champions League - League phase': 'UEFAChampionsLeague',
  'Brazil: Serie A Betano': 'Brasileirao'
  , 'Asia: AFC Elite': 'AFCChampionsLeague'
  , 'AFC Champions League': 'AFCChampionsLeague'
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
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.channel) {
              // Create keys for both possible orders
              const key1 = `${normalizeTeamName(data.home)}|${normalizeTeamName(data.away)}|${data.date}`;
              const key2 = `${normalizeTeamName(data.away)}|${normalizeTeamName(data.home)}|${data.date}`;
              channelMap.set(key1, data.channel);
              channelMap.set(key2, data.channel);
            }
          });
          console.log(`Found ${snapshot.size} upcoming games with channel data in ${collectionName}`);
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
    
    // Get today's date
    const nowInEastern = DateTime.now().setZone('America/New_York');
    const todayStr = nowInEastern.toISODate();
    console.log(`Today's date: ${todayStr}`);
    
    // Get today's games from sportsGames
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await gamesRef.where('gameDate', '==', todayStr).get();
    
    if (snapshot.empty) {
      console.log('❌ No games found for today');
      res.status(200).send('No games found for today');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} games for today`);
    
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
      const key = `${normalizeTeamName(game['Home Team'])}|${normalizeTeamName(game['Away Team'])}|${todayStr}`;
      const channel = channelMap.get(key);
      
      if (channel) {
        const docRef = gamesRef.doc(game.id);
        batch.update(docRef, { channel });
        updatedCount++;
        console.log(`✅ Added channel "${channel}" to ${game['Away Team']} @ ${game['Home Team']}`);
      } else {
        console.log(`❌ No channel found for ${game['Away Team']} @ ${game['Home Team']} (key: ${key})`);
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
