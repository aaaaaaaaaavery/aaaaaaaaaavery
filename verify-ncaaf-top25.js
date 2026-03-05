// Quick script to verify NCAAF Top 25 structure in Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyNCAAFTop25() {
  try {
    console.log('Checking NCAAFStandings collection...\n');
    
    const collectionRef = db.collection('NCAAFStandings');
    const snapshot = await collectionRef.limit(10).get();
    
    if (snapshot.empty) {
      console.log('❌ NCAAFStandings collection is empty or does not exist');
      console.log('   Run: node scrape-ncaaf-standings.cjs');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} documents (showing first 10):\n`);
    
    let hasTop25Rank = 0;
    let hasTeam = 0;
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Document ${index + 1} (ID: ${doc.id}):`);
      console.log(`  Team: ${data.Team || 'MISSING'}`);
      console.log(`  Top25Rank: ${data.Top25Rank !== null && data.Top25Rank !== undefined ? data.Top25Rank : 'MISSING or null'}`);
      console.log(`  Top25Points: ${data.Top25Points || 'N/A'}`);
      console.log(`  Conference: ${data.Conference || 'N/A'}`);
      console.log('');
      
      if (data.Top25Rank !== null && data.Top25Rank !== undefined) hasTop25Rank++;
      if (data.Team) hasTeam++;
    });
    
    // Check for Top 25 teams specifically
    console.log('\n--- Checking for Top 25 teams ---');
    const top25Snapshot = await collectionRef.where('Top25Rank', '!=', null).limit(5).get();
    
    if (top25Snapshot.empty) {
      console.log('⚠️  No teams found with Top25Rank field');
      console.log('   This means Top 25 rankings may not be populated yet');
    } else {
      console.log(`✅ Found ${top25Snapshot.size} teams with Top25Rank (showing first 5):`);
      top25Snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  #${data.Top25Rank}: ${data.Team}`);
      });
    }
    
    console.log(`\n--- Summary ---`);
    console.log(`Total documents checked: ${snapshot.size}`);
    console.log(`Documents with Team field: ${hasTeam}/${snapshot.size}`);
    console.log(`Documents with Top25Rank: ${hasTop25Rank}/${snapshot.size}`);
    
    if (hasTeam === snapshot.size && hasTop25Rank > 0) {
      console.log('\n✅ NCAAF Top 25 structure looks correct!');
      console.log('   Structure matches NCAAM/NCAAW format');
    } else {
      console.log('\n⚠️  Structure may be incomplete');
      if (hasTop25Rank === 0) {
        console.log('   Run: node scrape-ncaaf-standings.cjs to populate Top 25 rankings');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyNCAAFTop25();

