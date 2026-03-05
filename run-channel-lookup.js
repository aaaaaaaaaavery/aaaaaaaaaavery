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
  'England: Premier League': 'PremierLeague'
};

// Team name mappings for better matching
const TEAM_NAME_MAPPINGS = {
  // NFL
  'bills': ['buffalo bills', 'bills'],
  'jets': ['new york jets', 'jets'],
  'patriots': ['new england patriots', 'patriots'],
  'dolphins': ['miami dolphins', 'dolphins'],
  'ravens': ['baltimore ravens', 'ravens'],
  'bengals': ['cincinnati bengals', 'bengals'],
  'browns': ['cleveland browns', 'browns'],
  'steelers': ['pittsburgh steelers', 'steelers'],
  'texans': ['houston texans', 'texans'],
  'colts': ['indianapolis colts', 'colts'],
  'jaguars': ['jacksonville jaguars', 'jaguars'],
  'titans': ['tennessee titans', 'titans'],
  'broncos': ['denver broncos', 'broncos'],
  'chiefs': ['kansas city chiefs', 'chiefs'],
  'raiders': ['las vegas raiders', 'raiders'],
  'chargers': ['los angeles chargers', 'chargers'],
  'cowboys': ['dallas cowboys', 'cowboys'],
  'giants': ['new york giants', 'giants'],
  'eagles': ['philadelphia eagles', 'eagles'],
  'commanders': ['washington commanders', 'commanders'],
  'bears': ['chicago bears', 'bears'],
  'lions': ['detroit lions', 'lions'],
  'packers': ['green bay packers', 'packers'],
  'vikings': ['minnesota vikings', 'vikings'],
  'falcons': ['atlanta falcons', 'falcons'],
  'panthers': ['carolina panthers', 'panthers'],
  'saints': ['new orleans saints', 'saints'],
  'buccaneers': ['tampa bay buccaneers', 'buccaneers'],
  'cardinals': ['arizona cardinals', 'cardinals'],
  'rams': ['los angeles rams', 'rams'],
  '49ers': ['san francisco 49ers', '49ers'],
  'seahawks': ['seattle seahawks', 'seahawks'],

  // NBA
  'bucks': ['milwaukee bucks', 'bucks'],
  'pelicans': ['new orleans pelicans', 'pelicans'],
  'bulls': ['chicago bulls', 'bulls'],
  'cavaliers': ['cleveland cavaliers', 'cavaliers', 'cavs'],
  'celtics': ['boston celtics', 'celtics'],
  'mavericks': ['dallas mavericks', 'mavericks', 'mavs'],
  'nuggets': ['denver nuggets', 'nuggets'],
  'pistons': ['detroit pistons', 'pistons'],
  'warriors': ['golden state warriors', 'warriors'],
  'rockets': ['houston rockets', 'rockets'],
  'pacers': ['indiana pacers', 'pacers'],
  'clippers': ['los angeles clippers', 'clippers'],
  'lakers': ['los angeles lakers', 'lakers'],
  'grizzlies': ['memphis grizzlies', 'grizzlies'],
  'heat': ['miami heat', 'heat'],
  'timberwolves': ['minnesota timberwolves', 'timberwolves', 'wolves'],
  'nets': ['brooklyn nets', 'nets'],
  'knicks': ['new york knicks', 'knicks'],
  'magic': ['orlando magic', 'magic'],
  '76ers': ['philadelphia 76ers', '76ers'],
  'suns': ['phoenix suns', 'suns'],
  'trail blazers': ['portland trail blazers', 'trail blazers', 'blazers'],
  'kings': ['sacramento kings', 'kings'],
  'spurs': ['san antonio spurs', 'spurs'],
  'raptors': ['toronto raptors', 'raptors'],
  'jazz': ['utah jazz', 'jazz'],
  'wizards': ['washington wizards', 'wizards'],
  'hornets': ['charlotte hornets', 'hornets'],
  'hawks': ['atlanta hawks', 'hawks'],
  'thunder': ['oklahoma city thunder', 'thunder'],

  // MLB
  'yankees': ['new york yankees', 'yankees'],
  'red sox': ['boston red sox', 'red sox'],
  'rays': ['tampa bay rays', 'rays'],
  'blue jays': ['toronto blue jays', 'blue jays'],
  'orioles': ['baltimore orioles', 'orioles'],
  'white sox': ['chicago white sox', 'white sox'],
  'guardians': ['cleveland guardians', 'guardians'],
  'tigers': ['detroit tigers', 'tigers'],
  'royals': ['kansas city royals', 'royals'],
  'twins': ['minnesota twins', 'twins'],
  'astros': ['houston astros', 'astros'],
  'angels': ['los angeles angels', 'angels'],
  'athletics': ['oakland athletics', 'athletics', 'a\'s'],
  'mariners': ['seattle mariners', 'mariners'],
  'rangers': ['texas rangers', 'rangers'],
  'braves': ['atlanta braves', 'braves'],
  'marlins': ['miami marlins', 'marlins'],
  'mets': ['new york mets', 'mets'],
  'phillies': ['philadelphia phillies', 'phillies'],
  'nationals': ['washington nationals', 'nationals'],
  'cubs': ['chicago cubs', 'cubs'],
  'reds': ['cincinnati reds', 'reds'],
  'brewers': ['milwaukee brewers', 'brewers'],
  'pirates': ['pittsburgh pirates', 'pirates'],
  'cardinals': ['st louis cardinals', 'cardinals'],
  'diamondbacks': ['arizona diamondbacks', 'diamondbacks'],
  'rockies': ['colorado rockies', 'rockies'],
  'dodgers': ['los angeles dodgers', 'dodgers'],
  'padres': ['san diego padres', 'padres'],
  'giants': ['san francisco giants', 'giants'],

  // NHL
  'bruins': ['boston bruins', 'bruins'],
  'sabres': ['buffalo sabres', 'sabres'],
  'red wings': ['detroit red wings', 'red wings'],
  'panthers': ['florida panthers', 'panthers'],
  'canadiens': ['montreal canadiens', 'canadiens'],
  'senators': ['ottawa senators', 'senators'],
  'lightning': ['tampa bay lightning', 'lightning'],
  'maple leafs': ['toronto maple leafs', 'maple leafs', 'leafs'],
  'hurricanes': ['carolina hurricanes', 'hurricanes'],
  'blue jackets': ['columbus blue jackets', 'blue jackets'],
  'devils': ['new jersey devils', 'devils'],
  'islanders': ['new york islanders', 'islanders'],
  'rangers': ['new york rangers', 'rangers'],
  'flyers': ['philadelphia flyers', 'flyers'],
  'penguins': ['pittsburgh penguins', 'penguins'],
  'capitals': ['washington capitals', 'capitals'],
  'blackhawks': ['chicago blackhawks', 'blackhawks'],
  'avalanche': ['colorado avalanche', 'avalanche'],
  'stars': ['dallas stars', 'stars'],
  'wild': ['minnesota wild', 'wild'],
  'predators': ['nashville predators', 'predators'],
  'blues': ['st louis blues', 'blues'],
  'jets': ['winnipeg jets', 'jets'],
  'ducks': ['anaheim ducks', 'ducks'],
  'coyotes': ['arizona coyotes', 'coyotes'],
  'flames': ['calgary flames', 'flames'],
  'oilers': ['edmonton oilers', 'oilers'],
  'kings': ['los angeles kings', 'kings'],
  'sharks': ['san jose sharks', 'sharks'],
  'kraken': ['seattle kraken', 'kraken'],
  'canucks': ['vancouver canucks', 'canucks'],
  'golden knights': ['vegas golden knights', 'golden knights', 'knights']
};

