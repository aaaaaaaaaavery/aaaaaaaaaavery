// Configuration for which standings scrapers to run based on season
// Set to false to skip scrapers for leagues not in season

module.exports = {
  STANDINGS_SCRAPER_CONFIG: {
  // NFL - Season: September to February
  'scrape-nfl-standings.cjs': true, // Currently in season
  
  // NBA - Season: October to June
  'scrape-nba-standings.cjs': true, // Currently in season
  
  // MLB - Season: March to November
  'scrape-mlb-standings.cjs': false, // Off season (Dec-Feb)
  
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
  
  // MLS - Season: February to November
  'scrape-mls-standings.cjs': false, // Off season (Dec-Jan)
  
  // UEFA Champions League - Season: September to May
  'scrape-ucl-standings.cjs': true, // Currently in season
  
  // UEFA Europa League - Season: September to May
  'scrape-uel-standings.cjs': true, // Currently in season
  
  // UEFA Conference League - Season: September to May
  'scrape-uecl-standings.cjs': true, // Currently in season
  
  // Liga MX - Season: July to May (Apertura + Clausura)
  'scrape-ligamx-standings.cjs': false, // Paused
  
  // NWSL - Season: March to November
  'scrape-nwsl-standings.cjs': false, // Off season (Dec-Feb)
  
  // Ligue 1 - Season: August to May
  'scrape-ligue1-standings.cjs': true, // Currently in season
  
  // Formula One - Season: March to December
  'scrape-f1-driver-standings.cjs': false, // Off season (Dec-Feb)
  'scrape-f1-constructor-standings.cjs': false, // Off season (Dec-Feb)
  
  // PGA Tour - Year round (but less frequent in winter)
  'scrape-pgatour-standings.cjs': false, // Paused
  
  // LPGA Tour - Year round (but less frequent in winter)
  'scrape-lpgatour-standings.cjs': false, // Paused
  
  // UFC - Year round
  'scrape-ufc-standings.cjs': true, // Year round
  
  // Boxing - Year round
  'scrape-boxing-standings.cjs': true, // Year round
  
  // NASCAR - Season: February to November
  'scrape-nascar-standings.cjs': false, // Off season (Dec-Jan)
  
  // Tennis - Year round (ATP/WTA tours)
  'scrape-tennis-standings.cjs': true, // Year round
  
  // LIV Golf - Year round
  'scrape-livgolf-standings.cjs': false, // Paused
  
  // IndyCar - Season: March to September
  'scrape-indycar-standings.cjs': false, // Off season (Oct-Feb)
  
  // MotoGP - Season: March to November
  'scrape-motogp-standings.cjs': false, // Off season (Dec-Feb)
  
  // Track and Field - Year round (various events)
  'scrape-trackandfield-standings.cjs': true, // Year round
  
  // FA Cup - Season: August to May
  'scrape-facup-standings.cjs': true, // Currently in season
  
  // CFP Rankings - Season: October to January
  'scrape-cfp-standings.cjs': false, // Paused
  
  // Top 25 sync - Depends on NCAAF/NCAAM seasons
  'sync-top25-to-games.cjs': true, // Currently in season
  }
};

