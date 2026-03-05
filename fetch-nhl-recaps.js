/**
 * Fetches NHL game recap headlines and URLs from ESPN API
 * Processes games from both yesterday.json and today.json
 */

const https = require('https');

const BASE_URL = 'https://flashlive-scraper-124291936014.us-central1.run.app';
const ESPN_SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';

/**
 * Extract numeric ESPN game ID from formats like:
 * - "espn-nhl-401803082" -> "401803082"
 * - "401803082" -> "401803082"
 */
function extractEspnGameId(gameId) {
    if (!gameId) return null;
    
    // If it's already numeric, return it
    if (/^\d+$/.test(gameId)) {
        return gameId;
    }
    
    // Extract numeric part from "espn-nhl-{id}" format
    const match = gameId.match(/espn-nhl-(\d+)/);
    if (match) {
        return match[1];
    }
    
    // Try other ESPN formats
    const match2 = gameId.match(/espn-.*?-(\d+)/);
    if (match2) {
        return match2[1];
    }
    
    return null;
}

/**
 * Fetch JSON data from URL
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Fetch NHL recap from ESPN API
 */
function fetchNhlRecap(espnGameId) {
    return new Promise((resolve, reject) => {
        const url = `${ESPN_SUMMARY_BASE}?event=${espnGameId}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const article = json.article || {};
                    
                    // Only return if there's a recap article (not preview)
                    if (article.type === 'Recap' || article.headline) {
                        resolve({
                            headline: article.headline || 'No headline',
                            recapUrl: article.links?.web?.href || null,
                            articleId: article.id || null,
                            published: article.published || null,
                            type: article.type || null
                        });
                    } else {
                        resolve(null); // No recap available yet
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse ESPN response: ${e.message}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Process games and fetch recaps
 */
async function fetchAllNhlRecaps() {
    try {
        console.log('Fetching yesterday.json...');
        const yesterdayData = await fetchJson(`${BASE_URL}/data/yesterday.json`);
        const yesterdayGames = yesterdayData.games || [];
        
        console.log('Fetching today.json...');
        const todayData = await fetchJson(`${BASE_URL}/data/today.json`);
        const todayGames = todayData.games || [];
        
        // Filter NHL games
        const nhlGames = [
            ...yesterdayGames.filter(g => 
                g.League === 'USA: NHL' || 
                g.League === 'NHL' || 
                (g.Sport && g.Sport.toLowerCase().includes('hockey'))
            ).map(g => ({ ...g, source: 'yesterday' })),
            ...todayGames.filter(g => 
                (g.League === 'USA: NHL' || 
                 g.League === 'NHL' || 
                 (g.Sport && g.Sport.toLowerCase().includes('hockey'))) &&
                (g['Match Status'] === 'FINAL' || g['Match Status'] === 'FINISHED')
            ).map(g => ({ ...g, source: 'today' }))
        ];
        
        console.log(`\nFound ${nhlGames.length} NHL games (${yesterdayGames.filter(g => g.League === 'USA: NHL' || g.League === 'NHL').length} from yesterday, ${todayGames.filter(g => (g.League === 'USA: NHL' || g.League === 'NHL') && (g['Match Status'] === 'FINAL' || g['Match Status'] === 'FINISHED')).length} completed today)`);
        
        const results = [];
        
        for (const game of nhlGames) {
            const gameId = game['Game ID'];
            const espnGameId = extractEspnGameId(gameId);
            
            if (!espnGameId) {
                console.log(`⚠️  Skipping game ${gameId} - could not extract ESPN game ID`);
                continue;
            }
            
            const matchup = `${game['Away Team']} @ ${game['Home Team']}`;
            console.log(`\nFetching recap for: ${matchup} (${espnGameId})...`);
            
            try {
                const recap = await fetchNhlRecap(espnGameId);
                
                if (recap && recap.recapUrl) {
                    results.push({
                        gameId: gameId,
                        espnGameId: espnGameId,
                        matchup: matchup,
                        source: game.source,
                        matchStatus: game['Match Status'],
                        headline: recap.headline,
                        recapUrl: recap.recapUrl,
                        articleId: recap.articleId,
                        published: recap.published
                    });
                    console.log(`  ✅ ${recap.headline}`);
                    console.log(`     ${recap.recapUrl}`);
                } else {
                    console.log(`  ⏳ No recap available yet`);
                    results.push({
                        gameId: gameId,
                        espnGameId: espnGameId,
                        matchup: matchup,
                        source: game.source,
                        matchStatus: game['Match Status'],
                        headline: null,
                        recapUrl: null,
                        articleId: null,
                        published: null,
                        note: 'No recap available yet'
                    });
                }
            } catch (err) {
                console.log(`  ❌ Error: ${err.message}`);
                results.push({
                    gameId: gameId,
                    espnGameId: espnGameId,
                    matchup: matchup,
                    source: game.source,
                    matchStatus: game['Match Status'],
                    error: err.message
                });
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log(`\n\n=== SUMMARY ===`);
        console.log(`Total games processed: ${results.length}`);
        console.log(`Recaps found: ${results.filter(r => r.recapUrl).length}`);
        console.log(`No recap yet: ${results.filter(r => !r.recapUrl && !r.error).length}`);
        console.log(`Errors: ${results.filter(r => r.error).length}`);
        
        return results;
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    fetchAllNhlRecaps()
        .then(results => {
            console.log('\n=== RESULTS (JSON) ===');
            console.log(JSON.stringify(results, null, 2));
        })
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { fetchAllNhlRecaps, fetchNhlRecap, extractEspnGameId };
