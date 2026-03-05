# Quick Start Guide

Get your social media automation running in 15 minutes!

## 1. Get Twitter API Keys (5 min)

1. Go to https://developer.twitter.com/
2. Create app → Get your 4 keys:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)  
   - Access Token
   - Access Token Secret

## 2. Store Secrets (2 min)

```bash
echo -n "YOUR_API_KEY" | gcloud secrets create twitter-client-id --data-file=-
echo -n "YOUR_API_SECRET" | gcloud secrets create twitter-client-secret --data-file=-
echo -n "YOUR_ACCESS_TOKEN" | gcloud secrets create twitter-access-token --data-file=-
echo -n "YOUR_ACCESS_SECRET" | gcloud secrets create twitter-access-secret --data-file=-
```

## 3. Deploy (3 min)

```bash
cd social-poster
chmod +x deploy.sh
./deploy.sh
```

## 4. Schedule Daily Posts (2 min)

The deploy script will show you the command. Or:

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

## 5. Test It! (1 min)

```bash
curl -X POST https://social-poster-YOUR_PROJECT_ID.us-central1.run.app/post-daily \
  -H 'Content-Type: application/json' \
  -d '{"theme":"neon"}'
```

Check your Twitter - you should see a post! 🎉

## That's It!

Your service will now post daily at 6 AM ET with today's featured games.

## Need Help?

- Check logs: `gcloud run services logs read social-poster`
- See full setup: `SETUP_GUIDE.md`
- Test locally: `npm test`

