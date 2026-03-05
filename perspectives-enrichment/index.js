/**
 * Perspectives Enrichment Service
 * 
 * This service enriches RSS feed items with entity extraction (teams, players, games)
 * and stores them in Firestore with perspective tags for fast querying.
 * 
 * Architecture:
 * 1. RSS feeds → Raw items
 * 2. Enrichment → Extract teams, players, match to games
 * 3. Store in Firestore with perspective tags
 * 4. Query by perspective (Home/League/Game/Team/Player)
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Team name normalization dictionary
// This will be expanded from your existing TEAM_DISPLAY_MAP
const TEAM_VARIATIONS = {
  // NFL
  'CLE': ['browns', 'cleveland browns', 'cleveland', 'cle'],
  'BUF': ['bills', 'buffalo bills', 'buffalo', 'buf'],
  'KC': ['chiefs', 'kansas city chiefs', 'kansas city', 'kc'],
  'DAL': ['cowboys', 'dallas cowboys', 'dallas', 'dal'],
  // Add more teams as needed
};

// League keywords for matching
const LEAGUE_KEYWORDS = {
  'NFL': ['nfl', 'national football league', 'football'],
  'NBA': ['nba', 'national basketball association', 'basketball'],
  'MLB': ['mlb', 'major league baseball', 'baseball'],
  'NHL': ['nhl', 'national hockey league', 'hockey'],
  'NCAAF': ['ncaa football', 'college football', 'ncaaf'],
  'NCAAM': ['ncaa basketball', 'college basketball', 'ncaam', 'march madness'],
  'NCAAW': ['ncaa women', 'women\'s basketball', 'ncaaw'],
};

/**
 * Normalize team name for matching
 */
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, '');
}

/**
 * Extract team mentions from text
 */
function extractTeams(text) {
  const normalized = normalizeTeamName(text);
  const found = [];
  
  for (const [code, variations] of Object.entries(TEAM_VARIATIONS)) {
    for (const variation of variations) {
      if (normalized.includes(variation)) {
        found.push(code);
        break;
      }
    }
  }
  
  return found;
}

/**
 * Extract league mentions from text
 */
function extractLeagues(text) {
  const normalized = text.toLowerCase();
  const found = [];
  
  for (const [league, keywords] of Object.entries(LEAGUE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        found.push(league);
        break;
      }
    }
  }
  
  return found;
}

/**
 * Match content to games
 */
