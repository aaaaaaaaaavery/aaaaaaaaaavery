const admin = require('firebase-admin');
const { loadMasterTeamMappings, MASTER_MAPPINGS_SPREADSHEET_ID } = require('./load-master-team-mappings.cjs');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Sync master team name mappings from Google Sheets to Firestore
 * This allows the frontend to access the mappings without needing Google Sheets API access
 */
async function syncMasterMappingsToFirestore() {
  try {
    console.log('🔄 Syncing master team name mappings to Firestore...\n');
    
    // Load mappings from Google Sheets
    const mappings = await loadMasterTeamMappings();
    
    if (!mappings || !mappings.mappings || Object.keys(mappings.mappings).length === 0) {
      console.log('⚠️ No mappings found, skipping sync');
      return;
    }
    
    // Save to Firestore
    const docRef = db.collection('config').doc('masterTeamMappings');
    await docRef.set({
      mappings: mappings.mappings,
      displayNames: mappings.displayNames,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      source: 'Google Sheets',
      documentId: MASTER_MAPPINGS_SPREADSHEET_ID
    });
    
    const totalMappings = Object.values(mappings.mappings).reduce((sum, leagueMap) => sum + Object.keys(leagueMap).length, 0);
    const totalDisplayNames = Object.values(mappings.displayNames).reduce((sum, leagueMap) => sum + Object.keys(leagueMap).length, 0);
    console.log(`✅ Successfully synced ${totalMappings} team name mappings and ${totalDisplayNames} display names to Firestore`);
    console.log(`   Leagues: ${Object.keys(mappings.mappings).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error syncing master mappings to Firestore:', error);
    throw error;
  }
}

// Run the sync
if (require.main === module) {
  syncMasterMappingsToFirestore()
    .then(() => {
      console.log('\n✅ Sync completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncMasterMappingsToFirestore };

