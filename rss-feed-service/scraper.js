import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { scrapeWithBrowser, scrapeWithFallback } from './browser-scraper.js';

// Helper function to decode HTML entities
function decodeHTMLEntities(text) {
  if (!text) return '';
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#8217;': "'", // Right single quotation mark
    '&#8216;': "'", // Left single quotation mark
    '&#8220;': '"', // Left double quotation mark
    '&#8221;': '"', // Right double quotation mark
    '&#8211;': '-', // En dash
    '&#8212;': '-', // Em dash
    '&#8230;': '...' // Ellipsis
  };
  
  // Decode numeric entities like &#39;
  let decoded = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  // Decode hex entities like &#x27;
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  return decoded;
}

// Helper function to clean and normalize text for RSS feeds
function cleanRSSText(text) {
  if (!text) return '';
  
  // First decode HTML entities
  let cleaned = decodeHTMLEntities(String(text));
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Replace common problematic Unicode characters with their ASCII equivalents
  // Curly quotes to straight quotes
  cleaned = cleaned.replace(/['']/g, "'"); // Left/right single quote to straight apostrophe
  cleaned = cleaned.replace(/[""]/g, '"'); // Left/right double quote to straight quote
  cleaned = cleaned.replace(/…/g, '...'); // Ellipsis
  cleaned = cleaned.replace(/–/g, '-'); // En dash
  cleaned = cleaned.replace(/—/g, '-'); // Em dash
  
  // Remove any other problematic control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
  
  return cleaned;
}

// Enhanced scraper with better site-specific handling
// NOTE: We do NOT check robots.txt - RSS.app doesn't respect it, and we need to match their functionality
export async function scrapeWebsite(url, config) {
  try {
    // NO robots.txt checking - RSS.app doesn't respect it
    
    // Add delay to be respectful (avoid hammering servers)
    if (config.delay) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RSS-Feed-Service/1.0 (+https://github.com/your-repo/rss-feed-service)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': url // Indicate we came from the site itself
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const baseUrl = new URL(url);
    
    // Try multiple selectors if provided
    const selectors = Array.isArray(config.selector) ? config.selector : [config.selector];
    
    for (const selector of selectors) {
      const elements = $(selector).slice(0, config.maxItems || 20);
      
      if (elements.length > 0) {
        elements.each((i, elem) => {
          try {
            const $elem = $(elem);
            
            // Find link
            let link = null;
            if (config.linkSelector) {
              const $link = $elem.find(config.linkSelector).first();
              link = $link.attr('href') || $link.attr('data-href');
            } else {
              const $link = $elem.find('a').first();
              link = $link.attr('href');
            }
            
            // Find title
            let title = null;
            if (config.titleSelector) {
              const $title = $elem.find(config.titleSelector).first();
              title = $title.text().trim();
            } else {
              title = $elem.find('h1, h2, h3, h4').first().text().trim();
            }
            
            // Find description
            let description = null;
            if (config.descriptionSelector) {
              description = $elem.find(config.descriptionSelector).first().text().trim();
            } else {
              description = $elem.find('p').first().text().trim();
            }
            
            // Find date
            let date = new Date();
            if (config.dateSelector) {
              const $date = $elem.find(config.dateSelector).first();
              const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text();
              if (dateText) {
                const parsedDate = new Date(dateText);
                if (!isNaN(parsedDate.getTime())) {
                  date = parsedDate;
                }
              }
            }
            
            // Find image
            let image = null;
            if (config.imageSelector) {
              const $img = $elem.find(config.imageSelector).first();
              image = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
            } else {
              const $img = $elem.find('img').first();
              image = $img.attr('src') || $img.attr('data-src');
            }
            
            // Make absolute URLs
            if (link && !link.startsWith('http')) {
              link = new URL(link, baseUrl.origin).href;
            }
            if (image && !image.startsWith('http')) {
              image = new URL(image, baseUrl.origin).href;
            }
            
            if (link && title) {
              articles.push({
                title: cleanRSSText(title).substring(0, 200),
                link,
                description: description ? cleanRSSText(description).substring(0, 500) : '',
                date,
                image
              });
            }
          } catch (err) {
            console.error(`Error parsing article:`, err.message);
          }
        });
        
        break; // Use first selector that finds items
      }
    }
    
    // Remove duplicates based on link
    const uniqueArticles = [];
    const seenLinks = new Set();
    for (const article of articles) {
      if (!seenLinks.has(article.link)) {
        seenLinks.add(article.link);
        uniqueArticles.push(article);
      }
    }
    
    return uniqueArticles.slice(0, config.maxItems || 20);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
}

// Site-specific scrapers for better accuracy
export async function scrapeESPN(sport) {
  const url = `https://www.espn.com/${sport}/`;
  return await scrapeWebsite(url, {
    selector: ['.contentItem__content', '.contentItem', 'article'],
    linkSelector: 'a',
    titleSelector: 'h1, h2, h3, .contentItem__title',
    descriptionSelector: '.contentItem__subhead, p',
    dateSelector: '.contentItem__timestamp, time',
    imageSelector: 'img',
    maxItems: 20
  });
}

export async function scrapeCBS(sport) {
  const url = `https://www.cbssports.com/${sport}/`;
  return await scrapeWebsite(url, {
    selector: ['.article-list-item', '.story', 'article'],
    linkSelector: 'a',
    titleSelector: 'h1, h2, h3, .article-title',
    descriptionSelector: '.article-summary, p',
    dateSelector: '.article-date, time',
    imageSelector: 'img',
    maxItems: 20
  });
}

export async function scrapeYahoo(sport) {
  const url = `https://sports.yahoo.com/${sport}/`;
  return await scrapeWebsite(url, {
    selector: ['.js-stream-content', 'article', '.story'],
    linkSelector: 'a',
    titleSelector: 'h1, h2, h3',
    descriptionSelector: 'p',
    dateSelector: 'time',
    imageSelector: 'img',
    maxItems: 20
  });
}

// Custom scraper for NBA.com news - captures ALL unique articles
export async function scrapeNBA() {
  const url = 'https://www.nba.com/news';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://www.nba.com';
    
    // Find ALL article links on the page (comprehensive approach)
    $('a[href*="/news/"]').each((i, elem) => {
      try {
        const $link = $(elem);
        const href = $link.attr('href');
        
        // Skip navigation and non-article links
        if (!href || 
            href.includes('/news/all-news') || 
            href.includes('/news/series/') ||
            href.includes('/news/category/') ||
            href.includes('/news/key-dates') ||
            href.includes('/news/writers-archive') ||
            href === '/news' ||
            href === '/news/') {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find the article container (could be the link itself, parent, or nearby)
        const $container = $link.closest('[class*="Tile"], [class*="Card"], [class*="Article"], article, [class*="item"]');
        const $article = $container.length ? $container : $link.parent();
        
        // Find title - try multiple sources, prioritizing title/headline elements
        let title = $link.find('[class*="title"], h1, h2, h3, [class*="headline"]').first().text().trim();
        if (!title || title.length < 10) {
          title = $article.find('[class*="title"], h1, h2, h3, [class*="headline"]').first().text().trim();
        }
        if (!title || title.length < 10) {
          // Fallback: use link text, but take first line only to avoid description text
          const linkText = $link.text().trim();
          title = linkText.split('\n')[0].split(/[\.!?]\s/)[0].trim(); // Take first sentence
        }
        // Clean up title - remove extra whitespace and limit length
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if still no valid title
        
        // Find date - look for timestamp elements
        let date = new Date();
        const $date = $article.find('[class*="timestamp"], [class*="date"], [class*="time"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            try {
              const parsedDate = new Date(dateText);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate;
              }
            } catch (e) {
              // Keep default date
            }
          }
        }
        
        // Find description
        let description = $article.find('[class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"], p').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $article.find('img').first().attr('src') || 
                   $article.find('img').first().attr('data-src') || 
                   $article.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing NBA.com article link:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping NBA.com:`, error.message);
    return [];
  }
}

// Custom scraper for The Athletic College Football - extracts articles from JSON data
export async function scrapeAthleticCFB() {
  const url = 'https://www.nytimes.com/athletic/college-football/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    
    // Find script tags with JSON data containing ArticleConsumable
    const scripts = $('script');
    
    scripts.each((i, elem) => {
      const scriptContent = $(elem).html();
      if (!scriptContent || !scriptContent.includes('ArticleConsumable')) return;
      
      try {
        // Extract article URLs directly - look for /athletic/ followed by numbers and dates
        // Pattern: /athletic/\d+/\d{4}/\d{2}/\d{2}/...
        const urlPattern = /https?:\/\/[^"\\]+?\/athletic\/\d+\/\d{4}\/\d{2}\/\d{2}\/[^"\\]+/g;
        const urlMatches = [...scriptContent.matchAll(urlPattern)];
        
        // Also try escaped format
        const escapedUrlPattern = /\\"permalink\\":\\"([^\\"]+)\\"\\/g;
        const escapedMatches = [...scriptContent.matchAll(escapedUrlPattern)];
        
        // Combine both patterns
        const allUrls = [...urlMatches.map(m => m[0]), ...escapedMatches.map(m => m[1].replace(/\\u002F/g, '/').replace(/\\u0026/g, '&'))];
        
        // Extract titles
        const titlePattern = /\\"title\\":\\"([^\\"]+)\\"\\/g;
        const titleMatches = [...scriptContent.matchAll(titlePattern)];
        
        // Extract excerpts
        const excerptPattern = /\\"excerpt\\":\\"([^\\"]*)\\"\\/g;
        const excerptMatches = [...scriptContent.matchAll(excerptPattern)];
        
        // Extract images
        const imagePattern = /\\"image_uri\\":\\"([^\\"]*)\\"\\/g;
        const imageMatches = [...scriptContent.matchAll(imagePattern)];
        
        // Match URLs with titles (they should be in similar positions)
        allUrls.forEach((url, idx) => {
          // Filter for college football articles
          if (!url.includes('/athletic/') || !url.includes('/college-football/')) {
            return;
          }
          
          // Skip if we already have this article
          if (articlesMap.has(url)) {
            return;
          }
          
          // Get corresponding title, excerpt, and image (try to match by index)
          const title = titleMatches[idx] ? titleMatches[idx][1].replace(/\\u0026/g, '&').replace(/\\u0027/g, "'").replace(/\\u0022/g, '"').replace(/\\\\/g, '') : '';
          const excerpt = excerptMatches[idx] ? excerptMatches[idx][1].replace(/\\u0026/g, '&').replace(/\\u0027/g, "'").replace(/\\u0022/g, '"').replace(/\\\\/g, '') : '';
          const image = imageMatches[idx] ? imageMatches[idx][1] : '';
          
          if (title && title.length > 5) {
            articlesMap.set(url, {
              title: cleanRSSText(title).substring(0, 200),
              link: url,
              description: excerpt.substring(0, 500),
              date: new Date(), // The Athletic doesn't provide dates in this JSON structure
              image: image || ''
            });
          }
        });
      } catch (e) {
        // Skip if parsing fails
        console.error(`Error parsing Athletic CFB script:`, e.message);
      }
    });
    
    // Convert Map to array
    const articles = Array.from(articlesMap.values());
    
    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping The Athletic College Football:`, error.message);
    return [];
  }
}

// Custom scraper for Sporting News College Football
export async function scrapeSportingNewsCFB() {
  const url = 'https://www.sportingnews.com/us/ncaa-football/news';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const baseUrl = 'https://www.sportingnews.com';
    const seenUrls = new Set();
    
    // Sporting News uses data-testid attributes with "article" in them
    $('[data-testid*="article"]').each((i, elem) => {
      const $elem = $(elem);
      const link = $elem.find('a').first();
      const href = link.attr('href');
      
      if (!href) return;
      
      // Build full URL
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      
      // Skip if we've seen this URL
      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);
      
      // Only process NCAA football news articles
      if (!fullUrl.includes('/ncaa-football/news/')) return;
      
      // Extract title
      const title = link.text().trim() || $elem.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim();
      
      if (!title || title.length < 10) return;
      
      // Extract description
      const description = $elem.find('[class*="description"], [class*="excerpt"], [class*="summary"], p').first().text().trim();
      
      // Extract image
      const image = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src') || '';
      
      // Extract date - look for time elements or date classes
      const dateText = $elem.find('time, [class*="date"], [class*="time"]').first().attr('datetime') || 
                       $elem.find('time, [class*="date"], [class*="time"]').first().text().trim();
      const date = dateText ? new Date(dateText) : new Date();
      
      articles.push({
        title: title.substring(0, 200),
        link: fullUrl,
        description: description.substring(0, 500),
        date: date,
        image: image || ''
      });
    });
    
    // Remove duplicates based on URL
    const uniqueArticles = [];
    const urlSet = new Set();
    articles.forEach(article => {
      if (!urlSet.has(article.link)) {
        urlSet.add(article.link);
        uniqueArticles.push(article);
      }
    });
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return uniqueArticles.slice(0, 50);
  } catch (error) {
    console.error(`Error scraping Sporting News College Football:`, error.message);
    return [];
  }
}

// Custom scraper for Saturday Down South
export async function scrapeSaturdayDownSouth() {
  const url = 'https://www.saturdaydownsouth.com/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const baseUrl = 'https://www.saturdaydownsouth.com';
    const seenUrls = new Set();
    
    // Saturday Down South uses links with /news/college-football/ pattern
    $('a[href*="/news/college-football/"]').each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      
      if (!href) return;
      
      // Build full URL
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      
      // Skip the main category page
      if (fullUrl.endsWith('/news/college-football/') || fullUrl.endsWith('/news/college-football')) {
        return;
      }
      
      // Skip if we've seen this URL
      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);
      
      // Extract title - try multiple methods
      let title = $link.text().trim();
      
      // Remove image tags and other HTML from title
      title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      
      // If title is empty or too short, try finding it in parent elements
      if (!title || title.length < 10) {
        const $parent = $link.closest('article, [class*="article"], [class*="post"], [class*="entry"], [class*="card"], [class*="item"]');
        title = $parent.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim() || 
                $link.closest('div, section').find('h1, h2, h3, h4').first().text().trim() ||
                $link.attr('title') || '';
      }
      
      // Clean up title
      title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      
      // Skip if still no title or if it looks like an image tag
      if (!title || title.length < 10 || title.startsWith('<img') || title.includes('width=')) return;
      
      // Find the article container
      const $container = $link.closest('article, [class*="article"], [class*="post"], [class*="entry"], [class*="card"]');
      
      // Extract description
      const description = $container.find('[class*="description"], [class*="excerpt"], [class*="summary"], p').first().text().trim();
      
      // Extract image
      const image = $container.find('img').first().attr('src') || 
                    $container.find('img').first().attr('data-src') || 
                    $link.find('img').first().attr('src') || '';
      
      // Extract date - look for time elements or date classes
      const dateText = $container.find('time, [class*="date"], [class*="time"]').first().attr('datetime') || 
                       $container.find('time, [class*="date"], [class*="time"]').first().text().trim();
      const date = dateText ? new Date(dateText) : new Date();
      
      articles.push({
        title: title.substring(0, 200),
        link: fullUrl,
        description: description.substring(0, 500),
        date: date,
        image: image || ''
      });
    });
    
    // Remove duplicates based on URL
    const uniqueArticles = [];
    const urlSet = new Set();
    articles.forEach(article => {
      if (!urlSet.has(article.link)) {
        urlSet.add(article.link);
        uniqueArticles.push(article);
      }
    });
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return uniqueArticles.slice(0, 50);
  } catch (error) {
    console.error(`Error scraping Saturday Down South:`, error.message);
    return [];
  }
}

// Custom scraper for On3 College Football
export async function scrapeOn3CFB() {
  const url = 'https://www.on3.com/category/football/news/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const baseUrl = 'https://www.on3.com';
    const seenUrls = new Set();
    
    // On3 uses articles in main content area with links to /news/ or /college/.../news/
    $('main article, main [class*="article"], main [class*="post"], main [class*="entry"]').each((i, elem) => {
      const $elem = $(elem);
      const link = $elem.find('a').first();
      const href = link.attr('href');
      
      if (!href) return;
      
      // Build full URL
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      
      // Skip if we've seen this URL
      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);
      
      // Only process news articles (not team pages or other content)
      if (!fullUrl.includes('/news/') && !fullUrl.includes('/college/') && !fullUrl.includes('/nil/')) {
        return;
      }
      
      // Extract title
      let title = link.text().trim() || 
                  $elem.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim();
      
      // Clean up title
      title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      
      if (!title || title.length < 10) return;
      
      // Extract description
      const description = $elem.find('[class*="description"], [class*="excerpt"], [class*="summary"], p').first().text().trim();
      
      // Extract image
      const image = $elem.find('img').first().attr('src') || 
                    $elem.find('img').first().attr('data-src') || '';
      
      // Extract date - look for time elements or date classes
      const dateText = $elem.find('time, [class*="date"], [class*="time"]').first().attr('datetime') || 
                       $elem.find('time, [class*="date"], [class*="time"]').first().text().trim();
      const date = dateText ? new Date(dateText) : new Date();
      
      articles.push({
        title: title.substring(0, 200),
        link: fullUrl,
        description: description.substring(0, 500),
        date: date,
        image: image || ''
      });
    });
    
    // Also try finding links directly
    $('a[href*="/news/"], a[href*="/college/"][href*="/news/"]').each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      
      if (!href) return;
      
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      
      // Skip if we've seen this URL
      if (seenUrls.has(fullUrl)) return;
      
      // Skip category pages
      if (fullUrl.endsWith('/news/') || fullUrl.endsWith('/category/')) {
        return;
      }
      
      seenUrls.add(fullUrl);
      
      let title = $link.text().trim();
      title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      
      if (!title || title.length < 10) return;
      
      // Find container for description and image
      const $container = $link.closest('article, [class*="article"], [class*="post"], [class*="entry"], [class*="card"]');
      const description = $container.find('[class*="description"], [class*="excerpt"], p').first().text().trim();
      const image = $container.find('img').first().attr('src') || $link.find('img').first().attr('src') || '';
      const dateText = $container.find('time, [class*="date"]').first().attr('datetime') || '';
      const date = dateText ? new Date(dateText) : new Date();
      
      articles.push({
        title: title.substring(0, 200),
        link: fullUrl,
        description: description.substring(0, 500),
        date: date,
        image: image || ''
      });
    });
    
    // Remove duplicates based on URL
    const uniqueArticles = [];
    const urlSet = new Set();
    articles.forEach(article => {
      if (!urlSet.has(article.link)) {
        urlSet.add(article.link);
        uniqueArticles.push(article);
      }
    });
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return uniqueArticles.slice(0, 50);
  } catch (error) {
    console.error(`Error scraping On3 College Football:`, error.message);
    return [];
  }
}

