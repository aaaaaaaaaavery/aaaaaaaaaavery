// Run this 5 minutes before the daily scraper.
// 1) Wipes yesterdayScores
// 2) Copies all docs from sportsGames → yesterdayScores

import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin (service account JSON in repo root)
const serviceAccount = JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper';
const SPORTS_GAMES_COL = `artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`;
const YESTERDAY_SCORES_COL = `artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayScores`;

async function wipeCollection(colPath) {
  const colRef = db.collection(colPath);
  let deleted = 0;
  while (true) {
    const snap = await colRef.limit(500).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
  }
  console.log(`Wiped ${deleted} docs from ${colPath}`);
}

async function copyCollection(srcPath, dstPath) {
  const srcRef = db.collection(srcPath);
  const snap = await srcRef.get();
  if (snap.empty) {
    console.log(`No docs in ${srcPath}`);
    return 0;
  }
  let written = 0;
  let batch = db.batch();
  let ops = 0;
  for (const doc of snap.docs) {
    const dstRef = db.collection(dstPath).doc(doc.id);
    batch.set(dstRef, doc.data());
    ops += 1; written += 1;
    if (ops === 450) { // stay below 500
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  console.log(`Copied ${written} docs from ${srcPath} → ${dstPath}`);
  return written;
}

async function main() {
  console.log('--- prep-yesterday started ---');
  await wipeCollection(YESTERDAY_SCORES_COL);
  await copyCollection(SPORTS_GAMES_COL, YESTERDAY_SCORES_COL);
  console.log('--- prep-yesterday completed ---');
}

main().catch((e) => { console.error(e); process.exit(1); });


