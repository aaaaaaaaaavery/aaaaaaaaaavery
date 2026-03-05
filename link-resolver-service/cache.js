import { config } from './config.js';

class URLCache {
  constructor() {
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000); // Cleanup every hour
  }

  get(url) {
    const entry = this.cache.get(url);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(url);
      return null;
    }
    
    return entry.resolvedUrl;
  }

  set(url, resolvedUrl) {
    this.cache.set(url, {
      resolvedUrl,
      expiresAt: Date.now() + config.CACHE_TTL
    });
  }

  has(url) {
    const entry = this.cache.get(url);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(url);
      return false;
    }
    
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(url);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const urlCache = new URLCache();