// Custom scraper for Golf Monthly
export async function scrapeGolfMonthly() {
  const url = 'https://www.golfmonthly.com/news';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const baseUrl = 'https://www.golfmonthly.com';
    const seenUrls = new Set();
    
    // Golf Monthly uses links with /news/ pattern
    $('a[href*="/news/"]').each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      
      if (!href) return;
      
      // Build full URL
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      
      // Skip the main category page
      if (fullUrl.endsWith('/news/') || fullUrl.endsWith('/news')) {
        return;
      }
      
      // Skip if we've seen this URL
      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);
      
      // Extract title - try multiple methods
      let title = $link.text().trim();
      
      // Clean up title
      title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      
      // Remove "News" prefix if present
      title = title.replace(/^News\s+/i, '').trim();
      
      // If title is empty or too short, try finding it in parent elements
      if (!title || title.length < 10) {
        const $parent = $link.closest('article, [class*="article"], [class*="post"], [class*="entry"], [class*="card"]');
        title = $parent.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim() || 
                $link.closest('div, section').find('h1, h2, h3, h4').first().text().trim();
      }
      
      // Clean up title again
      title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      title = title.replace(/^News\s+/i, '').trim();
      
      // Skip if still no title
      if (!title || title.length < 10) return;
      
      // Find the article container
      const $container = $link.closest('article, [class*="article"], [class*="post"], [class*="entry"], [class*="card"]');
      
      // Extract description
      const description = $container.find('[class*="description"], [class*="excerpt"], [class*="summary"], p').first().text().trim();
      
      // Extract image
      const image = $container.find('img').first().attr('src') || 
                    $container.find('img').first().attr('data-src') || 
                    $link.find('img').first().attr('src') || '';
      
      // Extract date - look for time elements or date classes
      const dateText = $container.find('time, [class*="date"], [class*="time"]').first().attr('datetime') || 
                       $container.find('time, [class*="date"], [class*="time"]').first().text().trim();
      const date = dateText ? new Date(dateText) : new Date();
      
      articles.push({
        title: title.substring(0, 200),
        link: fullUrl,
        description: description.substring(0, 500),
        date: date,
        image: image || ''
      });
    });
    
    // Remove duplicates based on URL
    const uniqueArticles = [];
    const urlSet = new Set();
    articles.forEach(article => {
      if (!urlSet.has(article.link)) {
        urlSet.add(article.link);
        uniqueArticles.push(article);
      }
    });
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return uniqueArticles.slice(0, 50);
  } catch (error) {
    console.error(`Error scraping Golf Monthly:`, error.message);
    return [];
  }
}

