import express from 'express';
import fetch from 'node-fetch';
import RSS from 'rss';
import NodeCache from 'node-cache';
import * as cheerio from 'cheerio';

const router = express.Router();
const CACHE_TTL = 30 * 60; // 30 minutes cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// YouTube Data API v3 configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Extract playlist ID from URL
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Extract channel handle from URL (e.g., @NBA from youtube.com/@NBA/videos)
function extractChannelHandle(url) {
  const match = url.match(/youtube\.com\/@([^\/]+)/);
  return match ? match[1] : null;
}

// Get YouTube channel RSS feed (uses channel's uploads playlist)
async function getYouTubeChannelRSS(channelHandle) {
  try {
    // YouTube channels have uploads playlists at: UU + channelId
    // For now, we'll use YouTube's native RSS feed format
    // Note: This requires the channel ID, not the handle
    // We'll use direct YouTube RSS feed URLs in bundles instead
    return null;
  } catch (error) {
    console.log(`YouTube channel RSS not available for ${channelHandle}:`, error.message);
    return null;
  }
}

// Filter native RSS feed to only include recent videos (last 90 days)
function filterNativeRSSByDate(xml, maxItems = 25) {
  try {
    const $ = cheerio.load(xml, { xmlMode: true });
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    // Get all entries with their dates
    const entries = $('entry').toArray();
    const recentEntries = [];
    
    entries.forEach(entry => {
      const $entry = $(entry);
      const published = $entry.find('published').text().trim();
      if (published) {
        const pubDate = new Date(published);
        const isRecent = !isNaN(pubDate.getTime()) && pubDate >= ninetyDaysAgo;
        if (isRecent) {
          // Store the entry's outer HTML for re-insertion
          recentEntries.push({ entry: $entry, pubDate });
        } else {
          console.log(`Filtering out old video: ${published} (${pubDate.toISOString()}) is before ${ninetyDaysAgo.toISOString()}`);
        }
      }
    });
    
    // Sort by date (newest first) and limit
    recentEntries.sort((a, b) => b.pubDate - a.pubDate);
    const topEntries = recentEntries.slice(0, maxItems);
    
    // Remove all entries
    $('entry').remove();
    
    // Add back only recent ones in the correct order
    const $feed = $('feed');
    topEntries.forEach(({ entry }) => {
      // Clone the entry to avoid DOM issues
      $feed.append(entry.clone());
    });
    
    const result = $.xml();
    return result;
  } catch (error) {
    console.error('Error filtering native RSS by date:', error.message, error.stack);
    return xml; // Return original if filtering fails
  }
}

// Try YouTube's native RSS feed first (this is the best method)
async function getYouTubeNativeRSS(playlistId) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const xml = await response.text();
      // Filter to only include recent videos (last 90 days)
      const $before = cheerio.load(xml, { xmlMode: true });
      const filtered = filterNativeRSSByDate(xml, 25);
      const $after = cheerio.load(filtered, { xmlMode: true });
      console.log(`Filtered native RSS for playlist ${playlistId}: ${$before('entry').length} entries before, ${$after('entry').length} entries after`);
      return filtered;
    }
  } catch (error) {
    console.log(`YouTube native RSS not available for playlist ${playlistId}:`, error.message);
  }
  return null;
}

