const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Google Sheets configuration
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;
const FEATURED_FIELD_NAMES = ['Featured', 'featured', 'Featured ID', 'featuredId'];

async function authenticateGoogleSheets() {
    const googleAuth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        projectId: process.env.FIREBASE_PROJECT_ID
    });
    const authClient = await googleAuth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

async function fetchGameDataFromFirestore(gameId, dateStr) {
    const normalizedGameId = String(gameId).trim();
    
    async function findGameByIdentifiers(collectionRef, collectionName) {
        let snapshot = await collectionRef.where('Game ID', '==', normalizedGameId).limit(1).get();
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            console.log(`Found game in ${collectionName} via Game ID match: ${data['Home Team']} vs ${data['Away Team']}`);
            return data;
        }
        
        for (const fieldName of FEATURED_FIELD_NAMES) {
            snapshot = await collectionRef.where(fieldName, '==', normalizedGameId).limit(1).get();
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                console.log(`Found game in ${collectionName} via "${fieldName}" match for Featured ID ${normalizedGameId}`);
                return data;
            }
        }
        
        return null;
    }
    
    try {
        const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
        const sportsGameData = await findGameByIdentifiers(sportsGamesRef, 'sportsGames');
        if (sportsGameData) {
            return sportsGameData;
        }
        
        const yesterdayScoresRef = db.collection('artifacts/flashlive-daily-scraper/public/data/yesterdayScores');
        const yesterdayGameData = await findGameByIdentifiers(yesterdayScoresRef, 'yesterdayScores');
        if (yesterdayGameData) {
            return yesterdayGameData;
        }
        
        return null;
    } catch (error) {
        console.error(`Error fetching game data for ${gameId}:`, error);
        return null;
    }
}

async function writeFeaturedGamesToFirestore(gamesData) {
    const batch = db.batch();
    const featuredRef = db.collection('artifacts/flashlive-daily-scraper/public/data/Featured');
    
    // Delete old featured games (older than 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    const oldGamesSnapshot = await featuredRef.where('gameDate', '<', twoDaysAgoStr).get();
    oldGamesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    // Write new featured games
    gamesData.forEach(gameData => {
        const docRef = featuredRef.doc(gameData['Game ID']);
        batch.set(docRef, gameData, { merge: true });
    });
    
    await batch.commit();
    console.log(`Wrote ${gamesData.length} featured games to Firestore`);
}

async function importFeaturedGames() {
    try {
        console.log('=== Starting Featured Games Import ===');
        
        const sheets = await authenticateGoogleSheets();
        
        // Read from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`
        });
        
        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            console.log('No featured games to process');
            return;
        }
        
        const featuredGames = [];
        const headerRow = rows[0];
        console.log('Header row:', headerRow);
        
        let currentTitle = '';
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2 && row[0] && row[1]) {
                const dateStr = row[0];
                const gameId = row[1];
                
                if (row[2] && row[2].trim()) {
                    currentTitle = row[2].trim();
                }
                
                console.log(`Processing featured game: Date=${dateStr}, GameID=${gameId}, Title=${currentTitle}`);
                
                let isoDate;
                if (dateStr.includes('/')) {
                    const [month, day, year] = dateStr.split('/');
                    isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                } else {
                    isoDate = dateStr;
                }
                
                featuredGames.push({
                    date: isoDate,
                    gameId: gameId,
                    title: currentTitle,
                    originalDate: dateStr,
                    order: i - 1
                });
            }
        }
        
        console.log(`Processed ${featuredGames.length} featured games`);
        
        const featuredGamesData = [];
        
        for (const featuredGame of featuredGames) {
            const gameData = await fetchGameDataFromFirestore(featuredGame.gameId, featuredGame.date);
            if (gameData) {
                gameData.title = featuredGame.title || '';
                gameData.order = featuredGame.order;
                gameData.gameDate = featuredGame.date;
                featuredGamesData.push(gameData);
            } else {
                console.log(`⚠️ Could not find game data for GameID: ${featuredGame.gameId}`);
            }
        }
        
        console.log(`Found game data for ${featuredGamesData.length} out of ${featuredGames.length} featured games`);
        
        if (featuredGamesData.length > 0) {
            await writeFeaturedGamesToFirestore(featuredGamesData);
        }
        
        console.log('=== Featured Games Import Complete ===');
        
        return {
            success: true,
            imported: featuredGamesData.length,
            total: featuredGames.length
        };
    } catch (error) {
        console.error('Error importing featured games:', error);
        throw error;
    }
}

// Cloud Function handler
exports.importFeaturedGames = async (req, res) => {
    try {
        const result = await importFeaturedGames();
        res.status(200).send(result);
    } catch (error) {
        console.error('Featured games import failed:', error);
        res.status(500).send({ error: 'Import failed', message: error.message });
    }
};

