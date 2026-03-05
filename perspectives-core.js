// perspectives-core.js
// Core functions for Perspectives system: Firestore operations, matching, deduplication

import admin from 'firebase-admin';
import { DateTime } from 'luxon';
import { detectPlatform, extractPostId } from './perspectives-config.js';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

// Initialize Firestore (reuse existing initialization pattern)
let db;
function getFirestore() {
  if (db) return db;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: FIREBASE_PROJECT_ID
    });
  }
  db = admin.firestore();
  return db;
}

/**
 * Add a manual social post to a game
 * @param {string} gameId - The game's Game ID
 * @param {string} url - The social post URL
 * @param {object} options - Additional options
 * @param {number} options.priority - Priority (100=viral, 75=highlight, 50=normal, 25=low)
 * @param {string} options.sourceType - 'fan' | 'official' | 'media'
 * @param {string} options.addedBy - Who added it (default: 'admin')
 * @param {string} options.notes - Optional notes
 * @param {array} options.tags - Optional tags array
 */
export async function addManualPost(gameId, url, options = {}) {
  const db = getFirestore();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`);
  const gameRef = gamesRef.doc(String(gameId));
  
  const platform = detectPlatform(url);
  const postId = extractPostId(platform, url);
  
  if (!postId) {
    throw new Error(`Could not extract post ID from URL: ${url}`);
  }
  
  const postIdNormalized = `${platform}_${postId}`;
  
  const manualPost = {
    id: postIdNormalized,
    platform: platform,
    url: url,
    sourceType: options.sourceType || 'fan',
    addedBy: options.addedBy || 'admin',
    addedAt: new Date().toISOString(),
    priority: options.priority || 50,
    tags: options.tags || ['manual'],
    notes: options.notes || null
  };
  
  // Use Firestore arrayUnion to add to manual array
  await gameRef.update({
    'social.posts.manual': admin.firestore.FieldValue.arrayUnion(manualPost)
  });
  
  console.log(`✅ Added manual post ${postIdNormalized} to game ${gameId}`);
  return manualPost;
}

/**
 * Get all social posts for a game (merged automated + manual, deduplicated, sorted)
 * @param {string} gameId - The game's Game ID
 * @returns {Promise<Array>} Array of posts sorted by priority and recency
 */
export async function getGameSocialPosts(gameId) {
  const db = getFirestore();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`);
  const gameDoc = await gamesRef.doc(String(gameId)).get();
  
  if (!gameDoc.exists) {
    throw new Error(`Game ${gameId} not found`);
  }
  
  const gameData = gameDoc.data();
  const automated = gameData?.social?.posts?.automated || {};
  const manual = gameData?.social?.posts?.manual || [];
  
  // Flatten automated posts from all platforms
  const automatedPosts = [];
  for (const [platform, posts] of Object.entries(automated)) {
    if (Array.isArray(posts)) {
      posts.forEach(post => {
        automatedPosts.push({
          ...post,
          platform: platform,
          priority: post.priority || 20,
          source: 'automated'
        });
      });
    }
  }
  
  // Create deduplication map (manual overrides automated)
  const postMap = new Map();
  
  // Add automated first
  automatedPosts.forEach(post => {
    const id = post.id || `${post.platform}_${extractPostId(post.platform, post.url)}`;
    if (id) {
      postMap.set(id, post);
    }
  });
  
  // Manual overrides automated
  manual.forEach(post => {
    postMap.set(post.id, {
      ...post,
      source: 'manual'
    });
  });
  
  // Sort by priority (desc), then recency (desc)
  const sortedPosts = Array.from(postMap.values()).sort((a, b) => {
    // Priority first
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then recency
    const aTime = new Date(a.addedAt || a.timestamp || 0).getTime();
    const bTime = new Date(b.addedAt || b.timestamp || 0).getTime();
    return bTime - aTime;
  });
  
  return sortedPosts;
}

/**
 * Match a post to games based on team names and time proximity
 * @param {object} post - Post object with title, description, url, timestamp
 * @param {string} league - League name (optional filter)
 * @returns {Promise<Array>} Array of matching game IDs
 */
