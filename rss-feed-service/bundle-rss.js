import express from 'express';
import fetch from 'node-fetch';
import RSS from 'rss';
import NodeCache from 'node-cache';
import * as cheerio from 'cheerio';
import { generateChannelRSS, generatePlaylistRSS } from './youtube-rss.js';

// Mapping of feed IDs to channel handles/playlist IDs for YouTube feeds
// This avoids circular dependency with index.js
const YOUTUBE_FEED_MAP = {
  // Channels
  'youtube-nba': { type: 'channel', id: 'NBA' },
  'youtube-nfl': { type: 'channel', id: 'NFL' },
  'youtube-mlb': { type: 'channel', id: 'MLB' },
  'youtube-nhl': { type: 'channel', id: 'NHL' },
  'youtube-formula1': { type: 'channel', id: 'Formula1' },
  'youtube-laliga': { type: 'channel', id: 'LaLiga' },
  'youtube-bundesliga': { type: 'channel', id: 'bundesliga' },
  'youtube-seriea': { type: 'channel', id: 'seriea' },
  'youtube-ligue1': { type: 'channel', id: 'Ligue1' },
  'youtube-wnba': { type: 'channel', id: 'WNBA' },
  'youtube-nwsl': { type: 'channel', id: 'NWSLsoccer' },
  'youtube-lpga': { type: 'channel', id: 'LPGA' },
  'youtube-mls': { type: 'channel', id: 'mls' },
  'youtube-ligamx': { type: 'channel', id: 'ligabbvamx' },
  'youtube-facup': { type: 'channel', id: 'thefacup' },
  'youtube-indycar': { type: 'channel', id: 'indycar' },
  'youtube-pgatour': { type: 'channel', id: 'PGATOUR' },
  'youtube-motogp': { type: 'channel', id: 'motogp' },
  'youtube-livgolf': { type: 'channel', id: 'LIVGolf' },
  'youtube-nascar': { type: 'channel', id: 'NASCAR' },
  'youtube-ufc': { type: 'channel', id: 'ufc' },
  'youtube-tennischannel': { type: 'channel', id: 'TennisChannel' },
  'youtube-wta': { type: 'channel', id: 'WTA' },
  'youtube-atptour': { type: 'channel', id: 'ATPTour' },
  'youtube-tennistv': { type: 'channel', id: 'tennistv' },
  'youtube-ringmagazine': { type: 'channel', id: 'RingMagazine' },
  'youtube-premierboxingchampions': { type: 'channel', id: 'PremierBoxingChampions' },
  'youtube-matchroomboxing': { type: 'channel', id: 'MatchroomBoxing' },
  'youtube-toprank': { type: 'channel', id: 'toprank' },
  'youtube-daznboxing': { type: 'channel', id: 'DAZNBoxing' },
  'youtube-cbssportscfb': { type: 'channel', id: 'CBSSportsCFB' },
  'youtube-cfbonfox': { type: 'channel', id: 'CFBonFOX' },
  'youtube-espncfb': { type: 'channel', id: 'espncfb' },
  // Playlists
  'youtube-ncaaf-playlist-1': { type: 'playlist', id: 'PLXEMPXZ3PY1gD1F0DJeQYZjN_CKWsH911' },
  'youtube-ncaaf-playlist-2': { type: 'playlist', id: 'PLSrXjFYZsRuP1HW8mkTM7Z5q2PExbltfj' },
  'youtube-ncaaf-playlist-3': { type: 'playlist', id: 'PLtKVUJ3gZpTu0ApQHGUVeZa-tez87ucO6' },
  'youtube-ncaaf-playlist-4': { type: 'playlist', id: 'PLmkjXprBSRGPTiKLn8i8KIdN5I3nPP9sx' },
  'youtube-ncaaf-playlist-5': { type: 'playlist', id: 'PLJOfoNRMTY5z5QvxedrpMNi01zflJJpUN' },
  'youtube-ncaaf-playlist-6': { type: 'playlist', id: 'PL87LlAF-2PIwKpIUaKO4_p5QNmjxhYUFG' },
  'youtube-premierleague-playlist-1': { type: 'playlist', id: 'PLcj4z4KsbIoVYKuevRiaE94KlwPuXqLHy' },
  'youtube-premierleague-playlist-2': { type: 'playlist', id: 'PLXEMPXZ3PY1hMzinDc1TvSm8U2NUyz-0E' },
  'youtube-premierleague-playlist-3': { type: 'playlist', id: 'PLkwBiY2Dq-oaG6vHAhmcCOc3Q_-To2dlA' },
  'youtube-mlb-playlist': { type: 'playlist', id: 'PLL-lmlkrmJanq-c41voXY4cCbxVR0bjxR' }
};

