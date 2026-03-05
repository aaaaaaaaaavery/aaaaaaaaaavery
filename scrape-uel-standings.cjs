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

// ESPN's API endpoint for UEFA Europa League standings
const ESPN_UEL_API = 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.europa/standings';

function getStatByName(stats, name) {
  if (!stats || !Array.isArray(stats)) return '0';
  const stat = stats.find(s => s.name === name);
  return stat && stat.displayValue != null && stat.displayValue !== '' ? String(stat.displayValue) : '0';
}

async function scrapeUELStandings() {
  try {
    console.log('Fetching UEFA Europa League standings from ESPN API...');

    const response = await axios.get(ESPN_UEL_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const standings = [];
    const data = response.data;

    // ESPN API returns standings in children (e.g. "League Phase")
    if (data && data.children) {
      for (const group of data.children) {
        if (group.standings && group.standings.entries) {
          for (const entry of group.standings.entries) {
            const team = entry.team;
            const stats = entry.stats;
            const shortName = team.shortDisplayName || team.displayName || team.name;

            // Same format as UECL and UCL: Rank, Team, Points, MP, Wins, Draws, Losses (no GF/GA/GD)
            const teamData = {
              Team: shortName,
              Points: getStatByName(stats, 'points'),
              MP: getStatByName(stats, 'gamesPlayed'),
              Wins: getStatByName(stats, 'wins'),
              Draws: getStatByName(stats, 'ties'),
              Losses: getStatByName(stats, 'losses'),
              lastUpdated: new Date().toISOString()
            };

            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Points} pts (${teamData.Wins}-${teamData.Draws}-${teamData.Losses})`);
          }
        }
      }

      // Sort by points (desc), then by wins - same as UECL
      standings.sort((a, b) => {
        const pointsA = parseInt(a.Points, 10) || 0;
        const pointsB = parseInt(b.Points, 10) || 0;
        if (pointsA !== pointsB) return pointsB - pointsA;
        const winsA = parseInt(a.Wins, 10) || 0;
        const winsB = parseInt(b.Wins, 10) || 0;
        return winsB - winsA;
      });

      // Re-assign rank by sorted order
      standings.forEach((row, index) => {
        row.Rank = index + 1;
      });
    }

    console.log(`\nScraped ${standings.length} teams`);

    if (standings.length > 0) {
      await saveToFirestore(standings);
    } else {
      console.error('No standings data found. API structure may have changed.');
    }

    return standings;
  } catch (error) {
    console.error('Error scraping UEFA Europa League standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');

    const collectionRef = db.collection('UEFAEuropaLeagueStandings');

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

      if (count % 500 === 0) {
        await writeBatch.commit();
        writeBatch = db.batch();
      }
    }

    if (count % 500 !== 0) {
      await writeBatch.commit();
    }

    console.log(`Successfully saved ${count} teams to Firestore`);
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

async function main() {
  try {
    const standings = await scrapeUELStandings();
    console.log('\n✅ UEFA Europa League standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update UEFA Europa League standings');
    process.exit(1);
  }
}

main();
