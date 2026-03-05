# Services to Delete

## Services Currently in Use (KEEP):
1. **flashlive-scraper** - Main service with `pollESPNLiveData` and `refreshAll` endpoints
2. **rss-feed-service** - RSS feed service (being optimized)
3. **standings-fetcher** - Standings fetcher service

## Services to DELETE (Unused/Old):
1. **channel-lookup** - Old channel lookup service
2. **fetchandstoreevents** - Old event fetcher
3. **fetchtodaygames** - Old game fetcher
4. **fetchtomorrowgames** - Old tomorrow games fetcher
5. **fetchupcominggames** - Old upcoming games fetcher
6. **flashlive-archiver** - Old archiver service
7. **flashlive-poller** - Old poller service
8. **flashlive-scraper-test** - Test service
9. **flashlive-scraper-v2** - Old v2 service
10. **import-from-sheets** - Old import service (functionality moved to flashlive-scraper)
11. **parsefuturegames** - Old parser service
12. **polllivegames** - Old poller service

## Commands to Delete Services:

```bash
# Delete unused Cloud Run services
gcloud run services delete channel-lookup --region=us-central1 --quiet
gcloud run services delete fetchandstoreevents --region=us-central1 --quiet
gcloud run services delete fetchtodaygames --region=us-central1 --quiet
gcloud run services delete fetchtomorrowgames --region=us-central1 --quiet
gcloud run services delete fetchupcominggames --region=us-central1 --quiet
gcloud run services delete flashlive-archiver --region=us-central1 --quiet
gcloud run services delete flashlive-poller --region=us-central1 --quiet
gcloud run services delete flashlive-scraper-test --region=us-central1 --quiet
gcloud run services delete flashlive-scraper-v2 --region=us-central1 --quiet
gcloud run services delete import-from-sheets --region=us-central1 --quiet
gcloud run services delete parsefuturegames --region=us-central1 --quiet
gcloud run services delete polllivegames --region=us-central1 --quiet
```

## Cost Savings:
- Each unused service still has minimum Cloud Run costs (even if not receiving requests)
- Deleting these 12 services should reduce your monthly bill significantly
- Estimated savings: ~$5-8/month