async function matchToGames(teams, leagues, publishedAt) {
  const gameMatches = [];
  
  if (teams.length < 2) {
    return gameMatches; // Need at least 2 teams for a game match
  }
  
  try {
    // Query Firestore for games with these teams
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    
    // Get games from today and yesterday (within 48 hours)
    const { DateTime } = require('luxon');
    const today = DateTime.now().setZone('America/Denver').toISODate();
    const yesterday = DateTime.now().setZone('America/Denver').minus({ days: 1 }).toISODate();
    
    const queries = [
      gamesRef.where('gameDate', '==', today).get(),
      gamesRef.where('gameDate', '==', yesterday).get()
    ];
    
    const [todaySnap, yesterdaySnap] = await Promise.all(queries);
    const allGames = [...todaySnap.docs, ...yesterdaySnap.docs].map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Match games where both teams are present
    for (const game of allGames) {
      const homeTeam = normalizeTeamName(game['Home Team'] || '');
      const awayTeam = normalizeTeamName(game['Away Team'] || '');
      
      const homeMatches = teams.some(t => {
        const teamVariations = TEAM_VARIATIONS[t] || [];
        return teamVariations.some(v => homeTeam.includes(v) || v.includes(homeTeam));
      });
      
      const awayMatches = teams.some(t => {
        const teamVariations = TEAM_VARIATIONS[t] || [];
        return teamVariations.some(v => awayTeam.includes(v) || v.includes(awayTeam));
      });
      
      if (homeMatches && awayMatches) {
        // Calculate match score based on time proximity
        const gameTime = game['Start Time']?.toDate() || new Date();
        const timeDiff = Math.abs(publishedAt - gameTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        let score = 0.8; // Base score for team match
        if (hoursDiff < 24) score = 1.0; // Within 24 hours
        else if (hoursDiff < 48) score = 0.9; // Within 48 hours
        
        gameMatches.push({
          gameId: game['Game ID'] || game.id,
          gameData: game,
          score: score
        });
      }
    }
    
  } catch (error) {
    console.error('Error matching to games:', error);
  }
  
  return gameMatches;
}

/**
 * Enrich an RSS feed item
 */
async function enrichItem(item) {
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  
  // Extract entities
  const teams = extractTeams(text);
  const leagues = extractLeagues(text);
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : new Date();
  
  // Match to games
  const gameMatches = await matchToGames(teams, leagues, publishedAt);
  
  // Build perspectives
  const perspectives = {
    home: true, // Always available at home level
    leagues: leagues,
    games: gameMatches.map(m => m.gameId),
    teams: teams,
    players: [] // TODO: Add player extraction
  };
  
  return {
    ...item,
    teams,
    leagues,
    gameMatches,
    perspectives,
    enrichedAt: new Date().toISOString()
  };
}

/**
 * Store enriched item in Firestore
 */
async function storeEnrichedItem(enriched) {
  try {
    const contentRef = db.collection('perspectives/content');
    
    // Create document with ID based on source + original ID
    const docId = `${enriched.source}_${enriched.id || Date.now()}`;
    
    const docData = {
      ...enriched,
      // Index fields for fast querying
      indexedTeams: enriched.teams,
      indexedLeagues: enriched.leagues,
      indexedGameIds: enriched.gameMatches.map(m => m.gameId),
      indexedContentType: enriched.contentType || 'article',
      indexedPublishedAt: admin.firestore.Timestamp.fromDate(new Date(enriched.publishedAt)),
      indexedEnrichedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await contentRef.doc(docId).set(docData, { merge: true });
    
    return docId;
  } catch (error) {
    console.error('Error storing enriched item:', error);
    throw error;
  }
}

/**
 * Process RSS feed and enrich items
 */
async function processRSSFeed(feedUrl, sourceId) {
  try {
    console.log(`Processing RSS feed: ${feedUrl}`);
    
    // Fetch RSS feed from our service
    const serviceUrl = 'https://rss-feed-service-124291936014.us-central1.run.app';
    const response = await fetch(`${serviceUrl}/feeds/${sourceId}.xml`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    const { parseString } = require('xml2js');
    
    return new Promise((resolve, reject) => {
      parseString(xml, async (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const items = result.rss?.channel?.[0]?.item || [];
        const enrichedItems = [];
        
        for (const item of items.slice(0, 20)) { // Process first 20 items
          const enriched = await enrichItem({
            id: item.guid?.[0]?._ || item.link?.[0],
            title: item.title?.[0] || '',
            description: item.description?.[0] || '',
            link: item.link?.[0] || '',
            publishedAt: item.pubDate?.[0] || new Date().toISOString(),
            source: sourceId,
            contentType: 'article'
          });
          
          await storeEnrichedItem(enriched);
          enrichedItems.push(enriched);
        }
        
        resolve(enrichedItems);
      });
    });
  } catch (error) {
    console.error(`Error processing RSS feed ${feedUrl}:`, error);
    throw error;
  }
}

/**
 * Main enrichment function
 */
async function enrichAllFeeds() {
  const feeds = [
    'newsnow-nfl',
    'newsnow-nba',
    'espn-nfl-rss',
    'espn-nba-rss',
    // Add more feeds
  ];
  
  console.log(`Starting enrichment for ${feeds.length} feeds...`);
  
  for (const feedId of feeds) {
    try {
      await processRSSFeed(feedId, feedId);
      console.log(`✅ Processed ${feedId}`);
    } catch (error) {
      console.error(`❌ Error processing ${feedId}:`, error.message);
    }
  }
  
  console.log('Enrichment complete!');
}

// Export functions
module.exports = {
  enrichItem,
  storeEnrichedItem,
  processRSSFeed,
  enrichAllFeeds,
  extractTeams,
  extractLeagues,
  matchToGames
};

// Run if called directly
if (require.main === module) {
  enrichAllFeeds().then(() => {
    console.log('Done!');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}