const router = express.Router();
const CACHE_TTL = 15 * 60; // 15 minutes cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Log all incoming requests to bundle router for debugging
router.use((req, res, next) => {
  console.log(`[Bundle Router] Incoming request - method: ${req.method}, path: "${req.path}", originalUrl: "${req.originalUrl}", query:`, req.query);
  next();
});

// Parse RSS/Atom XML and extract items
async function parseRSSFeed(feedUrl, baseUrl) {
  try {
    let xml;
    
    // Extract the path from the URL (handle both relative and absolute URLs)
    const urlPath = feedUrl.includes('://') ? new URL(feedUrl).pathname : feedUrl;
    
    // Check if this is a YouTube feed that we should handle directly
    // Pattern: /feeds/youtube-xxx.xml or /youtube/channel/xxx.xml or /youtube/playlist/xxx.xml
    const youtubeFeedMatch = urlPath.match(/\/feeds\/(youtube-[^\/]+)\.xml$/);
    const youtubeChannelMatch = urlPath.match(/\/youtube\/channel\/([^\/]+)\.xml$/);
    const youtubePlaylistMatch = urlPath.match(/\/youtube\/playlist\/([^\/]+)\.xml$/);
    
    if (youtubeFeedMatch) {
      // This is a /feeds/youtube-xxx.xml URL
      // Look up the feed configuration to get the actual channel handle or playlist ID
      const feedId = youtubeFeedMatch[1];
      const feedConfig = YOUTUBE_FEED_MAP[feedId];
      
      if (feedConfig) {
        if (feedConfig.type === 'channel') {
          // Call YouTube channel function directly - NO HTTP FALLBACK, just throw error
          xml = await generateChannelRSS(feedConfig.id, baseUrl);
          if (!xml || xml.trim().length === 0) {
            throw new Error(`Empty XML returned from generateChannelRSS for ${feedConfig.id}`);
          }
          console.log(`✓ Bundle: Fetched YouTube channel directly: ${feedConfig.id} (${feedId})`);
        } else if (feedConfig.type === 'playlist') {
          // Call YouTube playlist function directly - NO HTTP FALLBACK, just throw error
          xml = await generatePlaylistRSS(feedConfig.id, baseUrl);
          if (!xml || xml.trim().length === 0) {
            throw new Error(`Empty XML returned from generatePlaylistRSS for ${feedConfig.id}`);
          }
          console.log(`✓ Bundle: Fetched YouTube playlist directly: ${feedConfig.id} (${feedId})`);
        }
      } else {
        console.log(`⚠ Bundle: Feed config not found for ${feedId}, using HTTP fetch`);
        // Fall through to HTTP fetch below
      }
    } else if (youtubeChannelMatch) {
      // Direct YouTube channel URL - call function directly
      const channelHandle = youtubeChannelMatch[1];
      xml = await generateChannelRSS(channelHandle, baseUrl);
      if (!xml || xml.trim().length === 0) {
        throw new Error(`Empty XML returned from generateChannelRSS for ${channelHandle}`);
      }
      console.log(`✓ Bundle: Fetched YouTube channel directly: ${channelHandle}`);
    } else if (youtubePlaylistMatch) {
      // Direct YouTube playlist URL - call function directly
      const playlistId = youtubePlaylistMatch[1];
      xml = await generatePlaylistRSS(playlistId, baseUrl);
      if (!xml || xml.trim().length === 0) {
        throw new Error(`Empty XML returned from generatePlaylistRSS for ${playlistId}`);
      }
      console.log(`✓ Bundle: Fetched YouTube playlist directly: ${playlistId}`);
    }
    
    // If we didn't get XML from direct call (non-YouTube feeds), fetch via HTTP
    if (!xml) {
      console.log(`Bundle: Fetching non-YouTube feed via HTTP: ${feedUrl}`);
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };
      
      const response = await fetch(feedUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${feedUrl}`);
      }
      
      xml = await response.text();
      if (!xml || xml.trim().length === 0) {
        throw new Error(`Empty response from ${feedUrl}`);
      }
    }
    
    if (!xml || xml.trim().length === 0) {
      throw new Error(`Empty XML response from ${feedUrl}`);
    }
    
    const $ = cheerio.load(xml, { xml: true });
    
    const items = [];
    
    // Check if it's Atom format (YouTube uses this)
    const isAtom = $('feed').length > 0;
    
    // Debug: Log XML structure
    const itemCount = $('item').length;
    const channelCount = $('channel').length;
    const rssCount = $('rss').length;
    console.log(`[parseRSSFeed] Feed ${feedUrl}: Found ${itemCount} <item> elements, ${channelCount} <channel> elements, ${rssCount} <rss> elements`);
    
    if (isAtom) {
      // Parse Atom format (<entry> elements)
      $('entry').each((i, elem) => {
        const $entry = $(elem);
        const link = $entry.find('link').attr('href') || $entry.find('link').text() || '';
        // Extract published date - prefer 'published' over 'updated' for Atom feeds
        const published = $entry.find('published').text().trim();
        const updated = $entry.find('updated').text().trim();
        const pubDate = published || updated || '';
        
        items.push({
          title: cleanRSSText($entry.find('title').text() || ''),
          link: link,
          description: cleanRSSText($entry.find('media\\:description, description, summary').text() || ''),
          pubDate: pubDate,
          guid: $entry.find('id').text() || link,
          thumbnail: $entry.find('media\\:thumbnail').attr('url') || 
                     $entry.find('media\\:group media\\:thumbnail').attr('url') || '',
          author: cleanRSSText($entry.find('author name').text() || $entry.find('author').text() || '')
        });
      });
    } else {
      // Parse RSS format (<item> elements)
      $('item').each((i, elem) => {
        const $item = $(elem);
        items.push({
          title: cleanRSSText($item.find('title').text() || ''),
          link: $item.find('link').text() || '',
          description: cleanRSSText($item.find('description').text() || ''),
          pubDate: $item.find('pubDate').text() || '',
          guid: $item.find('guid').text() || $item.find('link').text() || '',
          thumbnail: $item.find('media\\:thumbnail, thumbnail').attr('url') || 
                     $item.find('enclosure[type^="image"]').attr('url') || '',
          author: cleanRSSText($item.find('author, dc\\:creator').text() || '')
        });
      });
    }
    
    if (items.length === 0) {
      console.warn(`No items found in feed ${feedUrl}. XML length: ${xml ? xml.length : 0}`);
      // Debug: Log XML structure to help diagnose parsing issues
      if (xml) {
        const $debug = cheerio.load(xml, { xmlMode: true });
        const itemCount = $debug('item').length;
        const channelCount = $debug('channel').length;
        const rssCount = $debug('rss').length;
        console.warn(`Debug: Found ${itemCount} <item> elements, ${channelCount} <channel> elements, ${rssCount} <rss> elements`);
        if (itemCount > 0) {
          // Log first item structure for debugging
          const firstItem = $debug('item').first();
          console.warn(`First item title: "${firstItem.find('title').text()}", link: "${firstItem.find('link').text()}"`);
        }
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error.message);
    console.error(`Stack trace:`, error.stack);
    // Return empty array so bundle can continue with other feeds
    return [];
  }
}

// Combine multiple RSS feeds into one
async function combineFeeds(feedUrls, baseUrl) {
  const allItems = [];
  
  // Fetch all feeds in parallel
  const feedPromises = feedUrls.map(async (url) => {
    const items = await parseRSSFeed(url, baseUrl);
    return { url, items };
  });
  const feedResults = await Promise.allSettled(feedPromises);
  
  // Combine all items and log any failures
  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { url, items } = result.value;
      if (items.length === 0) {
        console.warn(`Warning: Feed ${url} returned 0 items`);
      } else {
        console.log(`Successfully fetched ${items.length} items from ${url}`);
      }
      items.forEach(item => {
        allItems.push({
          ...item,
          sourceFeed: url // Track which feed this came from
        });
      });
    } else {
      console.error(`Error fetching feed ${feedUrls[index]}:`, result.reason?.message || result.reason);
      console.error(`Full error:`, result.reason);
    }
  });
  
  console.log(`Total items collected from ${feedUrls.length} feeds: ${allItems.length}`);
  
  // Remove duplicates by link or guid (prefer link, fallback to guid)
  const seenItems = new Map();
  const uniqueItems = [];
  
  allItems.forEach(item => {
    const key = item.link || item.guid || '';
    if (key && !seenItems.has(key)) {
      seenItems.set(key, true);
      uniqueItems.push(item);
    }
  });
  
  // Sort by publication date (newest first)
  uniqueItems.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return dateB - dateA; // Descending order (newest first)
  });
  
  return uniqueItems;
}

// Generate bundled RSS feed
function generateBundledRSS(feedUrls, items, baseUrl, bundleName) {
  const feedUrl = `${baseUrl}/bundle/${bundleName}.xml`;
  
  const feed = new RSS({
    title: bundleName || 'RSS Feed Bundle',
    description: `Combined RSS feed bundle from ${feedUrls.length} sources`,
    feed_url: feedUrl,
    site_url: feedUrls[0] || '',
    language: 'en',
    pubDate: new Date(),
    custom_namespaces: {
      'media': 'http://search.yahoo.com/mrss/'
    }
  });
  
// Helper function to decode HTML entities
function decodeHTMLEntities(text) {
  if (!text) return '';
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#8217;': "'", // Right single quotation mark
    '&#8216;': "'", // Left single quotation mark
    '&#8220;': '"', // Left double quotation mark
    '&#8221;': '"', // Right double quotation mark
    '&#8211;': '-', // En dash
    '&#8212;': '-', // Em dash
    '&#8230;': '...' // Ellipsis
  };
  
  // Decode numeric entities like &#39;
  let decoded = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  // Decode hex entities like &#x27;
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  return decoded;
}

// Helper function to clean and normalize text for RSS feeds
function cleanRSSText(text) {
  if (!text) return '';
  
  // First decode HTML entities
  let cleaned = decodeHTMLEntities(String(text));
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Replace common problematic Unicode characters with their ASCII equivalents
  // Curly quotes to straight quotes
  cleaned = cleaned.replace(/['']/g, "'"); // Left/right single quote to straight apostrophe
  cleaned = cleaned.replace(/[""]/g, '"'); // Left/right double quote to straight quote
  cleaned = cleaned.replace(/…/g, '...'); // Ellipsis
  cleaned = cleaned.replace(/–/g, '-'); // En dash
  cleaned = cleaned.replace(/—/g, '-'); // Em dash
  
  // Remove any other problematic control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
  
  return cleaned;
}

  // Limit to 100 most recent items (increased from 50)
  items.slice(0, 100).forEach(item => {
    // Clean titles and descriptions
    const cleanTitle = cleanRSSText(item.title);
    let description = cleanRSSText(item.description || item.title);
    
    // Add thumbnail to description if available
    if (item.thumbnail) {
      description = `<img src="${item.thumbnail}" alt="${cleanTitle}" style="max-width: 100%;"/><br/>${description}`;
    }
    
    // Parse date properly - handle ISO 8601 format from YouTube
    let itemDate;
    if (item.pubDate && item.pubDate.trim()) {
      const parsedDate = new Date(item.pubDate);
      // Check if date is valid
      if (!isNaN(parsedDate.getTime())) {
        itemDate = parsedDate;
      } else {
        // Invalid date, use a very old date so it sorts to bottom
        console.warn(`Invalid date "${item.pubDate}" for item "${item.title}"`);
        itemDate = new Date(0); // Epoch time
      }
    } else {
      // No date provided, use a very old date so it sorts to bottom
      console.warn(`No date for item "${item.title}" from ${item.sourceFeed || 'unknown'}`);
      itemDate = new Date(0); // Epoch time
    }
    
    const feedItem = {
      title: item.title,
      description: description,
      url: item.link,
      guid: item.guid || item.link,
      date: itemDate,
      author: item.author,
      custom_elements: []
    };
    
    // Add media thumbnail
    if (item.thumbnail) {
      feedItem.custom_elements.push({
        'media:content': {
          _attr: {
            url: item.thumbnail,
            type: 'image/jpeg',
            medium: 'image'
          }
        }
      });
    }
    
    feed.item(feedItem);
  });
  
  return feed.xml({ indent: true });
}

// Route: Create bundle from query parameters
// Format: /bundle?feeds=url1,url2,url3&name=BundleName
// Note: Router is mounted at /bundle, so this route is /bundle
router.get('/', async (req, res) => {
  const feedUrlsParam = req.query.feeds;
  const bundleName = req.query.name || 'RSSBundle';
  const cacheKey = `bundle-${bundleName}-${feedUrlsParam}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  if (!feedUrlsParam) {
    return res.status(400).send('Missing feeds parameter. Format: /bundle?feeds=url1,url2,url3&name=BundleName');
  }
  
  try {
    // Parse feed URLs (comma-separated)
    let feedUrls = feedUrlsParam.split(',').map(url => url.trim()).filter(url => url);
    
    if (feedUrls.length === 0) {
      return res.status(400).send('No valid feed URLs provided');
    }
    
    // Resolve relative URLs to absolute URLs
    const baseUrl = req.protocol + '://' + req.get('host');
    const resolveUrl = (url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // Relative URL - resolve to this service
      return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    };
    
    feedUrls = feedUrls.map(resolveUrl);
    
    // Combine feeds (pass baseUrl so YouTube feeds can be fetched directly)
    const items = await combineFeeds(feedUrls, baseUrl);
    
    if (items.length === 0) {
      return res.status(404).send('No items found in any of the provided feeds');
    }
    
    const rssXml = generateBundledRSS(feedUrls, items, baseUrl, bundleName);
    
    // Cache the result
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating bundle feed:`, error);
    res.status(500).send('Error generating bundle feed');
  }
});

// Predefined bundle configurations
// Use relative URLs - they will be resolved to absolute URLs at runtime
// Format: '/youtube/playlist/PLAYLIST_ID.xml' or '/feeds/feed-name.xml'
const BUNDLE_CONFIGS = {
  // Example: NCAAM videos bundle
  // Add your bundles here with relative paths
  'ncaam-videos': [
    '/youtube/playlist/PLn3nHXu50t5zIzgZhRCXRsZcRIfapIxEV.xml',
    '/youtube/playlist/PLSoN6Th-EepPKUIUbnOMTwOpdBb5eNonz.xml',
    '/youtube/playlist/PLSrXjFYZsRuMeW1ttMkXz4cQy9bap9fIB.xml',
    '/youtube/playlist/PLhh7fyF6r5qVV2_RonsHodwkwe-GGt_Jl.xml',
    '/youtube/playlist/PL2RRF9GtC9s1v7L7tO5Astcl4Z8xq3BqQ.xml'
  ],
  // Example: NCAAW videos bundle
  'ncaaw-videos': [
    '/youtube/playlist/PLn3nHXu50t5ycOprei1VvRrS6rgFyNamo.xml',
    '/youtube/playlist/PLhh7fyF6r5qXCuhDgwdKKfCIzXkgF4fqx.xml',
    '/youtube/playlist/PLSrXjFYZsRuPigBvTe-tB2PWDWZr6Eks_.xml',
    '/youtube/playlist/PL2RRF9GtC9s32jHtkN74wyLXRtTR5Ash8.xml'
  ],
  // Home Videos bundle
  'home-videos': [
    '/feeds/youtube-nba.xml',
    '/feeds/youtube-formula1.xml',
    '/feeds/youtube-mlb.xml',
    '/feeds/youtube-espncfb.xml',
    '/feeds/youtube-laliga.xml',
    '/feeds/youtube-ncaaf-playlist-4.xml',
    '/feeds/youtube-ncaaf-playlist-1.xml',
    '/feeds/youtube-seriea.xml',
    '/feeds/youtube-nwsl.xml',
    '/feeds/youtube-ncaaf-playlist-2.xml',
    '/feeds/youtube-premierleague-playlist-2.xml',
    '/feeds/youtube-bundesliga.xml',
    '/feeds/youtube-ncaaf-playlist-3.xml',
    '/feeds/youtube-nhl.xml',
    '/feeds/youtube-premierleague-playlist-1.xml',
    '/feeds/youtube-ncaaf-playlist-6.xml',
    '/feeds/youtube-ncaaf-playlist-5.xml',
    '/feeds/youtube-premierleague-playlist-3.xml',
    '/feeds/youtube-nfl.xml',
    '/feeds/youtube-cbssportscfb.xml'
  ],
  // Tennis Videos bundle
  'tennis-videos': [
    '/feeds/youtube-wta.xml',
    '/feeds/youtube-tennischannel.xml',
    '/feeds/youtube-tennistv.xml',
    '/feeds/youtube-atptour.xml'
  ],
  // Soccer Videos bundle
  'soccer-videos': [
    '/feeds/youtube-laliga.xml',
    '/feeds/youtube-seriea.xml',
    '/feeds/youtube-nwsl.xml',
    '/feeds/youtube-premierleague-playlist-2.xml',
    '/feeds/youtube-bundesliga.xml',
    '/feeds/youtube-premierleague-playlist-1.xml',
    '/feeds/youtube-premierleague-playlist-3.xml',
    '/feeds/youtube-ligue1.xml',
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCChcWqwYXCEs657MQ00qVWA', // @thefacup (not in our service yet)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCq8BPLXtFeiSFOvmJrknWGg', // @ligabbvamx (not in our service yet)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UC7am34-1rGU_ky1vWYnoOJQ', // @GermanFootball (not in our service yet)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCET00YnetHT7tOpu12v8jxg', // @cbssportsgolazo (not in our service yet)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCf8YPuOWXlpTS7RibaJlP4g', // @CBSSportsGolazoEurope (not in our service yet)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCh4tni-ICN9z0eMIPcf2r2g', // @golazoamerica (not in our service yet)
    '/youtube/playlist/PLF1A3xcj_XjYWfzeXvnO8Uy8K3Q8JIQ5z.xml',
    '/youtube/playlist/PLF1A3xcj_XjahwjjdI5ovP1Rg9gKuY6tX.xml',
    '/youtube/playlist/PLF1A3xcj_XjauRnOMIAX0CQbMhJbbcDvN.xml',
    '/youtube/playlist/PLF1A3xcj_XjbjS6GrxUE_6FUdBsqJC8J7.xml',
    '/youtube/playlist/PLF1A3xcj_XjZK-NiI5-H2L2I2WpWXn-b0.xml'
  ],
  // NCAAF Highlights bundle
  'ncaaf-highlights': [
    '/feeds/youtube-ncaaf-playlist-4.xml',
    '/feeds/youtube-ncaaf-playlist-2.xml',
    '/feeds/youtube-ncaaf-playlist-3.xml',
    '/feeds/youtube-ncaaf-playlist-6.xml',
    '/feeds/youtube-ncaaf-playlist-5.xml'
  ],
  // NCAAF Videos bundle
  'ncaaf-videos': [
    '/feeds/youtube-espncfb.xml',
    '/feeds/youtube-cfbonfox.xml',
    '/feeds/youtube-ncaaf-playlist-1.xml',
    '/feeds/youtube-cbssportscfb.xml'
  ],
  // NCAAF Combined bundle (highlights + all videos)
  'ncaaf-all': [
    '/feeds/youtube-ncaaf-playlist-4.xml',
    '/feeds/youtube-ncaaf-playlist-2.xml',
    '/feeds/youtube-ncaaf-playlist-3.xml',
    '/feeds/youtube-ncaaf-playlist-6.xml',
    '/feeds/youtube-ncaaf-playlist-5.xml',
    '/feeds/youtube-espncfb.xml',
    '/feeds/youtube-cfbonfox.xml',
    '/feeds/youtube-ncaaf-playlist-1.xml',
    '/feeds/youtube-cbssportscfb.xml'
  ],
  // NHL Combined bundle (highlights + all videos)
  'nhl-all': [
    '/feeds/nhl-video-recaps.xml',
    '/feeds/youtube-nhl.xml'
  ],
  // Boxing Videos bundle
  'boxing-videos': [
    '/feeds/youtube-premierboxingchampions.xml',
    '/feeds/youtube-toprank.xml',
    '/feeds/youtube-matchroomboxing.xml',
    '/feeds/youtube-daznboxing.xml',
    '/feeds/youtube-ringmagazine.xml'
  ],
  // NWSL bundle
  'nwsl-bundle': [
    '/feeds/newsnow-nwsl.xml'
    // Note: RSS.app keyword feeds cannot be replicated directly - need alternative source
  ],
  // Home page CBS headlines bundle (Yahoo Sports feeds)
  'home-cbs-headlines': [
    '/feeds/yahoo-general-news-rss.xml',
    '/feeds/yahoo-sports-rss.xml'
  ],
  // FA Cup News bundle
  'facup-news': [
    'https://www.thesun.co.uk/topic/fa-cup/feed/',
    'https://feeds.bbci.co.uk/sport/football/fa-cup/rss.xml',
    'https://www.football-addict.com/en/562c39e484a97509608b4598/rss'
  ]
};

// Helper function to handle bundle generation (shared by both routes)
async function handleBundleRequest(bundleName, req, res) {
  console.log(`[handleBundleRequest] Called with bundleName: "${bundleName}"`);
  
  // Extract bundle name and strip .xml extension if present
  const originalBundleName = bundleName;
  if (bundleName.endsWith('.xml')) {
    bundleName = bundleName.slice(0, -4);
    console.log(`[handleBundleRequest] Stripped .xml extension: "${originalBundleName}" -> "${bundleName}"`);
  }
  
  // Check cache
  const cacheKey = `bundle-${bundleName}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[handleBundleRequest] Returning cached bundle for "${bundleName}"`);
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  // Resolve relative URLs to absolute URLs
  const baseUrl = req.protocol + '://' + req.get('host');
  const resolveUrl = (url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Relative URL - resolve to this service
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };
  
  console.log(`[handleBundleRequest] Requested bundle: "${bundleName}"`);
  console.log(`[handleBundleRequest] Available bundles:`, Object.keys(BUNDLE_CONFIGS));
  console.log(`[handleBundleRequest] Base URL: "${baseUrl}"`);
  
  const feedUrls = BUNDLE_CONFIGS[bundleName];
  
  if (!feedUrls) {
    console.error(`[handleBundleRequest] Bundle "${bundleName}" not found in BUNDLE_CONFIGS`);
    console.error(`[handleBundleRequest] Available bundles:`, Object.keys(BUNDLE_CONFIGS));
    return res.status(404).send(`Bundle "${bundleName}" not found. Available bundles: ${Object.keys(BUNDLE_CONFIGS).join(', ')}`);
  }
  
  // Resolve all URLs to absolute URLs
  const resolvedUrls = feedUrls.map(resolveUrl);
  
  try {
    console.log(`Generating bundle ${bundleName} with ${resolvedUrls.length} feeds`);
    console.log(`Feed URLs:`, resolvedUrls);
    
    // Combine feeds (pass baseUrl so YouTube feeds can be fetched directly)
    const items = await combineFeeds(resolvedUrls, baseUrl);
    
    console.log(`Bundle ${bundleName} collected ${items.length} items`);
    
    if (items.length === 0) {
      console.error(`Bundle ${bundleName} returned 0 items. Feed URLs were:`, resolvedUrls);
      return res.status(404).send(`No items found in bundle feeds. Checked ${resolvedUrls.length} feeds.`);
    }
    
    const rssXml = generateBundledRSS(resolvedUrls, items, baseUrl, bundleName);
    
    if (!rssXml || rssXml.trim().length === 0) {
      console.error(`Bundle ${bundleName} generated empty XML`);
      return res.status(500).send('Error: Generated empty RSS feed');
    }
    
    // Cache the result
    cache.set(`bundle-${bundleName}`, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating bundle feed for ${bundleName}:`, error);
    console.error(`Stack trace:`, error.stack);
    res.status(500).send(`Error generating bundle feed: ${error.message}`);
  }
}

// Route: Create bundle from named configuration
// Format: /bundle/:bundleName.xml
// Note: Router is mounted at /bundle, so this route is /bundle/:bundleName.xml
router.get('/:bundleName.xml', async (req, res) => {
  console.log(`[Bundle Route] Matched /:bundleName.xml route. bundleName: "${req.params.bundleName}", path: "${req.path}", originalUrl: "${req.originalUrl}"`);
  return handleBundleRequest(req.params.bundleName, req, res);
});

// Also handle route without .xml extension (fallback)
router.get('/:bundleName', async (req, res) => {
  console.log(`[Bundle Route] Matched /:bundleName route. bundleName: "${req.params.bundleName}", path: "${req.path}", originalUrl: "${req.originalUrl}"`);
  return handleBundleRequest(req.params.bundleName, req, res);
});

// Catch-all route for debugging - should not match if routes above work correctly
router.get('*', (req, res) => {
  console.error(`[Bundle Route] Unmatched route - path: "${req.path}", originalUrl: "${req.originalUrl}", method: "${req.method}"`);
  console.error(`[Bundle Route] Available bundles:`, Object.keys(BUNDLE_CONFIGS));
  res.status(404).send(`Bundle route not found: ${req.path}. Available bundles: ${Object.keys(BUNDLE_CONFIGS).join(', ')}`);
});

export default router;

