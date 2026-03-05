# THPORTH Social Media Poster

Automated daily posting of featured games to Twitter/X and Instagram.

## Features

- ✅ Fetches today's featured games from Firestore
- ✅ Generates bold, neon-styled images
- ✅ Posts to Twitter/X automatically
- ✅ Posts to Instagram (requires setup)
- ✅ Multiple design themes (neon, cyberpunk, electric, classic)
- ✅ Scheduled daily at 6 AM ET

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Social Media APIs

#### Twitter/X API Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Get your API keys:
   - Consumer Key (API Key)
   - Consumer Secret (API Secret)
   - Access Token
   - Access Token Secret

#### Instagram API Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Get your access token

### 3. Set Environment Variables

Create secrets in Google Cloud Secret Manager:

```bash
# Twitter
echo -n "YOUR_TWITTER_CLIENT_ID" | gcloud secrets create twitter-client-id --data-file=-
echo -n "YOUR_TWITTER_CLIENT_SECRET" | gcloud secrets create twitter-client-secret --data-file=-
echo -n "YOUR_TWITTER_ACCESS_TOKEN" | gcloud secrets create twitter-access-token --data-file=-
echo -n "YOUR_TWITTER_ACCESS_SECRET" | gcloud secrets create twitter-access-secret --data-file=-

# Instagram
echo -n "YOUR_INSTAGRAM_ACCESS_TOKEN" | gcloud secrets create instagram-access-token --data-file=-
```

### 4. Deploy to Cloud Run

```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Set Up Cloud Scheduler

The deploy script will output the command to create the scheduler job. Or run manually:

```bash
gcloud scheduler jobs create http post-daily-social \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://social-poster-YOUR_PROJECT_ID.us-central1.run.app/post-daily" \
  --http-method=POST \
  --location=us-central1 \
  --headers='Content-Type=application/json' \
  --message-body='{"theme":"neon"}'
```

## Design Themes

Available themes:
- `neon` - Green/pink neon glow (default)
- `cyberpunk` - Pink/green cyberpunk style
- `electric` - Blue/red electric theme
- `classic` - Clean black/white

Change theme in the scheduler job's message body.

## Manual Testing

```bash
curl -X POST https://social-poster-YOUR_PROJECT_ID.us-central1.run.app/post-daily \
  -H 'Content-Type: application/json' \
  -d '{"theme":"neon"}'
```

## Logo Scraping

To download team logos:

```bash
npm run scrape-logos
```

Logos will be saved to `logos/` directory.

## Project Structure

```
social-poster/
├── index.js              # Main service
├── logo-scraper.js       # Logo downloader
├── package.json
├── Dockerfile
├── deploy.sh
└── README.md
```

