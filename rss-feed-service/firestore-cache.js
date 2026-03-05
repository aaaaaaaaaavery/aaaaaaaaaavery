import admin from 'firebase-admin';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Initialize Firebase Admin (will use default credentials from environment)
// For Cloud Run, this uses the service account automatically
let db = null;

function initializeFirestore() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('[Firestore] Firebase Admin initialized');
    } catch (error) {
      // If already initialized, that's fine
      if (error.message && error.message.includes('already been initialized')) {
        console.log('[Firestore] Already initialized');
      } else {
        console.error('[Firestore] Initialization error:', error.message);
        console.error('[Firestore] Stack:', error.stack);
        // Don't return null - try to continue
      }
    }
  }
  
  if (!db) {
    try {
      db = admin.firestore();
      console.log('[Firestore] Firestore database initialized successfully');
      // Test connection by setting ignoreUndefinedProperties
      db.settings({ ignoreUndefinedProperties: true });
    } catch (error) {
      console.error('[Firestore] CRITICAL: Error initializing Firestore:', error.message);
      console.error('[Firestore] Stack:', error.stack);
      console.error('[Firestore] This will prevent feeds from being cached. Check Cloud Run service account permissions.');
      db = null;
    }
  }
  
  return db;
}

// Extract final URL from NewsNow redirect URL
// SIMPLE: NewsNow URLs contain the final URL in the URL string itself - just extract it
async function extractFinalUrl(redirectUrl) {
  if (!redirectUrl) return redirectUrl;
  
  // If it's already a direct URL (not a NewsNow redirect), return as-is
  if (!redirectUrl.includes('newsnow.com') && !redirectUrl.includes('c.newsnow.com')) {
    return redirectUrl;
  }
  
  // FIRST: Try to extract URL directly from the URL string (query params, hash, etc.)
  try {
    const urlObj = new URL(redirectUrl);
    
    // Check query parameter 'url'
    const urlParam = urlObj.searchParams.get('url');
    if (urlParam && !urlParam.includes('newsnow.com') && !urlParam.includes('c.newsnow.com')) {
      return decodeURIComponent(urlParam);
    }
    
    // Check for URL in hash
    if (urlObj.hash) {
      const hashMatch = urlObj.hash.match(/url=([^&]+)/);
      if (hashMatch && hashMatch[1] && !hashMatch[1].includes('newsnow.com')) {
        return decodeURIComponent(hashMatch[1]);
      }
    }
    
    // Check path for encoded URL (e.g., /A/1234567890?url=...)
    const pathParts = urlObj.pathname.split('/');
    for (const part of pathParts) {
      if (part.includes('http://') || part.includes('https://')) {
        const decoded = decodeURIComponent(part);
        if (decoded && !decoded.includes('newsnow.com') && !decoded.includes('c.newsnow.com')) {
          return decoded;
        }
      }
    }
  } catch (e) {
    // URL parsing failed, continue to HTML extraction
  }
  
  // SECOND: If URL string extraction failed, fetch HTML and extract from JavaScript
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const redirectResponse = await fetch(redirectUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const redirectHtml = await redirectResponse.text();
    const $redirect = cheerio.load(redirectHtml);
    
    let finalUrl = null;
    
    // Extract from JavaScript url: pattern (most common)
    const urlMatch = redirectHtml.match(/url:\s*['"](https?:\/\/[^'"]+)['"]/);
    if (urlMatch && urlMatch[1] && !urlMatch[1].includes('newsnow.com')) {
      finalUrl = urlMatch[1];
    }
    
    // Look for direct link
    if (!finalUrl) {
      const directLink = $redirect('a[rel="nofollow"][href^="http"]').first().attr('href');
      if (directLink && !directLink.includes('newsnow.com') && !directLink.includes('c.newsnow.com')) {
        finalUrl = directLink;
      }
    }
    
    // Look for any non-newsnow link
    if (!finalUrl) {
      $redirect('a[href^="http"]').each((i, elem) => {
        const href = $redirect(elem).attr('href');
        if (href && !href.includes('newsnow.com') && !href.includes('c.newsnow.com') && !finalUrl) {
          finalUrl = href;
        }
      });
    }
    
    // Check window.location in scripts
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
    
    if (finalUrl && !finalUrl.includes('newsnow.com') && !finalUrl.includes('c.newsnow.com')) {
      return finalUrl;
    }
  } catch (error) {
    console.error(`[Firestore] Error extracting URL from ${redirectUrl}:`, error.message);
  }
  
  // If all methods fail, return the original URL (better than nothing)
  // But log a warning
  console.error(`[Firestore] WARNING: Could not extract final URL from ${redirectUrl}, returning as-is`);
  return redirectUrl;
}

