// perspectives-feed-config.js
// Feed source configuration for Perspectives pipeline
// Auto-discovered from rss-feed-service and shadow.html

export const PERSPECTIVES_FEED_CONFIG = {
  'NHL': {
    news: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/nhl-com-news.xml', source: 'nhl-com', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/espn-nhl-rss.xml', source: 'espn-nhl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/cbs-nhl-rss.xml', source: 'cbs-nhl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/hockeywriters.xml', source: 'hockeywriters', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/yahoo-nhl-rss.xml', source: 'yahoo-nhl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/hockeynews.xml', source: 'hockeynews', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/reddit-nhl.xml', source: 'reddit-nhl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/newsnow-nhl.xml', source: 'newsnow-nhl', fetchMethod: 'rss-service' }
    ],
    social: [
      { url: 'https://rss.app/feeds/FkhRHZBH8WxhSWqp.xml', source: 'rssapp-nhl', fetchMethod: 'rss' }, // RSS.app feed URL
      { url: 'https://sportsbots.xyz/users/BuffaloSabres.rss', source: 'mastodon-buffalosabres', fetchMethod: 'rss' } // Mastodon RSS feed
    ],
    videos: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/nhl-video-recaps.xml', source: 'nhl-recaps', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/youtube-nhl.xml', source: 'youtube-nhl', fetchMethod: 'rss-service' }
    ]
  },
  'NFL': {
    news: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/nfl-com.xml', source: 'nfl-com', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/espn-nfl-rss.xml', source: 'espn-nfl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/nbcsports-profootballtalk.xml', source: 'pft', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/cbs-nfl-rss.xml', source: 'cbs-nfl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/si-nfl.xml', source: 'si-nfl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/foxsports-nfl-api.xml', source: 'fox-nfl', fetchMethod: 'rss-service' },
      { url: 'https://rss.app/feeds/LCbkYBU74yt9AnT5.xml', source: 'br-nfl', fetchMethod: 'rss' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/yahoo-nfl-rss.xml', source: 'yahoo-nfl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/reddit-nfl.xml', source: 'reddit-nfl', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/newsnow-nfl.xml', source: 'newsnow-nfl', fetchMethod: 'rss-service' }
    ],
    social: [
      { url: 'https://rss.app/feeds/uvYTDMyn9nIYp068.xml', source: 'rssapp-nfl', fetchMethod: 'rss' } // RSS.app feed URL
    ],
    videos: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/youtube-nfl.xml', source: 'youtube-nfl', fetchMethod: 'rss-service' }
    ]
  },
  'NBA': {
    news: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/talkbasket-wnba.xml', source: 'talkbasket', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/espn-nba-rss.xml', source: 'espn-nba', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/cbs-nba-rss.xml', source: 'cbs-nba', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/yahoo-nba-rss.xml', source: 'yahoo-nba', fetchMethod: 'rss-service' },
      { url: 'https://rss.app/feeds/pXNlalfRqrlyVml6.xml', source: 'nba-com', fetchMethod: 'rss' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/foxsports-nba-api.xml', source: 'fox-nba', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/reddit-nba.xml', source: 'reddit-nba', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/newsnow-nba.xml', source: 'newsnow-nba', fetchMethod: 'rss-service' }
    ],
    social: [
      { url: 'https://rss.app/feeds/KDHaD7kKFdoZKNKv.xml', source: 'rssapp-nba', fetchMethod: 'rss' } // RSS.app feed URL
    ],
    videos: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/youtube-nba.xml', source: 'youtube-nba', fetchMethod: 'rss-service' }
    ]
  },
  'MLB': {
    news: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/mlb-rss.xml', source: 'mlb-com', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/espn-mlb-rss.xml', source: 'espn-mlb', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/cbs-mlb-rss.xml', source: 'cbs-mlb', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/yahoo-mlb-rss.xml', source: 'yahoo-mlb', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/foxsports-mlb-api.xml', source: 'fox-mlb', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/fangraphs-rss.xml', source: 'fangraphs', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/athletic-mlb.xml', source: 'mlbtr', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/reddit-mlb.xml', source: 'reddit-mlb', fetchMethod: 'rss-service' },
      { url: 'https://rss.app/feeds/AYtjYuHSzf8VXPWV.xml', source: 'breaking-mlb', fetchMethod: 'rss' }
    ],
    social: [
      { url: 'https://rss.app/feeds/ujM61O6ZzDQ7sOrb.xml', source: 'rssapp-mlb', fetchMethod: 'rss' } // RSS.app feed URL
    ],
    videos: [
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/youtube-mlb-playlist.xml', source: 'mlb-playlist', fetchMethod: 'rss-service' },
      { url: 'https://rss-feed-service-vp7bkrygcq-uc.a.run.app/feeds/youtube-mlb.xml', source: 'youtube-mlb', fetchMethod: 'rss-service' }
    ]
  },
  'UFC': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/qzbgRcN4Qbr7VV0a.xml', source: 'rssapp-ufc', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'Boxing': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/F2n8AUgzsvLsTadA.xml', source: 'rssapp-boxing', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NASCARCupSeries': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/AHhwgLGIFW2bn8zL.xml', source: 'rssapp-nascar', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'Tennis': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/VeaGgNXCdeNdgl5l.xml', source: 'rssapp-tennis', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'WNBA': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/DDsbnQvTkj4SNtgY.xml', source: 'rssapp-wnba', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'LIVGolf': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/4lGhahA1b9JU9QZw.xml', source: 'rssapp-livgolf', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'IndyCar': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/oP6JlgisMb451EVK.xml', source: 'rssapp-indycar', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NCAAM': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/nSxcJn3Ke9aIPqkw.xml', source: 'rssapp-ncaam', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NCAAW': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/8V2qb8WK1CMdeBfd.xml', source: 'rssapp-ncaaw', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NCAABaseball': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/6wO4p6CY027kWz5C.xml', source: 'rssapp-ncaabaseball', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NCAASoftball': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/WhV6lzzXj1FYOxln.xml', source: 'rssapp-ncaasoftball', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'MotoGP': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/tNL3DAMLhpRv30tg.xml', source: 'rssapp-motogp', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'LPGATour': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/MfbotBtAVnTL3I8j.xml', source: 'rssapp-lpga', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'UEFAChampionsLeague': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/UMleWQY5zVMDG3RE.xml', source: 'rssapp-championsleague', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'PremierLeague': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/d972MWUX8N4NiXWc.xml', source: 'rssapp-premierleague', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'MLS': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/J2tGf8v6qaD6GjFC.xml', source: 'rssapp-mls', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'Bundesliga': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/pqS6JLI45o7NYCkr.xml', source: 'rssapp-bundesliga', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'LaLiga': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/8ZkcLZl1mdrw2loE.xml', source: 'rssapp-laliga', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'SerieA': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/vFegYItzKVnhgmre.xml', source: 'rssapp-seriea', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'Soccer': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/S2jMmGyBQoDlvZ4D.xml', source: 'rssapp-soccer', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'FACup': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/Lyr6iaRy8Fq04PKN.xml', source: 'rssapp-facup', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'LigaMX': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/jak4RrwNxI4UyoHb.xml', source: 'rssapp-ligamx', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NWSL': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/wL801782ohBuXGyb.xml', source: 'rssapp-nwsl', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'Ligue1': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/2yFpSRvAMKYuQUZV.xml', source: 'rssapp-ligue1', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'UEFAEuropaLeague': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/p3fm4LjBWgp1WWr1.xml', source: 'rssapp-europaleague', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'UEFAConferenceLeague': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/9ThCZix939tiPtXy.xml', source: 'rssapp-conferenceleague', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'FormulaOne': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/8CRDFN299eMRIrYT.xml', source: 'rssapp-formula1', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'NCAAF': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/MgdJ7SfrtcBRmv21.xml', source: 'rssapp-ncaaf', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'PGATour': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/cySoiRoRnUqrXnoa.xml', source: 'rssapp-pgatour', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'TrackAndField': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/hcIJ3xkcewSGD4Yq.xml', source: 'rssapp-trackandfield', fetchMethod: 'rss' }
    ],
    videos: []
  },
  'Home': {
    news: [],
    social: [
      { url: 'https://rss.app/feeds/_dQv2W26Lxax1n3sC.xml', source: 'rssapp-home-1', fetchMethod: 'rss' },
      { url: 'https://rss.app/feeds/4kPf5TwmnRhc9JOI.xml', source: 'rssapp-home-2', fetchMethod: 'rss' },
      { url: 'https://rss.app/feeds/DxhOq5IvdSWmuCOQ.xml', source: 'rssapp-home-3', fetchMethod: 'rss' }
    ],
    videos: []
  }
};

