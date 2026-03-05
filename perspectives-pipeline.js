// perspectives-pipeline.js
// Backend data pipeline for Perspectives feature
// Transforms league-wide content into game-specific content bundles

import admin from 'firebase-admin';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firestore
let db;
function initializeFirebase() {
  if (db) return db;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'
    });
  }
  db = admin.firestore();
  return db;
}

// =================================================================
// 1. NORMALIZED CONTENT SCHEMA
// =================================================================

/**
 * Normalize content from various sources to unified schema
 */
function normalizeContentItem(rawItem, type, source, league) {
  return {
    id: rawItem.id || rawItem.guid || rawItem.link || `${source}-${Date.now()}-${Math.random()}`,
    type: type, // 'news' | 'social' | 'video'
    source: source,
    league: league,
    title: (rawItem.title || '').trim(),
    description: (rawItem.description || rawItem.summary || rawItem.content || '').trim(),
    content: (rawItem.content || rawItem.text || '').trim(),
    url: rawItem.link || rawItem.url || '',
    thumbnail: rawItem.thumbnail || rawItem.image || rawItem.enclosure?.url || '',
    publishedAt: rawItem.pubDate || rawItem.publishedAt || rawItem.date || new Date().toISOString(),
    matchedTeams: []
  };
}

// =================================================================
// 2. ENTITY DICTIONARY FROM CSV
// =================================================================

// Cache for Google Sheets data (lifetime: process execution)
const keywordCache = new Map();

/**
 * Fetch CSV from Google Sheets URL
 * Returns parsed CSV records
 */
