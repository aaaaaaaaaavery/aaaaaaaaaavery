import express from 'express';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

const router = express.Router();
const CACHE_TTL = 15 * 60; // 15 minutes cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// RSSHub instances
// NOTE: For X.com/Twitter feeds, RSSHub requires X.com API credentials
// Public instances won't work for Twitter without API keys
// Set RSSHUB_SELF_HOSTED_URL if you self-host RSSHub with API credentials
const RSSHUB_SELF_HOSTED_URL = process.env.RSSHUB_SELF_HOSTED_URL || null;

const RSSHUB_INSTANCES = [
  ...(RSSHUB_SELF_HOSTED_URL ? [RSSHUB_SELF_HOSTED_URL] : []),
  'https://rsshub.app', // Official public instance (Twitter requires API)
  'https://rsshub.rssforever.com', // Alternative instance (Twitter requires API)
  'https://rsshub.uneasy.win' // Another alternative
].filter(Boolean);

// Try RSSHub instances in order
async function getRSSHubFeed(route) {
  for (const instance of RSSHUB_INSTANCES) {
    try {
      const url = `${instance}${route}`;
      console.log(`Trying RSSHub instance: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.ok) {
        const xml = await response.text();
        // Check if it's valid RSS
        if (xml.includes('<rss') || xml.includes('<feed')) {
          console.log(`✅ RSSHub feed retrieved from ${instance}`);
          return xml;
        }
      }
    } catch (error) {
      console.log(`RSSHub instance ${instance} failed: ${error.message}`);
      continue; // Try next instance
    }
  }
  return null;
}

// X.com/Twitter routes via RSSHub
router.get('/twitter/user/:username.xml', async (req, res) => {
  const { username } = req.params;
  const cacheKey = `rsshub-twitter-${username}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  try {
    const route = `/twitter/user/${username}`;
    const rssXml = await getRSSHubFeed(route);
    
    if (!rssXml) {
      return res.status(503).send('RSSHub service unavailable. For X.com/Twitter feeds, RSSHub requires X.com API credentials. Either self-host RSSHub with API keys, or use RSS.app for X.com feeds.');
    }
    
    // Cache the result
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error getting RSSHub feed for ${username}:`, error);
    res.status(500).send('Error generating feed');
  }
});

// X.com/Twitter list route
router.get('/twitter/list/:username/:listId.xml', async (req, res) => {
  const { username, listId } = req.params;
  const cacheKey = `rsshub-twitter-list-${username}-${listId}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  try {
    const route = `/twitter/list/${username}/${listId}`;
    const rssXml = await getRSSHubFeed(route);
    
    if (!rssXml) {
      return res.status(503).send('RSSHub service unavailable.');
    }
    
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error getting RSSHub list feed:`, error);
    res.status(500).send('Error generating feed');
  }
});

// X.com/Twitter hashtag route
router.get('/twitter/hashtag/:hashtag.xml', async (req, res) => {
  const { hashtag } = req.params;
  const cacheKey = `rsshub-twitter-hashtag-${hashtag}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  try {
    const route = `/twitter/hashtag/${hashtag}`;
    const rssXml = await getRSSHubFeed(route);
    
    if (!rssXml) {
      return res.status(503).send('RSSHub service unavailable.');
    }
    
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error getting RSSHub hashtag feed:`, error);
    res.status(500).send('Error generating feed');
  }
});

// Generic RSSHub proxy (for any RSSHub route)
router.get('/proxy/*', async (req, res) => {
  const route = req.params[0]; // Everything after /proxy/
  const cacheKey = `rsshub-${route}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(cached);
  }
  
  try {
    const rssXml = await getRSSHubFeed(`/${route}`);
    
    if (!rssXml) {
      return res.status(503).send('RSSHub service unavailable.');
    }
    
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(rssXml);
  } catch (error) {
    console.error(`Error getting RSSHub feed:`, error);
    res.status(500).send('Error generating feed');
  }
});

export default router;

