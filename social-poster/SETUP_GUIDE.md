# Social Media Poster Setup Guide

Complete step-by-step guide to set up automated social media posting.

## Prerequisites

- Google Cloud Project with billing enabled
- Firebase project (`flashlive-daily-scraper`)
- Twitter/X Developer Account
- Instagram Business Account (for Instagram posting)

## Step 1: Twitter/X API Setup

### 1.1 Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Apply for a developer account (usually instant approval for basic access)

### 1.2 Create a New App

1. Go to [Twitter Developer Portal Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or "Create App"
3. Fill in:
   - App name: `THPORTH Social Poster`
   - Use case: Select "Making a bot" or "Exploring the API"
   - App environment: Production
4. Accept terms and create

### 1.3 Get API Keys

1. In your app settings, go to "Keys and tokens"
2. Generate/regenerate:
   - **API Key** (Consumer Key)
   - **API Key Secret** (Consumer Secret)
   - **Access Token**
   - **Access Token Secret**
3. **Save these immediately** - you won't see them again!

### 1.4 Set App Permissions

1. Go to "App permissions"
2. Set to: **Read and Write** (needed to post tweets)
3. Save changes

## Step 2: Instagram API Setup

⚠️ **Note**: Instagram posting requires more setup. For now, Twitter is the primary platform.

### 2.1 Facebook Business Account

1. Go to [Facebook Business](https://business.facebook.com/)
2. Create a Business Account (if you don't have one)
3. Link your Instagram account to the Business Account

### 2.2 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Add "Instagram Basic Display" product

### 2.3 Get Access Token

1. Follow Instagram Basic Display API setup
2. Get your access token
3. Note: This requires OAuth flow and user consent

**Alternative**: Start with Twitter only, add Instagram later.

## Step 3: Store Secrets in Google Cloud

### 3.1 Create Secret Manager Secrets

```bash
# Twitter secrets
echo -n "YOUR_TWITTER_CLIENT_ID" | gcloud secrets create twitter-client-id --data-file=-
echo -n "YOUR_TWITTER_CLIENT_SECRET" | gcloud secrets create twitter-client-secret --data-file=-
echo -n "YOUR_TWITTER_ACCESS_TOKEN" | gcloud secrets create twitter-access-token --data-file=-
echo -n "YOUR_TWITTER_ACCESS_SECRET" | gcloud secrets create twitter-access-secret --data-file=-

# Instagram (optional for now)
echo -n "YOUR_INSTAGRAM_ACCESS_TOKEN" | gcloud secrets create instagram-access-token --data-file=-
```

### 3.2 Grant Cloud Run Access

```bash
PROJECT_ID="flashlive-daily-scraper"
SERVICE_ACCOUNT="social-poster@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant access to secrets
gcloud secrets add-iam-policy-binding twitter-client-id \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding twitter-client-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding twitter-access-token \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding twitter-access-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 4: Deploy the Service

### 4.1 Install Dependencies Locally (for testing)

```bash
cd social-poster
npm install
```

### 4.2 Deploy to Cloud Run

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
- Build the Docker image
- Deploy to Cloud Run
- Set up environment variables
- Configure secrets

## Step 5: Set Up Cloud Scheduler

The deploy script will output the scheduler command. Or run manually:

```bash
gcloud scheduler jobs create http post-daily-social \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://social-poster-124291936014.us-central1.run.app/post-daily" \
  --http-method=POST \
  --location=us-central1 \
  --headers='Content-Type=application/json' \
  --message-body='{"theme":"neon"}' \
  --oidc-service-account-email="social-poster@flashlive-daily-scraper.iam.gserviceaccount.com"
```

## Step 6: Test the Service

### 6.1 Manual Test

```bash
curl -X POST https://social-poster-YOUR_PROJECT_ID.us-central1.run.app/post-daily \
  -H 'Content-Type: application/json' \
  -d '{"theme":"neon"}'
```

### 6.2 Check Logs

```bash
gcloud run services logs read social-poster --limit=50
```

## Step 7: Download Team Logos (Optional)

```bash
cd social-poster
npm run scrape-logos
```

Logos will be saved to `logos/` directory. You can also manually download logos and organize them.

## Troubleshooting

### Twitter API Errors

- **401 Unauthorized**: Check your API keys and tokens
- **403 Forbidden**: Verify app permissions are set to "Read and Write"
- **429 Rate Limit**: You're posting too frequently (unlikely for daily posts)

### No Games Found

- Check that featured games exist in Firestore for today's date
- Verify the date format matches (YYYY-MM-DD)
- Check Firebase connection and permissions

### Image Generation Fails

- Ensure canvas dependencies are installed
- Check Cloud Run has enough memory (1Gi recommended)
- Verify fonts are available (Arial is default)

## Design Themes

Change the theme in the scheduler job's message body:

- `neon` - Green/pink neon glow (default)
- `cyberpunk` - Pink/green cyberpunk style  
- `electric` - Blue/red electric theme
- `classic` - Clean black/white

## Next Steps

1. ✅ Test with a manual post
2. ✅ Verify images look good
3. ✅ Set up Cloud Scheduler
4. ✅ Monitor first few automated posts
5. ⏳ Add Instagram support (optional)
6. ⏳ Add team logos to images (optional)

## Support

If you encounter issues:
1. Check Cloud Run logs
2. Verify secrets are correctly set
3. Test API credentials manually
4. Review error messages in logs

