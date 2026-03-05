# Link Resolver Service

⚠️ **DISABLED** - This service is currently disabled and not in use.

Standalone Node.js service to resolve aggregator/wrapper URLs (e.g. SportSpyder, NewsNow) to their final destination URLs by following HTTP redirects.

## Installation

```bash
npm install
```

## Configuration

Edit `config.js` or set environment variables:
- `PORT` - Server port (default: 3001)
- `CACHE_TTL` - Cache TTL in milliseconds (default: 24 hours)
- `MAX_REDIRECTS` - Maximum redirects to follow (default: 10)
- `TIMEOUT_MS` - Request timeout in milliseconds (default: 10000)

## Usage

Start the service:
```bash
npm start
```

## API

### POST /resolve

Resolve a URL to its final destination.

**Request:**
```json
{
  "url": "https://sportspyder.com/news/12345678"
}
```

**Response:**
```json
{
  "originalUrl": "https://sportspyder.com/news/12345678",
  "resolvedUrl": "https://example.com/article",
  "redirected": true,
  "status": "ok",
  "cached": false
}
```

### GET /health

Health check endpoint.

## Deployment

Deploy to Cloud Run, Fly.io, or any Node.js hosting platform.