// Normalize team names for matching
function normalizeTeamName(name) {
  if (!name) return '';
  
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
  
  // Check if this is a known team name and return all possible variations
  for (const [key, variations] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (variations.includes(cleanName)) {
      // Return all variations for this team to maximize matching chances
      return variations.map(v => v.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim());
    }
  }
  
  // If no mapping found, return the cleaned name as-is
  return [cleanName];
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
              // Get all possible variations for both teams
              const homeVariations = normalizeTeamName(data.home);
              const awayVariations = normalizeTeamName(data.away);
              
              // Create keys for all possible combinations
              for (const homeVar of homeVariations) {
                for (const awayVar of awayVariations) {
                  const key = `${homeVar}|${awayVar}|${data.date}`;
                  channelMap.set(key, data.channel);
                }
              }
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

async function runChannelLookup() {
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
      // Get all possible variations for both teams
      const homeVariations = normalizeTeamName(game['Home Team']);
      const awayVariations = normalizeTeamName(game['Away Team']);
      
      let channel = null;
      let matchedKey = null;
      
      // Try all possible combinations to find a match
      for (const homeVar of homeVariations) {
        for (const awayVar of awayVariations) {
          const key = `${homeVar}|${awayVar}|${todayStr}`;
          if (channelMap.has(key)) {
            channel = channelMap.get(key);
            matchedKey = key;
            break;
          }
        }
        if (channel) break; // Found a match, stop searching
      }
      
      if (channel) {
        const docRef = gamesRef.doc(game.id);
        batch.update(docRef, { channel });
        updatedCount++;
        console.log(`✅ Added channel "${channel}" to ${game['Away Team']} @ ${game['Home Team']} (matched key: ${matchedKey})`);
      } else {
        console.log(`❌ No channel found for ${game['Away Team']} @ ${game['Home Team']}`);
        console.log(`   Tried variations: Home: [${homeVariations.join(', ')}], Away: [${awayVariations.join(', ')}]`);
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`🎉 Successfully updated ${updatedCount} games with channel data`);
    } else {
      console.log('⚠️  No channel data found to update');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Error in channel lookup:', error);
    process.exit(1);
  }
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
      // Get all possible variations for both teams
      const homeVariations = normalizeTeamName(game['Home Team']);
      const awayVariations = normalizeTeamName(game['Away Team']);
      
      let channel = null;
      let matchedKey = null;
      
      // Try all possible combinations to find a match
      for (const homeVar of homeVariations) {
        for (const awayVar of awayVariations) {
          const key = `${homeVar}|${awayVar}|${todayStr}`;
          if (channelMap.has(key)) {
            channel = channelMap.get(key);
            matchedKey = key;
            break;
          }
        }
        if (channel) break; // Found a match, stop searching
      }
      
      if (channel) {
        const docRef = gamesRef.doc(game.id);
        batch.update(docRef, { channel });
        updatedCount++;
        console.log(`✅ Added channel "${channel}" to ${game['Away Team']} @ ${game['Home Team']} (matched key: ${matchedKey})`);
      } else {
        console.log(`❌ No channel found for ${game['Away Team']} @ ${game['Home Team']}`);
        console.log(`   Tried variations: Home: [${homeVariations.join(', ')}], Away: [${awayVariations.join(', ')}]`);
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

// Keep the original function for local testing
runChannelLookup();
