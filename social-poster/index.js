const express = require('express');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Initialize Firebase
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
  console.log('✅ Firebase initialized');
  return db;
}

// Initialize social media clients
let twitterClient, instagramClient;

function initializeTwitter() {
  if (twitterClient) return twitterClient;
  
  const appKey = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_APP_KEY;
  const appSecret = process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_APP_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.warn('⚠️  Twitter credentials not configured');
    console.warn('   Required: TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET');
    return null;
  }
  
  twitterClient = new TwitterApi({
    appKey: appKey,
    appSecret: appSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
  
  console.log('✅ Twitter client initialized');
  return twitterClient;
}

function initializeInstagram() {
  if (instagramClient) return instagramClient;
  
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('⚠️  Instagram credentials not configured');
    return null;
  }
  
  // Instagram Basic Display API setup
  instagramClient = {
    accessToken: accessToken,
    apiUrl: 'https://graph.instagram.com'
  };
  
  console.log('✅ Instagram client initialized');
  return instagramClient;
}

// Design options
const DESIGN_THEMES = {
  neon: {
    background: '#0a0a0a',
    primary: '#00ff41',
    secondary: '#ff00ff',
    accent: '#00ffff',
    text: '#ffffff',
    glow: true
  },
  cyberpunk: {
    background: '#000000',
    primary: '#ff0080',
    secondary: '#00ff80',
    accent: '#8000ff',
    text: '#ffffff',
    glow: true
  },
  electric: {
    background: '#0d1117',
    primary: '#58a6ff',
    secondary: '#f85149',
    accent: '#3fb950',
    text: '#c9d1d9',
    glow: true
  },
  classic: {
    background: '#1a1a1a',
    primary: '#ffffff',
    secondary: '#888888',
    accent: '#ff6b6b',
    text: '#ffffff',
    glow: false
  }
};

// Get today's featured games
async function getTodaysFeaturedGames() {
  const db = initializeFirebase();
  const today = DateTime.now().setZone('America/New_York').toISODate();
  
  console.log(`📅 Fetching featured games for ${today}...`);
  
  const featuredRef = db.collection('artifacts/flashlive-daily-scraper/public/data/Featured');
  const snapshot = await featuredRef.where('gameDate', '==', today).get();
  
  if (snapshot.empty) {
    console.log('⚠️  No featured games found for today');
    return [];
  }
  
  const games = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    games.push({
      id: doc.id,
      ...data,
      // Normalize team names
      homeTeam: data['Home Team'] || data.homeTeam || '',
      awayTeam: data['Away Team'] || data.awayTeam || '',
      league: data.League || data.league || '',
      channel: data.Channel || data.channel || '',
      startTime: data['Start Time'] || data.startTime,
      timeString: data.timeString || ''
    });
  });
  
  // Sort by order if available, otherwise by start time
  games.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.startTime && b.startTime) {
      return a.startTime.toMillis() - b.startTime.toMillis();
    }
    return 0;
  });
  
  console.log(`✅ Found ${games.length} featured games`);
  return games;
}

// Generate image for social media post
async function generateSocialImage(games, themeName = 'neon') {
  const theme = DESIGN_THEMES[themeName] || DESIGN_THEMES.neon;
  
  // Canvas dimensions (Instagram/Twitter optimal)
  const width = 1080;
  const height = 1080;
  const padding = 60;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background with animated gradient effect
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, theme.background);
  bgGradient.addColorStop(0.5, '#0a0a1a');
  bgGradient.addColorStop(1, theme.background);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add grid pattern for depth
  if (theme.glow) {
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  }
  
  // Title with neon glow effect
  ctx.fillStyle = theme.primary;
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  if (theme.glow) {
    // Multiple shadow layers for glow
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  const title = "TODAY'S FEATURED GAMES";
  ctx.fillText(title, width / 2, padding);
  
  // Add secondary glow
  if (theme.glow) {
    ctx.shadowBlur = 50;
    ctx.globalAlpha = 0.5;
    ctx.fillText(title, width / 2, padding);
    ctx.globalAlpha = 1.0;
  }
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Date with accent color
  const today = DateTime.now().setZone('America/New_York');
  const dateStr = today.toFormat('EEEE, MMMM d').toUpperCase();
  ctx.fillStyle = theme.secondary;
  ctx.font = 'bold 40px Arial';
  
  if (theme.glow) {
    ctx.shadowColor = theme.secondary;
    ctx.shadowBlur = 20;
  }
  
  ctx.fillText(dateStr, width / 2, padding + 110);
  ctx.shadowBlur = 0;
  
  // Games list with dynamic spacing
  const gameStartY = padding + 220;
  const availableHeight = height - gameStartY - padding - 60; // Reserve space for footer
  const gameHeight = Math.min(availableHeight / games.length, 150);
  const gamePadding = 15;
  
  games.forEach((game, index) => {
    const y = gameStartY + (index * gameHeight);
    
    // League badge with glow
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    
    if (theme.glow) {
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 15;
    }
    
    ctx.fillText(game.league.toUpperCase(), padding, y);
    ctx.shadowBlur = 0;
    
    // Teams with bold styling
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 48px Arial';
    
    // Truncate long team names
    let matchup = `${game.awayTeam} vs ${game.homeTeam}`;
    if (ctx.measureText(matchup).width > width - (padding * 2)) {
      // Try shorter version
      const awayShort = game.awayTeam.length > 20 ? game.awayTeam.substring(0, 17) + '...' : game.awayTeam;
      const homeShort = game.homeTeam.length > 20 ? game.homeTeam.substring(0, 17) + '...' : game.homeTeam;
      matchup = `${awayShort} vs ${homeShort}`;
    }
    
    ctx.fillText(matchup, padding, y + 45);
    
    // Time and channel with secondary color
    ctx.fillStyle = theme.secondary;
    ctx.font = '32px Arial';
    const info = game.timeString 
      ? `${game.timeString} ET • ${game.channel || 'TBD'}`
      : game.channel || 'Time TBD';
    ctx.fillText(info, padding, y + 100);
    
    // Divider line with glow
    if (index < games.length - 1) {
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 8]);
      
      if (theme.glow) {
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 10;
      }
      
      ctx.beginPath();
      ctx.moveTo(padding, y + gameHeight - gamePadding);
      ctx.lineTo(width - padding, y + gameHeight - gamePadding);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }
  });
  
  // Footer with website
  ctx.fillStyle = theme.secondary;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  
  if (theme.glow) {
    ctx.shadowColor = theme.secondary;
    ctx.shadowBlur = 15;
  }
  
  ctx.fillText('thporth.com', width / 2, height - padding - 20);
  ctx.shadowBlur = 0;
  
  return canvas.toBuffer('image/png');
}

