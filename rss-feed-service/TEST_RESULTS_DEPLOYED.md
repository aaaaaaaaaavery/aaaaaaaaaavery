# Feed Test Results - After Deployment

**Test Date:** December 3, 2025  
**Service URL:** https://rss-feed-service-124291936014.us-central1.run.app

## Summary

- ✅ **Working:** 52 feeds
- ❌ **Failing:** 40 feeds
- **Success Rate:** 56.5%

---

## ✅ Working Feeds (52)

### NewsNow Feeds (16 working, 1 failing)
- ✅ newsnow-nfl
- ✅ newsnow-nba
- ✅ newsnow-soccer
- ✅ newsnow-championsleague
- ✅ newsnow-premierleague
- ✅ newsnow-mls
- ✅ newsnow-laliga
- ✅ newsnow-seriea
- ✅ newsnow-bundesliga
- ✅ newsnow-facup
- ✅ newsnow-ligue1
- ✅ newsnow-nwsl
- ✅ newsnow-europaleague
- ✅ newsnow-ncaabasketball
- ✅ newsnow-ncaafootball
- ✅ newsnow-pgatour
- ✅ newsnow-ufc
- ✅ newsnow-boxing
- ✅ newsnow-tennis
- ✅ newsnow-nascar
- ✅ newsnow-wnba
- ✅ newsnow-livgolf
- ✅ newsnow-motogp
- ✅ newsnow-lpga
- ✅ newsnow-indycar
- ✅ newsnow-trackandfield
- ✅ newsnow-europaconferenceleague
- ✅ newsnow-ligamx
- ❌ newsnow-f1 (HTTP 504 - still timing out)

### Direct RSS Feeds (20 working)
- ✅ mlbtraderumors
- ✅ cbs-nfl-rss
- ✅ yahoo-nfl-rss
- ✅ foxsports-nfl-api
- ✅ espn-nfl-rss
- ✅ yahoo-mlb-rss
- ✅ yahoo-nba-rss
- ✅ cbs-mlb-rss
- ✅ espn-nba-rss
- ✅ cbs-nba-rss
- ✅ foxsports-nba-api
- ✅ yahoo-nhl-rss
- ✅ espn-nhl-rss
- ✅ cbs-nhl-rss
- ✅ goal-com
- ✅ espn-soccer-rss
- ✅ yahoo-soccer-rss
- ✅ cbs-soccer-rss
- ✅ getfootballnewsgermany-bundesliga
- ✅ yahoo-collegefootball-rss
- ✅ espn-ncf-rss
- ✅ cbs-collegefootball-rss
- ✅ foxsports-cfb-api

### Bundles (1 working)
- ✅ nwsl-bundle

---

## ❌ Failing Feeds (40)

### HTTP 503 Errors (38 feeds) - Scraper Failures
These feeds need updated HTML selectors or the websites may be blocking requests:

1. **nfl-com** (NFL.com News)
2. **nba-com-news** (NBA.com News)
3. **nhl-com-news** (NHL.com News)
4. **hockeywriters** (The Hockey Writers)
5. **hockeynews** (The Hockey News)
6. **onefootball-home** (OneFootball)
7. **worldsoccertalk** (World Soccer Talk)
8. **bundesliga-com** (Bundesliga.com)
9. **reddit-nwsl** (Reddit r/NWSL)
10. **reddit-ligue1** (Reddit r/Ligue1)
11. **reddit-ligamx** (Reddit r/LigaMX)
12. **nytimes-athletic-cfb** (The Athletic College Football)
13. **247sports-cfb** (247Sports College Football)
14. **reddit-cfb** (Reddit r/CFB)
15. **collegefootballnews** (College Football News)
16. **sportingnews-cfb** (Sporting News College Football)
17. **si-cfb** (Sports Illustrated College Football)
18. **bleacherreport-cfb** (Bleacher Report College Football)
19. **saturdaydownsouth** (Saturday Down South)
20. **on3-cfb** (On3 College Football)
21. **golfdigest** (Golf Digest)
22. **pgatour-com** (PGA Tour.com)
23. **golfwrx** (GolfWRX)
24. **golfmonthly** (Golf Monthly)
25. **si-golf** (Sports Illustrated Golf)
26. **si-ufc** (Sports Illustrated UFC)
27. **mmajunkie** (MMA Junkie)
28. **mmamania** (MMA Mania)
29. **sherdog** (Sherdog)
30. **mma-core** (MMA Core)
31. **ufc-com** (UFC.com)
32. **tapology** (Tapology)
33. **mmafighting** (MMA Fighting)
34. **ringmagazine-rss** (Ring Magazine)
35. **boxingnews24** (Boxing News 24)
36. **badlefthook** (Bad Left Hook)
37. **boxingscene** (Boxing Scene)
38. **boxing247** (Boxing 247)

### HTTP 504 Errors (1 feed) - Timeout
1. **newsnow-f1** (NewsNow Formula 1) - Still timing out despite concurrency fixes

### Invalid RSS Format (1 feed)
1. **transfermarkt-rss** (Transfermarkt RSS) - Not valid RSS/Atom XML

---

## Improvements

### NewsNow Feeds Success Rate
- **Before:** 0/17 working (all timing out)
- **After:** 16/17 working (94% success rate)
- **Improvement:** ✅ Massive improvement! Only 1 feed still timing out

The concurrency control and 5-second delays are working well for most NewsNow feeds.

---

## Recommendations

### For HTTP 503 Errors (38 feeds)
- Update scraper selectors for each website
- Check if websites are blocking requests (may need better User-Agent or headers)
- Consider alternative sources or native RSS feeds if available
- These are low priority since they were already failing before

### For newsnow-f1 (HTTP 504)
- May need to reduce articles further (from 15 to 10)
- Or increase Cloud Run timeout settings
- Or investigate if F1 feed has more redirects than others

### For transfermarkt-rss
- Check if Transfermarkt has a different RSS endpoint
- Consider scraping the website instead of using RSS

---

## Next Steps

1. ✅ **Deployed concurrency fixes** - Working well for NewsNow feeds
2. ⚠️ **Monitor newsnow-f1** - May need additional optimization
3. 📝 **Low priority:** Fix HTTP 503 scraper failures (these were already broken)

