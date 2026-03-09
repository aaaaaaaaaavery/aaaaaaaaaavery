const { updateHTMLWithStandings } = require('./generate-hardcoded-standings.cjs');

async function runScrapers() {
  console.log('\nRunning no-Firebase standings pipeline...');
  await updateHTMLWithStandings();
  console.log('\nStandings pipeline complete (data written directly into index-test.html).');
}

module.exports = { runScrapers };

if (require.main === module) {
  runScrapers().catch((error) => {
    console.error('Error running standings pipeline:', error);
    process.exit(1);
  });
}
