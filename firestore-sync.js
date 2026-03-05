// Firestore Sync Script for MLB Stats
// This script syncs Google Sheets data to Firestore with 12-hour caching

// Firebase configuration (use your existing config)
const firebaseConfig = {
    apiKey: "AIzaSyD3bw8d4q2oO2qpbgGiUG6Qnlf4aABK3Bc",
    authDomain: "flashlive-daily-scraper.firebaseapp.com",
    projectId: "flashlive-daily-scraper",
    storageBucket: "flashlive-daily-scraper.appspot.com",
    messagingSenderId: "124291936014",
    appId: "1:124291936014:web:acadcaa791d6046849315f"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Cache system for 12-hour duration
const statsCache = {
    data: new Map(),
    timestamps: new Map(),
    CACHE_DURATION: 12 * 60 * 60 * 1000, // 12 hours
    
    set(key, data) {
        this.data.set(key, data);
        this.timestamps.set(key, Date.now());
    },
    
    get(key) {
        const timestamp = this.timestamps.get(key);
        if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
            this.data.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        return this.data.get(key);
    },
    
    clear() {
        this.data.clear();
        this.timestamps.clear();
    }
};

// Sync Google Sheets to Firestore
async function syncMLBStatsFromGoogleSheets() {
    console.log('🔄 Starting MLB stats sync from Google Sheets...');
    
    try {
        // Replace with your actual Google Sheets CSV URL
        const sheetUrl = 'YOUR_GOOGLE_SHEETS_CSV_URL_HERE';
        
        // Fetch CSV data
        const response = await fetch(sheetUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Google Sheets: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('✅ Fetched CSV data (length:', csvText.length, 'characters)');
        
        // Parse CSV data
        const statsData = parseCSVData(csvText);
        console.log('✅ Parsed', statsData.length, 'stat entries');
        
        // Group by category
        const categorizedData = categorizeStats(statsData);
        console.log('✅ Categorized stats:', Object.keys(categorizedData));
        
        // Upload to Firestore
        await uploadToFirestore(categorizedData);
        console.log('✅ Successfully synced to Firestore');
        
        // Clear cache to force fresh data
        statsCache.clear();
        console.log('✅ Cache cleared - fresh data will be loaded');
        
    } catch (error) {
        console.error('❌ Error syncing MLB stats:', error);
        throw error;
    }
}

// Parse CSV data into structured format
function parseCSVData(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const statsData = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 4) {
                statsData.push({
                    category: values[0],
                    statName: values[1],
                    leaderName: values[2],
                    value: values[3],
                    lastUpdated: values[4] || new Date().toISOString().split('T')[0]
                });
            }
        }
    }
    
    return statsData;
}

// Categorize stats by category
function categorizeStats(statsData) {
    const categorized = {
        batting: [],
        pitching: [],
        fielding: [],
        advanced: []
    };
    
    statsData.forEach(stat => {
        const category = stat.category.toLowerCase();
        if (categorized[category]) {
            categorized[category].push(stat);
        }
    });
    
    return categorized;
}

// Upload categorized data to Firestore
async function uploadToFirestore(categorizedData) {
    const batch = db.batch();
    const collectionRef = db.collection('mlb_stats');
    
    // Clear existing data
    const existingDocs = await collectionRef.get();
    existingDocs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    // Add new data
    Object.keys(categorizedData).forEach(category => {
        const categoryRef = collectionRef.doc(category);
        batch.set(categoryRef, {
            category: category,
            stats: categorizedData[category],
            lastUpdated: new Date(),
            cacheExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
        });
    });
    
    await batch.commit();
    console.log('✅ Uploaded to Firestore collection: mlb_stats');
}

// Load MLB stats from Firestore with caching
async function loadMLBStatsFromFirestore(category) {
    const cacheKey = `mlb_stats_${category}`;
    let cachedData = statsCache.get(cacheKey);
    
    if (cachedData) {
        console.log('📦 Using cached MLB stats for', category);
        return cachedData;
    }
    
    try {
        console.log('🔄 Fetching fresh MLB stats from Firestore for', category);
        const docRef = db.collection('mlb_stats').doc(category);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const statsData = data.stats || [];
            
            // Cache the data for 12 hours
            statsCache.set(cacheKey, statsData);
            console.log('✅ Loaded', statsData.length, 'stats for', category);
            return statsData;
        } else {
            console.log('❌ No stats found for category:', category);
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading MLB stats from Firestore:', error);
        return [];
    }
}

// Display MLB stats in the website
function displayMLBStatsFromFirestore(statsData, category, displayElement) {
    let html = `<div style="color: white;">`;
    html += `<h4 style="color: #fff; font-size: 12px; margin-bottom: 10px; border-bottom: 1px solid #4a4a4a; padding-bottom: 5px;">2025 MLB ${category.charAt(0).toUpperCase() + category.slice(1)} Leaders</h4>`;
    
    if (statsData && statsData.length > 0) {
        html += `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">`;
        html += `<thead><tr style="border-bottom: 1px solid #4a4a4a;">`;
        html += `<th style="padding: 4px; text-align: left; color: #ccc;">Statistic</th>`;
        html += `<th style="padding: 4px; text-align: left; color: #ccc;">Leader</th>`;
        html += `<th style="padding: 4px; text-align: left; color: #ccc;">Value</th>`;
        html += `</tr></thead><tbody>`;
        
        statsData.forEach(stat => {
            html += `<tr style="border-bottom: 1px solid #333;">`;
            html += `<td style="padding: 4px; color: white; font-weight: 500;">${stat.statName}</td>`;
            html += `<td style="padding: 4px; color: #ccc;">${stat.leaderName}</td>`;
            html += `<td style="padding: 4px; color: #ccc;">${stat.value}</td>`;
            html += `</tr>`;
        });
        
        html += `</tbody></table>`;
    } else {
        html += `<p style="color: #9ca3af;">No ${category} statistics available.</p>`;
    }
    
    html += `<p style="color: #666; font-size: 9px; margin-top: 10px;">Data from Google Sheets • Updated daily • Cached for 12 hours</p>`;
    html += `</div>`;
    
    displayElement.innerHTML = html;
}

// Make functions available globally
window.syncMLBStatsFromGoogleSheets = syncMLBStatsFromGoogleSheets;
window.loadMLBStatsFromFirestore = loadMLBStatsFromFirestore;
window.displayMLBStatsFromFirestore = displayMLBStatsFromFirestore;

console.log('📊 MLB Stats Firestore sync script loaded');
console.log('Available functions:');
console.log('- syncMLBStatsFromGoogleSheets() - Sync from Google Sheets to Firestore');
console.log('- loadMLBStatsFromFirestore(category) - Load stats from Firestore');
console.log('- displayMLBStatsFromFirestore(statsData, category, element) - Display stats');
