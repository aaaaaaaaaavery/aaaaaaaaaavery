// ⚠️ SERVICE DISABLED - This service is not currently in use
// The link-resolver-service has been disabled and will not start

console.log('[Link Resolver Service] Service is disabled and will not start');
process.exit(0);

/*
import express from 'express';
import { config } from './config.js';
import { resolveUrl } from './resolver.js';
import { urlCache } from './cache.js';
import { rateLimiter } from './rateLimiter.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'link-resolver-service',
    cacheSize: urlCache.size(),
    timestamp: new Date().toISOString()
  });
});

// Rate limiting middleware
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!rateLimiter.isAllowed(ip)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      originalUrl: req.body?.url || null,
      resolvedUrl: req.body?.url || null,
      redirected: false,
      status: 'rate_limited',
      retryAfter: 60
    });
  }
  
  res.setHeader('X-RateLimit-Remaining', rateLimiter.getRemainingRequests(ip));
  next();
}

// Main resolve endpoint
app.post('/resolve', rateLimitMiddleware, async (req, res) => {
  try {
    const { url } = req.body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: url is required and must be a string',
        originalUrl: url || null,
        resolvedUrl: url || null,
        redirected: false,
        status: 'error'
      });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid URL format',
        originalUrl: url,
        resolvedUrl: url,
        redirected: false,
        status: 'error'
      });
    }

    // Only allow http/https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({
        error: 'Only http and https URLs are allowed',
        originalUrl: url,
        resolvedUrl: url,
        redirected: false,
        status: 'error'
      });
    }

    // Check cache first
    const cachedResult = urlCache.get(url);
    if (cachedResult) {
      return res.json({
        originalUrl: url,
        resolvedUrl: cachedResult,
        redirected: cachedResult !== url,
        status: 'ok',
        cached: true
      });
    }

    // Resolve URL
    const result = await resolveUrl(url);

    // Cache successful resolutions
    if (result.status === 'ok' && result.resolvedUrl) {
      urlCache.set(url, result.resolvedUrl);
    }

    // Return result
    res.json({
      ...result,
      cached: false
    });

  } catch (error) {
    console.error('[Server] Unexpected error:', error);
    const originalUrl = req.body?.url || null;
    res.status(500).json({
      originalUrl,
      resolvedUrl: originalUrl,
      redirected: false,
      status: 'fallback',
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Error middleware:', err);
  const originalUrl = req.body?.url || null;
  res.status(500).json({
    originalUrl,
    resolvedUrl: originalUrl,
    redirected: false,
    status: 'fallback',
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
const server = app.listen(config.PORT, () => {
  console.log(`[Link Resolver Service] Listening on port ${config.PORT}`);
  console.log(`[Link Resolver Service] Health check: http://localhost:${config.PORT}/health`);
  console.log(`[Link Resolver Service] Resolve endpoint: POST http://localhost:${config.PORT}/resolve`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Link Resolver Service] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Link Resolver Service] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Link Resolver Service] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[Link Resolver Service] Server closed');
    process.exit(0);
  });
});
*/