// Get cached feed items from Firestore
export async function getCachedFeed(feedId) {
  const firestore = initializeFirestore();
  if (!firestore) {
    return null; // Firestore not available, fall back to normal processing
  }
  
  try {
    const feedRef = firestore.collection('feed_items')
      .where('feed_id', '==', feedId)
      .orderBy('pubDate', 'desc')
      .limit(80);
    
    const snapshot = await feedRef.get();
    
    if (snapshot.empty) {
      return null; // No cached data
    }
    
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      items.push({
        title: data.title || '',
        link: data.link || '', // Already has final URL (no redirect)
        description: data.description || '',
        date: data.pubDate ? data.pubDate.toDate() : new Date(),
        image: data.image || '',
        guid: data.guid || ''
      });
    });
    
    console.log(`[Firestore] Retrieved ${items.length} cached items for ${feedId}`);
    return items;
  } catch (error) {
    console.error(`[Firestore] Error getting cached feed ${feedId}:`, error.message);
    return null; // On error, fall back to normal processing
  }
}

// Store feed items in Firestore
export async function cacheFeedItems(feedId, items) {
  console.log(`[Firestore] cacheFeedItems called for ${feedId} with ${items.length} items`);
  const firestore = initializeFirestore();
  if (!firestore) {
    console.error(`[Firestore] CRITICAL: Firestore not available for ${feedId}. Cannot cache items.`);
    console.error(`[Firestore] Check Cloud Run service account has Firestore permissions.`);
    return false; // Firestore not available
  }
  console.log(`[Firestore] Firestore available, proceeding to cache ${items.length} items for ${feedId}`);
  
  try {
    const batch = firestore.batch();
    const now = admin.firestore.Timestamp.now();
    
    // Process items and extract final URLs (follow NewsNow redirects)
    // SIMPLE: Extract URL from NewsNow redirect - it's in the URL string itself
    const processedItems = [];
    for (const item of items) {
      try {
        const finalUrl = await extractFinalUrl(item.link);
        
        // Double-check: NEVER store NewsNow redirect URLs
        if (finalUrl && (finalUrl.includes('newsnow.com') || finalUrl.includes('c.newsnow.com'))) {
          console.error(`[Firestore] Extracted URL still contains newsnow.com for ${item.link}, skipping item`);
          continue; // Skip this item
        }
        
        // Add item with final URL
        processedItems.push({
          ...item,
          link: finalUrl // Store final URL (bypass redirect)
        });
      } catch (error) {
        console.error(`[Firestore] Error processing item ${item.link}:`, error.message);
        // Skip this item on error
        continue;
      }
    }
    
    // If no items were successfully processed, log error but don't throw
    if (processedItems.length === 0) {
      console.error(`[Firestore] WARNING: No items were successfully processed for ${feedId}. All URL extractions failed.`);
      return false; // Don't write empty batch
    }
    
    // Delete old items for this feed (keep only latest 80)
    // Get all existing items, sort by pubDate, keep only newest 80
    const existingItemsRef = firestore.collection('feed_items')
      .where('feed_id', '==', feedId)
      .orderBy('pubDate', 'desc');
    
    const existingSnapshot = await existingItemsRef.get();
    const allExistingItems = [];
    existingSnapshot.forEach(doc => {
      allExistingItems.push({ id: doc.id, data: doc.data() });
    });
    
    // Combine new items with existing, sort by pubDate (newest first), keep top 80
    const combinedItems = [...allExistingItems.map(item => ({ ...item.data, _docId: item.id })), ...processedItems];
    
    // Remove duplicates by guid
    const uniqueItemsMap = new Map();
    combinedItems.forEach(item => {
      const guid = item.guid || item.link || `${feedId}-${item.title}`;
      if (!uniqueItemsMap.has(guid)) {
        uniqueItemsMap.set(guid, item);
      } else {
        // Keep the newer one
        const existing = uniqueItemsMap.get(guid);
        let existingDate = new Date(0);
        if (existing.pubDate) {
          existingDate = existing.pubDate.toDate ? existing.pubDate.toDate() : (existing.pubDate instanceof Date ? existing.pubDate : new Date(existing.pubDate));
        } else if (existing.date) {
          existingDate = existing.date instanceof Date ? existing.date : new Date(existing.date);
        }
        
        let newDate = new Date(0);
        if (item.pubDate) {
          newDate = item.pubDate.toDate ? item.pubDate.toDate() : (item.pubDate instanceof Date ? item.pubDate : new Date(item.pubDate));
        } else if (item.date) {
          newDate = item.date instanceof Date ? item.date : new Date(item.date);
        }
        
        if (newDate.getTime() > existingDate.getTime()) {
          uniqueItemsMap.set(guid, item);
        }
      }
    });
    
    // Sort by pubDate (newest first) and keep top 80
    const sortedItems = Array.from(uniqueItemsMap.values()).sort((a, b) => {
      // Handle Firestore Timestamp or Date objects
      let dateA = new Date(0);
      if (a.pubDate) {
        dateA = a.pubDate.toDate ? a.pubDate.toDate() : (a.pubDate instanceof Date ? a.pubDate : new Date(a.pubDate));
      } else if (a.date) {
        dateA = a.date instanceof Date ? a.date : new Date(a.date);
      }
      
      let dateB = new Date(0);
      if (b.pubDate) {
        dateB = b.pubDate.toDate ? b.pubDate.toDate() : (b.pubDate instanceof Date ? b.pubDate : new Date(b.pubDate));
      } else if (b.date) {
        dateB = b.date instanceof Date ? b.date : new Date(b.date);
      }
      
      return dateB.getTime() - dateA.getTime();
    });
    
    const itemsToKeep = sortedItems.slice(0, 80);
    const itemsToDelete = sortedItems.slice(80);
    
    // Delete items beyond the 80 limit
    itemsToDelete.forEach(item => {
      if (item._docId) {
        batch.delete(firestore.collection('feed_items').doc(item._docId));
      }
    });
    
    // Add/update items (only the ones we're keeping)
    itemsToKeep.forEach(item => {
      const guid = item.guid || item.link || `${feedId}-${item.title}`;
      const docRef = firestore.collection('feed_items').doc(`${feedId}-${guid}`);
      
      // Convert date to Firestore Timestamp
      const pubDate = item.date instanceof Date 
        ? admin.firestore.Timestamp.fromDate(item.date)
        : (item.pubDate?.toDate ? admin.firestore.Timestamp.fromDate(item.pubDate.toDate()) : admin.firestore.Timestamp.now());
      
      batch.set(docRef, {
        feed_id: feedId,
        guid: guid,
        title: item.title || '',
        description: item.description || '',
        link: item.link || '', // Final URL (no redirect)
        image: item.image || '',
        pubDate: pubDate,
        cached_at: now
      }, { merge: true });
    });
    
    console.log(`[Firestore] Committing batch for ${feedId}: adding ${processedItems.length} new items, keeping ${itemsToKeep.length} total (max 80)`);
    await batch.commit();
    console.log(`[Firestore] ✓ Successfully cached ${processedItems.length} new items for ${feedId}. Total items in collection: ${itemsToKeep.length}`);
    return true;
  } catch (error) {
    console.error(`[Firestore] ✗ CRITICAL ERROR caching feed ${feedId}:`, error.message);
    console.error(`[Firestore] Error stack:`, error.stack);
    console.error(`[Firestore] This feed will not be cached. Check Firestore permissions and quota.`);
    return false;
  }
}

// Check if feed needs refresh (based on cached_at timestamp)
export async function shouldRefreshFeed(feedId, maxAgeMinutes = 30) {
  const firestore = initializeFirestore();
  if (!firestore) {
    return true; // If Firestore not available, always refresh
  }
  
  try {
    const feedRef = firestore.collection('feed_items')
      .where('feed_id', '==', feedId)
      .orderBy('cached_at', 'desc')
      .limit(1);
    
    const snapshot = await feedRef.get();
    
    if (snapshot.empty) {
      return true; // No cache, needs refresh
    }
    
    const latestItem = snapshot.docs[0].data();
    const cachedAt = latestItem.cached_at.toDate();
    const ageMinutes = (Date.now() - cachedAt.getTime()) / (1000 * 60);
    
    return ageMinutes > maxAgeMinutes;
  } catch (error) {
    console.error(`[Firestore] Error checking refresh for ${feedId}:`, error.message);
    return true; // On error, refresh
  }
}


