import { config } from './config.js';

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), config.RATE_LIMIT_WINDOW_MS);
  }

  isAllowed(ip) {
    const now = Date.now();
    const ipRequests = this.requests.get(ip) || [];

    // Remove requests outside the time window
    const recentRequests = ipRequests.filter(timestamp => now - timestamp < config.RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= config.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(ts => now - ts < config.RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recent);
      }
    }
  }

  getRemainingRequests(ip) {
    const now = Date.now();
    const ipRequests = this.requests.get(ip) || [];
    const recentRequests = ipRequests.filter(timestamp => now - timestamp < config.RATE_LIMIT_WINDOW_MS);
    return Math.max(0, config.RATE_LIMIT_MAX_REQUESTS - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

