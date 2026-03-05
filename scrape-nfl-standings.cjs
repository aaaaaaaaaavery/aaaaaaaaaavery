const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin (reuse existing credentials)
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ESPN's hidden API endpoint for NFL standings
const ESPN_NFL_API = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';

// NFL Division mappings
const TEAM_DIVISIONS = {
  // AFC East
  'Buffalo Bills': 'AFC East',
  'Miami Dolphins': 'AFC East',
  'New England Patriots': 'AFC East',
  'New York Jets': 'AFC East',
  
  // AFC North
  'Baltimore Ravens': 'AFC North',
  'Cincinnati Bengals': 'AFC North',
  'Cleveland Browns': 'AFC North',
  'Pittsburgh Steelers': 'AFC North',
  
  // AFC South
  'Houston Texans': 'AFC South',
  'Indianapolis Colts': 'AFC South',
  'Jacksonville Jaguars': 'AFC South',
  'Tennessee Titans': 'AFC South',
  
  // AFC West
  'Denver Broncos': 'AFC West',
  'Kansas City Chiefs': 'AFC West',
  'Las Vegas Raiders': 'AFC West',
  'Los Angeles Chargers': 'AFC West',
  
  // NFC East
  'Dallas Cowboys': 'NFC East',
  'New York Giants': 'NFC East',
  'Philadelphia Eagles': 'NFC East',
  'Washington Commanders': 'NFC East',
  
  // NFC North
  'Chicago Bears': 'NFC North',
  'Detroit Lions': 'NFC North',
  'Green Bay Packers': 'NFC North',
  'Minnesota Vikings': 'NFC North',
  
  // NFC South
  'Atlanta Falcons': 'NFC South',
  'Carolina Panthers': 'NFC South',
  'New Orleans Saints': 'NFC South',
  'Tampa Bay Buccaneers': 'NFC South',
  
  // NFC West
  'Arizona Cardinals': 'NFC West',
  'Los Angeles Rams': 'NFC West',
  'San Francisco 49ers': 'NFC West',
  'Seattle Seahawks': 'NFC West'
};

