// export-static-data.js
// Backend service that reads from Firestore once and generates static JSON files
// This replaces all direct Firestore access from the frontend

import { DateTime } from 'luxon';
import admin from 'firebase-admin';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin initialization
let db;
function initializeFirebase() {
  if (db) return db;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  db = admin.firestore();
  console.log('Firebase Firestore initialized.');
  return db;
}

const app = express();
app.use(express.json());

// Directory to store static JSON files
const DATA_DIR = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Helper function to serialize Firestore Timestamps
 */
function serializeFirestoreData(data) {
  if (data === null || data === undefined) return data;
  if (data instanceof Date) return data.toISOString();
  if (data && typeof data === 'object' && data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  if (data && typeof data === 'object' && data._seconds !== undefined) {
    return new Date(data._seconds * 1000).toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      result[key] = serializeFirestoreData(data[key]);
    }
    return result;
  }
  return data;
}

/**
 * Write JSON file to disk
 */
function writeJSONFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, json, 'utf8');
  console.log(`✅ Written: ${filename} (${(json.length / 1024).toFixed(2)} KB)`);
}

/**
 * Export today's games
 */
async function exportTodayGames() {
  try {
    const db = initializeFirebase();
    const nowInMountain = DateTime.now().setZone('America/Denver');
    const todayStr = nowInMountain.toISODate();
    
    console.log(`📅 Exporting today's games for ${todayStr}...`);
    
    const gamesRef = db.collection(`artifacts/flashlive-daily-scraper/public/data/sportsGames`);
    const snapshot = await gamesRef.where('gameDate', '==', todayStr).get();
    
    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      games.push({
        'Game ID': doc.id,
        ...serializeFirestoreData(data)
      });
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      date: todayStr,
      gameCount: games.length,
      games: games
    };
    
    writeJSONFile('today.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting today games:', error);
    throw error;
  }
}

/**
 * Export yesterday's scores
 */
async function exportYesterdayScores() {
  try {
    const db = initializeFirebase();
    const nowInMountain = DateTime.now().setZone('America/Denver');
    const yesterdayStr = nowInMountain.minus({ days: 1 }).toISODate();
    
    console.log(`📅 Exporting yesterday's scores for ${yesterdayStr}...`);
    
    const yesterdayScoresRef = db.collection(`artifacts/flashlive-daily-scraper/public/data/yesterdayScores`);
    const snapshot = await yesterdayScoresRef.where('gameDate', '==', yesterdayStr).get();
    
    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      games.push({
        'Game ID': doc.id,
        ...serializeFirestoreData(data)
      });
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      date: yesterdayStr,
      gameCount: games.length,
      games: games
    };
    
    writeJSONFile('yesterday.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting yesterday scores:', error);
    throw error;
  }
}

/**
 * Export featured games
 */
async function exportFeaturedGames() {
  try {
    const db = initializeFirebase();
    const today = DateTime.now().setZone('America/New_York').toISODate();
    
    console.log(`⭐ Exporting featured games for ${today}...`);
    
    const featuredRef = db.collection('artifacts/flashlive-daily-scraper/public/data/Featured');
    const snapshot = await featuredRef.where('gameDate', '==', today).get();
    
    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      games.push({
        id: doc.id,
        ...serializeFirestoreData(data)
      });
    });
    
    // Sort by order if available
    games.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return 0;
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      date: today,
      gameCount: games.length,
      games: games
    };
    
    writeJSONFile('featured.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting featured games:', error);
    throw error;
  }
}

/**
 * Export F1 Driver Standings
 */
async function exportF1DriverStandings() {
  try {
    const db = initializeFirebase();
    console.log('🏎️ Exporting F1 Driver Standings...');
    
    const snapshot = await db.collection('F1DriverStandings').get();
    
    const standings = [];
    snapshot.forEach(doc => {
      standings.push({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      });
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      standings: standings
    };
    
    writeJSONFile('f1-driver-standings.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting F1 Driver Standings:', error);
    throw error;
  }
}

/**
 * Export F1 Constructor Standings
 */
async function exportF1ConstructorStandings() {
  try {
    const db = initializeFirebase();
    console.log('🏎️ Exporting F1 Constructor Standings...');
    
    const snapshot = await db.collection('F1ConstructorStandings').get();
    
    const standings = [];
    snapshot.forEach(doc => {
      standings.push({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      });
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      standings: standings
    };
    
    writeJSONFile('f1-constructor-standings.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting F1 Constructor Standings:', error);
    throw error;
  }
}

/**
 * Export F1 Schedule
 */
async function exportF1Schedule() {
  try {
    const db = initializeFirebase();
    console.log('🏎️ Exporting F1 Schedule...');
    
    const snapshot = await db.collection('FormulaOne').get();
    
    const events = [];
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      });
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      events: events
    };
    
    writeJSONFile('f1-schedule.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting F1 Schedule:', error);
    throw error;
  }
}

/**
 * Export Standings (all leagues)
 */
