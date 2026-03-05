import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import RSS from 'rss';
import NodeCache from 'node-cache';

const router = express.Router();
const CACHE_TTL = 15 * 60; // 15 minutes cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Extract username from X.com URL
function extractUsername(url) {
  // Handle various X.com URL formats
  const patterns = [
    /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/,
    /@([a-zA-Z0-9_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Scrape X.com profile (public profiles only)
async function scrapeXProfile(username) {
  try {
    const url = `https://x.com/${username}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cookie': 'auth_token=; ct0=' // May need actual cookies for private accounts
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const posts = [];
    
    // X.com embeds data in script tags
    // Look for embedded JSON data
    const scriptTags = $('script').toArray();
    let tweetData = null;
    
    for (const script of scriptTags) {
      const content = $(script).html() || '';
      // X.com uses various data structures - try to find tweet data
      if (content.includes('tweets') || content.includes('timeline') || content.includes('entries')) {
        try {
          // Try to extract JSON from script tags
          const jsonMatches = content.match(/\{.*"tweets".*\}/s) || 
                             content.match(/\{.*"entries".*\}/s);
          if (jsonMatches) {
            tweetData = JSON.parse(jsonMatches[0]);
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }
    
    // Alternative: Try to parse HTML structure directly
    // X.com uses article tags for tweets
    $('article[data-testid="tweet"]').slice(0, 20).each((i, elem) => {
      try {
        const $tweet = $(elem);
        
        // Extract tweet text
        const $text = $tweet.find('[data-testid="tweetText"]');
        const text = $text.text().trim();
        
        // Extract tweet link
        const $link = $tweet.find('a[href*="/status/"]').first();
        const href = $link.attr('href');
        const tweetId = href?.match(/\/status\/(\d+)/)?.[1];
        const tweetUrl = tweetId ? `https://x.com${href}` : null;
        
        // Extract timestamp
        const $time = $tweet.find('time').first();
        const datetime = $time.attr('datetime');
        const date = datetime ? new Date(datetime) : new Date();
        
        // Extract images
        const images = [];
        $tweet.find('img[src*="pbs.twimg.com"]').each((i, img) => {
          const src = $(img).attr('src');
          if (src && !src.includes('profile_images')) {
            images.push(src);
          }
        });
        
        // Extract author
        const $author = $tweet.find('[data-testid="User-Name"]').first();
        const authorName = $author.find('span').first().text().trim();
        
        if (text && tweetUrl) {
          posts.push({
            id: tweetId || `tweet-${i}`,
            text: text,
            url: tweetUrl,
            date: date,
            author: authorName || username,
            images: images,
            username: username
          });
        }
      } catch (e) {
        console.log('Error parsing tweet:', e.message);
      }
    });
    
    return posts;
  } catch (error) {
    console.error(`Error scraping X.com profile ${username}:`, error.message);
    return [];
  }
}

// Generate RSS feed from X.com posts
function generateXRSS(username, posts, baseUrl) {
  const feedUrl = `${baseUrl}/x/profile/${username}.xml`;
  
  const feed = new RSS({
    title: `X.com / ${username}`,
    description: `RSS feed for X.com profile @${username}`,
    feed_url: feedUrl,
    site_url: `https://x.com/${username}`,
    language: 'en',
    pubDate: new Date(),
    custom_namespaces: {
      'media': 'http://search.yahoo.com/mrss/'
    }
  });
  
  posts.forEach(post => {
    let description = post.text;
    
    // Add images to description
    if (post.images.length > 0) {
      post.images.forEach(img => {
        description += `<br/><img src="${img}" alt="Tweet image"/>`;
      });
    }
    
    const item = {
      title: post.text.substring(0, 100) + (post.text.length > 100 ? '...' : ''),
      description: description,
      url: post.url,
      guid: post.url,
      date: post.date,
      author: post.author,
      custom_elements: []
    };
    
    // Add media thumbnails
    post.images.forEach(img => {
      item.custom_elements.push({
        'media:content': {
          _attr: {
            url: img,
            type: 'image/jpeg',
            medium: 'image'
          }
        }
      });
    });
    
    feed.item(item);
  });
  
  return feed.xml({ indent: true });
}

// Route: Get X.com profile RSS feed
router.get('/profile/:username.xml', async (req, res) => {
  const { username } = req.params;
  
  // Check cache
  const cached = cache.get(username);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  try {
    const posts = await scrapeXProfile(username);
    
    if (posts.length === 0) {
      return res.status(404).send('No posts found. The profile may be private, require login, or the structure may have changed.');
    }
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const rssXml = generateXRSS(username, posts, baseUrl);
    
    // Cache the result
    cache.set(username, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating X.com feed for ${username}:`, error);
    res.status(500).send('Error generating feed');
  }
});

// Route: Get X.com profile from URL
router.get('/profile', async (req, res) => {
  const url = req.query.url || req.query.username;
  if (!url) {
    return res.status(400).json({ error: 'URL or username parameter required' });
  }
  
  const username = extractUsername(url) || url.replace('@', '');
  if (!username) {
    return res.status(400).json({ error: 'Invalid X.com URL or username' });
  }
  
  res.redirect(`/x/profile/${username}.xml`);
});

export default router;