async function scrapeNFLStandings() {
  try {
    console.log('Using hard-coded NFL standings (per request)');
    const standings = [];

    // Helper to push team
    function pushTeam(conf, division, status, code, teamName, stats) {
      standings.push({
        Conference: conf,
        Division: division,
        Status: status || '',
        Code: code,
        Team: teamName,
        W: stats.W,
        L: stats.L,
        T: stats.T,
        PCT: stats.PCT,
        HOME: stats.HOME,
        AWAY: stats.AWAY,
        DIV: stats.DIV,
        CONF: stats.CONF,
        PF: stats.PF,
        PA: stats.PA,
        DIFF: stats.DIFF,
        STRK: stats.STRK,
        lastUpdated: new Date().toISOString()
      });
    }

    // AFC EAST
    pushTeam('AFC','AFC East','z','NE','New England Patriots',{W:13,L:3,T:0,PCT:'.813',HOME:'5-3',AWAY:'8-0',DIV:'4-1',CONF:'8-3',PF:452,PA:310,DIFF:'+142',STRK:'W2'});
    pushTeam('AFC','AFC East','y','BUF','Buffalo Bills',{W:11,L:5,T:0,PCT:'.688',HOME:'6-2',AWAY:'5-3',DIV:'3-2',CONF:'8-3',PF:446,PA:357,DIFF:'+89',STRK:'L1'});
    pushTeam('AFC','AFC East','e','MIA','Miami Dolphins',{W:7,L:9,T:0,PCT:'.438',HOME:'5-4',AWAY:'2-5',DIV:'3-2',CONF:'3-8',PF:337,PA:386,DIFF:'-49',STRK:'W1'});
    pushTeam('AFC','AFC East','','NYJ','New York Jets',{W:3,L:13,T:0,PCT:'.188',HOME:'2-7',AWAY:'1-6',DIV:'0-5',CONF:'2-9',PF:292,PA:468,DIFF:'-176',STRK:'L4'});

    // AFC NORTH
    pushTeam('AFC','AFC North','','PIT','Pittsburgh Steelers',{W:9,L:7,T:0,PCT:'.563',HOME:'5-3',AWAY:'4-4',DIV:'3-2',CONF:'7-4',PF:371,PA:363,DIFF:'+8',STRK:'L1'});
    pushTeam('AFC','AFC North','','BAL','Baltimore Ravens',{W:8,L:8,T:0,PCT:'.500',HOME:'3-6',AWAY:'5-2',DIV:'3-2',CONF:'5-6',PF:400,PA:372,DIFF:'+28',STRK:'W1'});
    pushTeam('AFC','AFC North','e','CIN','Cincinnati Bengals',{W:6,L:10,T:0,PCT:'.375',HOME:'3-5',AWAY:'3-5',DIV:'3-2',CONF:'5-6',PF:396,PA:472,DIFF:'-76',STRK:'W2'});
    pushTeam('AFC','AFC North','e','CLE','Cleveland Browns',{W:4,L:12,T:0,PCT:'.250',HOME:'3-6',AWAY:'1-6',DIV:'1-4',CONF:'3-8',PF:259,PA:361,DIFF:'-102',STRK:'W1'});

    // AFC SOUTH
    pushTeam('AFC','AFC South','x','JAX','Jacksonville Jaguars',{W:12,L:4,T:0,PCT:'.750',HOME:'6-2',AWAY:'6-2',DIV:'4-1',CONF:'9-2',PF:433,PA:329,DIFF:'+104',STRK:'W7'});
    pushTeam('AFC','AFC South','x','HOU','Houston Texans',{W:11,L:5,T:0,PCT:'.688',HOME:'6-2',AWAY:'5-3',DIV:'4-1',CONF:'9-2',PF:366,PA:265,DIFF:'+101',STRK:'W8'});
    pushTeam('AFC','AFC South','e','IND','Indianapolis Colts',{W:8,L:8,T:0,PCT:'.500',HOME:'6-3',AWAY:'2-5',DIV:'2-3',CONF:'6-5',PF:436,PA:374,DIFF:'+62',STRK:'L6'});
    pushTeam('AFC','AFC South','e','TEN','Tennessee Titans',{W:3,L:13,T:0,PCT:'.188',HOME:'1-8',AWAY:'2-5',DIV:'0-5',CONF:'2-9',PF:277,PA:437,DIFF:'-160',STRK:'L1'});

    // AFC WEST
    pushTeam('AFC','AFC West','z','DEN','Denver Broncos',{W:13,L:3,T:0,PCT:'.813',HOME:'7-1',AWAY:'6-2',DIV:'4-1',CONF:'8-3',PF:382,PA:308,DIFF:'+74',STRK:'W1'});
    pushTeam('AFC','AFC West','y','LAC','Los Angeles Chargers',{W:11,L:5,T:0,PCT:'.688',HOME:'6-3',AWAY:'5-2',DIV:'5-0',CONF:'8-3',PF:365,PA:321,DIFF:'+44',STRK:'L1'});
    pushTeam('AFC','AFC West','e','KC','Kansas City Chiefs',{W:6,L:10,T:0,PCT:'.375',HOME:'5-4',AWAY:'1-6',DIV:'1-4',CONF:'3-8',PF:350,PA:314,DIFF:'+36',STRK:'L5'});
    pushTeam('AFC','AFC West','e','LV','Las Vegas Raiders',{W:2,L:14,T:0,PCT:'.125',HOME:'1-7',AWAY:'1-7',DIV:'0-5',CONF:'2-9',PF:227,PA:420,DIFF:'-193',STRK:'L10'});

    // NFC EAST
    pushTeam('NFC','NFC East','z','PHI','Philadelphia Eagles',{W:11,L:5,T:0,PCT:'.688',HOME:'5-2',AWAY:'6-3',DIV:'3-2',CONF:'8-3',PF:362,PA:301,DIFF:'+61',STRK:'W3'});
    pushTeam('NFC','NFC East','e','DAL','Dallas Cowboys',{W:7,L:8,T:1,PCT:'.469',HOME:'4-3-1',AWAY:'3-5',DIV:'4-1',CONF:'4-6-1',PF:454,PA:477,DIFF:'-23',STRK:'W1'});
    pushTeam('NFC','NFC East','e','WSH','Washington Commanders',{W:4,L:12,T:0,PCT:'.250',HOME:'2-6',AWAY:'2-6',DIV:'2-3',CONF:'2-9',PF:332,PA:434,DIFF:'-102',STRK:'L2'});
    pushTeam('NFC','NFC East','e','NYG','New York Giants',{W:3,L:13,T:0,PCT:'.188',HOME:'2-5',AWAY:'1-8',DIV:'1-4',CONF:'1-10',PF:347,PA:422,DIFF:'-75',STRK:'W1'});

    // NFC NORTH
    pushTeam('NFC','NFC North','z','CHI','Chicago Bears',{W:11,L:5,T:0,PCT:'.688',HOME:'6-1',AWAY:'5-4',DIV:'2-3',CONF:'7-4',PF:425,PA:396,DIFF:'+29',STRK:'L1'});
    pushTeam('NFC','NFC North','y','GB','Green Bay Packers',{W:9,L:6,T:1,PCT:'.594',HOME:'5-3',AWAY:'4-3-1',DIV:'4-1',CONF:'7-3-1',PF:388,PA:344,DIFF:'+44',STRK:'L3'});
    pushTeam('NFC','NFC North','e','MIN','Minnesota Vikings',{W:8,L:8,T:0,PCT:'.500',HOME:'3-4',AWAY:'5-4',DIV:'3-2',CONF:'6-5',PF:328,PA:330,DIFF:'-2',STRK:'W4'});
    pushTeam('NFC','NFC North','e','DET','Detroit Lions',{W:8,L:8,T:0,PCT:'.500',HOME:'5-3',AWAY:'3-5',DIV:'1-4',CONF:'5-6',PF:462,PA:397,DIFF:'+65',STRK:'L3'});

    // NFC SOUTH
    pushTeam('NFC','NFC South','','CAR','Carolina Panthers',{W:8,L:8,T:0,PCT:'.500',HOME:'5-3',AWAY:'3-5',DIV:'3-2',CONF:'6-5',PF:297,PA:364,DIFF:'-67',STRK:'L1'});
    pushTeam('NFC','NFC South','','TB','Tampa Bay Buccaneers',{W:7,L:9,T:0,PCT:'.438',HOME:'3-4',AWAY:'4-5',DIV:'2-3',CONF:'5-6',PF:364,PA:397,DIFF:'-33',STRK:'L4'});
    pushTeam('NFC','NFC South','e','ATL','Atlanta Falcons',{W:7,L:9,T:0,PCT:'.438',HOME:'3-4',AWAY:'4-5',DIV:'2-3',CONF:'6-5',PF:334,PA:384,DIFF:'-50',STRK:'W3'});
    pushTeam('NFC','NFC South','e','NO','New Orleans Saints',{W:6,L:10,T:0,PCT:'.375',HOME:'3-5',AWAY:'3-5',DIV:'3-2',CONF:'4-7',PF:289,PA:364,DIFF:'-75',STRK:'W4'});

    // NFC WEST
    pushTeam('NFC','NFC West','x','SEA','Seattle Seahawks',{W:13,L:3,T:0,PCT:'.813',HOME:'6-2',AWAY:'7-1',DIV:'3-2',CONF:'8-3',PF:470,PA:289,DIFF:'+181',STRK:'W6'});
    pushTeam('NFC','NFC West','x','SF','San Francisco 49ers',{W:12,L:4,T:0,PCT:'.750',HOME:'5-2',AWAY:'7-2',DIV:'4-1',CONF:'9-2',PF:434,PA:358,DIFF:'+76',STRK:'W6'});
    pushTeam('NFC','NFC West','y','LAR','Los Angeles Rams',{W:11,L:5,T:0,PCT:'.688',HOME:'6-1',AWAY:'5-4',DIV:'3-2',CONF:'6-5',PF:481,PA:326,DIFF:'+155',STRK:'L2'});
    pushTeam('NFC','NFC West','e','ARI','Arizona Cardinals',{W:3,L:13,T:0,PCT:'.188',HOME:'1-7',AWAY:'2-6',DIV:'0-5',CONF:'3-8',PF:335,PA:451,DIFF:'-116',STRK:'L8'});

    console.log('\nHard-coded standings prepared with', standings.length, 'teams');
    
    // Save to Firestore
    if (standings.length > 0) {
      await saveToFirestore(standings);
    }
    return standings;
  } catch (error) {
    console.error('Error preparing hard-coded standings:', error);
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('NFLStandings');
    
    // Clear existing data
    const snapshot = await collectionRef.get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Cleared existing standings');
    
    // Add new data
    let writeBatch = db.batch();
    let count = 0;
    
    for (const team of standings) {
      const docRef = collectionRef.doc(team.Team.replace(/\s+/g, '_'));
      writeBatch.set(docRef, {
        ...team,
        lastUpdated: new Date().toISOString()
      });
      count++;
      
      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await writeBatch.commit();
        writeBatch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % 500 !== 0) {
      await writeBatch.commit();
    }
    
    console.log(`Successfully saved ${count} teams to Firestore`);
    
    // Clear cache for this league (if running in browser context)
    if (typeof localStorage !== 'undefined') {
      const cacheKey = `standings_cache_NFL`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared NFL standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeNFLStandings();
    console.log('\n✅ NFL standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update NFL standings');
    process.exit(1);
  }
}

main();