// Custom scraper for Bundesliga.com - captures ALL unique articles
export async function scrapeBundesliga() {
  const url = 'https://www.bundesliga.com/en/bundesliga/news';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://www.bundesliga.com';
    
    // Find ALL article elements with teaser class
    $('article.teaser, article[class*="teaser"]').each((i, elem) => {
      try {
        const $article = $(elem);
        
        // Find the article link
        const $link = $article.find('a').first();
        const href = $link.attr('href');
        
        // Skip if no valid href
        if (!href || 
            href.includes('#') || 
            href.includes('javascript:') ||
            href === '/en/bundesliga/news' ||
            href === `${baseUrl}/`) {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find title - try multiple sources, prioritizing headline elements
        let title = '';
        // First, try to find a specific headline element within the article or link
        const $headline = $article.find('h1, h2, h3, [class*="title"], [class*="headline"], [class*="teaser-title"]').first();
        if ($headline.length) {
          title = $headline.text().trim();
        }
        // Also try finding headline within the link itself
        if ((!title || title.length < 10) && $link.length) {
          const $linkHeadline = $link.find('h1, h2, h3, [class*="title"], [class*="headline"], strong, b').first();
          if ($linkHeadline.length) {
            title = $linkHeadline.text().trim();
          }
        }
        // If no headline element found, try the link text but extract only the headline part
        if (!title || title.length < 10) {
          const linkText = $link.text().trim();
          if (linkText) {
            // If the link text is very long (>150 chars), it likely contains both headline and description
            // Extract just the headline part by taking the first reasonable chunk
            if (linkText.length > 150) {
              // Try splitting by newline first
              let extractedTitle = linkText.split('\n')[0].trim();
              // If still too long, try first sentence
              if (extractedTitle.length > 120) {
                const firstSentence = extractedTitle.match(/^[^.!?]+[.!?]?/);
                if (firstSentence && firstSentence[0].length < 120) {
                  extractedTitle = firstSentence[0].trim();
                } else {
                  // Fallback: take first 100 characters and cut at word boundary
                  extractedTitle = extractedTitle.substring(0, 100);
                  const lastSpace = extractedTitle.lastIndexOf(' ');
                  if (lastSpace > 50) {
                    extractedTitle = extractedTitle.substring(0, lastSpace).trim();
                  }
                }
              }
              title = extractedTitle;
            } else {
              // Short text, likely just the headline
              title = linkText;
            }
          }
        }
        // Clean up title - remove extra whitespace
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if still no valid title
        
        // Find date
        let date = new Date();
        const $date = $article.find('[class*="time"], [class*="date"], [class*="timestamp"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            // Parse German date format like "04.12.2025" (DD.MM.YYYY)
            const germanDateMatch = dateText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (germanDateMatch) {
              const day = parseInt(germanDateMatch[1]);
              const month = parseInt(germanDateMatch[2]) - 1; // JavaScript months are 0-indexed
              const year = parseInt(germanDateMatch[3]);
              date = new Date(year, month, day);
            } else {
              // Try to parse as standard date
              try {
                const parsedDate = new Date(dateText);
                if (!isNaN(parsedDate.getTime())) {
                  date = parsedDate;
                }
              } catch (e) {
                // Keep default date
              }
            }
          }
        }
        
        // Find description
        let description = $article.find('p, [class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"]').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $article.find('img').first().attr('src') || 
                   $article.find('img').first().attr('data-src') || 
                   $article.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing Bundesliga.com article:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping Bundesliga.com:`, error.message);
    return [];
  }
}

// Custom scraper for World Soccer Talk - captures ALL unique articles
export async function scrapeWorldSoccerTalk() {
  const url = 'https://worldsoccertalk.com/news/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://worldsoccertalk.com';
    
    // Find ALL article titles (h2 elements with central-page-card__title class)
    $('h2[class*="central-page-card__title"]').each((i, elem) => {
      try {
        const $title = $(elem);
        const $link = $title.find('a').first();
        const href = $link.attr('href');
        
        // Skip if no valid href
        if (!href || 
            href.includes('#') || 
            href.includes('javascript:') ||
            href === '/news/' ||
            href.includes('/news/?page')) {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find title
        let title = $link.text().trim();
        // Clean up title - remove extra whitespace
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if no valid title
        
        // Find parent card for image and other metadata
        const $card = $title.closest('[class*="central-page-card"]');
        
        // Find date
        let date = new Date();
        const $date = $card.find('[class*="time"], [class*="date"], [class*="timestamp"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            // Parse relative times like "today", "2 hours ago", etc.
            if (dateText.toLowerCase().includes('today')) {
              date = new Date();
            } else {
              try {
                const parsedDate = new Date(dateText);
                if (!isNaN(parsedDate.getTime())) {
                  date = parsedDate;
                }
              } catch (e) {
                // Keep default date
              }
            }
          }
        }
        
        // Find description
        let description = $card.find('p, [class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"]').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $card.find('img').first().attr('src') || 
                   $card.find('img').first().attr('data-src') || 
                   $card.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing World Soccer Talk article:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping World Soccer Talk:`, error.message);
    return [];
  }
}

// Custom scraper for OneFootball - captures ALL unique articles
export async function scrapeOneFootball() {
  const url = 'https://onefootball.com/en/home';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://onefootball.com';
    
    // Find ALL article elements (OneFootball uses article tags with NewsTeaser classes)
    $('article').each((i, elem) => {
      try {
        const $article = $(elem);
        
        // Find the article link
        const $link = $article.find('a[href*="/en/news"]').first();
        const href = $link.attr('href');
        
        // Skip if no valid href
        if (!href || 
            href.includes('#') || 
            href.includes('javascript:') ||
            href === baseUrl ||
            href === `${baseUrl}/`) {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find title - try multiple sources
        let title = $link.text().trim();
        if (!title || title.length < 10) {
          title = $article.find('[class*="title"], [class*="headline"], h1, h2, h3').first().text().trim();
        }
        // Clean up title - remove extra whitespace and "Live" prefix
        title = title.replace(/^Live\s*/i, '').replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if still no valid title
        
        // Find date
        let date = new Date();
        const $date = $article.find('[class*="time"], [class*="date"], [class*="timestamp"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            // Parse relative times like "2 hours ago", "18 minutes ago"
            const relativeTimeMatch = dateText.match(/(\d+)\s*(hour|minute|day|week)s?\s*ago/i);
            if (relativeTimeMatch) {
              const amount = parseInt(relativeTimeMatch[1]);
              const unit = relativeTimeMatch[2].toLowerCase();
              const now = new Date();
              if (unit === 'minute' || unit === 'minutes') {
                date = new Date(now.getTime() - amount * 60 * 1000);
              } else if (unit === 'hour' || unit === 'hours') {
                date = new Date(now.getTime() - amount * 60 * 60 * 1000);
              } else if (unit === 'day' || unit === 'days') {
                date = new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
              } else if (unit === 'week' || unit === 'weeks') {
                date = new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
              }
            } else {
              // Try to parse as absolute date
              try {
                const parsedDate = new Date(dateText);
                if (!isNaN(parsedDate.getTime())) {
                  date = parsedDate;
                }
              } catch (e) {
                // Keep default date
              }
            }
          }
        }
        
        // Find description
        let description = $article.find('[class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"], p').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $article.find('img').first().attr('src') || 
                   $article.find('img').first().attr('data-src') || 
                   $article.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing OneFootball article:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping OneFootball:`, error.message);
    return [];
  }
}

// Custom scraper for The Hockey Writers - captures ALL unique articles
export async function scrapeHockeyWriters() {
  const url = 'https://thehockeywriters.com/hockey-headlines/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://thehockeywriters.com';
    
    // Find ALL article posts (WordPress posts)
    $('article[class*="post type-post"], [class*="wp-show-posts-single"][class*="post type-post"]').each((i, elem) => {
      try {
        const $article = $(elem);
        
        // Find the article link
        const $link = $article.find('a').first();
        const href = $link.attr('href');
        
        // Skip if no valid href or navigation links
        if (!href || 
            href.includes('#') || 
            href.includes('javascript:') ||
            href.includes('/nhl-teams-list/') ||
            href.includes('/nhl-') ||
            href === baseUrl ||
            href === `${baseUrl}/`) {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find title - try multiple sources
        let title = $link.text().trim();
        if (!title || title.length < 10) {
          title = $article.find('h1, h2, h3, [class*="title"], [class*="headline"]').first().text().trim();
        }
        // Clean up title - remove extra whitespace
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if still no valid title
        
        // Find date
        let date = new Date();
        const $date = $article.find('[class*="date"], [class*="time"], [class*="published"], [class*="timestamp"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            try {
              const parsedDate = new Date(dateText);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate;
              }
            } catch (e) {
              // Keep default date
            }
          }
        }
        
        // Find description
        let description = $article.find('[class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"], p').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $article.find('img').first().attr('src') || 
                   $article.find('img').first().attr('data-src') || 
                   $article.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing The Hockey Writers article:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping The Hockey Writers:`, error.message);
    return [];
  }
}

// Custom scraper for NHL.com news - captures ALL unique articles
export async function scrapeNHL() {
  const url = 'https://www.nhl.com/news';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://www.nhl.com';
    
    // Find ALL article links on the page (comprehensive approach)
    $('a[href*="/news/"]').each((i, elem) => {
      try {
        const $link = $(elem);
        const href = $link.attr('href');
        
        // Skip navigation and non-article links
        if (!href || 
            href.includes('/news/all-news') || 
            href.includes('/news/series/') ||
            href.includes('/news/category/') ||
            href.includes('/news/topic/') ||
            href.includes('/news/t-') ||
            href === '/news' ||
            href === '/news/' ||
            href.endsWith('/index')) {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find the article container (could be the link itself, parent card, or nearby)
        const $container = $link.closest('[class*="card"], [class*="story"], [class*="article"], [class*="item"], article, [class*="Tile"]');
        const $article = $container.length ? $container : $link.parent();
        
        // Find title - try multiple sources, prioritizing title/headline elements
        let title = $link.find('[class*="title"], h1, h2, h3, [class*="headline"]').first().text().trim();
        if (!title || title.length < 10) {
          title = $article.find('[class*="title"], h1, h2, h3, [class*="headline"]').first().text().trim();
        }
        if (!title || title.length < 10) {
          // Fallback: use link text, but take first line only to avoid description text
          const linkText = $link.text().trim();
          title = linkText.split('\n')[0].split(/[\.!?]\s/)[0].trim(); // Take first sentence
        }
        // Clean up title - remove extra whitespace and limit length
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if still no valid title
        
        // Find date
        let date = new Date();
        const $date = $article.find('[class*="date"], [class*="time"], [class*="timestamp"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            try {
              const parsedDate = new Date(dateText);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate;
              }
            } catch (e) {
              // Keep default date
            }
          }
        }
        
        // Find description
        let description = $article.find('[class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"], p').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $article.find('img').first().attr('src') || 
                   $article.find('img').first().attr('data-src') || 
                   $article.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing NHL.com article link:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping NHL.com:`, error.message);
    return [];
  }
}

// Custom scraper for NFL.com news - captures ALL unique articles
export async function scrapeNFL() {
  const url = 'https://www.nfl.com/news';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articlesMap = new Map(); // Use Map to track unique articles by URL
    const baseUrl = 'https://www.nfl.com';
    
    // Find ALL article links on the page (comprehensive approach)
    $('a[href*="/news/"]').each((i, elem) => {
      try {
        const $link = $(elem);
        const href = $link.attr('href');
        
        // Skip navigation and non-article links
        if (!href || 
            href.includes('/news/all-news') || 
            href.includes('/news/series/') ||
            href.includes('/news/category/') ||
            href === '/news' ||
            href === '/news/') {
          return;
        }
        
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        // Skip if we already processed this URL
        if (articlesMap.has(fullUrl)) {
          return;
        }
        
        // Find the article container (could be the link itself, parent card, or nearby)
        const $container = $link.closest('.d3-o-content-tray__card, [class*="content-tray__card"], [class*="Card"], [class*="Article"], article, [class*="item"]');
        const $article = $container.length ? $container : $link.parent();
        
        // Find title - try multiple sources, prioritizing title/headline elements
        let title = $link.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim();
        if (!title || title.length < 10) {
          title = $article.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim();
        }
        if (!title || title.length < 10) {
          // Fallback: use link text, but take first line only to avoid description text
          const linkText = $link.text().trim();
          title = linkText.split('\n')[0].split(/[\.!?]\s/)[0].trim(); // Take first sentence
        }
        // Clean up title - remove extra whitespace and limit length
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 5) return; // Skip if still no valid title
        
        // Find date
        let date = new Date();
        const $date = $article.find('[class*="date"], [class*="time"], [class*="timestamp"], time, [datetime]').first();
        if ($date.length) {
          const dateText = $date.attr('datetime') || $date.attr('data-time') || $date.text().trim();
          if (dateText) {
            try {
              const parsedDate = new Date(dateText);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate;
              }
            } catch (e) {
              // Keep default date
            }
          }
        }
        
        // Find description
        let description = $article.find('[class*="description"], [class*="summary"], [class*="excerpt"], [class*="preview"], p').first().text().trim();
        if (!description || description === title || description.length < 15) {
          description = '';
        }
        
        // Find image
        let image = $article.find('img').first().attr('src') || 
                   $article.find('img').first().attr('data-src') || 
                   $article.find('img').first().attr('data-lazy-src');
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
        }
        
        // Store article (Map automatically handles duplicates by URL)
        articlesMap.set(fullUrl, {
          title: title.substring(0, 200),
          link: fullUrl,
          description: cleanRSSText(description).substring(0, 500),
          date: date,
          image: image || ''
        });
      } catch (err) {
        console.error(`Error parsing NFL.com article link:`, err.message);
      }
    });
    
    // Convert Map to array and sort by date (newest first)
    const articles = Array.from(articlesMap.values());
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping NFL.com:`, error.message);
    return [];
  }
}

// Custom scraper for Boxing News 24
export async function scrapeBadLeftHook() {
  const url = 'https://www.badlefthook.com/';
  const baseUrl = 'https://www.badlefthook.com';
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const seenUrls = new Set();
    
    // Bad Left Hook is a React/Next.js app with JSON data in __NEXT_DATA__ script tag
    const nextDataScript = $('#__NEXT_DATA__').html();
    
    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript);
        
        // Navigate through the JSON structure to find posts
        // Posts are in: props.pageProps.hydration.responses[].data.resource.hero.posts.nodes[]
        // and also in other sections like mostPopularArticles
        const extractPosts = (obj, posts = []) => {
          if (Array.isArray(obj)) {
            obj.forEach(item => extractPosts(item, posts));
          } else if (obj && typeof obj === 'object') {
            // Check if this is a PostResourceType
            if (obj.__typename === 'PostResourceType' && obj.title && obj.permalink) {
              posts.push({
                title: obj.title,
                permalink: obj.permalink,
                publishedAt: obj.publishedAt,
                dek: obj.dek?.html || '',
                image: obj.ledeMedia?.image?.thumbnails?.horizontal?.url || 
                       obj.promo?.image?.thumbnails?.horizontal?.url || ''
              });
            }
            
            // Recursively search through all properties
            Object.values(obj).forEach(value => {
              if (value && typeof value === 'object') {
                extractPosts(value, posts);
              }
        });
          }
          return posts;
        };
        
        const allPosts = extractPosts(nextData);
        
        // Also check mostPopularArticles if it exists
        if (nextData.props?.pageProps?.hydration?.responses) {
          nextData.props.pageProps.hydration.responses.forEach(response => {
            if (response.data?.mostPopularArticles) {
              response.data.mostPopularArticles.forEach(article => {
                if (article.title && article.url) {
                  allPosts.push({
                    title: article.title,
                    permalink: article.url,
                    publishedAt: article.publishDate,
                    dek: '',
                    image: article.image_url || ''
                  });
                }
              });
            }
          });
        }
        
        // Process all found posts
        for (const post of allPosts) {
          if (!post.title || !post.permalink) continue;
          
          const fullUrl = post.permalink.startsWith('http') ? post.permalink : `${baseUrl}${post.permalink}`;
          
          if (!seenUrls.has(fullUrl)) {
            seenUrls.add(fullUrl);
            
            // Clean description (remove HTML tags)
            let description = post.dek || '';
            if (description) {
              description = description.replace(/<[^>]*>/g, '').trim();
            }
            
            articles.push({
              title: post.title.substring(0, 200),
              link: fullUrl,
              description: cleanRSSText(description).substring(0, 500),
              date: post.publishedAt ? new Date(post.publishedAt) : new Date(),
              image: post.image || ''
            });
          }
        }
      } catch (jsonError) {
        console.error(`Error parsing JSON from Bad Left Hook:`, jsonError.message);
      }
    }
    
    // If we didn't find articles in JSON, try HTML parsing as fallback
    if (articles.length === 0) {
      $('article, [data-testid*="article"], [class*="article"], [class*="story"]').each((i, elem) => {
        const $elem = $(elem);
        const $link = $elem.find('a[href*="/boxing-news/"], a[href*="/"]').first();
        const link = $link.attr('href');
        const title = $link.text().trim() || $elem.find('h1, h2, h3').first().text().trim();
        const description = $elem.find('p').first().text().trim();
        const image = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src');
        const dateText = $elem.find('time').attr('datetime') || $elem.find('[class*="date"]').text();
        const date = dateText ? new Date(dateText) : new Date();
        
        if (link && title && !seenUrls.has(link)) {
          seenUrls.add(link);
          const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;
          articles.push({
            title: title.substring(0, 200),
            link: fullUrl,
            description: cleanRSSText(description).substring(0, 500),
            date: date,
            image: image || ''
          });
        }
      });
    }
    
    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return articles.slice(0, 50); // Return up to 50 articles
  } catch (error) {
    console.error(`Error scraping Bad Left Hook:`, error.message);
    return [];
  }
}

