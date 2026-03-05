# Custom RSS Feed Service

A custom RSS feed service to replace RSS.app. This service scrapes news websites and generates RSS feeds.

## Features

- Scrapes multiple sports news sources
- Generates RSS XML feeds
- 15-minute caching for performance
- Easy to add new sources
- Deployable to Cloud Run

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm start
```

3. Access feeds:
- Health check: `http://localhost:8080/health`
- List feeds: `http://localhost:8080/feeds`
- Get feed: `http://localhost:8080/feeds/mlb-com.xml`

## Adding New Sources

Edit `index.js` and add to `NEWS_SOURCES`:

```javascript
'new-source-id': {
  url: 'https://example.com/news',
  title: 'Source Name',
  description: 'Description',
  selector: '.article, article', // CSS selector for articles
  linkSelector: 'a',
  titleSelector: 'h1, h2, h3',
  dateSelector: '.date, time',
  imageSelector: 'img'
}
```

## Deployment to Cloud Run

1. Build and deploy:
```bash
gcloud run deploy rss-feed-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

2. Update your frontend to use the new service URL instead of `rss.app`.

## Migration from RSS.app

Replace RSS.app URLs in your HTML:
- Old: `https://rss.app/feeds/Kcftj40UrmoGhLBA.xml`
- New: `https://your-service-url.com/feeds/mlb-com.xml`

