// Use puppeteer-extra with stealth plugin for better anti-detection
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

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
import { execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Configure stealth plugin - RSS.app doesn't respect robots.txt, so we match their behavior
puppeteer.use(StealthPlugin());

// Lazy load Playwright to avoid slow startup
let playwrightChromium = null;
async function getPlaywright() {
  if (!playwrightChromium) {
    const playwright = await import('playwright');
    playwrightChromium = playwright.chromium;
  }
  return playwrightChromium;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Browser pool management
class BrowserPool {
  constructor(maxBrowsers = 3) {
    this.maxBrowsers = maxBrowsers;
    this.browsers = [];
    this.availableBrowsers = [];
    this.queue = [];
  }

  async getBrowser() {
    // Return available browser if exists
    if (this.availableBrowsers.length > 0) {
      return this.availableBrowsers.shift();
    }

    // Create new browser if under limit
    if (this.browsers.length < this.maxBrowsers) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      return browser;
    }

    // Wait for browser to become available
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  async createBrowser() {
    // Check for system Chromium first (set in Dockerfile)
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || null;
    
    // If not set, try to find Chrome executable in the cache directory
    if (!executablePath) {
      try {
        const projectRoot = process.cwd();
        const cachePath = path.join(projectRoot, '.cache', 'puppeteer', 'chrome');
        
        // Try to find Chrome executable
        if (existsSync(cachePath)) {
          try {
            const chromePath = execSync(`find "${cachePath}" -name "Google Chrome for Testing" -type f 2>/dev/null | head -1`, { encoding: 'utf-8' }).trim();
            if (chromePath && existsSync(chromePath)) {
              executablePath = chromePath;
              console.log(`[Browser] Found Chrome at: ${executablePath}`);
            }
          } catch (e) {
            // Find command failed, try direct path
            const directPath = path.join(cachePath, 'mac_arm-121.0.6167.85', 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
            if (existsSync(directPath)) {
              executablePath = directPath;
              console.log(`[Browser] Found Chrome at: ${executablePath}`);
            }
          }
        }
      } catch (e) {
        console.warn(`[Browser] Could not find Chrome executable: ${e.message}`);
      }
    } else {
      console.log(`[Browser] Using system Chromium at: ${executablePath}`);
    }

    const launchOptions = {
      headless: 'new', // Use new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
        '--start-maximized',
        '--disable-infobars',
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--mute-audio',
        '--hide-scrollbars',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--disable-web-resources',
        '--safebrowsing-disable-auto-update',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      ignoreHTTPSErrors: true,
      timeout: 90000, // Increased timeout to 90 seconds
      defaultViewport: null // Use full viewport
    };

    // Only set executablePath if we found it
    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    return browser;
  }

  releaseBrowser(browser) {
    // Check if browser is still connected
    if (browser.isConnected()) {
      this.availableBrowsers.push(browser);
    } else {
      // Remove disconnected browser
      const index = this.browsers.indexOf(browser);
      if (index > -1) {
        this.browsers.splice(index, 1);
      }
    }

    // Process queue
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve(browser);
    }
  }

  async closeAll() {
    await Promise.all(this.browsers.map(browser => browser.close()));
    this.browsers = [];
    this.availableBrowsers = [];
  }
}

// Global browser pool instance
// Reduced to 1 browser to avoid overwhelming sites and reduce connection issues
const browserPool = new BrowserPool(process.env.MAX_BROWSERS ? parseInt(process.env.MAX_BROWSERS) : 1);

// Cleanup on process exit
process.on('SIGINT', async () => {
  await browserPool.closeAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserPool.closeAll();
  process.exit(0);
});

/**
 * Scrape website using headless browser (Puppeteer)
 * This handles JavaScript-rendered content that Cheerio can't see
 * 
 * @param {string} url - URL to scrape
 * @param {Object} config - Scraping configuration
 * @param {string|Array} config.selector - CSS selector(s) for article containers
 * @param {string} config.titleSelector - CSS selector for article title
 * @param {string} config.linkSelector - CSS selector for article link
 * @param {string} config.dateSelector - CSS selector for article date
 * @param {string} config.imageSelector - CSS selector for article image
 * @param {string} config.descriptionSelector - CSS selector for article description
 * @param {number} config.maxItems - Maximum number of articles to return
 * @param {number} config.timeout - Page load timeout in ms (default: 30000)
 * @param {string} config.waitForSelector - Wait for specific selector before scraping
 * @param {number} config.scrollDelay - Delay after scrolling (for lazy-loaded content)
 * @param {boolean} config.scrollToBottom - Whether to scroll to bottom to load content
 * @returns {Promise<Array>} Array of article objects
 */
export async function scrapeWithBrowser(url, config = {}) {
  const {
    selector = 'article, [class*="article"], [class*="story"], [class*="post"]',
    titleSelector = 'h1, h2, h3, h4, [class*="title"], [class*="headline"]',
    linkSelector = 'a',
    dateSelector = 'time, [class*="date"], [class*="published"], [datetime]',
    imageSelector = 'img',
    descriptionSelector = 'p, [class*="description"], [class*="excerpt"], [class*="summary"]',
    maxItems = 20,
    timeout = 30000,
    waitForSelector = null,
    scrollDelay = 1000,
    scrollToBottom = false
  } = config;

  let browser = null;
  let page = null;

  try {
    // Get browser from pool
    browser = await browserPool.getBrowser();
    page = await browser.newPage();

    // Set realistic viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set additional browser context to appear more realistic
    try {
      await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 }); // New York coordinates
      await page.setJavaScriptEnabled(true);
    } catch (e) {
      // Geolocation setting failed, continue without it
      console.warn(`[Browser] Could not set geolocation: ${e.message}`);
    }

    // Add additional stealth features beyond puppeteer-extra-plugin-stealth
    await page.evaluateOnNewDocument(() => {
      // Override navigator.webdriver (stealth plugin does this, but we add extra)
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Override plugins with realistic plugin list
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          return [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
          ];
        },
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override chrome with more complete object
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Override getBattery
      if (navigator.getBattery) {
        navigator.getBattery = () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 1
        });
      }
      
      // Override platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'MacIntel',
      });
      
      // Override hardwareConcurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
      });
      
      // Override deviceMemory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });
    });
    
    // Add realistic mouse movements and delays
    await page.evaluateOnNewDocument(() => {
      // Simulate human-like mouse movement
      let mouseX = Math.random() * window.innerWidth;
      let mouseY = Math.random() * window.innerHeight;
      
      const moveMouse = () => {
        mouseX += (Math.random() - 0.5) * 10;
        mouseY += (Math.random() - 0.5) * 10;
        mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
        mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
      };
      
      // Move mouse every few seconds
      setInterval(moveMouse, 3000 + Math.random() * 2000);
    });

    // Set extra headers with more realistic browser headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });

    // Set cookies to appear more like a real browser
    try {
      const urlObj = new URL(url);
      await page.setCookie({
        name: 'cookie_consent',
        value: 'true',
        domain: urlObj.hostname,
        path: '/'
      });
    } catch (e) {
      // Cookie setting failed, continue without it
      console.warn(`[Browser] Could not set cookie for ${url}: ${e.message}`);
    }

    // Navigate to page with retry logic and multiple wait strategies
    console.log(`[Browser] Navigating to ${url}...`);
    let navigationSuccess = false;
    let lastError = null;
    
    // Add random delay before navigation to appear more human-like
    const randomDelay = 1000 + Math.random() * 2000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    // Try different wait strategies in order: load, domcontentloaded, networkidle0
    const waitStrategies = ['load', 'domcontentloaded', 'networkidle0'];
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      for (const waitStrategy of waitStrategies) {
        try {
          console.log(`[Browser] Attempt ${attempt}, using wait strategy: ${waitStrategy}`);
          await page.goto(url, {
            waitUntil: waitStrategy,
            timeout: timeout
          });
          navigationSuccess = true;
          console.log(`[Browser] Successfully navigated to ${url} on attempt ${attempt} with ${waitStrategy}`);
          break;
        } catch (error) {
          lastError = error;
          console.warn(`[Browser] Wait strategy ${waitStrategy} failed: ${error.message}`);
          if (waitStrategy !== waitStrategies[waitStrategies.length - 1]) {
            // Try next wait strategy
            continue;
          }
        }
      }
      
      if (navigationSuccess) {
        break;
      }
      
      if (attempt < 3) {
        const delay = attempt * 3000; // Exponential backoff: 3s, 6s
        console.log(`[Browser] All wait strategies failed on attempt ${attempt}, retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!navigationSuccess) {
      console.error(`[Browser] Failed to navigate to ${url} after 3 attempts with all wait strategies. Last error: ${lastError?.message}`);
      throw lastError || new Error('Failed to navigate after 3 attempts');
    }

    // Wait for page to be fully interactive
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             (typeof jQuery === 'undefined' || jQuery.active === 0);
    }, { timeout: 30000 }).catch(() => {
      console.warn(`[Browser] Page interactive check timed out, continuing...`);
    });
    
    // Wait for specific selector if provided
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 15000 });
      } catch (e) {
        console.warn(`[Browser] Wait for selector ${waitForSelector} timed out, continuing...`);
      }
    }
    
    // Add small random delay to simulate human reading time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Scroll to bottom if needed (for lazy-loaded content)
    if (scrollToBottom) {
      await page.evaluate(async (delay) => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              setTimeout(resolve, delay);
            }
          }, 100);
        });
      }, scrollDelay);
    }

    // Extract articles - try multiple selector strategies
    const selectors = Array.isArray(selector) ? selector : [selector];
    // Add fallback selectors if main ones don't work
    const allSelectors = [
      ...selectors,
      'a[href*="/story"]',
      'a[href*="/article"]',
      'a[href*="/news"]',
      'a[href*="/post"]',
      '[class*="headline"] a',
      'h2 a, h3 a, h4 a',
      '[data-module*="article"]',
      '[data-module*="story"]'
    ];
    
    let articles = [];

    for (const sel of allSelectors) {
      const extracted = await page.evaluate((sel, config) => {
        const {
          titleSelector,
          linkSelector,
          dateSelector,
          imageSelector,
          descriptionSelector,
          maxItems,
          baseUrl
        } = config;

        const elements = Array.from(document.querySelectorAll(sel)).slice(0, maxItems);
        const articles = [];
        const seenUrls = new Set();

        elements.forEach((elem) => {
          try {
            // Find link - try multiple strategies
            let link = null;
            let linkEl = elem.querySelector(linkSelector);
            
            // If element itself is a link, use it
            if (!linkEl && elem.tagName === 'A') {
              linkEl = elem;
            }
            
            // Try finding link in parent or child
            if (!linkEl) {
              linkEl = elem.closest('a') || elem.querySelector('a');
            }
            
            if (linkEl) {
              link = linkEl.href || linkEl.getAttribute('href');
            }

            // Find title - try multiple strategies
            let title = null;
            let titleEl = elem.querySelector(titleSelector);
            
            // If element itself is a heading, use it
            if (!titleEl && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(elem.tagName)) {
              titleEl = elem;
            }
            
            // Try finding title in link text
            if (!titleEl && linkEl) {
              titleEl = linkEl;
            }
            
            // Try finding in parent
            if (!titleEl) {
              titleEl = elem.closest('h1, h2, h3, h4') || elem.querySelector('h1, h2, h3, h4');
            }
            
            if (titleEl) {
              title = titleEl.textContent?.trim();
            }
            
            // Fallback: use link text if no title found
            if (!title && linkEl) {
              title = linkEl.textContent?.trim();
            }

            // Find date
            let date = null;
            const dateEl = elem.querySelector(dateSelector);
            if (dateEl) {
              const datetime = dateEl.getAttribute('datetime') || dateEl.getAttribute('date');
              if (datetime) {
                date = new Date(datetime);
              } else {
                date = new Date(dateEl.textContent?.trim() || Date.now());
              }
            }

            // Find image
            let image = null;
            const imageEl = elem.querySelector(imageSelector);
            if (imageEl) {
              image = imageEl.src || imageEl.getAttribute('src') || imageEl.getAttribute('data-src');
            }

            // Find description
            let description = null;
            const descEl = elem.querySelector(descriptionSelector);
            if (descEl) {
              description = descEl.textContent?.trim();
            }

            // Build full URL
            if (link) {
              try {
                const fullUrl = link.startsWith('http') ? link : new URL(link, baseUrl).href;
                
                if (title && fullUrl && !seenUrls.has(fullUrl)) {
                  seenUrls.add(fullUrl);
                  articles.push({
                    title: cleanRSSText(title).substring(0, 200),
                    link: fullUrl,
                    description: description ? cleanRSSText(description).substring(0, 500) : '',
                    date: date || new Date(),
                    image: image || ''
                  });
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
          } catch (e) {
            // Error extracting from element, skip
          }
        });

        return articles;
      }, sel, {
        titleSelector,
        linkSelector,
        dateSelector,
        imageSelector,
        descriptionSelector,
        maxItems,
        baseUrl: url
      });

      if (extracted.length > 0) {
        // Merge with existing articles, avoiding duplicates
        const existingUrls = new Set(articles.map(a => a.link));
        extracted.forEach(article => {
          if (!existingUrls.has(article.link)) {
            articles.push(article);
            existingUrls.add(article.link);
          }
        });
        
        // If we have enough articles, stop trying more selectors
        if (articles.length >= maxItems) {
          break;
        }
      }
    }

    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`[Browser] Scraped ${articles.length} articles from ${url}`);
    return articles.slice(0, maxItems);

  } catch (error) {
    console.error(`[Browser] Error scraping ${url}:`, error.message);
    console.error(`[Browser] Error stack:`, error.stack);
    // Log more details for connection errors
    if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up') || error.message.includes('timeout')) {
      console.error(`[Browser] Connection error detected. This may be due to network issues or site blocking.`);
    }
    return [];
  } finally {
    // Close page and release browser
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Page might already be closed
      }
    }
    if (browser) {
      browserPool.releaseBrowser(browser);
    }
  }
}

/**
 * Scrape website with fallback: try Cheerio first, then browser if needed
 * This is the recommended approach for most sites
 * 
 * @param {string} url - URL to scrape
 * @param {Function} cheerioScraper - Function that uses Cheerio to scrape
 * @param {Object} browserConfig - Configuration for browser scraping (if needed)
 * @returns {Promise<Array>} Array of article objects
 */
export async function scrapeWithFallback(url, cheerioScraper, browserConfig = {}) {
  // Try Cheerio first (faster, cheaper)
  try {
    const cheerioResults = await cheerioScraper();
    if (cheerioResults && cheerioResults.length > 0) {
      console.log(`[Scraper] Cheerio succeeded for ${url} (${cheerioResults.length} articles)`);
      return cheerioResults;
    }
  } catch (error) {
    console.warn(`[Scraper] Cheerio failed for ${url}: ${error.message}`);
  }

  // Fallback to browser if Cheerio fails or returns no results
  console.log(`[Scraper] Falling back to browser for ${url}...`);
  return await scrapeWithBrowser(url, browserConfig);
}

/**
 * Extract data from embedded JSON (for React/Next.js apps)
 * This is a helper for sites that embed data in script tags
 * 
 * @param {Object} page - Puppeteer page object
 * @param {string} scriptSelector - Selector for script tag containing JSON
 * @param {Function} extractor - Function to extract articles from JSON data
 * @returns {Promise<Array>} Array of article objects
 */
export async function extractFromJSON(page, scriptSelector, extractor) {
  try {
    const jsonData = await page.evaluate((selector) => {
      const script = document.querySelector(selector);
      if (script) {
        try {
          return JSON.parse(script.textContent);
        } catch (e) {
          return null;
        }
      }
      return null;
    }, scriptSelector);

    if (jsonData && extractor) {
      return extractor(jsonData);
    }
  } catch (error) {
    console.error(`[Browser] Error extracting JSON:`, error.message);
  }

  return [];
}

/**
 * Scrape website using Playwright (alternative to Puppeteer)
 * Playwright often has better success rates with anti-bot detection
 * 
 * @param {string} url - URL to scrape
 * @param {Object} config - Scraping configuration (same as scrapeWithBrowser)
 * @returns {Promise<Array>} Array of article objects
 */
export async function scrapeWithPlaywright(url, config = {}) {
  const {
    selector = 'article, [class*="article"], [class*="story"], [class*="post"]',
    titleSelector = 'h1, h2, h3, h4, [class*="title"], [class*="headline"]',
    linkSelector = 'a',
    dateSelector = 'time, [class*="date"], [class*="published"], [datetime]',
    imageSelector = 'img',
    descriptionSelector = 'p, [class*="description"], [class*="excerpt"], [class*="summary"]',
    maxItems = 20,
    timeout = 30000,
    waitForSelector = null,
    scrollDelay = 1000,
    scrollToBottom = false
  } = config;

  let browser = null;
  let page = null;

  try {
    console.log(`[Playwright] Launching browser for ${url}...`);
    
    // Lazy load Playwright
    const playwright = await getPlaywright();
    
    // Use system Chromium if available (set in Dockerfile)
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || null;
    
    // Launch Playwright browser
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    };
    
    if (executablePath) {
      launchOptions.executablePath = executablePath;
      console.log(`[Playwright] Using system Chromium at: ${executablePath}`);
    }
    
    browser = await playwright.launch(launchOptions);

    // Create new context with realistic settings
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      permissions: ['geolocation']
    });

    page = await context.newPage();

    // Add delay before navigation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate with retry logic
    console.log(`[Playwright] Navigating to ${url}...`);
    let navigationSuccess = false;
    let lastError = null;
    const waitStrategies = ['load', 'domcontentloaded', 'networkidle'];

    for (let attempt = 1; attempt <= 3; attempt++) {
      for (const waitStrategy of waitStrategies) {
        try {
          console.log(`[Playwright] Attempt ${attempt}, using wait strategy: ${waitStrategy}`);
          await page.goto(url, {
            waitUntil: waitStrategy,
            timeout: timeout
          });
          navigationSuccess = true;
          console.log(`[Playwright] Successfully navigated to ${url} on attempt ${attempt} with ${waitStrategy}`);
          break;
        } catch (error) {
          lastError = error;
          console.warn(`[Playwright] Wait strategy ${waitStrategy} failed: ${error.message}`);
          if (waitStrategy !== waitStrategies[waitStrategies.length - 1]) {
            continue;
          }
        }
      }

      if (navigationSuccess) {
        break;
      }

      if (attempt < 3) {
        const delay = attempt * 3000;
        console.log(`[Playwright] All wait strategies failed on attempt ${attempt}, retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!navigationSuccess) {
      console.error(`[Playwright] Failed to navigate to ${url} after 3 attempts. Last error: ${lastError?.message}`);
      throw lastError || new Error('Failed to navigate after 3 attempts');
    }

    // Wait for specific selector if provided
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      } catch (e) {
        console.warn(`[Playwright] Wait for selector ${waitForSelector} timed out, continuing...`);
      }
    }

    // Scroll to bottom if needed
    if (scrollToBottom) {
      await page.evaluate(async (delay) => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              setTimeout(resolve, delay);
            }
          }, 100);
        });
      }, scrollDelay);
    }

    // Extract articles - try multiple selector strategies
    const selectors = Array.isArray(selector) ? selector : [selector];
    // Add fallback selectors if main ones don't work
    const allSelectors = [
      ...selectors,
      'a[href*="/story"]',
      'a[href*="/article"]',
      'a[href*="/news"]',
      'a[href*="/post"]',
      '[class*="headline"] a',
      'h2 a, h3 a, h4 a',
      '[data-module*="article"]',
      '[data-module*="story"]'
    ];
    
    let articles = [];

    for (const sel of allSelectors) {
      const extracted = await page.evaluate(({ sel: selector, config: cfg }) => {
        const {
          titleSelector,
          linkSelector,
          dateSelector,
          imageSelector,
          descriptionSelector,
          maxItems,
          baseUrl
        } = cfg;

        const elements = Array.from(document.querySelectorAll(selector)).slice(0, maxItems);
        const articles = [];
        const seenUrls = new Set();

        elements.forEach((elem) => {
          try {
            // Find link - try multiple strategies
            let link = null;
            let linkEl = elem.querySelector(linkSelector);
            
            // If element itself is a link, use it
            if (!linkEl && elem.tagName === 'A') {
              linkEl = elem;
            }
            
            // Try finding link in parent or child
            if (!linkEl) {
              linkEl = elem.closest('a') || elem.querySelector('a');
            }
            
            if (linkEl) {
              link = linkEl.href || linkEl.getAttribute('href');
            }

            // Find title - try multiple strategies
            let title = null;
            let titleEl = elem.querySelector(titleSelector);
            
            // If element itself is a heading, use it
            if (!titleEl && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(elem.tagName)) {
              titleEl = elem;
            }
            
            // Try finding title in link text
            if (!titleEl && linkEl) {
              titleEl = linkEl;
            }
            
            // Try finding in parent
            if (!titleEl) {
              titleEl = elem.closest('h1, h2, h3, h4') || elem.querySelector('h1, h2, h3, h4');
            }
            
            if (titleEl) {
              title = titleEl.textContent?.trim();
            }
            
            // Fallback: use link text if no title found
            if (!title && linkEl) {
              title = linkEl.textContent?.trim();
            }

            let date = null;
            const dateEl = elem.querySelector(dateSelector);
            if (dateEl) {
              const datetime = dateEl.getAttribute('datetime') || dateEl.getAttribute('date');
              if (datetime) {
                date = new Date(datetime);
              } else {
                date = new Date(dateEl.textContent?.trim() || Date.now());
              }
            }

            let image = null;
            const imageEl = elem.querySelector(imageSelector);
            if (imageEl) {
              image = imageEl.src || imageEl.getAttribute('src') || imageEl.getAttribute('data-src');
            }

            let description = null;
            const descEl = elem.querySelector(descriptionSelector);
            if (descEl) {
              description = descEl.textContent?.trim();
            }

            if (link) {
              try {
                const fullUrl = link.startsWith('http') ? link : new URL(link, baseUrl).href;
                
                if (title && fullUrl && !seenUrls.has(fullUrl)) {
                  seenUrls.add(fullUrl);
                  articles.push({
                    title: cleanRSSText(title).substring(0, 200),
                    link: fullUrl,
                    description: description ? cleanRSSText(description).substring(0, 500) : '',
                    date: date || new Date(),
                    image: image || ''
                  });
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
          } catch (e) {
            // Error extracting from element, skip
          }
        });

        return articles;
      }, { 
        sel, 
        config: {
          titleSelector,
          linkSelector,
          dateSelector,
          imageSelector,
          descriptionSelector,
          maxItems,
          baseUrl: url
        }
      });

      if (extracted.length > 0) {
        articles = extracted;
        break;
      }
    }

    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`[Playwright] Scraped ${articles.length} articles from ${url}`);
    return articles.slice(0, maxItems);

  } catch (error) {
    console.error(`[Playwright] Error scraping ${url}:`, error.message);
    console.error(`[Playwright] Error stack:`, error.stack);
    if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up') || error.message.includes('timeout')) {
      console.error(`[Playwright] Connection error detected.`);
    }
    return [];
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Page might already be closed
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Browser might already be closed
      }
    }
  }
}

export { browserPool };