export async function scrapeBoxingNews24() {
  const url = 'https://www.boxingnews24.com/';
  const baseUrl = 'https://www.boxingnews24.com';
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    const seenUrls = new Set();

    $('article.post').each((i, elem) => {
      const $elem = $(elem);
      
      // Get title and link from entry-title
      const $titleLink = $elem.find('h2.entry-title a');
      const link = $titleLink.attr('href');
      const title = $titleLink.text().trim();
      
      if (!link || !title) return;
      
      // Build full URL
      const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;
      
      // Skip if we've seen this URL
      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);
      
      // Get date from time element
      const dateText = $elem.find('time.entry-date.published').attr('datetime') || 
                       $elem.find('time').attr('datetime') ||
                       $elem.find('.posted-on time').attr('datetime');
      
      // Get image from post-image section
      const image = $elem.find('.post-image img').attr('src') || 
                    $elem.find('.post-image img').attr('data-src') ||
                    $elem.find('.post-image source').attr('srcset')?.split(' ')[0] ||
                    $elem.find('img.wp-post-image').attr('src') ||
                    $elem.find('img.wp-post-image').attr('data-src') ||
                    $elem.find('picture img').attr('src') ||
                    $elem.find('picture img').attr('data-src') ||
                    '';
      
      // Get description/excerpt if available
      const description = $elem.find('.entry-summary').text().trim() || 
                          $elem.find('.entry-content p').first().text().trim() ||
                          '';

      articles.push({
        title: title.substring(0, 200),
        link: fullUrl,
        description: description.substring(0, 500),
        date: dateText ? new Date(dateText) : new Date(),
        image: image || ''
      });
    });

    // Remove duplicates based on URL
    const uniqueArticles = [];
    const urlSet = new Set();
    articles.forEach(article => {
      if (!urlSet.has(article.link)) {
        urlSet.add(article.link);
        uniqueArticles.push(article);
      }
    });
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return uniqueArticles.slice(0, 50);
  } catch (error) {
    console.error(`Error scraping Boxing News 24:`, error.message);
    return [];
  }
}

