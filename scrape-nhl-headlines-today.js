const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

// Function to get today's date in ESPN format (YYYYMMDD)
function getTodayESPNFormat() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Function to fetch NHL game IDs for a specific date from ESPN API
async function fetchNHLGameIDs(date) {
    console.log(`\n=== Fetching NHL game IDs for ${date} ===\n`);
    
    try {
        // ESPN's scoreboard API endpoint
        const url = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`;
        
        console.log(`Fetching from: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract game IDs from the response
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

// Function to scrape ESPN headline from the game page
async function scrapeESPNHeadline(gameId) {
    // Use the game page URL, not the recap URL
    const url = `https://www.espn.com/nhl/game/_/gameId/${gameId}`;
    
    try {
        console.log(`\nFetching: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Look for the article headline below the video player
        // This is typically in a div with article content
        let headline = null;
        let articleUrl = null;
        
        // Try to find the article headline - it's usually in a link or heading near the video
        const articleLink = document.querySelector('a[href*="/story/"]');
        if (articleLink) {
            headline = articleLink.textContent.trim();
            articleUrl = articleLink.href;
        }
        
        // Alternative: look for h2 or other headings near the video
        if (!headline) {
            const videoSection = document.querySelector('[class*="video"]') || document.querySelector('[class*="Video"]');
            if (videoSection) {
                const nextHeading = videoSection.nextElementSibling?.querySelector('h2, h3, a');
                if (nextHeading) {
                    headline = nextHeading.textContent.trim();
                    if (nextHeading.tagName === 'A') {
                        articleUrl = nextHeading.href;
                    }
                }
            }
        }
        
        // Fallback: look for any article-related content
        if (!headline) {
            const articleElements = document.querySelectorAll('a[href*="/story/"], h2, h3');
            for (const element of articleElements) {
                const text = element.textContent.trim();
                if (text && text.length > 20 && text.length < 200) {
                    headline = text;
                    if (element.tagName === 'A') {
                        articleUrl = element.href;
                    }
                    break;
                }
            }
        }
        
        if (headline) {
            console.log(`✅ Headline: ${headline}`);
            if (articleUrl) {
                console.log(`   Article URL: ${articleUrl}`);
            }
            return { gameId, gameUrl: url, headline, articleUrl, success: true };
        } else {
            console.log(`❌ No headline found for game ${gameId} (game may not be completed yet)`);
            return { gameId, gameUrl: url, headline: null, articleUrl: null, success: false };
        }
        
    } catch (error) {
        console.error(`Error scraping game ${gameId}:`, error.message);
        return { gameId, gameUrl: url, headline: null, articleUrl: null, success: false, error: error.message };
    }
}

// Main function to scrape all NHL headlines for today
async function scrapeTodayNHLHeadlines() {
    console.log('=== NHL Headline Scraper - Today ===\n');
    
    // Get today's date in ESPN format
    const today = getTodayESPNFormat();
    console.log(`Date: ${today}\n`);
    
    // Fetch game IDs for today
    const gameIDs = await fetchNHLGameIDs(today);
    
    if (gameIDs.length === 0) {
        console.log('\n❌ No games found for today');
        return [];
    }
    
    console.log(`\n=== Scraping ${gameIDs.length} headlines ===\n`);
    
    // Scrape headlines for each game
    const results = [];
    for (const gameId of gameIDs) {
        const result = await scrapeESPNHeadline(gameId);
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
            console.log(`   Game URL: ${result.gameUrl}`);
            if (result.articleUrl) {
                console.log(`   Article URL: ${result.articleUrl}`);
            }
            console.log('');
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
scrapeTodayNHLHeadlines();

