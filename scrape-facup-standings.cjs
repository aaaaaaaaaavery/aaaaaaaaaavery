const axios = require('axios');
const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const ESPN_FA_CUP_API = 'https://site.api.espn.com/apis/v2/sports/soccer/eng.fa/standings';

async function scrapeFaCupStandings() {
  try {
    console.log('Fetching FA Cup standings from ESPN API...');

    const response = await axios.get(ESPN_FA_CUP_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const standings = [];
    const data = response.data;

    if (data && data.children) {
      for (const group of data.children) {
        if (group.standings && Array.isArray(group.standings.entries)) {
          for (const entry of group.standings.entries) {
            const team = entry.team || {};
            const stats = entry.stats || [];
            const getStatValue = (index) => (stats[index] ? stats[index].displayValue : '0');

            const teamData = {
              Team: team.shortDisplayName || team.displayName || team.name || 'Unknown',
              Group: (group.name || group.abbreviation || '').trim(),
              Points: getStatValue(3) || '0',
              MP: getStatValue(0) || '0',
              Wins: getStatValue(7) || '0',
              Draws: getStatValue(6) || '0',
              Losses: getStatValue(1) || '0',
              GoalsFor: getStatValue(8) || '0',
              GoalsAgainst: getStatValue(9) || '0',
              GoalDifference: getStatValue(10) || '0',
              lastUpdated: new Date().toISOString()
            };

            standings.push(teamData);
            console.log(`  ${teamData.Team} (${teamData.Group || 'Group'}): ${teamData.Points} pts`);
          }
        }
      }

      const grouped = standings.reduce((acc, team) => {
        const key = team.Group || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(team);
        return acc;
      }, {});

      Object.values(grouped).forEach(groupTeams => {
        groupTeams.sort((a, b) => {
          const pointsA = parseInt(a.Points) || 0;
          const pointsB = parseInt(b.Points) || 0;
          if (pointsA !== pointsB) return pointsB - pointsA;
          const gdA = parseInt(a.GoalDifference) || 0;
          const gdB = parseInt(b.GoalDifference) || 0;
          if (gdA !== gdB) return gdB - gdA;
          const goalsForA = parseInt(a.GoalsFor) || 0;
          const goalsForB = parseInt(b.GoalsFor) || 0;
          return goalsForB - goalsForA;
        });

        groupTeams.forEach((team, index) => {
          team.Rank = index + 1;
        });
      });
    }

    console.log(`\nScraped ${standings.length} FA Cup entries`);

    if (standings.length > 0) {
      await saveToFirestore(standings);
    } else {
      console.warn('No standings data found for FA Cup. The competition may be in knockout phase or API format changed.');
    }

    return standings;

  } catch (error) {
    console.error('Error scraping FA Cup standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  console.log('\nSaving FA Cup standings to Firestore...');

  const collectionRef = db.collection('FACupStandings');

  const snapshot = await collectionRef.get();
  const batchDelete = db.batch();
  snapshot.docs.forEach(doc => batchDelete.delete(doc.ref));
  await batchDelete.commit();
  console.log('Cleared existing FA Cup standings');

  let batch = db.batch();
  let count = 0;

  for (const team of standings) {
    const docRef = collectionRef.doc(
      `${team.Group || 'General'}_${team.Team}`.replace(/\s+/g, '_')
    );
    batch.set(docRef, team);
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully saved ${count} FA Cup entries to Firestore`);
}

async function main() {
  try {
    await scrapeFaCupStandings();
    console.log('\n✅ FA Cup standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update FA Cup standings');
    process.exit(1);
  }
}

main();