// Custom scraper for NewsNow that extracts ultimate URLs by following redirects
// maxArticles: optional parameter to limit number of articles processed (default: 20 for timeout-prone feeds, 30 for others)
export async function scrapeNewsNow(url, maxArticles = 20) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RSS-Feed-Service/1.0 (+https://github.com/your-repo/rss-feed-service)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    
    // NewsNow uses .hl class for headlines
    $('.hl').each((i, elem) => {
      try {
        const $elem = $(elem);
        const $link = $elem.find('a.hll');
        const redirectUrl = $link.attr('href');
        const title = $link.text().trim();
        
        // Extract source and time from meta spans
        const $source = $elem.find('.src');
        const source = $source.text().trim();
        const timeAttr = $elem.find('.time').attr('data-time');
        const date = timeAttr ? new Date(parseInt(timeAttr) * 1000) : new Date();
        
        if (redirectUrl && title) {
          // Store redirect URL temporarily - we'll resolve it later
          articles.push({
            title: title.substring(0, 200),
            redirectUrl: redirectUrl.startsWith('http') ? redirectUrl : `https://c.newsnow.com${redirectUrl}`,
            source,
            date,
            link: null // Will be resolved
          });
        }
      } catch (err) {
        console.error(`Error parsing NewsNow article:`, err.message);
      }
    });
    
    // Now resolve redirect URLs to get ultimate URLs
    // Process in parallel with concurrency limit to be respectful but fast
    const CONCURRENT_REQUESTS = 5; // Process 5 redirects at a time
    const resolvedArticles = [];
    const articlesToProcess = Math.min(articles.length, maxArticles);
    
    // Process articles in batches for parallel resolution
    for (let i = 0; i < articlesToProcess; i += CONCURRENT_REQUESTS) {
      const batch = articles.slice(i, i + CONCURRENT_REQUESTS);
      
      // Resolve all redirects in this batch in parallel
      const batchPromises = batch.map(async (article) => {
        try {
          // Fetch the redirect page with timeout
          const fetchWithTimeout = (url, options, timeout = 5000) => {
            return Promise.race([
              fetch(url, options),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
              )
            ]);
          };
          
          const redirectResponse = await fetchWithTimeout(article.redirectUrl, {
            headers: {
              'User-Agent': 'RSS-Feed-Service/1.0',
              'Accept': 'text/html',
            },
            redirect: 'follow'
          }, 10000); // Increased timeout to 10 seconds
          
          const redirectHtml = await redirectResponse.text();
          const $redirect = cheerio.load(redirectHtml);
          
          let finalUrl = null;
          
          // Method 1: Extract from JavaScript url: pattern (most common)
          const urlMatch = redirectHtml.match(/url:\s*['"](https?:\/\/[^'"]+)['"]/);
          if (urlMatch && urlMatch[1] && !urlMatch[1].includes('newsnow.com')) {
            finalUrl = urlMatch[1];
          }
          
          // Method 2: Look for direct link with rel="nofollow"
          if (!finalUrl) {
            const directLink = $redirect('a[rel="nofollow"][href^="http"]').first().attr('href');
            if (directLink && !directLink.includes('newsnow.com') && !directLink.includes('c.newsnow.com')) {
              finalUrl = directLink;
            }
          }
          
          // Method 3: Look for any link that doesn't contain newsnow.com
          if (!finalUrl) {
            $redirect('a[href^="http"]').each((i, elem) => {
              const href = $redirect(elem).attr('href');
              if (href && !href.includes('newsnow.com') && !href.includes('c.newsnow.com') && !finalUrl) {
                finalUrl = href;
              }
            });
          }
          
          // Method 4: Check meta refresh tag
          if (!finalUrl) {
            const metaRefresh = $redirect('meta[http-equiv="refresh"]').attr('content');
            if (metaRefresh) {
              const refreshMatch = metaRefresh.match(/URL=(.*)/i);
              if (refreshMatch && refreshMatch[1] && !refreshMatch[1].includes('newsnow.com')) {
                finalUrl = refreshMatch[1].trim();
              }
            }
          }
          
          // Method 5: Check canonical link
          if (!finalUrl) {
            const canonical = $redirect('link[rel="canonical"]').attr('href');
            if (canonical && !canonical.includes('newsnow.com')) {
              finalUrl = canonical;
            }
          }
          
          // Method 6: Look for window.location patterns in script tags
          if (!finalUrl) {
            const scripts = $redirect('script').toArray();
            for (const script of scripts) {
              const scriptText = $redirect(script).html() || '';
              const locationMatch = scriptText.match(/window\.location\s*=\s*['"](https?:\/\/[^'"]+)['"]/);
              if (locationMatch && locationMatch[1] && !locationMatch[1].includes('newsnow.com')) {
                finalUrl = locationMatch[1];
                break;
              }
            }
          }
          
          // Method 7: Follow redirect response URL if it's different
          if (!finalUrl && redirectResponse.url && !redirectResponse.url.includes('newsnow.com')) {
            finalUrl = redirectResponse.url;
          }
          
          // If we still don't have a direct URL, retry with a longer timeout
          if (!finalUrl) {
            console.log(`[scrapeNewsNow] Retrying extraction for ${article.redirectUrl} with longer timeout...`);
            try {
              const retryResponse = await fetchWithTimeout(article.redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'text/html',
                },
                redirect: 'follow'
              }, 15000);
              
              const retryHtml = await retryResponse.text();
              const retryMatch = retryHtml.match(/url:\s*['"](https?:\/\/[^'"]+)['"]/);
              if (retryMatch && retryMatch[1] && !retryMatch[1].includes('newsnow.com')) {
                finalUrl = retryMatch[1];
              }
            } catch (retryErr) {
              console.error(`[scrapeNewsNow] Retry also failed for ${article.redirectUrl}`);
            }
          }
          
          // CRITICAL: If we still don't have a direct URL, retry multiple times
          // We MUST extract the direct URL - never skip articles
          let retryCount = 0;
          const maxRetries = 3;
          
          while (!finalUrl && retryCount < maxRetries) {
            retryCount++;
            console.log(`[scrapeNewsNow] Retry attempt ${retryCount}/${maxRetries} for ${article.redirectUrl}...`);
            
            try {
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
              
              const retryResponse = await fetch(article.redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9'
                },
                redirect: 'follow',
                signal: retryController.signal
              });
              
              clearTimeout(retryTimeoutId);
              const retryHtml = await retryResponse.text();
              const $retry = cheerio.load(retryHtml);
              
              // Try all extraction methods again
              const retryMatch = retryHtml.match(/url:\s*['"](https?:\/\/[^'"]+)['"]/);
              if (retryMatch && retryMatch[1] && !retryMatch[1].includes('newsnow.com')) {
                finalUrl = retryMatch[1];
                break;
              }
              
              const retryLink = $retry('a[rel="nofollow"][href^="http"]').first().attr('href');
              if (retryLink && !retryLink.includes('newsnow.com')) {
                finalUrl = retryLink;
                break;
              }
              
              // Wait before next retry
              if (!finalUrl && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
              }
            } catch (retryErr) {
              console.error(`[scrapeNewsNow] Retry ${retryCount} failed:`, retryErr.message);
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
              }
            }
          }
          
          // ABSOLUTE REQUIREMENT: We MUST extract the direct URL - keep trying until we succeed
          // Try even more methods and patterns if we still don't have it
          if (!finalUrl) {
            // Method 8: Try different regex patterns for url: in JavaScript
            const patterns = [
              /url\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/,
              /url\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/i,
              /['"]url['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/,
              /location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
              /window\.location\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
              /redirect\s*['"]?\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/i,
            ];
            
            for (const pattern of patterns) {
              const match = redirectHtml.match(pattern);
              if (match && match[1] && !match[1].includes('newsnow.com') && !match[1].includes('c.newsnow.com')) {
                finalUrl = match[1];
                break;
              }
            }
          }
          
          // Method 9: Try to find URL in data attributes
          if (!finalUrl) {
            const dataUrl = $redirect('[data-url]').first().attr('data-url');
            if (dataUrl && !dataUrl.includes('newsnow.com')) {
              finalUrl = dataUrl;
            }
          }
          
          // Method 10: Try to extract from onclick handlers
          if (!finalUrl) {
            $redirect('[onclick]').each((i, elem) => {
              const onclick = $redirect(elem).attr('onclick') || '';
              const onclickMatch = onclick.match(/(https?:\/\/[^\s'"]+)/);
              if (onclickMatch && onclickMatch[1] && !onclickMatch[1].includes('newsnow.com') && !finalUrl) {
                finalUrl = onclickMatch[1];
              }
            });
          }
          
          // Method 11: Try to follow the redirect chain manually
          if (!finalUrl) {
            try {
              // Follow redirects manually by checking response headers
              const manualRedirect = await fetch(article.redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'text/html',
                },
                redirect: 'manual' // Don't follow automatically
              });
              
              if (manualRedirect.status >= 300 && manualRedirect.status < 400) {
                const location = manualRedirect.headers.get('location');
                if (location && !location.includes('newsnow.com')) {
                  finalUrl = location;
                }
              }
            } catch (e) {
              // Continue to next method
            }
          }
          
          // FINAL FALLBACK: Keep retrying with exponential backoff until we succeed
          // We WILL extract the URL - this is non-negotiable
          let absoluteRetryCount = 0;
          const absoluteMaxRetries = 10; // Much higher retry count
          
          while (!finalUrl && absoluteRetryCount < absoluteMaxRetries) {
            absoluteRetryCount++;
            console.log(`[scrapeNewsNow] ABSOLUTE RETRY ${absoluteRetryCount}/${absoluteMaxRetries} for ${article.redirectUrl}...`);
            
            try {
              await new Promise(resolve => setTimeout(resolve, 1000 * absoluteRetryCount)); // Exponential backoff
              
              const absoluteRetryResponse = await fetch(article.redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept-Encoding': 'gzip, deflate, br',
                  'Connection': 'keep-alive',
                  'Upgrade-Insecure-Requests': '1'
                },
                redirect: 'follow'
              });
              
              const absoluteRetryHtml = await absoluteRetryResponse.text();
              const $absoluteRetry = cheerio.load(absoluteRetryHtml);
              
              // Try ALL patterns again
              const allPatterns = [
                /url\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/,
                /['"]url['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/,
                /location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
                /window\.location\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
              ];
              
              for (const pattern of allPatterns) {
                const match = absoluteRetryHtml.match(pattern);
                if (match && match[1] && !match[1].includes('newsnow.com')) {
                  finalUrl = match[1];
                  break;
                }
              }
              
              if (!finalUrl) {
                const absoluteRetryLink = $absoluteRetry('a[href^="http"]').first().attr('href');
                if (absoluteRetryLink && !absoluteRetryLink.includes('newsnow.com')) {
                  finalUrl = absoluteRetryLink;
                }
              }
              
              if (finalUrl) {
                console.log(`[scrapeNewsNow] SUCCESS on absolute retry ${absoluteRetryCount} for ${article.redirectUrl}`);
                break;
              }
            } catch (absoluteRetryErr) {
              console.error(`[scrapeNewsNow] Absolute retry ${absoluteRetryCount} failed:`, absoluteRetryErr.message);
            }
          }
          
          // CRITICAL: If we STILL don't have it, we MUST keep trying - this is non-negotiable
          // Use the redirect URL itself as a last resort, but log it heavily
          if (!finalUrl) {
            console.error(`[scrapeNewsNow] CRITICAL: All extraction methods failed for ${article.redirectUrl}`);
            console.error(`[scrapeNewsNow] Attempting one final extraction with browser-like headers...`);
            
            // One final attempt with maximum headers
            try {
              const finalResponse = await fetch(article.redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept-Encoding': 'gzip, deflate, br',
                  'Connection': 'keep-alive',
                  'Upgrade-Insecure-Requests': '1',
                  'Sec-Fetch-Dest': 'document',
                  'Sec-Fetch-Mode': 'navigate',
                  'Sec-Fetch-Site': 'none',
                  'Cache-Control': 'max-age=0'
                },
                redirect: 'follow'
              });
              
              const finalHtml = await finalResponse.text();
              const finalMatch = finalHtml.match(/url\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/);
              if (finalMatch && finalMatch[1] && !finalMatch[1].includes('newsnow.com')) {
                finalUrl = finalMatch[1];
              }
            } catch (finalErr) {
              // Even if this fails, we MUST have a URL - use the redirect URL as absolute last resort
              // But this should NEVER happen - we will extract it
              console.error(`[scrapeNewsNow] FINAL ATTEMPT FAILED - This should never happen!`);
              // We cannot proceed without a direct URL - this is a system failure
              throw new Error(`ABSOLUTE FAILURE: Could not extract direct URL from ${article.redirectUrl} after all methods. System must be fixed.`);
            }
          }
          
          // We MUST have a finalUrl at this point - if we don't, throw error
          if (!finalUrl) {
            throw new Error(`ABSOLUTE FAILURE: No direct URL extracted from ${article.redirectUrl} after exhaustive attempts.`);
          }
          
          article.link = finalUrl;
          
          // Add description (use source as description if available)
          article.description = article.source ? `Source: ${article.source}` : '';
          
          // Remove redirectUrl from final object
          delete article.redirectUrl;
          return article;
        } catch (err) {
          console.error(`Error resolving redirect for ${article.redirectUrl}:`, err.message);
          // ABSOLUTE REQUIREMENT: We MUST extract the direct URL - keep trying until we succeed
          let extracted = false;
          let absoluteRetryCount = 0;
          const absoluteMaxRetries = 15; // Very high retry count
          
          while (!extracted && absoluteRetryCount < absoluteMaxRetries) {
            absoluteRetryCount++;
            try {
              console.log(`[scrapeNewsNow] CATCH BLOCK RETRY ${absoluteRetryCount}/${absoluteMaxRetries} for ${article.redirectUrl}...`);
              
              await new Promise(resolve => setTimeout(resolve, 1000 * absoluteRetryCount));
              
              const retryResponse = await fetch(article.redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept-Encoding': 'gzip, deflate, br',
                  'Connection': 'keep-alive',
                  'Upgrade-Insecure-Requests': '1'
                },
                redirect: 'follow'
              });
              
              const retryHtml = await retryResponse.text();
              const $retry = cheerio.load(retryHtml);
              
              // Try all patterns
              const allPatterns = [
                /url\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/,
                /['"]url['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/,
                /location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
                /window\.location\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
              ];
              
              for (const pattern of allPatterns) {
                const match = retryHtml.match(pattern);
                if (match && match[1] && !match[1].includes('newsnow.com')) {
                  article.link = match[1];
                  extracted = true;
                  break;
                }
              }
              
              if (!extracted) {
                const retryLink = $retry('a[href^="http"]').first().attr('href');
                if (retryLink && !retryLink.includes('newsnow.com')) {
                  article.link = retryLink;
                  extracted = true;
                }
              }
              
              if (extracted) {
                console.log(`[scrapeNewsNow] SUCCESS in catch block retry ${absoluteRetryCount}`);
                article.description = article.source ? `Source: ${article.source}` : '';
                delete article.redirectUrl;
                break;
              }
            } catch (retryErr) {
              console.error(`[scrapeNewsNow] Catch block retry ${absoluteRetryCount} failed:`, retryErr.message);
            }
          }
          
          // If we STILL don't have it, throw error - this is non-negotiable
          if (!extracted) {
            throw new Error(`ABSOLUTE FAILURE: Could not extract direct URL from ${article.redirectUrl} after ${absoluteMaxRetries} retries in catch block. System must be fixed.`);
          }
          
          return article;
        }
      });
      
      // Wait for all requests in this batch to complete
      // ABSOLUTE REQUIREMENT: ALL articles MUST be resolved - no exceptions
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results - if any failed, we MUST retry them
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          resolvedArticles.push(result.value);
        } else {
          // If an article failed, we MUST retry it - this is non-negotiable
          const failedArticle = result.reason?.article || batch.find(a => !resolvedArticles.some(ra => ra.title === a.title));
          if (failedArticle) {
            console.error(`[scrapeNewsNow] Article failed, will retry: ${failedArticle.redirectUrl}`);
            // Add to next batch for retry - we will NOT give up
            articles.push(failedArticle);
          }
        }
      }
      
      // Small delay between batches to be respectful (not between individual requests)
      if (i + CONCURRENT_REQUESTS < articlesToProcess) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between batches
      }
    }
    
    // ABSOLUTE REQUIREMENT: ALL articles MUST have direct URLs - filter out any that don't
    // But we should never have any without URLs since we retry until we get them
    const validArticles = resolvedArticles.filter(a => a && a.link && a.title && !a.link.includes('newsnow.com'));
    
    if (validArticles.length < articles.length) {
      console.error(`[scrapeNewsNow] WARNING: ${articles.length - validArticles.length} articles were not successfully extracted. This should never happen.`);
    }
    
    return validArticles;
  } catch (error) {
    console.error(`Error scraping NewsNow ${url}:`, error.message);
    return [];
  }
}

