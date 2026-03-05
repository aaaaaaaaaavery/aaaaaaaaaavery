// perspectives-config.js
// Source registry and configuration for Perspectives system

// Source registry: Which accounts to monitor per league/team
export const PERSPECTIVES_SOURCES = {
  // League-level sources (apply to all games in that league)
  NHL: {
    x_accounts: ['NHL', 'espn', 'spittinchiclets'],
    rss: [
      'https://www.espn.com/espn/rss/nhl/news',
      'https://www.nhl.com/rss/news'
    ],
    mastodon: [
      'https://mastodon.social/@nhl'
    ],
    youtube: [
      'https://www.youtube.com/@NHL',
      'https://www.youtube.com/@ESPN'
    ]
  },
  NFL: {
    x_accounts: ['NFL', 'espn', 'nflnetwork'],
    rss: [
      'https://www.espn.com/espn/rss/nfl/news',
      'https://www.nfl.com/rss/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@NFL',
      'https://www.youtube.com/@ESPN'
    ]
  },
  NBA: {
    x_accounts: ['NBA', 'espn', 'wojespn'],
    rss: [
      'https://www.espn.com/espn/rss/nba/news',
      'https://www.nba.com/rss/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@NBA',
      'https://www.youtube.com/@ESPN'
    ]
  },
  MLB: {
    x_accounts: ['MLB', 'espn'],
    rss: [
      'https://www.espn.com/espn/rss/mlb/news',
      'https://www.mlb.com/rss/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@MLB',
      'https://www.youtube.com/@ESPN'
    ]
  },
  WNBA: {
    x_accounts: ['WNBA', 'espn'],
    rss: [
      'https://www.espn.com/espn/rss/wnba/news',
      'https://www.wnba.com/rss/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@WNBA',
      'https://www.youtube.com/@ESPN'
    ]
  },
  NWSL: {
    x_accounts: ['NWSL', 'espn'],
    rss: [
      'https://www.espn.com/espn/rss/nwsl/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@NWSL',
      'https://www.youtube.com/@ESPN'
    ]
  },
  MLS: {
    x_accounts: ['MLS', 'espn'],
    rss: [
      'https://www.espn.com/espn/rss/mls/news',
      'https://www.mlssoccer.com/rss/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@MLS',
      'https://www.youtube.com/@ESPN'
    ]
  },
  'USA: NCAA': {
    x_accounts: ['ESPNCFB', 'ESPN', 'NCAA'],
    rss: [
      'https://www.espn.com/espn/rss/ncf/news',
      'https://www.espn.com/espn/rss/ncb/news'
    ],
    mastodon: [],
    youtube: [
      'https://www.youtube.com/@ESPNCFB',
      'https://www.youtube.com/@ESPN'
    ]
  }
};

// Team-level sources (specific team accounts)
export const TEAM_SOURCES = {
  // NHL Teams
  'St. Louis Blues': {
    x_accounts: ['StLouisBlues'],
    rss: ['https://www.nhl.com/blues/rss'],
    mastodon: [],
    youtube: ['https://www.youtube.com/@stlouisblues']
  },
  'Dallas Stars': {
    x_accounts: ['DallasStars'],
    rss: ['https://www.nhl.com/stars/rss'],
    mastodon: [],
    youtube: ['https://www.youtube.com/@dallasstars']
  },
  // Add more teams as needed - this is extensible
};

// Platform detection and ID extraction helpers
export function detectPlatform(url) {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x';
  if (url.includes('mastodon')) return 'mastodon';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  return 'unknown';
}

export function extractPostId(platform, url) {
  if (platform === 'x') {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  }
  if (platform === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
  if (platform === 'mastodon') {
    const match = url.match(/\/(\d+)$/);
    return match ? match[1] : null;
  }
  return null;
}

// Get sources for a specific game (league + teams)
export function getSourcesForGame(game) {
  const league = game.League || game.Sport;
  const homeTeam = game['Home Team'];
  const awayTeam = game['Away Team'];
  
  const sources = {
    x_accounts: [],
    rss: [],
    mastodon: [],
    youtube: []
  };
  
  // Add league sources
  if (PERSPECTIVES_SOURCES[league]) {
    sources.x_accounts.push(...(PERSPECTIVES_SOURCES[league].x_accounts || []));
    sources.rss.push(...(PERSPECTIVES_SOURCES[league].rss || []));
    sources.mastodon.push(...(PERSPECTIVES_SOURCES[league].mastodon || []));
    sources.youtube.push(...(PERSPECTIVES_SOURCES[league].youtube || []));
  }
  
  // Add team sources
  if (homeTeam && TEAM_SOURCES[homeTeam]) {
    sources.x_accounts.push(...(TEAM_SOURCES[homeTeam].x_accounts || []));
    sources.rss.push(...(TEAM_SOURCES[homeTeam].rss || []));
    sources.mastodon.push(...(TEAM_SOURCES[homeTeam].mastodon || []));
    sources.youtube.push(...(TEAM_SOURCES[homeTeam].youtube || []));
  }
  
  if (awayTeam && TEAM_SOURCES[awayTeam]) {
    sources.x_accounts.push(...(TEAM_SOURCES[awayTeam].x_accounts || []));
    sources.rss.push(...(TEAM_SOURCES[awayTeam].rss || []));
    sources.mastodon.push(...(TEAM_SOURCES[awayTeam].mastodon || []));
    sources.youtube.push(...(TEAM_SOURCES[awayTeam].youtube || []));
  }
  
  // Deduplicate
  sources.x_accounts = [...new Set(sources.x_accounts)];
  sources.rss = [...new Set(sources.rss)];
  sources.mastodon = [...new Set(sources.mastodon)];
  sources.youtube = [...new Set(sources.youtube)];
  
  return sources;
}

