const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

// Function to get yesterday's date in ESPN format (YYYYMMDD)
function getYesterdayESPNFormat() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Function to fetch NHL game IDs for a specific date from ESPN API
async function fetchNHLGameIDs(date) {
    console.log(`\n=== Fetching NHL game IDs for ${date} ===\n`);
    
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const gameIDs = [];
        
        if (data.events && Array.isArray(data.events)) {
            data.events.forEach(event => {
                if (event.id) {
                    gameIDs.push(event.id);
                    console.log(`Found game: ${event.name} (ID: ${event.id})`);
                }
            });
        }
        
        console.log(`\nTotal games found: ${gameIDs.length}`);
        return gameIDs;
        
    } catch (error) {
        console.error('Error fetching game IDs:', error.message);
        return [];
    }
}

// Function to scrape ESPN headline from the recap page
async function scrapeESPNRecapHeadline(gameId) {
    const url = `https://www.espn.com/nhl/recap/_/gameId/${gameId}`;
    
    try {
        console.log(`\nFetching: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Look for the article headline
        let headline = null;
        
        // Try the main headline selector
        const headlineElement = document.querySelector('h1.ArticleHeader__headline');
        if (headlineElement) {
            headline = headlineElement.textContent.trim();
        }
        
        // If not found, try alternative selectors
        if (!headline) {
            const altSelectors = [
                'h1[data-module="ArticleHeader"]',
                '.ArticleHeader h1',
                'h1.headline',
                '[class*="headline"]'
            ];
            
            for (const selector of altSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    headline = element.textContent.trim();
                    break;
                }
            }
        }
        
        if (headline) {
            console.log(`✅ Headline: ${headline}`);
            return { gameId, url, headline, success: true };
        } else {
            console.log(`❌ No headline found for game ${gameId}`);
            return { gameId, url, headline: null, success: false };
        }
        
    } catch (error) {
        console.error(`Error scraping game ${gameId}:`, error.message);
        return { gameId, url, headline: null, success: false, error: error.message };
    }
}

// Main function to scrape all NHL headlines for yesterday (completed games)
async function scrapeYesterdayNHLHeadlines() {
    console.log('=== NHL Headline Scraper - Yesterday (Completed Games) ===\n');
    
    // Get yesterday's date in ESPN format
    const yesterday = getYesterdayESPNFormat();
    console.log(`Date: ${yesterday}\n`);
    
    // Fetch game IDs for yesterday
    const gameIDs = await fetchNHLGameIDs(yesterday);
    
    if (gameIDs.length === 0) {
        console.log('\n❌ No games found for yesterday');
        return [];
    }
    
    console.log(`\n=== Scraping ${gameIDs.length} headlines ===\n`);
    
    // Scrape headlines for each game
    const results = [];
    for (const gameId of gameIDs) {
        const result = await scrapeESPNRecapHeadline(gameId);
        results.push(result);
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print summary
    console.log('\n\n=== RESULTS SUMMARY ===\n');
    results.forEach((result, index) => {
        if (result.success) {
            console.log(`${index + 1}. ${result.headline}`);
            console.log(`   Game ID: ${result.gameId}`);
            console.log(`   URL: ${result.url}\n`);
        } else {
            console.log(`${index + 1}. ❌ Failed to get headline for game ${result.gameId}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            console.log('');
        }
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\nSuccessfully scraped ${successCount} out of ${results.length} headlines`);
    
    return results;
}

// Run the scraper
scrapeYesterdayNHLHeadlines();