// Scrape YouTube playlist as fallback
async function scrapeYouTubePlaylist(playlistId) {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const videos = [];
    
    // Try to extract from embedded JSON data
    const scriptTags = $('script').toArray();
    let ytData = null;
    
    for (const script of scriptTags) {
      const content = $(script).html() || '';
      if (content.includes('var ytInitialData') || content.includes('window["ytInitialData"]')) {
        try {
          const jsonMatch = content.match(/var ytInitialData\s*=\s*({.+?});/s) || 
                          content.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);
          if (jsonMatch) {
            ytData = JSON.parse(jsonMatch[1]);
            break;
          }
        } catch (e) {
          // Continue to next script tag
        }
      }
    }
    
    if (ytData) {
      // Navigate YouTube's data structure to find playlist videos
      const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
      
      if (contents) {
        contents.forEach((item) => {
          try {
            const video = item?.playlistVideoRenderer;
            if (video) {
              const videoId = video.videoId;
              const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Untitled';
              const thumbnail = video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || 
                               `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
              const lengthText = video.lengthText?.simpleText || '';
              const publishedTimeText = video.publishedTimeText?.simpleText || '';
              const shortBylineText = video.shortBylineText?.runs?.[0]?.text || '';
              
              videos.push({
                id: videoId,
                title: title,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: thumbnail,
                duration: lengthText,
                publishedTime: publishedTimeText,
                channel: shortBylineText,
                description: video.description?.simpleText || ''
              });
            }
          } catch (e) {
            console.log('Error parsing video item:', e.message);
          }
        });
      }
    }
    
    return videos;
  } catch (error) {
    console.error(`Error scraping YouTube playlist ${playlistId}:`, error.message);
    return [];
  }
}

// Generate RSS feed from videos (updated to handle both API and scraped videos)
function generateYouTubeRSS(videos, title, description, siteUrl, feedUrl) {
  const feed = new RSS({
    title: title,
    description: description,
    feed_url: feedUrl,
    site_url: siteUrl,
    language: 'en',
    pubDate: new Date(),
    custom_namespaces: {
      'media': 'http://search.yahoo.com/mrss/',
      'yt': 'http://www.youtube.com/xml/schemas/2015'
    }
  });
  
  videos.forEach(video => {
    const item = {
      title: video.title,
      description: video.description || video.title,
      url: video.url,
      guid: video.url,
      date: video.publishedAt || new Date(),
      custom_elements: [
        {
          'media:content': {
            _attr: {
              url: video.thumbnail,
              type: 'image/jpeg',
              medium: 'image'
            }
          }
        },
        {
          'media:thumbnail': {
            _attr: {
              url: video.thumbnail,
              width: '1280',
              height: '720'
            }
          }
        }
      ]
    };
    
    if (video.duration) {
      item.custom_elements.push({
        'yt:duration': video.duration
      });
    }
    
    if (video.channelTitle || video.channel) {
      item.custom_elements.push({
        'yt:channel': video.channelTitle || video.channel
      });
    }
    
    feed.item(item);
  });
  
  return feed.xml({ indent: true });
}

// Route: Get YouTube playlist RSS feed
router.get('/playlist/:playlistId.xml', async (req, res) => {
  const { playlistId } = req.params;
  
  // Check cache
  const cached = cache.get(playlistId);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=1800');
    return res.send(cached);
  }
  
  try {
    let rssXml = null;
    
    // Try YouTube API first if available
    if (YOUTUBE_API_KEY) {
      try {
        const videos = await getPlaylistVideosAPI(playlistId, 25);
        if (videos && videos.length > 0) {
          const baseUrl = req.protocol + '://' + req.get('host');
          const feedUrl = `${baseUrl}/youtube/playlist/${playlistId}.xml`;
          const siteUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
          const title = `YouTube Playlist: ${playlistId}`;
          const description = `RSS feed for YouTube playlist ${playlistId}`;
          rssXml = generateYouTubeRSS(videos, title, description, siteUrl, feedUrl);
        }
      } catch (apiError) {
        console.log(`YouTube API failed for playlist ${playlistId}, falling back to native RSS:`, apiError.message);
      }
    }
    
    // Try YouTube's native RSS feed
    if (!rssXml) {
      rssXml = await getYouTubeNativeRSS(playlistId);
    }
    
    // If native RSS not available, scrape the playlist
    if (!rssXml) {
      const videos = await scrapeYouTubePlaylist(playlistId);
      
      if (videos.length === 0) {
        return res.status(404).send('No videos found in playlist. The playlist may be private or unavailable.');
      }
      
      const baseUrl = req.protocol + '://' + req.get('host');
      rssXml = generateYouTubeRSS(playlistId, videos, baseUrl);
    }
    
    // Cache the result
    cache.set(playlistId, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating YouTube playlist feed for ${playlistId}:`, error);
    res.status(500).send('Error generating feed');
  }
});

// Route: Get YouTube playlist from URL
router.get('/playlist', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }
  
  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    return res.status(400).json({ error: 'Invalid YouTube playlist URL' });
  }
  
  res.redirect(`/youtube/playlist/${playlistId}.xml`);
});