async function exportStandings() {
  try {
    const db = initializeFirebase();
    console.log('📊 Exporting Standings...');
    
    const snapshot = await db.collection('standings').get();
    
    const standings = {};
    snapshot.forEach(doc => {
      standings[doc.id] = serializeFirestoreData(doc.data());
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      standings: standings
    };
    
    writeJSONFile('standings.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting Standings:', error);
    throw error;
  }
}

/**
 * Export MLB Stats
 */
async function exportMLBStats() {
  try {
    const db = initializeFirebase();
    console.log('⚾ Exporting MLB Stats...');
    
    const snapshot = await db.collection('mlb_stats').get();
    
    const stats = {};
    snapshot.forEach(doc => {
      stats[doc.id] = serializeFirestoreData(doc.data());
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      stats: stats
    };
    
    writeJSONFile('mlb-stats.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting MLB Stats:', error);
    throw error;
  }
}

/**
 * Export NBA Stats
 */
async function exportNBAStats() {
  try {
    const db = initializeFirebase();
    console.log('🏀 Exporting NBA Stats...');
    
    const playerStatsSnapshot = await db.collection('nbaStats').get();
    const teamStatsSnapshot = await db.collection('nbaTeamStats').get();
    
    const playerStats = {};
    playerStatsSnapshot.forEach(doc => {
      playerStats[doc.id] = serializeFirestoreData(doc.data());
    });
    
    const teamStats = {};
    teamStatsSnapshot.forEach(doc => {
      teamStats[doc.id] = serializeFirestoreData(doc.data());
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      playerStats: playerStats,
      teamStats: teamStats
    };
    
    writeJSONFile('nba-stats.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting NBA Stats:', error);
    throw error;
  }
}

/**
 * Export CFP Standings
 */
async function exportCFPStandings() {
  try {
    const db = initializeFirebase();
    console.log('🏈 Exporting CFP Standings...');
    
    const snapshot = await db.collection('CFP').get();
    
    const standings = [];
    snapshot.forEach(doc => {
      standings.push({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      });
    });
    
    const result = {
      lastUpdated: new Date().toISOString(),
      standings: standings
    };
    
    writeJSONFile('cfp-standings.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting CFP Standings:', error);
    throw error;
  }
}

/**
 * Export Today Slate
 */
async function exportTodaySlate() {
  try {
    const db = initializeFirebase();
    console.log('📋 Exporting Today Slate...');
    
    const docRef = db.collection('system').doc('todaySlate');
    const doc = await docRef.get();
    
    const result = {
      lastUpdated: new Date().toISOString(),
      slate: doc.exists ? serializeFirestoreData(doc.data()) : null
    };
    
    writeJSONFile('today-slate.json', result);
    return result;
  } catch (error) {
    console.error('❌ Error exporting Today Slate:', error);
    throw error;
  }
}

/**
 * Export all data
 */
async function exportAllData() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Starting static data export...');
  console.log('='.repeat(70) + '\n');
  
  const results = {};
  
  try {
    results.todayGames = await exportTodayGames();
  } catch (error) {
    console.error('Failed to export today games:', error);
  }
  
  try {
    results.yesterdayScores = await exportYesterdayScores();
  } catch (error) {
    console.error('Failed to export yesterday scores:', error);
  }
  
  try {
    results.featuredGames = await exportFeaturedGames();
  } catch (error) {
    console.error('Failed to export featured games:', error);
  }
  
  try {
    results.f1DriverStandings = await exportF1DriverStandings();
  } catch (error) {
    console.error('Failed to export F1 Driver Standings:', error);
  }
  
  try {
    results.f1ConstructorStandings = await exportF1ConstructorStandings();
  } catch (error) {
    console.error('Failed to export F1 Constructor Standings:', error);
  }
  
  try {
    results.f1Schedule = await exportF1Schedule();
  } catch (error) {
    console.error('Failed to export F1 Schedule:', error);
  }
  
  try {
    results.standings = await exportStandings();
  } catch (error) {
    console.error('Failed to export Standings:', error);
  }
  
  try {
    results.mlbStats = await exportMLBStats();
  } catch (error) {
    console.error('Failed to export MLB Stats:', error);
  }
  
  try {
    results.nbaStats = await exportNBAStats();
  } catch (error) {
    console.error('Failed to export NBA Stats:', error);
  }
  
  try {
    results.cfpStandings = await exportCFPStandings();
  } catch (error) {
    console.error('Failed to export CFP Standings:', error);
  }
  
  try {
    results.todaySlate = await exportTodaySlate();
  } catch (error) {
    console.error('Failed to export Today Slate:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Static data export complete!');
  console.log('='.repeat(70) + '\n');
  
  return results;
}

// HTTP endpoint to trigger export
app.post('/export', async (req, res) => {
  try {
    const results = await exportAllData();
    res.status(200).json({
      success: true,
      message: 'Export complete',
      results: results
    });
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// HTTP endpoint to serve static files
app.use('/data', express.static(DATA_DIR));

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8081;
  app.listen(PORT, () => {
    console.log(`📦 Export service running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
  });
}

// Export functions for use in other modules
export {
  exportAllData,
  exportTodayGames,
  exportYesterdayScores,
  exportFeaturedGames,
  exportF1DriverStandings,
  exportF1ConstructorStandings,
  exportF1Schedule,
  exportStandings,
  exportMLBStats,
  exportNBAStats,
  exportCFPStandings,
  exportTodaySlate
};

