const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

// Check if Firebase is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// League display name mapping (to match what's stored in Firestore)
const LEAGUE_DISPLAY_NAMES = {
  'NFL': 'NFL',
  'NBA': 'NBA',
  'MLB': 'MLB',
  'PremierLeague': 'England: Premier League',
  'Premier League': 'England: Premier League',
  'MLS': 'USA: MLS',
  'LaLiga': 'Spain: LaLiga',
  'La Liga': 'Spain: LaLiga',
  'Bundesliga': 'Germany: Bundesliga',
  'SerieA': 'Italy: Serie A',
  'Serie A': 'Italy: Serie A',
  'Ligue1': 'France: Ligue 1',
  'Ligue 1': 'France: Ligue 1',
  'UEFAChampionsLeague': 'UEFA Champions League',
  'UEFA Champions League': 'UEFA Champions League',
  'UEFAEuropaLeague': 'Europa League',
  'UEFA Europa League': 'Europa League',
  'UEFAConferenceLeague': 'Conference League',
  'UEFA Conference League': 'Conference League',
  'NCAAF': 'NCAAF',
  'NHL': 'NHL',
  'WNBA': 'WNBA',
  'NCAAM': 'USA: NCAA',
  'NCAAW': 'USA: NCAA Women',
  'DPWorldTour': 'DP World Tour',
  'PGATourChampions': 'PGA Champions',
  'MotoGP': 'MotoGP',
  'PGATour': 'PGA Tour',
  'LPGATour': 'LPGA Tour',
  'LIVGolf': 'LIV Golf',
  'FormulaOne': 'Formula 1',
  'Formula 1': 'Formula 1',
  'Boxing': 'Boxing',
  'UFC': 'UFC',
  'ATP': 'ATP',
  'WTA': 'WTA',
  'USMNT': 'USMNT'
};

async function deleteLeagueGames(leagueName) {
  const leagueDisplayName = LEAGUE_DISPLAY_NAMES[leagueName] || leagueName;
  const gamesRef = db.collection(`artifacts/${process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'}/public/data/sportsGames`);

  console.log(`Deleting games for league: ${leagueDisplayName}...`);
  console.log(`Searching in collection: artifacts/${process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'}/public/data/sportsGames`);

  try {
    // Query for all games with this league name
    const snapshot = await gamesRef.where('League', '==', leagueDisplayName).get();

    if (snapshot.empty) {
      console.log(`No games found for league "${leagueDisplayName}"`);
      return;
    }

    console.log(`Found ${snapshot.size} games to delete`);

    // Delete in batches (Firestore batch limit is 500)
    const batchSize = 500;
    let deletedCount = 0;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + batchSize);

      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(`Deleted ${deletedCount} / ${docs.length} games...`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} games for league "${leagueDisplayName}"`);

  } catch (error) {
    console.error(`Error deleting games for ${leagueDisplayName}:`, error.message);
    process.exit(1);
  }
}

// Get league name from command line argument
const leagueName = process.argv[2];

if (!leagueName) {
  console.error('Usage: node delete-single-league.cjs <LEAGUE_NAME>');
  console.log('\nAvailable league names:');
  console.log(Object.keys(LEAGUE_DISPLAY_NAMES).join(', '));
  console.log('\nExample: node delete-single-league.cjs DPWorldTour');
  console.log('Example: node delete-single-league.cjs "Premier League"');
  process.exit(1);
}

// Confirm deletion
console.log(`⚠️  WARNING: This will delete ALL games for league "${leagueName}"`);
console.log(`Press Ctrl+C to cancel, or wait 3 seconds to continue...`);

setTimeout(() => {
  deleteLeagueGames(leagueName).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 3000);

