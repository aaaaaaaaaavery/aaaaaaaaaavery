import fetch from 'node-fetch';
import RSS from 'rss';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

/**
 * Keyword-based news aggregator - NewsNow clone
 * Aggregates news from multiple sources and filters by keyword
 * OPTIMIZED: Caches RSS feeds in memory to reduce Firestore reads
 */

// In-memory cache for RSS feeds (15 minute TTL)
const feedCache = new NodeCache({ stdTTL: 15 * 60 }); // 15 minutes

// Configuration: Which sources to aggregate from for each sport/league
// Uses existing RSS feed service endpoints where available for better caching and reliability
const SERVICE_BASE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';

const SOURCE_CONFIGS = {
  'nhl': {
    sources: [
      { id: 'espn-nhl', url: `${SERVICE_BASE_URL}/feeds/espn-nhl-rss.xml`, name: 'ESPN NHL' },
      { id: 'cbs-nhl', url: `${SERVICE_BASE_URL}/feeds/cbs-nhl-rss.xml`, name: 'CBS Sports NHL' },
      { id: 'yahoo-nhl', url: `${SERVICE_BASE_URL}/feeds/yahoo-nhl-rss.xml`, name: 'Yahoo Sports NHL' },
      { id: 'nhl-com', url: `${SERVICE_BASE_URL}/feeds/nhl-com-news.xml`, name: 'NHL.com' },
      { id: 'hockeywriters', url: `${SERVICE_BASE_URL}/feeds/hockeywriters.xml`, name: 'The Hockey Writers' },
      { id: 'hockeynews', url: `${SERVICE_BASE_URL}/feeds/hockeynews.xml`, name: 'The Hockey News' }
    ]
  },
  'nfl': {
    sources: [
      { id: 'espn-nfl', url: `${SERVICE_BASE_URL}/feeds/espn-nfl-rss.xml`, name: 'ESPN NFL' },
      { id: 'cbs-nfl', url: `${SERVICE_BASE_URL}/feeds/cbs-nfl-rss.xml`, name: 'CBS Sports NFL' },
      { id: 'yahoo-nfl', url: `${SERVICE_BASE_URL}/feeds/yahoo-nfl-rss.xml`, name: 'Yahoo Sports NFL' },
      { id: 'nfl-com', url: `${SERVICE_BASE_URL}/feeds/nfl-com.xml`, name: 'NFL.com' }
    ]
  },
  'nba': {
    sources: [
      { id: 'espn-nba', url: `${SERVICE_BASE_URL}/feeds/espn-nba-rss.xml`, name: 'ESPN NBA' },
      { id: 'cbs-nba', url: `${SERVICE_BASE_URL}/feeds/cbs-nba-rss.xml`, name: 'CBS Sports NBA' },
      { id: 'yahoo-nba', url: `${SERVICE_BASE_URL}/feeds/yahoo-nba-rss.xml`, name: 'Yahoo Sports NBA' },
      { id: 'nba-com', url: `${SERVICE_BASE_URL}/feeds/nba-com-news.xml`, name: 'NBA.com' }
    ]
  },
  'mlb': {
    sources: [
      { id: 'espn-mlb', url: `${SERVICE_BASE_URL}/feeds/espn-mlb-rss.xml`, name: 'ESPN MLB' },
      { id: 'cbs-mlb', url: `${SERVICE_BASE_URL}/feeds/cbs-mlb-rss.xml`, name: 'CBS Sports MLB' },
      { id: 'yahoo-mlb', url: `${SERVICE_BASE_URL}/feeds/yahoo-mlb-rss.xml`, name: 'Yahoo Sports MLB' }
    ]
  }
};

/**
 * Normalize keyword for matching
 */
function normalizeKeyword(keyword) {
  return keyword.toLowerCase().trim();
}

/**
 * Check if article matches keyword(s)
 */
function matchesKeyword(article, keywords) {
  if (!keywords || keywords.length === 0) return true;
  
  const normalizedKeywords = keywords.map(k => normalizeKeyword(k));
  const searchText = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  
  // Match if any keyword is found in title or description
  return normalizedKeywords.some(keyword => searchText.includes(keyword));
}

/**
 * Parse RSS feed with caching
 */