async function fetchKeywordCSVFromSheets(sheetsUrl) {
  try {
    const response = await fetch(sheetsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const csvContent = await response.text();
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.error(`[fetchKeywordCSVFromSheets] Error fetching ${sheetsUrl}:`, error.message);
    return [];
  }
}

/**
 * Load and parse CSV keyword file
 * Supports both local file paths and Google Sheets URLs
 * Format: Each column = team, rows = keywords (city, nickname, players, coaches)
 */
function loadKeywordCSV(csvPath) {
  try {
    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.error(`[loadKeywordCSV] Error loading ${csvPath}:`, error.message);
    return [];
  }
}

/**
 * Load keywords from CSV (local file or Google Sheets URL)
 * Uses cache for Google Sheets to avoid redundant fetches
 */
async function loadKeywords(source, league) {
  const cacheKey = `${league}-${source}`;
  
  // Check cache first
  if (keywordCache.has(cacheKey)) {
    console.log(`[loadKeywords] Using cached keywords for ${league}`);
    return keywordCache.get(cacheKey);
  }
  
  let records;
  
  // Determine if source is Google Sheets URL or local file
  if (source.startsWith('http://') || source.startsWith('https://')) {
    // Google Sheets URL
    console.log(`[loadKeywords] Fetching keywords from Google Sheets for ${league}`);
    records = await fetchKeywordCSVFromSheets(source);
  } else {
    // Local file path
    console.log(`[loadKeywords] Loading keywords from local file for ${league}`);
    records = loadKeywordCSV(source);
  }
  
  // Cache the result
  keywordCache.set(cacheKey, records);
  
  return records;
}

/**
 * Normalize keyword: lowercase, remove punctuation, trim
 */
function normalizeKeyword(keyword) {
  if (!keyword) return '';
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate entity dictionary from CSV (local file or Google Sheets URL)
 * Returns: { "league-team-id": { league, names: [...] } }
 */
async function generateEntityDictionary(keywordSource, league) {
  const records = await loadKeywords(keywordSource, league);
  const dictionary = {};
  
  // Each column header is a team name
  if (records.length === 0) return dictionary;
  
  const teamColumns = Object.keys(records[0]);
  
  teamColumns.forEach(teamName => {
    if (!teamName || teamName.trim() === '') return;
    
    // Generate team ID: league-team-name (normalized)
    const teamId = `${league}-${normalizeKeyword(teamName).replace(/\s+/g, '-')}`;
    const aliases = new Set();
    
    // Add team name variations
    aliases.add(normalizeKeyword(teamName));
    
    // Collect all keywords from this column
    records.forEach(record => {
      const keyword = record[teamName];
      if (keyword && keyword.trim()) {
        const normalized = normalizeKeyword(keyword);
        aliases.add(normalized);
        
        // For multi-word names, add last-name-only alias
        const words = normalized.split(' ');
        if (words.length > 1) {
          aliases.add(words[words.length - 1]); // Last name
        }
      }
    });
    
    dictionary[teamId] = {
      league: league,
      names: Array.from(aliases).filter(n => n.length > 0)
    };
  });
  
  return dictionary;
}

// =================================================================
// 3. TEAM MATCHING LOGIC
// =================================================================

/**
 * Detect teams mentioned in text
 * Returns array of teamIds
 */
function detectTeams(text, league, entityDictionary) {
  if (!text) return [];
  
  const normalizedText = normalizeKeyword(text);
  const matchedTeams = new Set();
  
  // Check each team's aliases
  Object.entries(entityDictionary).forEach(([teamId, teamData]) => {
    if (teamData.league !== league) return; // Don't match across leagues
    
    // Check if any alias appears in text
    const hasMatch = teamData.names.some(alias => {
      if (alias.length < 2) return false; // Skip single characters
      return normalizedText.includes(alias);
    });
    
    if (hasMatch) {
      matchedTeams.add(teamId);
    }
  });
  
  return Array.from(matchedTeams);
}

// =================================================================
// 4. GAME MATCHING LOGIC
// =================================================================

/**
 * Calculate relevance score for content item matching a game
 */
function calculateRelevanceScore(contentItem, teamA, teamB) {
  let score = 0;
  const text = `${contentItem.title} ${contentItem.description} ${contentItem.content || ''}`.toLowerCase();
  
  const teamAInTitle = contentItem.title.toLowerCase().includes(teamA.toLowerCase()) || 
                       contentItem.title.toLowerCase().includes(teamB.toLowerCase());
  const teamBInTitle = contentItem.title.toLowerCase().includes(teamA.toLowerCase()) || 
                       contentItem.title.toLowerCase().includes(teamB.toLowerCase());
  
  if (teamAInTitle && teamBInTitle) {
    score += 3; // Both teams in title
  } else if (teamAInTitle || teamBInTitle) {
    score += 1; // One team in title
  }
  
  // Check description
  const teamAInDesc = contentItem.description.toLowerCase().includes(teamA.toLowerCase()) || 
                      contentItem.description.toLowerCase().includes(teamB.toLowerCase());
  const teamBInDesc = contentItem.description.toLowerCase().includes(teamA.toLowerCase()) || 
                      contentItem.description.toLowerCase().includes(teamB.toLowerCase());
  
  if (teamAInDesc && teamBInDesc) {
    score += 2;
  } else if (teamAInDesc || teamBInDesc) {
    score += 1;
  }
  
  // Check body content
  if (contentItem.content) {
    const teamAInBody = contentItem.content.toLowerCase().includes(teamA.toLowerCase()) || 
                        contentItem.content.toLowerCase().includes(teamB.toLowerCase());
    const teamBInBody = contentItem.content.toLowerCase().includes(teamA.toLowerCase()) || 
                        contentItem.content.toLowerCase().includes(teamB.toLowerCase());
    
    if (teamAInBody && teamBInBody) {
      score += 1;
    }
  }
  
  // Proximity check: both teams within 50 words
  const words = text.split(/\s+/);
  const teamAIndices = [];
  const teamBIndices = [];
  
  words.forEach((word, idx) => {
    if (word.includes(teamA.toLowerCase()) || word.includes(teamB.toLowerCase())) {
      teamAIndices.push(idx);
    }
    if (word.includes(teamA.toLowerCase()) || word.includes(teamB.toLowerCase())) {
      teamBIndices.push(idx);
    }
  });
  
  // Check if any teamA index is within 50 words of any teamB index
  const hasProximity = teamAIndices.some(aIdx => 
    teamBIndices.some(bIdx => Math.abs(aIdx - bIdx) <= 50)
  );
  
  if (hasProximity && score === 0) {
    score = 4; // Proximity match
  }
  
  return score;
}

/**
 * Match content item to a game
 * Returns true if score >= 4
 */
function matchesGame(contentItem, game, entityDictionary) {
  const { teamA, teamB, league } = game;
  
  // Get team IDs from entity dictionary
  const teamAId = Object.keys(entityDictionary).find(id => 
    id.includes(normalizeKeyword(teamA).replace(/\s+/g, '-'))
  );
  const teamBId = Object.keys(entityDictionary).find(id => 
    id.includes(normalizeKeyword(teamB).replace(/\s+/g, '-'))
  );
  
  if (!teamAId || !teamBId) return false;
  
  // Check if content matches both teams
  const matchedTeams = detectTeams(
    `${contentItem.title} ${contentItem.description} ${contentItem.content || ''}`,
    league,
    entityDictionary
  );
  
  const hasBothTeams = matchedTeams.includes(teamAId) && matchedTeams.includes(teamBId);
  
  if (hasBothTeams) {
    return true;
  }
  
  // Check proximity match
  const score = calculateRelevanceScore(contentItem, teamA, teamB);
  return score >= 4;
}

// =================================================================
// 5. CONTENT FETCHING FROM SOURCES
// =================================================================

/**
 * Fetch content from RSS feed
 */
async function fetchRSSFeed(feedUrl, type, source, league) {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) return [];
    
    const xml = await response.text();
    const $ = cheerio.load(xml, { xml: true });
    const items = [];
    
    // Parse RSS or Atom
    const entries = $('item').length > 0 ? $('item') : $('entry');
    entries.each((i, elem) => {
      const $item = $(elem);
      const rawItem = {
        id: $item.find('guid, id').text().trim(),
        title: $item.find('title').text().trim(),
        description: $item.find('description, summary, content').text().trim(),
        link: $item.find('link').text().trim() || $item.find('link').attr('href') || '',
        pubDate: $item.find('pubDate, published, updated').text().trim(),
        thumbnail: $item.find('media\\:thumbnail').attr('url') || $item.find('enclosure[type^="image"]').attr('url') || ''
      };
      items.push(normalizeContentItem(rawItem, type, source, league));
    });
    
    return items;
  } catch (error) {
    console.error(`[fetchRSSFeed] Error fetching ${feedUrl}:`, error.message);
    return [];
  }
}

