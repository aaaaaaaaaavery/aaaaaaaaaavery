import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import RSS from 'rss';
import NodeCache from 'node-cache';

const router = express.Router();
const CACHE_TTL = 30 * 60; // 30 minutes cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Extract playlist ID from URL
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Scrape YouTube playlist page
async function scrapeYouTubePlaylist(playlistId) {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const videos = [];
    
    // YouTube embeds video data in script tags as JSON
    // Look for ytInitialData or window["ytInitialData"]
    const scriptTags = $('script').toArray();
    let ytData = null;
    
    for (const script of scriptTags) {
      const content = $(script).html() || '';
      if (content.includes('var ytInitialData') || content.includes('window["ytInitialData"]')) {
        try {
          // Extract JSON data
          const jsonMatch = content.match(/var ytInitialData\s*=\s*({.+?});/s) || 
                          content.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);
          if (jsonMatch) {
            ytData = JSON.parse(jsonMatch[1]);
            break;
          }
        } catch (e) {
          console.log('Could not parse ytInitialData:', e.message);
        }
      }
    }
    
    if (ytData) {
      // Navigate through YouTube's data structure
      const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
      
      if (contents) {
        contents.forEach((item, index) => {
          try {
            const video = item?.playlistVideoRenderer;
            if (video) {
              const videoId = video.videoId;
              const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Untitled';
              const thumbnail = video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || 
                               `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
              const lengthText = video.lengthText?.simpleText || '';
              const publishedTimeText = video.publishedTimeText?.simpleText || '';
              
              videos.push({
                id: videoId,
                title: title,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: thumbnail,
                duration: lengthText,
                publishedTime: publishedTimeText,
                description: video.description?.simpleText || '',
                index: index + 1
              });
            }
          } catch (e) {
            console.log('Error parsing video item:', e.message);
          }
        });
      }
    }
    
    // Fallback: Try to extract from HTML if JSON parsing fails
    if (videos.length === 0) {
      $('a[href*="/watch?v="]').each((i, elem) => {
        if (i < 50) { // Limit to 50 videos
          const $link = $(elem);
          const href = $link.attr('href');
          const videoId = href?.match(/[?&]v=([a-zA-Z0-9_-]+)/)?.[1];
          const title = $link.attr('title') || $link.text().trim();
          const $thumb = $link.find('img').first();
          const thumbnail = $thumb.attr('src') || $thumb.attr('data-thumb') || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          
          if (videoId && title) {
            videos.push({
              id: videoId,
              title: title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail: thumbnail,
              duration: '',
              publishedTime: '',
              description: '',
              index: videos.length + 1
            });
          }
        }
      });
    }
    
    return videos;
  } catch (error) {
    console.error(`Error scraping YouTube playlist ${playlistId}:`, error.message);
    return [];
  }
}

// Generate RSS feed from YouTube playlist
function generateYouTubeRSS(playlistId, videos, baseUrl) {
  const feedUrl = `${baseUrl}/youtube/playlist/${playlistId}.xml`;
  
  const feed = new RSS({
    title: `YouTube Playlist: ${playlistId}`,
    description: `RSS feed for YouTube playlist ${playlistId}`,
    feed_url: feedUrl,
    site_url: `https://www.youtube.com/playlist?list=${playlistId}`,
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
      date: new Date(), // YouTube doesn't always provide exact publish date in playlist view
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
    res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
    return res.send(cached);
  }
  
  try {
    const videos = await scrapeYouTubePlaylist(playlistId);
    
    if (videos.length === 0) {
      return res.status(404).send('No videos found in playlist. The playlist may be private or the structure may have changed.');
    }
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const rssXml = generateYouTubeRSS(playlistId, videos, baseUrl);
    
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

export default router;

