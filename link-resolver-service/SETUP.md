# Setup Instructions

## Installation

```bash
npm install
```

## JavaScript Redirects (Optional)

The service supports JavaScript redirects via Puppeteer, but it's optional. If Puppeteer fails to install, the service will still work but will only handle HTTP redirects.

### Enable JavaScript Redirects

JavaScript redirects are enabled by default. To disable, set:
```
ENABLE_JS_REDIRECTS=false
```

### Puppeteer Installation Issues

If Puppeteer installation fails:
1. The service will automatically disable JS redirects and continue working
2. Only HTTP redirects will be followed
3. For JavaScript-based redirects (like SportSpyder), consider:
   - Installing Chrome/Chromium separately
   - Using `puppeteer-core` instead
   - Or disabling JS redirects and using HTTP redirects only

## Running Locally

```bash
npm start
```

Service will start on port 3001 (or PORT environment variable).

## Testing

```bash
curl -X POST http://localhost:3001/resolve \
  -H "Content-Type: application/json" \
  -d '{"url": "https://sportspyder.com/nhl/anaheim-ducks/articles/55065826"}'
```