/**
 * Fetch content from rss-feed-service JSON endpoint
 */
async function fetchRSSServiceFeed(feedUrl, type, source, league) {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    
    const data = await response.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    
    return items.map(item => normalizeContentItem(item, type, source, league));
  } catch (error) {
    console.error(`[fetchRSSServiceFeed] Error fetching ${feedUrl}:`, error.message);
    return [];
  }
}

/**
 * Fetch manually entered social posts from Firestore
 */
async function fetchManualSocialPosts(league) {
  try {
    const db = initializeFirebase();
    const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    
    // Get all games for this league
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const todayGames = await gamesRef.where('gameDate', '==', todayStr).get();
    const yesterdayGames = await gamesRef.where('gameDate', '==', yesterdayStr).get();
    
    const allPosts = [];
    
    [todayGames, yesterdayGames].forEach(snapshot => {
      snapshot.forEach(doc => {
        const gameData = doc.data();
        const gameLeague = gameData['League'] || '';
        let gameLeagueName = gameLeague;
        if (gameLeague.includes(':')) {
          gameLeagueName = gameLeague.split(':').pop().trim();
        }
        
        if (gameLeagueName === league && gameData.social?.posts?.manual) {
          gameData.social.posts.manual.forEach(post => {
            allPosts.push(normalizeContentItem({
              id: post.id,
              title: post.text || post.title || '',
              description: post.text || post.description || '',
              link: post.url || '',
              pubDate: post.addedAt || new Date().toISOString(),
              thumbnail: post.image || ''
            }, 'social', 'manual', league));
          });
        }
      });
    });
    
    return allPosts;
  } catch (error) {
    console.error(`[fetchManualSocialPosts] Error:`, error.message);
    return [];
  }
}

// =================================================================
// 6. MAIN PIPELINE
// =================================================================

/**
 * Main pipeline: Process content and generate Perspectives artifacts
 */
