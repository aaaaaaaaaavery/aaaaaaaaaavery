export const config = {
  PORT: process.env.PORT || 3001,
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_REDIRECTS: 10,
  TIMEOUT_MS: 10000, // 10 seconds
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100 // per IP per window
};

