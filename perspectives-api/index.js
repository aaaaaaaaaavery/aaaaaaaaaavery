/**
 * Perspectives API
 * 
 * REST API endpoints to query content by perspective:
 * - /perspective/home - All content (global)
 * - /perspective/league/:leagueId - Content for a league
 * - /perspective/game/:gameId - Content for a specific game
 * - /perspective/team/:teamId - Content for a team
 * - /perspective/player/:playerId - Content for a player
 */

const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

/**
 * Query content by perspective
 */
async function queryPerspective(perspectiveType, perspectiveId, options = {}) {
  const {
    contentType = null, // 'article', 'video', 'social'
    limit = 50,
    sortBy = 'publishedAt', // 'publishedAt', 'matchScore', 'relevance'
    timeRange = null // 'today', 'week', 'month', or null for all
  } = options;
  
  let query = db.collection('perspectives/content');
  
  // Apply perspective filter
  switch (perspectiveType) {
    case 'home':
      // No filter - get all content
      break;
      
    case 'league':
      query = query.where('indexedLeagues', 'array-contains', perspectiveId);
      break;
      
    case 'game':
      query = query.where('indexedGameIds', 'array-contains', perspectiveId);
      break;
      
    case 'team':
      query = query.where('indexedTeams', 'array-contains', perspectiveId);
      break;
      
    case 'player':
      query = query.where('indexedPlayers', 'array-contains', perspectiveId);
      break;
      
    default:
      throw new Error(`Unknown perspective type: ${perspectiveType}`);
  }
  
  // Apply content type filter
  if (contentType) {
    query = query.where('indexedContentType', '==', contentType);
  }
  
  // Apply time range filter
  if (timeRange) {
    const { DateTime } = require('luxon');
    const now = DateTime.now();
    let startDate;
    
    switch (timeRange) {
      case 'today':
        startDate = now.startOf('day');
        break;
      case 'week':
        startDate = now.minus({ days: 7 });
        break;
      case 'month':
        startDate = now.minus({ days: 30 });
        break;
    }
    
    if (startDate) {
      query = query.where('indexedPublishedAt', '>=', admin.firestore.Timestamp.fromDate(startDate.toJSDate()));
    }
  }
  
  // Apply sorting
  if (sortBy === 'publishedAt') {
    query = query.orderBy('indexedPublishedAt', 'desc');
  } else if (sortBy === 'matchScore') {
    query = query.orderBy('matchScore', 'desc');
  }
  
  // Apply limit
  query = query.limit(limit);
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * GET /perspective/home
 * Get all content (global perspective)
 */
app.get('/perspective/home', async (req, res) => {
  try {
    const { contentType, limit, sortBy, timeRange } = req.query;
    const content = await queryPerspective('home', null, {
      contentType,
      limit: limit ? parseInt(limit) : 50,
      sortBy: sortBy || 'publishedAt',
      timeRange
    });
    
    res.json({
      perspective: 'home',
      count: content.length,
      content
    });
  } catch (error) {
    console.error('Error fetching home perspective:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /perspective/league/:leagueId
 * Get content for a league
 */
app.get('/perspective/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { contentType, limit, sortBy, timeRange } = req.query;
    
    const content = await queryPerspective('league', leagueId, {
      contentType,
      limit: limit ? parseInt(limit) : 50,
      sortBy: sortBy || 'publishedAt',
      timeRange
    });
    
    res.json({
      perspective: 'league',
      leagueId,
      count: content.length,
      content
    });
  } catch (error) {
    console.error('Error fetching league perspective:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /perspective/game/:gameId
 * Get content for a specific game
 */
app.get('/perspective/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { contentType, limit, sortBy } = req.query;
    
    const content = await queryPerspective('game', gameId, {
      contentType,
      limit: limit ? parseInt(limit) : 50,
      sortBy: sortBy || 'matchScore'
    });
    
    // Also get game details
    const gameRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const gameSnap = await gameRef.where('Game ID', '==', gameId).limit(1).get();
    const gameData = gameSnap.empty ? null : gameSnap.docs[0].data();
    
    res.json({
      perspective: 'game',
      gameId,
      game: gameData,
      count: content.length,
      content
    });
  } catch (error) {
    console.error('Error fetching game perspective:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /perspective/team/:teamId
 * Get content for a team
 */
app.get('/perspective/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { contentType, limit, sortBy, timeRange } = req.query;
    
    const content = await queryPerspective('team', teamId, {
      contentType,
      limit: limit ? parseInt(limit) : 50,
      sortBy: sortBy || 'publishedAt',
      timeRange
    });
    
    res.json({
      perspective: 'team',
      teamId,
      count: content.length,
      content
    });
  } catch (error) {
    console.error('Error fetching team perspective:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /perspective/player/:playerId
 * Get content for a player
 */
app.get('/perspective/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { contentType, limit, sortBy, timeRange } = req.query;
    
    const content = await queryPerspective('player', playerId, {
      contentType,
      limit: limit ? parseInt(limit) : 50,
      sortBy: sortBy || 'publishedAt',
      timeRange
    });
    
    res.json({
      perspective: 'player',
      playerId,
      count: content.length,
      content
    });
  } catch (error) {
    console.error('Error fetching player perspective:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'perspectives-api' });
});

app.listen(PORT, () => {
  console.log(`Perspectives API running on port ${PORT}`);
});