async function runPerspectivesPipeline(config) {
  const {
    league,
    keywordSource, // Can be local file path or Google Sheets CSV URL
    contentSources = null, // If null, auto-load from perspectives-feed-config.js
    gameDate = null // null = today
  } = config;
  
  console.log(`[Perspectives] Starting pipeline for ${league}`);
  
  // 1. Generate entity dictionary from CSV/Google Sheets
  const entityDictionary = await generateEntityDictionary(keywordSource, league);
  console.log(`[Perspectives] Loaded ${Object.keys(entityDictionary).length} teams from ${keywordSource.startsWith('http') ? 'Google Sheets' : 'CSV file'}`);
  
  // 2. Auto-load feeds if not provided
  let feedSources = contentSources;
  if (!feedSources) {
    try {
      const { PERSPECTIVES_FEED_CONFIG } = await import('./perspectives-feed-config.js');
      const leagueFeeds = PERSPECTIVES_FEED_CONFIG[league];
      if (leagueFeeds) {
        feedSources = [
          ...leagueFeeds.news.map(f => ({ ...f, type: 'news' })),
          ...leagueFeeds.social.map(f => ({ ...f, type: 'social' })),
          ...leagueFeeds.videos.map(f => ({ ...f, type: 'video' }))
        ];
        console.log(`[Perspectives] Auto-loaded ${feedSources.length} feed sources for ${league}`);
      } else {
        console.warn(`[Perspectives] No feed config found for ${league}, using provided sources`);
      }
    } catch (error) {
      console.warn(`[Perspectives] Could not load feed config: ${error.message}, using provided sources`);
    }
  }
  
  if (!feedSources || feedSources.length === 0) {
    throw new Error(`No content sources provided for ${league}`);
  }
  
  // 3. Fetch all content
  const allContent = [];
  
  for (const source of feedSources) {
    let items = [];
    if (source.fetchMethod === 'rss') {
      items = await fetchRSSFeed(source.url, source.type, source.source, league);
    } else if (source.fetchMethod === 'rss-service') {
      items = await fetchRSSServiceFeed(source.url, source.type, source.source, league);
    }
    allContent.push(...items);
    console.log(`[Perspectives] Fetched ${items.length} ${source.type} items from ${source.source}`);
  }
  
  // 4. Add manual social posts
  const manualPosts = await fetchManualSocialPosts(league);
  allContent.push(...manualPosts);
  console.log(`[Perspectives] Added ${manualPosts.length} manual social posts`);
  
  // 5. Match content to teams
  allContent.forEach(item => {
    const text = `${item.title} ${item.description} ${item.content || ''}`;
    item.matchedTeams = detectTeams(text, league, entityDictionary);
  });
  
  // 6. Get games for the date
  const db = initializeFirebase();
  const gamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
  
  const targetDate = gameDate || new Date().toISOString().split('T')[0];
  const gamesSnapshot = await gamesRef.where('gameDate', '==', targetDate).get();
  
  const games = [];
  gamesSnapshot.forEach(doc => {
    const gameData = doc.data();
    const gameLeague = gameData['League'] || '';
    let gameLeagueName = gameLeague;
    if (gameLeague.includes(':')) {
      gameLeagueName = gameLeague.split(':').pop().trim();
    }
    
    if (gameLeagueName === league) {
      games.push({
        gameId: doc.id,
        league: gameLeagueName,
        teamA: gameData['Away Team'] || '',
        teamB: gameData['Home Team'] || '',
        startTime: gameData['Start Time'] || ''
      });
    }
  });
  
  console.log(`[Perspectives] Found ${games.length} games for ${targetDate}`);
  
  // 7. Match content to games and generate Perspectives
  for (const game of games) {
    const perspectives = {
      news: [],
      social: [],
      videos: []
    };
    
    allContent.forEach(item => {
      if (matchesGame(item, game, entityDictionary)) {
        perspectives[item.type].push(item);
      }
    });
    
    // 8. Write to Firestore
    const gameRef = gamesRef.doc(game.gameId);
    await gameRef.set({
      perspectives: perspectives
    }, { merge: true });
    
    console.log(`[Perspectives] Wrote ${perspectives.news.length} news, ${perspectives.social.length} social, ${perspectives.videos.length} videos for ${game.gameId}`);
  }
  
  console.log(`[Perspectives] Pipeline complete for ${league}`);
}

// =================================================================
// 7. EXPORT
// =================================================================

export {
  runPerspectivesPipeline,
  generateEntityDictionary,
  loadKeywords,
  detectTeams,
  matchesGame,
  normalizeContentItem
};

