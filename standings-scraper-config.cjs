// Configuration for which standings scrapers to run based on season
// Set to false to skip scrapers for leagues not in season

module.exports = {
  STANDINGS_SCRAPER_CONFIG: {
  // NFL - Season: September to February
  'scrape-nfl-standings.cjs': true, // Currently in season
  
  // NBA - Season: October to June
  'scrape-nba-standings.cjs': true, // Currently in season
  
  // MLB - ESPN API available
  'scrape-mlb-standings.cjs': true,
  
  // NHL - Season: October to June
  'scrape-nhl-standings.cjs': true, // Currently in season
  
  // NCAAF - Season: August to January
  'scrape-ncaaf-standings.cjs': true, // Currently in season
  
  // NCAAM - Season: November to April
  'scrape-ncaam-standings.cjs': true, // Currently in season
  
  // NCAAW - Season: November to April
  'scrape-ncaaw-standings.cjs': true, // Currently in season
  
  // EPL - Season: August to May
  'scrape-epl-standings.cjs': true, // Currently in season
  
  // LaLiga - Season: August to May
  'scrape-laliga-standings.cjs': true, // Currently in season
  
  // Bundesliga - Season: August to May
  'scrape-bundesliga-standings.cjs': true, // Currently in season
  
  // Serie A - Season: August to May
  'scrape-seriea-standings.cjs': true, // Currently in season
  
  // MLS - ESPN API available
  'scrape-mls-standings.cjs': true,
  
  // UEFA Champions League - Season: September to May
  'scrape-ucl-standings.cjs': true, // Currently in season
  
  // UEFA Europa League - Season: September to May
  'scrape-uel-standings.cjs': true, // Currently in season
  
  // UEFA Conference League - Season: September to May
  'scrape-uecl-standings.cjs': true, // Currently in season
  
  // Liga MX - ESPN API available
  'scrape-ligamx-standings.cjs': true,
  
  // NWSL - ESPN API available
  'scrape-nwsl-standings.cjs': true,
  
  // Ligue 1 - Season: August to May
  'scrape-ligue1-standings.cjs': true, // Currently in season
  
  // Formula One - Season: March to December
  'scrape-f1-driver-standings.cjs': true,
  'scrape-f1-constructor-standings.cjs': true,
  
  // PGA Tour - Year round (but less frequent in winter)
  'scrape-pgatour-standings.cjs': true,
  
  // LPGA Tour - Year round (but less frequent in winter)
  'scrape-lpgatour-standings.cjs': true,
  
  // UFC - Year round
  'scrape-ufc-standings.cjs': true, // Year round
  
  // Boxing - Year round
  'scrape-boxing-standings.cjs': true, // Year round
  
  // NASCAR - Season: February to November
  'scrape-nascar-standings.cjs': true,
  
  // Tennis - Year round (ATP/WTA tours)
  'scrape-tennis-standings.cjs': true, // Year round
  
  // LIV Golf - Year round
  'scrape-livgolf-standings.cjs': true,
  
  // IndyCar - Season: March to September
  'scrape-indycar-standings.cjs': true,
  
  // MotoGP - Season: March to November
  'scrape-motogp-standings.cjs': true,
  
  // Track and Field - Year round (various events)
  'scrape-trackandfield-standings.cjs': true, // Year round
  
  // FA Cup - Season: August to May
  'scrape-facup-standings.cjs': true, // Currently in season
  
  // CFP Rankings - Season: October to January
  'scrape-cfp-standings.cjs': true,
  
  // Top 25 sync - Depends on NCAAF/NCAAM seasons
  'sync-top25-to-games.cjs': true, // Currently in season
  }
};

