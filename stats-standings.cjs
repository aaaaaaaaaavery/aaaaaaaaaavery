#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const cwd = __dirname;

function run(command, label) {
  console.log(`\n🔁 Running: ${label}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
    console.log(`✅ ${label} completed`);
  } catch (err) {
    console.error(`❌ ${label} failed:`);
    if (err.stdout) console.error(String(err.stdout).substring(0, 2000));
    if (err.stderr) console.error(String(err.stderr).substring(0, 2000));
    console.error(err);
    process.exit(1);
  }
}

(async () => {
  try {
    run(`node "${path.join(cwd, 'run-all-stats-scrapers.js')}"`, 'run-all-stats-scrapers.js');
    run(`node "${path.join(cwd, 'scrape-all-standings.cjs')}"`, 'scrape-all-standings.cjs');
    console.log('\nAll scripts finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error running stats and standings:', err);
    process.exit(1);
  }
})();
