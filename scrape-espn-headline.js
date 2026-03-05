const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const fs = require('fs').promises;

async function scrapeESPNHeadline(url) {
    try {
        console.log(`Fetching: ${url}`);
        
        // Fetch the HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Parse the HTML
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Try multiple selectors for the headline
        let headline = null;
        
        // Try the main headline selector (the actual article headline)
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
        
        // Debug: log all h1 elements to see what we're getting
        console.log('\nAll h1 elements on page:');
        document.querySelectorAll('h1').forEach((h1, i) => {
            console.log(`${i}: "${h1.textContent.trim()}"`);
        });
        
        if (headline) {
            console.log('\n✅ Headline found:');
            console.log(headline);
            return headline;
        } else {
            console.log('\n❌ Could not find headline');
            console.log('HTML structure:');
            console.log(html.substring(0, 2000)); // Show first 2000 chars for debugging
            return null;
        }
        
    } catch (error) {
        console.error('Error scraping headline:', error.message);
        return null;
    }
}

// Function to scrape multiple URLs from an array
async function scrapeMultipleHeadlines(urls) {
    console.log(`\n=== Scraping ${urls.length} URLs ===\n`);
    const results = [];
    
    for (const url of urls) {
        const headline = await scrapeESPNHeadline(url);
        results.push({ url, headline });
        
        // Add a small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n=== RESULTS SUMMARY ===');
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.headline || 'NO HEADLINE FOUND'}`);
        console.log(`   ${result.url}\n`);
    });
    
    return results;
}

// Function to scrape all NHL recaps for a specific date
async function scrapeNHLRecapsForDate(date) {
    console.log(`\n=== Scraping NHL recaps for ${date} ===\n`);
    
    // ESPN's NHL recap URLs follow a pattern with game IDs
    // We'll need to discover the game IDs for the date
    // This is a placeholder - you'll need to implement the logic to find game IDs
    
    console.log('Note: To scrape all recaps for a date, we need to know the game IDs first.');
    console.log('You can either:');
    console.log('1. Provide a file with URLs');
    console.log('2. Provide an array of game IDs');
    console.log('3. Use the ESPN API to get game IDs for a date');
    
    return [];
}

// Function to read URLs from a file
async function scrapeFromFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const urls = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.startsWith('https://www.espn.com/nhl/recap/_/gameId/'));
        
        console.log(`Found ${urls.length} NHL recap URLs in file`);
        return await scrapeMultipleHeadlines(urls);
    } catch (error) {
        console.error('Error reading file:', error.message);
        return [];
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node scrape-espn-headline.js <url>                    - Scrape single URL');
        console.log('  node scrape-espn-headline.js --file <filepath>        - Scrape URLs from file');
        console.log('  node scrape-espn-headline.js --urls <url1> <url2>... - Scrape multiple URLs');
        console.log('\nExample:');
        console.log('  node scrape-espn-headline.js https://www.espn.com/nhl/recap/_/gameId/401802383');
        console.log('  node scrape-espn-headline.js --file urls.txt');
        console.log('  node scrape-espn-headline.js --urls https://www.espn.com/nhl/recap/_/gameId/401802383 https://www.espn.com/nhl/recap/_/gameId/401802382');
        process.exit(0);
    }
    
    if (args[0] === '--file') {
        // Scrape from file
        if (!args[1]) {
            console.error('Error: Please provide a file path');
            process.exit(1);
        }
        await scrapeFromFile(args[1]);
    } else if (args[0] === '--urls') {
        // Scrape multiple URLs
        const urls = args.slice(1).filter(url => url.startsWith('https://www.espn.com/nhl/recap/_/gameId/'));
        await scrapeMultipleHeadlines(urls);
    } else {
        // Scrape single URL
        const url = args[0];
        if (!url.startsWith('https://www.espn.com/nhl/recap/_/gameId/') && 
            !url.startsWith('https://www.espn.com/nhl/game/_/gameId/')) {
            console.error('Error: URL must start with https://www.espn.com/nhl/recap/_/gameId/ or https://www.espn.com/nhl/game/_/gameId/');
            process.exit(1);
        }
        await scrapeESPNHeadline(url);
    }
}

main();

