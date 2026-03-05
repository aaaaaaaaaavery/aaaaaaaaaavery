// Local SQLite database adapter (replaces Firestore for local development)
// This is FREE and runs entirely on your local machine

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file location
const DB_PATH = join(__dirname, 'feed_items.db');

// Ensure directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize database
let db = null;

function initializeDatabase() {
  if (db) {
    return db;
  }

  try {
    db = new Database(DB_PATH);
    
    // Create feed_items table
    db.exec(`
      CREATE TABLE IF NOT EXISTS feed_items (
        id TEXT PRIMARY KEY,
        feed_id TEXT NOT NULL,
        guid TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        link TEXT NOT NULL,
        image TEXT,
        pubDate INTEGER NOT NULL,
        cached_at INTEGER NOT NULL,
        UNIQUE(feed_id, guid)
      );
      
      CREATE INDEX IF NOT EXISTS idx_feed_id ON feed_items(feed_id);
      CREATE INDEX IF NOT EXISTS idx_pubDate ON feed_items(pubDate DESC);
      CREATE INDEX IF NOT EXISTS idx_cached_at ON feed_items(cached_at DESC);
    `);
    
    console.log('[Local DB] SQLite database initialized successfully');
    return db;
  } catch (error) {
    console.error('[Local DB] CRITICAL: Error initializing database:', error.message);
    console.error('[Local DB] Stack:', error.stack);
    return null;
  }
}

// Get cached feed items from local database
export async function getCachedFeed(feedId) {
  const database = initializeDatabase();
  if (!database) {
    return null;
  }

  try {
    const stmt = database.prepare(`
      SELECT * FROM feed_items 
      WHERE feed_id = ? 
      ORDER BY pubDate DESC 
      LIMIT 80
    `);
    
    const rows = stmt.all(feedId);
    
    if (rows.length === 0) {
      return null;
    }
    
    const items = rows.map(row => ({
      title: row.title || '',
      link: row.link || '',
      description: row.description || '',
      date: new Date(row.pubDate),
      image: row.image || '',
      guid: row.guid || ''
    }));
    
    console.log(`[Local DB] Retrieved ${items.length} cached items for ${feedId}`);
    return items;
  } catch (error) {
    console.error(`[Local DB] Error getting cached feed ${feedId}:`, error.message);
    return null;
  }
}

// Store feed items in local database
export async function cacheFeedItems(feedId, items) {
  console.log(`[Local DB] cacheFeedItems called for ${feedId} with ${items.length} items`);
  const database = initializeDatabase();
  if (!database) {
    console.error(`[Local DB] CRITICAL: Database not available for ${feedId}. Cannot cache items.`);
    return false;
  }
  console.log(`[Local DB] Database available, proceeding to cache ${items.length} items for ${feedId}`);

  try {
    const now = Date.now();
    
    // Process items - accept all URLs (including NewsNow redirects for now)
    const processedItems = [];
    for (const item of items) {
      try {
        // Accept all URLs (including NewsNow redirects - we'll extract ultimate URLs later if needed)
        processedItems.push({
          ...item,
          guid: item.guid || item.link || `${feedId}-${item.title}`
        });
      } catch (error) {
        console.error(`[Local DB] Error processing item ${item.link}:`, error.message);
        continue;
      }
    }
    
    if (processedItems.length === 0) {
      console.error(`[Local DB] WARNING: No items were successfully processed for ${feedId}.`);
      return false;
    }
    
    // Get existing items
    const getExistingStmt = database.prepare(`
      SELECT * FROM feed_items WHERE feed_id = ? ORDER BY pubDate DESC
    `);
    const existingRows = getExistingStmt.all(feedId);
    
    // Combine new items with existing
    const combinedItems = [
      ...existingRows.map(row => ({
        ...row,
        date: new Date(row.pubDate),
        _docId: row.id
      })),
      ...processedItems
    ];
    
    // Remove duplicates by guid, keep newer one
    const uniqueItemsMap = new Map();
    combinedItems.forEach(item => {
      const guid = item.guid || item.link || `${feedId}-${item.title}`;
      if (!uniqueItemsMap.has(guid)) {
        uniqueItemsMap.set(guid, item);
      } else {
        const existing = uniqueItemsMap.get(guid);
        const existingDate = existing.pubDate || existing.date?.getTime() || 0;
        const newDate = item.pubDate || item.date?.getTime() || 0;
        if (newDate > existingDate) {
          uniqueItemsMap.set(guid, item);
        }
      }
    });
    
    // Sort by pubDate (newest first) and keep top 80
    const sortedItems = Array.from(uniqueItemsMap.values()).sort((a, b) => {
      const dateA = a.pubDate || a.date?.getTime() || 0;
      const dateB = b.pubDate || b.date?.getTime() || 0;
      return dateB - dateA;
    });
    
    const itemsToKeep = sortedItems.slice(0, 80);
    const itemsToDelete = sortedItems.slice(80);
    
    // Start transaction
    const transaction = database.transaction(() => {
      // Delete items beyond the 80 limit
      if (itemsToDelete.length > 0) {
        const deleteStmt = database.prepare('DELETE FROM feed_items WHERE id = ?');
        for (const item of itemsToDelete) {
          if (item._docId) {
            deleteStmt.run(item._docId);
          }
        }
      }
      
      // Insert/update items
      const upsertStmt = database.prepare(`
        INSERT OR REPLACE INTO feed_items 
        (id, feed_id, guid, title, description, link, image, pubDate, cached_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of itemsToKeep) {
        const guid = item.guid || item.link || `${feedId}-${item.title}`;
        const docId = `${feedId}-${guid}`;
        const pubDate = item.date instanceof Date ? item.date.getTime() : (item.pubDate || now);
        
        upsertStmt.run(
          docId,
          feedId,
          guid,
          item.title || '',
          item.description || '',
          item.link || '',
          item.image || '',
          pubDate,
          now
        );
      }
    });
    
    transaction();
    
    console.log(`[Local DB] Committing batch for ${feedId}: adding ${processedItems.length} new items, keeping ${itemsToKeep.length} total (max 80)`);
    console.log(`[Local DB] ✓ Successfully cached ${processedItems.length} new items for ${feedId}. Total items in collection: ${itemsToKeep.length}`);
    return true;
  } catch (error) {
    console.error(`[Local DB] ✗ CRITICAL ERROR caching feed ${feedId}:`, error.message);
    console.error(`[Local DB] Error stack:`, error.stack);
    return false;
  }
}

// Check if feed needs refresh (based on cached_at timestamp)
export async function shouldRefreshFeed(feedId, maxAgeMinutes = 30) {
  const database = initializeDatabase();
  if (!database) {
    return true;
  }
  
  try {
    const stmt = database.prepare(`
      SELECT cached_at FROM feed_items 
      WHERE feed_id = ? 
      ORDER BY cached_at DESC 
      LIMIT 1
    `);
    
    const row = stmt.get(feedId);
    
    if (!row) {
      return true; // No cache, needs refresh
    }
    
    const cachedAt = row.cached_at;
    const ageMinutes = (Date.now() - cachedAt) / (1000 * 60);
    
    return ageMinutes > maxAgeMinutes;
  } catch (error) {
    console.error(`[Local DB] Error checking refresh for ${feedId}:`, error.message);
    return true;
  }
}

// Close database connection (call on shutdown)
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[Local DB] Database connection closed');
  }
}