async function parseRSSFeed(url) {
  // Check cache first
  const cached = feedCache.get(url);
  if (cached) {
    console.log(`[KeywordAggregator] Using cached feed: ${url}`);
    return cached;
  }
  
  try {
    console.log(`[KeywordAggregator] Fetching feed: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xmlText = await response.text();
    const $ = cheerio.load(xmlText, { xmlMode: true });
    
    const items = [];
    
    // Handle RSS format
    $('item').each((i, elem) => {
      const $item = $(elem);
      items.push({
        title: $item.find('title').text() || '',
        link: $item.find('link').text() || '',
        description: $item.find('description').text() || '',
        pubDate: $item.find('pubDate').text() || '',
        guid: $item.find('guid').text() || ''
      });
    });
    
    // Handle Atom format
    $('entry').each((i, elem) => {
      const $entry = $(elem);
      items.push({
        title: $entry.find('title').text() || '',
        link: $entry.find('link').attr('href') || $entry.find('link').text() || '',
        description: $entry.find('summary').text() || $entry.find('content').text() || '',
        pubDate: $entry.find('published').text() || $entry.find('updated').text() || '',
        guid: $entry.find('id').text() || ''
      });
    });
    
    // Cache the results
    feedCache.set(url, items);
    console.log(`[KeywordAggregator] Cached ${items.length} items from ${url}`);
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error.message);
    return [];
  }
}

/**
 * Aggregate news from multiple sources filtered by keyword
 */
export async function aggregateKeywordNews(keyword, league = 'nhl', maxItems = 50) {
  const config = SOURCE_CONFIGS[league.toLowerCase()];
  
  if (!config) {
    throw new Error(`Unsupported league: ${league}`);
  }
  
  // Normalize keywords (split by comma or space if multiple)
  const keywords = keyword.split(/[,\s]+/).filter(k => k.trim().length > 0);
  
  console.log(`[KeywordAggregator] Aggregating news for keywords: ${keywords.join(', ')} from ${league.toUpperCase()} sources`);
  
  const allArticles = [];
  const sourcePromises = config.sources.map(async (source) => {
    try {
      let articles = [];
      
      // Fetch from RSS URL
      if (source.url) {
        articles = await parseRSSFeed(source.url);
      }
      
      // Add source name to each article
      articles = articles.map(article => ({
        ...article,
        source: source.name,
        sourceId: source.id
      }));
      
      return articles;
    } catch (error) {
      console.error(`[KeywordAggregator] Error fetching from ${source.name}:`, error.message);
      return [];
    }
  });
  
  // Fetch from all sources in parallel
  const sourceResults = await Promise.all(sourcePromises);
  
  // Flatten and filter by keyword (ONLY matched articles are kept)
  // This reduces storage - we only write matched articles to Firestore
  for (const articles of sourceResults) {
    for (const article of articles) {
      if (matchesKeyword(article, keywords)) {
        allArticles.push(article);
      }
    }
  }
  
  console.log(`[KeywordAggregator] Matched ${allArticles.length} articles out of ${sourceResults.reduce((sum, arr) => sum + arr.length, 0)} total articles`);
  
  // Remove duplicates (by URL/guid)
  const seen = new Set();
  const uniqueArticles = [];
  for (const article of allArticles) {
    const id = article.link || article.guid || article.title;
    if (!seen.has(id)) {
      seen.add(id);
      uniqueArticles.push(article);
    }
  }
  
  // Sort by date (newest first)
  uniqueArticles.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return dateB - dateA;
  });
  
  // Limit to maxItems
  return uniqueArticles.slice(0, maxItems);
}

/**
 * Generate RSS feed from aggregated articles
 */
export function generateKeywordRSSFeed(articles, keyword, league, baseUrl) {
  const feed = new RSS({
    title: `${keyword} News - ${league.toUpperCase()} Aggregator`,
    description: `Aggregated news about ${keyword} from multiple ${league.toUpperCase()} sources`,
    feed_url: `${baseUrl}/aggregator/${encodeURIComponent(keyword)}.xml?league=${league}`,
    site_url: baseUrl,
    language: 'en',
    ttl: 30 // Cache for 30 minutes
  });
  
  for (const article of articles) {
    feed.item({
      title: article.title,
      description: article.description || '',
      url: article.link,
      guid: article.guid || article.link,
      date: article.pubDate || new Date(),
      author: article.source || ''
    });
  }
  
  return feed.xml({ indent: true });
}

