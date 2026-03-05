# NewsNow Feeds → RSS.app Configuration

All NewsNow feeds will use RSS.app URLs instead of scraping.

## Current NewsNow Feeds (need RSS.app URLs):

1. **newsnow-nfl** - NewsNow NFL
2. **newsnow-nba** - NewsNow NBA  
3. **newsnow-nhl** - NewsNow NHL
4. **newsnow-soccer** - NewsNow Soccer
5. **newsnow-championsleague** - NewsNow Champions League
6. **newsnow-premierleague** - NewsNow Premier League
7. **newsnow-mls** - NewsNow MLS
8. **newsnow-laliga** - NewsNow La Liga
9. **newsnow-seriea** - NewsNow Serie A
10. **newsnow-bundesliga** - NewsNow Bundesliga
11. **newsnow-facup** - NewsNow FA Cup
12. **newsnow-ligue1** - NewsNow Ligue 1
13. **newsnow-nwsl** - NewsNow NWSL
14. **newsnow-f1** - NewsNow Formula 1
15. **newsnow-europaleague** - NewsNow Europa League
16. **newsnow-ncaabasketball** - NewsNow NCAA Basketball
17. **newsnow-ncaaw** - NewsNow NCAA Women's Basketball
18. **newsnow-ncaafootball** - NewsNow NCAA Football
19. **newsnow-pgatour** - NewsNow PGA Tour
20. **newsnow-ufc** - NewsNow UFC
21. **newsnow-boxing** - NewsNow Boxing
22. **newsnow-tennis** - NewsNow Tennis
23. **newsnow-nascar** - NewsNow NASCAR
24. **newsnow-wnba** - NewsNow WNBA
25. **newsnow-livgolf** - NewsNow LIV Golf
26. **newsnow-motogp** - NewsNow MotoGP
27. **newsnow-lpga** - NewsNow LPGA
28. **newsnow-indycar** - NewsNow IndyCar
29. **newsnow-trackandfield** - NewsNow Track & Field
30. **newsnow-europaconferenceleague** - NewsNow Europa Conference League
31. **newsnow-ligamx** - NewsNow Liga MX

## How to Get RSS.app URLs:

1. Go to https://rss.app
2. Create a feed for each NewsNow source
3. Copy the RSS.app feed URL (format: `https://rss.app/feeds/[FEED_ID].xml`)
4. Provide the URLs below

## Example RSS.app Feed URL Format:
```
https://rss.app/feeds/yTWZ2e72VcuxPyrv.xml
```

## Template for Your RSS.app URLs:

Once you have the RSS.app URLs, provide them in this format:

```javascript
'newsnow-nfl': {
  url: 'https://rss.app/feeds/YOUR_FEED_ID.xml',
  title: 'NewsNow NFL',
  description: 'NewsNow NFL news',
  isDirectRSS: true
},
```

---

**Note:** Once you provide the RSS.app URLs, I'll update the configuration file to use them instead of scraping.