export async function matchPostToGames(post, league = null) {
  const db = getFirestore();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`);
  
  // Extract text to search
  const searchText = `${post.title || ''} ${post.description || ''}`.toLowerCase();
  
  // Get all active/live games (or recent games within 48 hours)
  const now = DateTime.now().setZone('America/New_York');
  const twoDaysAgo = now.minus({ days: 2 });
  const twoDaysFromNow = now.plus({ days: 2 });
  
  let query = gamesRef
    .where('Start Time', '>=', admin.firestore.Timestamp.fromDate(twoDaysAgo.toJSDate()))
    .where('Start Time', '<=', admin.firestore.Timestamp.fromDate(twoDaysFromNow.toJSDate()));
  
  if (league) {
    query = query.where('League', '==', league);
  }
  
  const snapshot = await query.get();
  const matchingGames = [];
  
  snapshot.docs.forEach(doc => {
    const game = doc.data();
    const homeTeam = (game['Home Team'] || '').toLowerCase();
    const awayTeam = (game['Away Team'] || '').toLowerCase();
    const leagueName = (game.League || '').toLowerCase();
    
    // Simple matching: check if both team names appear in post text
    // Or if league name appears and at least one team appears
    const hasHomeTeam = searchText.includes(homeTeam) || searchText.includes(homeTeam.split(' ').pop());
    const hasAwayTeam = searchText.includes(awayTeam) || searchText.includes(awayTeam.split(' ').pop());
    const hasLeague = searchText.includes(leagueName);
    
    // Match if both teams found, or league + one team found
    if ((hasHomeTeam && hasAwayTeam) || (hasLeague && (hasHomeTeam || hasAwayTeam))) {
      matchingGames.push({
        gameId: game['Game ID'],
        score: (hasHomeTeam && hasAwayTeam) ? 0.9 : 0.6, // Higher score for both teams
        game: game
      });
    }
  });
  
  // Sort by match score
  matchingGames.sort((a, b) => b.score - a.score);
  
  return matchingGames;
}

/**
 * Add an automated post to a game
 * @param {string} gameId - The game's Game ID
 * @param {object} post - Post object
 * @param {string} platform - Platform name ('x', 'mastodon', 'youtube', 'rss')
 */
export async function addAutomatedPost(gameId, post, platform) {
  const db = getFirestore();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`);
  const gameRef = gamesRef.doc(String(gameId));
  
  // Normalize post ID
  const postId = post.id || `${platform}_${extractPostId(platform, post.url)}`;
  
  const automatedPost = {
    id: postId,
    platform: platform,
    url: post.url,
    title: post.title || null,
    description: post.description || null,
    timestamp: post.timestamp || new Date().toISOString(),
    source: post.source || 'automated',
    priority: post.priority || 20
  };
  
  // Initialize social.posts.automated if it doesn't exist
  const gameDoc = await gameRef.get();
  const gameData = gameDoc.data() || {};
  
  if (!gameData.social) {
    await gameRef.set({ social: { posts: { automated: {}, manual: [] } } }, { merge: true });
  } else if (!gameData.social.posts) {
    await gameRef.set({ 'social.posts': { automated: {}, manual: [] } }, { merge: true });
  } else if (!gameData.social.posts.automated) {
    await gameRef.set({ 'social.posts.automated': {} }, { merge: true });
  }
  
  // Add to platform-specific array
  const platformKey = `social.posts.automated.${platform}`;
  await gameRef.update({
    [platformKey]: admin.firestore.FieldValue.arrayUnion(automatedPost)
  });
  
  console.log(`✅ Added automated ${platform} post ${postId} to game ${gameId}`);
  return automatedPost;
}

/**
 * Ensure game document has social structure initialized
 * @param {string} gameId - The game's Game ID
 */
export async function ensureGameSocialStructure(gameId) {
  const db = getFirestore();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`);
  const gameRef = gamesRef.doc(String(gameId));
  
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    throw new Error(`Game ${gameId} not found`);
  }
  
  const gameData = gameDoc.data();
  if (!gameData.social) {
    await gameRef.set({
      social: {
        posts: {
          automated: {},
          manual: []
        }
      }
    }, { merge: true });
  }
}