// Post to Twitter/X
async function postToTwitter(imageBuffer, caption) {
  const client = initializeTwitter();
  if (!client) {
    console.warn('⚠️  Twitter not configured, skipping');
    return null;
  }
  
  try {
    console.log('🐦 Posting to Twitter...');
    
    // Upload media using v1 API (required for media upload)
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: 'image/png'
    });
    
    console.log(`📸 Media uploaded: ${mediaId}`);
    
    // Create tweet using v2 API
    const tweet = await client.v2.tweet({
      text: caption.substring(0, 280), // Twitter character limit
      media: {
        media_ids: [mediaId]
      }
    });
    
    console.log(`✅ Tweet posted successfully!`);
    console.log(`   Tweet ID: ${tweet.data.id}`);
    console.log(`   URL: https://twitter.com/i/web/status/${tweet.data.id}`);
    return tweet.data.id;
  } catch (error) {
    console.error('❌ Twitter error:', error);
    if (error.data) {
      console.error('   Error details:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

// Post to Instagram
async function postToInstagram(imageBuffer, caption) {
  const client = initializeInstagram();
  if (!client) {
    console.warn('⚠️  Instagram not configured, skipping');
    return null;
  }
  
  try {
    console.log('📸 Posting to Instagram...');
    
    // Instagram requires a two-step process:
    // 1. Create media container
    // 2. Publish media
    
    // For now, we'll use a simplified approach
    // Note: Full Instagram API requires more setup (Facebook Business account, etc.)
    
    console.log('⚠️  Instagram posting requires additional setup');
    console.log('   See: https://developers.facebook.com/docs/instagram-api/');
    
    return null;
  } catch (error) {
    console.error('❌ Instagram error:', error);
    throw error;
  }
}

// Main posting function
async function createDailyPost(themeName = 'neon') {
  try {
    console.log('🚀 Starting daily social media post...');
    
    // Get today's games
    const games = await getTodaysFeaturedGames();
    
    if (games.length === 0) {
      console.log('⚠️  No games to post today');
      return { success: false, reason: 'No games found' };
    }
    
    // Generate image
    console.log('🎨 Generating image...');
    const imageBuffer = await generateSocialImage(games, themeName);
    
    // Create caption
    const today = DateTime.now().setZone('America/New_York');
    const dateStr = today.toFormat('EEEE, MMMM d');
    let caption = `🏀 Today's Featured Games - ${dateStr}\n\n`;
    
    games.forEach((game, index) => {
      caption += `${index + 1}. ${game.awayTeam} vs ${game.homeTeam}\n`;
      if (game.timeString) {
        caption += `   ⏰ ${game.timeString} ET`;
      }
      if (game.channel) {
        caption += ` 📺 ${game.channel}`;
      }
      caption += '\n\n';
    });
    
    caption += '📊 Full schedule: thporth.com';
    
    // Post to social media
    const results = {
      twitter: null,
      instagram: null
    };
    
    try {
      results.twitter = await postToTwitter(imageBuffer, caption);
    } catch (error) {
      console.error('Twitter posting failed:', error);
    }
    
    try {
      results.instagram = await postToInstagram(imageBuffer, caption);
    } catch (error) {
      console.error('Instagram posting failed:', error);
    }
    
    console.log('✅ Daily post complete!');
    return {
      success: true,
      gamesCount: games.length,
      results
    };
    
  } catch (error) {
    console.error('❌ Error creating daily post:', error);
    throw error;
  }
}

// HTTP endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/post-daily', async (req, res) => {
  try {
    const theme = req.body.theme || 'neon';
    const result = await createDailyPost(theme);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Social poster service running on port ${PORT}`);
  console.log(`📅 Ready to post daily at 6 AM ET`);
});

// Export for testing
module.exports = { createDailyPost, generateSocialImage, getTodaysFeaturedGames };

