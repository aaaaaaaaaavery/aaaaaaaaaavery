#!/usr/bin/env node

/**
 * Local cache refresh script for ALL custom RSS feeds
 * This script refreshes:
 * 1. All individual feeds (from /feeds endpoint)
 * 2. All bundles (from BUNDLE_CONFIGS)
 * 
 * Refresh intervals:
 * - Direct RSS feeds (isDirectRSS: true): Every 30 minutes
 * - Scraped feeds (website scraping): Every 3 hours (180 minutes)
 * 
 * Run this script every 30 minutes via cron to check and refresh feeds as needed
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SERVICE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to store last refresh times
const REFRESH_STATE_FILE = join(__dirname, '.refresh-state.json');

// Refresh intervals (in milliseconds)
const DIRECT_RSS_INTERVAL = 30 * 60 * 1000; // 30 minutes
const SCRAPED_FEED_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours (180 minutes)

// List of bundles to refresh (from bundle-rss.js BUNDLE_CONFIGS)
// Bundles are treated as scraped feeds (3 hour interval) since they combine multiple sources
const BUNDLES_TO_REFRESH = [
  'ncaaw-videos',
  'ncaam-videos',
  'home-videos',
  'tennis-videos',
  'soccer-videos',
  'ncaaf-highlights',
  'ncaaf-videos',
  'ncaaf-all',
  'nhl-all',
  'boxing-videos'
];

// Load refresh state from file
async function loadRefreshState() {
  try {
    const data = await fs.readFile(REFRESH_STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty state
    return {};
  }
}

// Save refresh state to file
async function saveRefreshState(state) {
  try {
    await fs.writeFile(REFRESH_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error(`⚠️  Could not save refresh state: ${error.message}`);
  }
}

async function refreshFeed(feedId, feedType = 'feed') {
  let url;
  if (feedType === 'bundle') {
    url = `${SERVICE_URL}/bundle/${feedId}.xml`;
  } else {
    url = `${SERVICE_URL}/feeds/${feedId}.xml`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'RSS-Feed-Refresh-Script/1.0'
      }
    });
    
    if (response.ok) {
      const timestamp = new Date().toISOString();
      const typeLabel = feedType === 'bundle' ? 'Bundle' : 'Feed';
      console.log(`✅ [${timestamp}] Refreshed ${typeLabel}: ${feedId} (${response.status})`);
      return true;
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed ${typeLabel}: ${feedId} (${response.status})`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error refreshing ${feedId}:`, error.message);
    return false;
  }
}

async function getAllFeeds() {
  try {
    const response = await fetch(`${SERVICE_URL}/feeds`, {
      headers: {
        'User-Agent': 'RSS-Feed-Refresh-Script/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.feeds; // Returns array of {id, url, title, isDirectRSS}
  } catch (error) {
    console.error(`⚠️  Could not fetch feed list from service: ${error.message}`);
    console.error(`   Using hardcoded feed list instead...\n`);
    
    // Fallback: hardcoded list (assume all are scraped if we can't get metadata)
    return [
      { id: 'mlb-com', isDirectRSS: false },
      { id: 'espn-mlb-rss', isDirectRSS: true },
      { id: 'cbs-mlb-rss', isDirectRSS: true },
      { id: 'yahoo-mlb-rss', isDirectRSS: true },
      { id: 'foxsports-mlb-api', isDirectRSS: true },
      { id: 'nba-com-news', isDirectRSS: false },
      { id: 'espn-nba-rss', isDirectRSS: true },
      { id: 'cbs-nba-rss', isDirectRSS: true },
      { id: 'yahoo-nba-rss', isDirectRSS: true },
      { id: 'nfl-com', isDirectRSS: false },
      { id: 'espn-nfl-rss', isDirectRSS: true },
      { id: 'cbs-nfl-rss', isDirectRSS: true },
      { id: 'yahoo-nfl-rss', isDirectRSS: true },
      { id: 'nhl-com-news', isDirectRSS: false },
      { id: 'espn-nhl-rss', isDirectRSS: true },
      { id: 'cbs-nhl-rss', isDirectRSS: true },
      { id: 'yahoo-nhl-rss', isDirectRSS: true },
      { id: 'hockeywriters', isDirectRSS: false },
      { id: 'hockeynews', isDirectRSS: true },
      { id: 'onefootball-home', isDirectRSS: false },
      { id: 'worldsoccertalk', isDirectRSS: false },
      { id: 'bundesliga-com', isDirectRSS: false }
    ];
  }
}

async function shouldRefresh(feedId, isDirectRSS, lastRefreshTime) {
  if (!lastRefreshTime) {
    return true; // Never refreshed, refresh now
  }
  
  const now = Date.now();
  const timeSinceRefresh = now - lastRefreshTime;
  const interval = isDirectRSS ? DIRECT_RSS_INTERVAL : SCRAPED_FEED_INTERVAL;
  
  return timeSinceRefresh >= interval;
}

async function refreshAllFeeds() {
  console.log(`\n🔄 Starting refresh check at ${new Date().toISOString()}\n`);
  
  // Load refresh state
  const refreshState = await loadRefreshState();
  
  // Get all individual feeds with metadata
  console.log('📡 Fetching list of available feeds...');
  const allFeeds = await getAllFeeds();
  console.log(`   Found ${allFeeds.length} individual feed(s)\n`);
  
  // Separate feeds by type
  const directRSSFeeds = allFeeds.filter(feed => feed.isDirectRSS);
  const newsnowFeeds = allFeeds.filter(feed => feed.id && feed.id.startsWith('newsnow-'));
  const youtubeFeeds = allFeeds.filter(feed => feed.id && feed.id.startsWith('youtube-'));
  const scrapedFeeds = allFeeds.filter(feed => !feed.isDirectRSS && !(feed.id && feed.id.startsWith('newsnow-')) && !(feed.id && feed.id.startsWith('youtube-')));
  
  console.log(`📊 Feed breakdown:`);
  console.log(`   Direct RSS feeds: ${directRSSFeeds.length}`);
  console.log(`   NewsNow feeds: ${newsnowFeeds.length} (30 min refresh)`);
  console.log(`   YouTube feeds: ${youtubeFeeds.length} (30 min refresh)`);
  console.log(`   Other scraped feeds: ${scrapedFeeds.length}\n`);
  
  // Check which feeds need refreshing
  const feedsToRefresh = [];
  
  // Check direct RSS feeds (30 min interval)
  for (const feed of directRSSFeeds) {
    const lastRefresh = refreshState[feed.id];
    if (shouldRefresh(feed.id, true, lastRefresh)) {
      feedsToRefresh.push({ ...feed, type: 'feed', reason: 'direct-rss' });
    }
  }
  
  // Check NewsNow feeds (30 min interval - same as direct RSS for fast updates)
  for (const feed of newsnowFeeds) {
    const lastRefresh = refreshState[feed.id];
    if (shouldRefresh(feed.id, true, lastRefresh)) { // Use DIRECT_RSS_INTERVAL (30 min)
      feedsToRefresh.push({ ...feed, type: 'feed', reason: 'newsnow' });
    }
  }
  
  // Check YouTube feeds (30 min interval - API/native RSS based, should refresh frequently)
  for (const feed of youtubeFeeds) {
    const lastRefresh = refreshState[feed.id];
    if (shouldRefresh(feed.id, true, lastRefresh)) { // Use DIRECT_RSS_INTERVAL (30 min)
      feedsToRefresh.push({ ...feed, type: 'feed', reason: 'youtube' });
    }
  }
  
  // Check other scraped feeds (3 hour interval)
  for (const feed of scrapedFeeds) {
    const lastRefresh = refreshState[feed.id];
    if (shouldRefresh(feed.id, false, lastRefresh)) {
      feedsToRefresh.push({ ...feed, type: 'feed', reason: 'scraped' });
    }
  }
  
  // Check bundles (treat as scraped - 3 hour interval)
  for (const bundleId of BUNDLES_TO_REFRESH) {
    const lastRefresh = refreshState[`bundle-${bundleId}`];
    if (shouldRefresh(`bundle-${bundleId}`, false, lastRefresh)) {
      feedsToRefresh.push({ id: bundleId, type: 'bundle', reason: 'scraped' });
    }
  }
  
  if (feedsToRefresh.length === 0) {
    console.log('✅ All feeds are up to date. No refresh needed.\n');
    return;
  }
  
  console.log(`🔄 Refreshing ${feedsToRefresh.length} feed(s) and bundle(s)...\n`);
  
  // Group by reason for logging
  const directRSSCount = feedsToRefresh.filter(f => f.reason === 'direct-rss').length;
  const newsnowCount = feedsToRefresh.filter(f => f.reason === 'newsnow').length;
  const youtubeCount = feedsToRefresh.filter(f => f.reason === 'youtube').length;
  const scrapedCount = feedsToRefresh.filter(f => f.reason === 'scraped').length;
  
  if (directRSSCount > 0) {
    console.log(`   Direct RSS feeds: ${directRSSCount}`);
  }
  if (newsnowCount > 0) {
    console.log(`   NewsNow feeds: ${newsnowCount}`);
  }
  if (youtubeCount > 0) {
    console.log(`   YouTube feeds: ${youtubeCount}`);
  }
  if (scrapedCount > 0) {
    console.log(`   Other scraped feeds/bundles: ${scrapedCount}`);
  }
  console.log('');
  
  // Refresh all feeds that need it
  const refreshPromises = feedsToRefresh.map(async (feed) => {
    const success = await refreshFeed(feed.id, feed.type);
    if (success) {
      // Update refresh time
      const stateKey = feed.type === 'bundle' ? `bundle-${feed.id}` : feed.id;
      refreshState[stateKey] = Date.now();
    }
    return success;
  });
  
  const results = await Promise.all(refreshPromises);
  
  // Save updated state
  await saveRefreshState(refreshState);
  
  // Summary
  const successCount = results.filter(r => r === true).length;
  const failCount = results.filter(r => r === false).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`   Refreshed: ${feedsToRefresh.length} feed(s) and bundle(s)`);
  console.log(`   ✅ Succeeded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}\n`);
  
  // Exit with error code if any failed
  process.exit(failCount > 0 ? 1 : 0);
}

// Run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('refresh-bundle.js')) {
  refreshAllFeeds();
}

export { refreshFeed, refreshAllFeeds, getAllFeeds };