// Get channel ID from channel handle using YouTube API (preferred method)
async function getChannelIdFromHandleAPI(channelHandle) {
  if (!YOUTUBE_API_KEY) {
    console.log(`[getChannelIdFromHandleAPI] No YouTube API key configured for @${channelHandle}`);
    return null;
  }

  try {
    // Method 1: Search by handle name directly (most reliable for @handles)
    const searchUrl1 = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(channelHandle)}&type=channel&maxResults=5&key=${YOUTUBE_API_KEY}`;
    const response1 = await fetch(searchUrl1);
    
    if (response1.ok) {
      const data1 = await response1.json();
      if (data1.items && data1.items.length > 0) {
        // Find exact match by customUrl or title
        for (const item of data1.items) {
          const customUrl = item.snippet?.customUrl;
          const title = item.snippet?.title?.toLowerCase();
          const handleLower = channelHandle.toLowerCase();
          
          // Check if customUrl matches (e.g., "@buffalosabres" or "buffalosabres")
          if (customUrl && (customUrl.toLowerCase() === `@${handleLower}` || customUrl.toLowerCase() === handleLower)) {
            console.log(`[getChannelIdFromHandleAPI] Found exact match by customUrl for @${channelHandle}: ${item.snippet.channelId}`);
            return item.snippet.channelId;
          }
          
          // Check if title matches (e.g., "Buffalo Sabres")
          if (title && title.includes(handleLower.replace(/s$/, ''))) {
            console.log(`[getChannelIdFromHandleAPI] Found match by title for @${channelHandle}: ${item.snippet.channelId}`);
            return item.snippet.channelId;
          }
        }
        // If no exact match, return first result
        console.log(`[getChannelIdFromHandleAPI] Using first search result for @${channelHandle}: ${data1.items[0].snippet.channelId}`);
        return data1.items[0].snippet.channelId;
      }
    } else {
      const errorData = await response1.json().catch(() => ({}));
      console.log(`[getChannelIdFromHandleAPI] Search API error for @${channelHandle}: ${response1.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    // Method 2: Try searching by custom URL
    const customUrl = `https://www.youtube.com/@${channelHandle}`;
    const searchUrl2 = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(customUrl)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const response2 = await fetch(searchUrl2);
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.items && data2.items.length > 0) {
        return data2.items[0].snippet.channelId;
      }
    }
    
    // Method 3: Try forUsername (deprecated but sometimes works)
    const url3 = `${YOUTUBE_API_BASE}/channels?part=id&forUsername=${channelHandle}&key=${YOUTUBE_API_KEY}`;
    const response3 = await fetch(url3);
    
    if (response3.ok) {
      const data3 = await response3.json();
      if (data3.items && data3.items.length > 0) {
        return data3.items[0].id;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting channel ID from API for ${channelHandle}:`, error.message);
    return null;
  }
}

// Extract channel ID from channel handle/URL (fallback scraping method)
async function extractChannelId(channelHandle) {
  // Try API first if available
  if (YOUTUBE_API_KEY) {
    const apiChannelId = await getChannelIdFromHandleAPI(channelHandle);
    if (apiChannelId) {
      return apiChannelId;
    }
  }
  
  // Fallback to scraping
  try {
    const url = `https://www.youtube.com/@${channelHandle}/videos`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    // Look for channel ID in meta tags or embedded JSON
    const channelIdMatch = html.match(/"channelId":"([^"]+)"/) || 
                          html.match(/<meta\s+property="og:url"\s+content="[^"]*\/channel\/([^"]+)"/) ||
                          html.match(/channel_id=([^&"'\s]+)/);
    
    if (channelIdMatch) {
      return channelIdMatch[1];
    }
    
    // Try to find in ytInitialData
    const ytDataMatch = html.match(/var ytInitialData\s*=\s*({.+?});/s);
    if (ytDataMatch) {
      try {
        const data = JSON.parse(ytDataMatch[1]);
        const channelId = data?.metadata?.channelMetadataRenderer?.externalId ||
                         data?.header?.c4TabbedHeaderRenderer?.channelId;
        if (channelId) return channelId;
      } catch (e) {
        // Continue
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting channel ID for ${channelHandle}:`, error.message);
    return null;
  }
}

// Get channel uploads playlist ID (UU + channelId)
function getUploadsPlaylistId(channelId) {
  if (channelId.startsWith('UC')) {
    return 'UU' + channelId.substring(2);
  }
  return 'UU' + channelId;
}

// Get videos from channel using YouTube API
async function getChannelVideosAPI(channelHandle, maxResults = 25) {
  if (!YOUTUBE_API_KEY) {
    return null;
  }

  try {
    const channelId = await getChannelIdFromHandleAPI(channelHandle);
    if (!channelId) {
      return null;
    }
    
    const uploadsPlaylistId = getUploadsPlaylistId(channelId);
    // Fetch more videos (50) to ensure we have enough recent ones after filtering
    return await getPlaylistVideosAPI(uploadsPlaylistId, Math.max(maxResults, 50));
  } catch (error) {
    console.error(`Error getting channel videos from API for ${channelHandle}:`, error.message);
    return null;
  }
}

// Get videos from playlist using YouTube API
async function getPlaylistVideosAPI(playlistId, maxResults = 25) {
  if (!YOUTUBE_API_KEY) {
    return null;
  }

  try {
    // Fetch more videos (50) to ensure we have enough recent ones after filtering by date
    const fetchLimit = Math.max(maxResults, 50);
    const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${fetchLimit}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    // Get video details for better metadata
    const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
    const videosUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const videosResponse = await fetch(videosUrl);
    
    if (!videosResponse.ok) {
      // Fallback to playlist items data only
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      
      const allVideos = data.items.map(item => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: new Date(item.snippet.publishedAt),
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId
      }));
      
      // Filter to only recent videos (last 90 days) and sort by date (newest first)
      return allVideos
        .filter(video => video.publishedAt >= ninetyDaysAgo)
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, maxResults);
    }
    
    const videosData = await videosResponse.json();
    const videosMap = new Map();
    
    videosData.items.forEach(video => {
      videosMap.set(video.id, {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
        publishedAt: new Date(video.snippet.publishedAt),
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        duration: video.contentDetails.duration,
        viewCount: video.statistics?.viewCount,
        likeCount: video.statistics?.likeCount
      });
    });
    
    // Get all videos and filter by date (last 90 days)
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    const allVideos = data.items.map(item => {
      const videoId = item.contentDetails.videoId;
      return videosMap.get(videoId) || {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: new Date(item.snippet.publishedAt),
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId
      };
    });
    
    // Filter to only recent videos (last 90 days) and sort by date (newest first)
    const recentVideos = allVideos
      .filter(video => video.publishedAt >= ninetyDaysAgo)
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, maxResults); // Limit to maxResults
    
    return recentVideos;
  } catch (error) {
    console.error(`Error getting playlist videos from API for ${playlistId}:`, error.message);
    return null;
  }
}

// Route: Get YouTube channel RSS feed
router.get('/channel/:channelHandle.xml', async (req, res) => {
  const { channelHandle } = req.params;
  
  // Check cache
  const cacheKey = `channel-${channelHandle}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=1800');
    return res.send(cached);
  }
  
  try {
    let rssXml = null;
    
    // Try YouTube API first if available
    if (YOUTUBE_API_KEY) {
      try {
        const videos = await getChannelVideosAPI(channelHandle, 25);
        if (videos && videos.length > 0) {
          const baseUrl = req.protocol + '://' + req.get('host');
          const feedUrl = `${baseUrl}/youtube/channel/${channelHandle}.xml`;
          const siteUrl = `https://www.youtube.com/@${channelHandle}/videos`;
          const title = `${videos[0].channelTitle || channelHandle} - YouTube`;
          const description = `Latest videos from ${videos[0].channelTitle || channelHandle} on YouTube`;
          rssXml = generateYouTubeRSS(videos, title, description, siteUrl, feedUrl);
        }
      } catch (apiError) {
        console.log(`YouTube API failed for ${channelHandle}, falling back to native RSS:`, apiError.message);
      }
    }
    
    // Fallback to native RSS feed
    if (!rssXml) {
      const channelId = await extractChannelId(channelHandle);
      
      if (!channelId) {
        return res.status(404).send('Channel ID not found. The channel may be private or unavailable.');
      }
      
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const nativeRssXml = await response.text();
      // Filter to only include recent videos (last 90 days)
      rssXml = filterNativeRSSByDate(nativeRssXml, 25);
      console.log(`Filtered native RSS for channel ${channelHandle}: ${(cheerio.load(nativeRssXml, { xmlMode: true })('entry').length || 0)} entries before, ${(cheerio.load(rssXml, { xmlMode: true })('entry').length || 0)} entries after`);
    }
    
    // Cache the result
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating YouTube channel feed for ${channelHandle}:`, error);
    res.status(500).send('Error generating feed');
  }
});

// Route: Get YouTube search RSS feed
router.get('/search/:query.xml', async (req, res) => {
  const { query } = req.params;
  const decodedQuery = decodeURIComponent(query);
  
  // Check cache
  const cacheKey = `search-${decodedQuery}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=1800');
    return res.send(cached);
  }
  
  try {
    const baseUrl = req.protocol + '://' + req.get('host');
    const rssXml = await generateSearchRSS(decodedQuery, baseUrl);
    
    // Cache the result
    cache.set(cacheKey, rssXml);
    
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating YouTube search feed for "${decodedQuery}":`, error);
    res.status(500).send('Error generating feed');
  }
});

// Helper function to generate channel RSS feed (for direct calls from index.js)
export async function generateChannelRSS(channelHandle, baseUrl, isShorts = false) {
  const cacheKey = `channel-${channelHandle}${isShorts ? '-shorts' : ''}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    let rssXml = null;
    
    // Try YouTube API first if available
    if (YOUTUBE_API_KEY) {
      try {
        const videos = await getChannelVideosAPI(channelHandle, 25, isShorts);
        if (videos && videos.length > 0) {
          const feedUrl = `${baseUrl}/youtube/channel/${channelHandle}${isShorts ? '-shorts' : ''}.xml`;
          const siteUrl = `https://www.youtube.com/@${channelHandle}${isShorts ? '/shorts' : '/videos'}`;
          const title = `${videos[0].channelTitle || channelHandle} - YouTube${isShorts ? ' Shorts' : ''}`;
          const description = `Latest ${isShorts ? 'shorts (videos < 60s) ' : ''}from ${videos[0].channelTitle || channelHandle} on YouTube`;
          rssXml = generateYouTubeRSS(videos, title, description, siteUrl, feedUrl);
        }
      } catch (apiError) {
        console.log(`YouTube API failed for ${channelHandle}${isShorts ? ' (shorts)' : ''}, falling back to native RSS:`, apiError.message);
      }
    }
    
    // Fallback to native RSS feed
    if (!rssXml) {
      const channelId = await extractChannelId(channelHandle);
      
      if (!channelId) {
        throw new Error('Channel ID not found. The channel may be private or unavailable.');
      }
      
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const nativeRssXml = await response.text();
      // Filter to only include recent videos (last 90 days)
      rssXml = filterNativeRSSByDate(nativeRssXml, 25);
      console.log(`Filtered native RSS for channel ${channelHandle}: ${(cheerio.load(nativeRssXml, { xmlMode: true })('entry').length || 0)} entries before, ${(cheerio.load(rssXml, { xmlMode: true })('entry').length || 0)} entries after`);
    }
    
    // Cache the result
    cache.set(cacheKey, rssXml);
    return rssXml;
  } catch (error) {
    console.error(`Error generating YouTube channel feed for ${channelHandle}:`, error);
    throw error;
  }
}

// Search YouTube videos using API
async function searchYouTubeVideos(query, maxResults = 25) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=date&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      console.error(`YouTube API error ${response.status} for query "${query}":`, errorMessage);
      throw new Error(`YouTube API error: ${response.status} - ${errorMessage}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    const videos = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
      publishedAt: new Date(item.snippet.publishedAt),
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId
    }));
    
    return videos;
  } catch (error) {
    console.error(`Error searching YouTube videos for "${query}":`, error.message);
    throw error;
  }
}

// Helper function to generate YouTube search RSS feed
export async function generateSearchRSS(query, baseUrl) {
  const cacheKey = `search-${query}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const videos = await searchYouTubeVideos(query, 25);
    
    if (!videos || videos.length === 0) {
      throw new Error(`No videos found for search query: ${query}`);
    }
    
    const feedUrl = `${baseUrl}/youtube/search/${encodeURIComponent(query)}.xml`;
    const siteUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const title = `YouTube Search: ${query}`;
    const description = `Latest YouTube videos for "${query}"`;
    
    const rssXml = generateYouTubeRSS(videos, title, description, siteUrl, feedUrl);
    
    // Cache the result
    cache.set(cacheKey, rssXml);
    return rssXml;
  } catch (error) {
    console.error(`Error generating YouTube search feed for "${query}":`, error);
    throw error;
  }
}

// Helper function to generate playlist RSS feed (for direct calls from index.js)
export async function generatePlaylistRSS(playlistId, baseUrl) {
  // Check cache
  const cached = cache.get(playlistId);
  if (cached) {
    return cached;
  }
  
  try {
    let rssXml = null;
    
    // Try YouTube API first if available
    if (YOUTUBE_API_KEY) {
      try {
        const videos = await getPlaylistVideosAPI(playlistId, 25);
        if (videos && videos.length > 0) {
          const feedUrl = `${baseUrl}/youtube/playlist/${playlistId}.xml`;
          const siteUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
          const title = `YouTube Playlist: ${playlistId}`;
          const description = `RSS feed for YouTube playlist ${playlistId}`;
          rssXml = generateYouTubeRSS(videos, title, description, siteUrl, feedUrl);
        }
      } catch (apiError) {
        console.log(`YouTube API failed for playlist ${playlistId}, falling back to native RSS:`, apiError.message);
      }
    }
    
    // Try YouTube's native RSS feed
    if (!rssXml) {
      rssXml = await getYouTubeNativeRSS(playlistId);
    }
    
    // If native RSS not available, scrape the playlist
    if (!rssXml) {
      const videos = await scrapeYouTubePlaylist(playlistId);
      
      if (videos.length === 0) {
        throw new Error('No videos found in playlist');
      }
      
      const feedUrl = `${baseUrl}/youtube/playlist/${playlistId}.xml`;
      const siteUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      const title = `YouTube Playlist: ${playlistId}`;
      const description = `RSS feed for YouTube playlist ${playlistId}`;
      rssXml = generateYouTubeRSS(videos, title, description, siteUrl, feedUrl);
    }
    
    // Cache the result
    cache.set(playlistId, rssXml);
    return rssXml;
  } catch (error) {
    console.error(`Error generating YouTube playlist feed for ${playlistId}:`, error);
    throw error;
  }
}

// Get channel videos with channel ID directly (internal function)
async function getChannelVideosWithChannelId(channelId, isShorts = false, maxResults = 50) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    console.log(`[getChannelVideosWithChannelId] Fetching videos for channel ID: ${channelId}, shorts: ${isShorts}`);

    // Get uploads playlist ID
    const uploadsPlaylistId = getUploadsPlaylistId(channelId);
    
    // Fetch playlist items
    const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      throw new Error(`YouTube API error: ${response.status} - ${errorMessage}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    // Get video IDs
    const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
    
    // Get video details including duration
    const videosUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const videosResponse = await fetch(videosUrl);
    
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.status}`);
    }
    
    const videosData = await videosResponse.json();
    
    // Parse duration from ISO 8601 format (e.g., PT1M30S = 1 minute 30 seconds)
    function parseDuration(durationStr) {
      const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Process videos
    let videos = videosData.items.map(video => {
      const duration = parseDuration(video.contentDetails.duration);
      const publishedAt = new Date(video.snippet.publishedAt);
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description || '',
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${video.id}/default.jpg`,
        publishedAt: publishedAt.toISOString(),
        duration: duration,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        // Only include videos that are actually published (not upcoming live streams)
        isUpcoming: video.snippet.liveBroadcastContent === 'upcoming'
      };
    });
    
    // Filter out upcoming live streams
    videos = videos.filter(v => !v.isUpcoming);
    
    // For /shorts, filter to videos < 60 seconds
    if (isShorts) {
      videos = videos.filter(v => v.duration < 60);
    }
    
    // Sort by published date (newest first)
    videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // Limit to maxResults
    return videos.slice(0, maxResults);
  } catch (error) {
    console.error(`Error getting channel videos for channel ID ${channelId}:`, error.message);
    throw error;
  }
}

// Generate JSON feed for channel /videos or /shorts (channel ID only)
export async function generateChannelJSONFeed(channelUrl, baseUrl = '') {
  try {
    // Extract channel ID from URL (must be youtube.com/channel/UC...)
    const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/([^\/\?]+)/);
    if (!channelIdMatch) {
      throw new Error('Invalid channel URL format. Must be youtube.com/channel/CHANNEL_ID');
    }
    
    const channelId = channelIdMatch[1];
    const isShorts = channelUrl.includes('/shorts');
    
    console.log(`[generateChannelJSONFeed] Using channel ID: ${channelId}, shorts: ${isShorts}`);
    
    // Get channel info to get channel name
    let channelName = `Channel ${channelId}`;
    if (YOUTUBE_API_KEY) {
      try {
        const channelInfoUrl = `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(channelInfoUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            channelName = data.items[0].snippet.title;
          }
        }
      } catch (e) {
        console.log(`Could not fetch channel name for ${channelId}, using ID:`, e.message);
      }
    }
    
    // Get videos (up to 50, will be filtered/sorted) - use channel ID directly
    const videos = await getChannelVideosWithChannelId(channelId, isShorts, 50);
    
    // Format as JSON feed
    const feed = {
      channel: channelName,
      channelUrl: `https://www.youtube.com/channel/${channelId}${isShorts ? '/shorts' : '/videos'}`,
      items: videos.map(video => ({
        id: video.id,
        title: video.title,
        link: video.url,
        description: video.description,
        publishedAt: video.publishedAt,
        thumbnail: video.thumbnail
      }))
    };
    
    return feed;
  } catch (error) {
    console.error(`Error generating channel JSON feed for ${channelUrl}:`, error.message);
    throw error;
  }
}

export default router;