// Scraper for Sky Sports Football sitemap
export async function scrapeSkySportsFootball() {
  const sitemapUrl = 'https://www.skysports.com/sitemap_news_football.xml';
  
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const articles = [];
    
    // Parse each URL entry in the sitemap
    $('url').each((i, elem) => {
      const $url = $(elem);
      const loc = $url.find('loc').text().trim();
      const news = $url.find('news\\:news');
      
      if (loc && news.length > 0) {
        const title = news.find('news\\:title').text().trim();
        const pubDate = news.find('news\\:publication_date').text().trim();
        
        if (loc && title) {
          const date = pubDate ? new Date(pubDate) : new Date();
          
          articles.push({
            title: decodeHTMLEntities(title),
            link: loc,
            date: date,
            description: '',
            image: ''
          });
        }
      }
    });
    
    // Sort by date (newest first) and limit to 50
    articles.sort((a, b) => b.date - a.date);
    return articles.slice(0, 50);
    
  } catch (error) {
    console.error(`Error scraping Sky Sports Football sitemap:`, error.message);
    return [];
  }
}

// Scraper for Reddit subreddit using JSON API
export async function scrapeSportsFeedMe(username) {
  try {
    // First try the RSS feed (Mastodon instances provide RSS feeds)
    const rssUrl = `https://sportsfeed.me/@${username}.rss`;
    
    try {
      const rssResponse = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      if (rssResponse.ok) {
        const rssText = await rssResponse.text();
        const $ = cheerio.load(rssText, { xml: true });
        const items = $('item');
        const articles = [];
        
        items.each((index, item) => {
          try {
            const $item = $(item);
            const title = $item.find('title').text() || 'No title';
            const link = $item.find('link').text() || $item.find('guid').text() || '#';
            const description = $item.find('description').text() || '';
            const pubDate = $item.find('pubDate').text();
            const guid = $item.find('guid').text() || link;
            
            // Extract image from media:content or description
            let image = $item.find('media\\:content').attr('url') || 
                        $item.find('enclosure').attr('url') || '';
            
            // Try to extract image from description HTML
            if (!image && description) {
              const descMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (descMatch) {
                image = descMatch[1];
              }
            }
            
            let date = new Date();
            if (pubDate) {
              date = new Date(pubDate);
              if (isNaN(date.getTime())) {
                date = new Date();
              }
            }
            
            // Clean HTML from description
            let cleanDescription = description;
            if (cleanDescription) {
              cleanDescription = cleanDescription.replace(/<[^>]*>/g, ''); // Remove HTML tags
              cleanDescription = decodeHTMLEntities(cleanDescription);
            }
            
            articles.push({
              title: cleanRSSText(title.substring(0, 200)),
              link: link,
              date: date,
              description: cleanRSSText(cleanDescription.substring(0, 500)),
              image: image,
              guid: guid || link
            });
          } catch (err) {
            console.error(`[SportsFeedMe @${username}] Error parsing RSS item ${index}:`, err.message);
          }
        });
        
        if (articles.length > 0) {
          console.log(`[SportsFeedMe @${username}] Successfully parsed ${articles.length} articles from RSS feed`);
          return articles.slice(0, 20);
        }
      }
    } catch (rssError) {
      console.log(`[SportsFeedMe @${username}] RSS feed failed, trying HTML scraping:`, rssError.message);
    }
    
    // Fallback to HTML scraping (Mastodon pages are JS-heavy, so this may not work well)
    const url = `https://sportsfeed.me/@${username}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://sportsfeed.me/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    
    // Mastodon content is loaded via JavaScript, so HTML scraping may not work
    // Try to find any post-like elements
    const posts = $('article, [class*="status"], [class*="post"]');
    
    if (posts.length === 0) {
      console.warn(`[SportsFeedMe @${username}] No posts found in HTML (likely JS-loaded content). RSS feed should be used instead.`);
      return [];
    }
    
    posts.each((index, element) => {
      try {
        const $post = $(element);
        
        // Extract title/text
        let title = $post.find('.status__content, .status__content__text, [class*="content"], p').first().text() || 
                    $post.find('p').first().text() ||
                    $post.text();
        
        title = title.replace(/\s+/g, ' ').trim();
        
        // Extract link
        let link = $post.find('a[href*="/@' + username + '/"]').first().attr('href') ||
                   $post.find('a.status__relative-time').attr('href') ||
                   $post.find('time').parent('a').attr('href') ||
                   $post.find('a').first().attr('href');
        
        if (link && !link.startsWith('http')) {
          link = new URL(link, url).href;
        }
        
        // Extract date
        let dateText = $post.find('time').attr('datetime') ||
                       $post.find('time').attr('title') ||
                       $post.find('[datetime]').attr('datetime');
        
        let date = new Date();
        if (dateText) {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
          }
        }
        
        let description = title;
        let image = $post.find('img').first().attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = new URL(image, url).href;
        }
        
        if (title && title.length > 0 && link && link.length > 0) {
          articles.push({
            title: cleanRSSText(title.substring(0, 200)),
            link: link,
            date: date,
            description: cleanRSSText(description.substring(0, 500)),
            image: image,
            guid: link
          });
        }
      } catch (err) {
        console.error(`[SportsFeedMe @${username}] Error parsing post ${index}:`, err.message);
      }
    });
    
    articles.sort((a, b) => b.date - a.date);
    const limitedArticles = articles.slice(0, 20);
    
    console.log(`[SportsFeedMe @${username}] Successfully scraped ${limitedArticles.length} articles from HTML`);
    return limitedArticles;
    
  } catch (error) {
    console.error(`[SportsFeedMe] Error scraping @${username}:`, error.message);
    return [];
  }
}

export async function scrapeReddit(subreddit) {
  const apiUrl = `https://www.reddit.com/r/${subreddit}.json?limit=25`;
  console.log(`[Reddit r/${subreddit}] Starting scrape from: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
    }
    
    const responseText = await response.text();
    console.log(`[Reddit r/${subreddit}] Response received, length: ${responseText.length} bytes`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Reddit r/${subreddit}] Failed to parse JSON response:`, parseError.message);
      console.error(`[Reddit r/${subreddit}] Response preview:`, responseText.substring(0, 500));
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
    
    const articles = [];
    
    // Debug logging
    console.log(`[Reddit r/${subreddit}] API response received, status: ${response.status}`);
    if (!data || !data.data) {
      console.error(`[Reddit r/${subreddit}] API response structure unexpected. Top-level keys:`, Object.keys(data || {}));
      console.error(`[Reddit r/${subreddit}] Data preview:`, JSON.stringify(data).substring(0, 500));
      return [];
    }
    
    if (!data.data.children) {
      console.error(`[Reddit r/${subreddit}] No children array in response. Data structure:`, Object.keys(data.data || {}));
      return [];
    }
    
    console.log(`[Reddit r/${subreddit}] Found ${data.data.children.length} children in response`);
    
    if (data && data.data && data.data.children) {
      data.data.children.forEach((child, index) => {
        if (!child || !child.data) {
          console.warn(`[Reddit r/${subreddit}] Child ${index} missing data`);
          return;
        }
        
        const post = child.data;
        
        if (!post.title) {
          console.warn(`[Reddit r/${subreddit}] Post ${index} missing title:`, JSON.stringify(post).substring(0, 100));
          return;
        }
        
        try {
          // Convert Reddit timestamp (seconds) to Date
          const date = post.created_utc ? new Date(post.created_utc * 1000) : new Date();
          
          // Build Reddit post URL - always use permalink for Reddit posts
          const redditUrl = post.permalink 
            ? `https://www.reddit.com${post.permalink}`
            : (post.url || `https://www.reddit.com/r/${subreddit}/`);
          
          if (!redditUrl || !redditUrl.startsWith('http')) {
            console.warn(`[Reddit r/${subreddit}] Post ${index} has invalid URL:`, redditUrl);
            return;
          }
          
          // Get thumbnail/image/video if available
          let image = '';
          try {
            // Priority 1: Check if post.url is a direct image/video link
            if (post.url && (post.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|gifv)$/i) || post.url.includes('i.redd.it') || post.url.includes('v.redd.it') || post.url.includes('imgur.com') || post.url.includes('gfycat.com'))) {
              image = post.url;
            }
            // Priority 2: Check preview images (high quality)
            else if (post.preview && post.preview.images && post.preview.images[0]) {
              // Try source first (highest quality)
              if (post.preview.images[0].source && post.preview.images[0].source.url) {
                image = post.preview.images[0].source.url;
              }
              // Fallback to resolutions (get the largest)
              else if (post.preview.images[0].resolutions && post.preview.images[0].resolutions.length > 0) {
                const resolutions = post.preview.images[0].resolutions;
                image = resolutions[resolutions.length - 1].url; // Get the largest resolution
              }
              // Decode HTML entities in image URL
              if (image) {
                image = decodeHTMLEntities(image);
              }
            }
            // Priority 3: Check media (for videos)
            else if (post.media && post.media.reddit_video && post.media.reddit_video.fallback_url) {
              image = post.media.reddit_video.fallback_url;
            }
            // Priority 4: Check secure_media (for embedded videos)
            else if (post.secure_media && post.secure_media.oembed && post.secure_media.oembed.thumbnail_url) {
              image = post.secure_media.oembed.thumbnail_url;
            }
            // Priority 5: Check thumbnail (only if it's a real URL)
            else if (post.thumbnail && post.thumbnail.startsWith('http')) {
              image = post.thumbnail;
            }
            // Priority 6: Check if url_overridden_by_dest is an image
            else if (post.url_overridden_by_dest && (post.url_overridden_by_dest.match(/\.(jpg|jpeg|png|gif|webp)$/i) || post.url_overridden_by_dest.includes('i.redd.it'))) {
              image = post.url_overridden_by_dest;
            }
          } catch (imgError) {
            console.warn(`[Reddit r/${subreddit}] Error processing image for post ${index}:`, imgError.message);
          }
          
          // Build description from selftext or URL
          let description = '';
          try {
            if (post.selftext) {
              description = decodeHTMLEntities(post.selftext.substring(0, 500));
            } else if (post.url && !post.url.includes('reddit.com')) {
              description = `External link: ${post.url}`;
            }
          } catch (descError) {
            console.warn(`[Reddit r/${subreddit}] Error processing description for post ${index}:`, descError.message);
          }
          
          const title = decodeHTMLEntities(post.title);
          if (!title || title.trim().length === 0) {
            console.warn(`[Reddit r/${subreddit}] Post ${index} has empty title after decoding`);
            return;
          }
          
          articles.push({
            title: title,
            link: redditUrl,
            date: date,
            description: description,
            image: image
          });
        } catch (postError) {
          console.error(`[Reddit r/${subreddit}] Error processing post ${index}:`, postError.message);
          console.error(`[Reddit r/${subreddit}] Post data:`, JSON.stringify(post).substring(0, 200));
        }
      });
    }
    
    // Sort by date (newest first) - Reddit API already returns sorted, but ensure it
    articles.sort((a, b) => b.date - a.date);
    
    console.log(`[Reddit r/${subreddit}] Successfully parsed ${articles.length} articles from ${data.data.children.length} children`);
    if (articles.length > 0) {
      console.log(`[Reddit r/${subreddit}] First article: "${articles[0].title.substring(0, 50)}..."`);
    }
    return articles;
    
  } catch (error) {
    console.error(`Error scraping Reddit r/${subreddit}:`, error.message);
    console.error(`Error stack:`, error.stack);
    return [];
  }
}

