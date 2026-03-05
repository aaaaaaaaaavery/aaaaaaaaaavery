# Feed Status Report - From RSS_APP_BACKUP_FEEDS.md

Generated: December 6, 2025

## Summary

- **✅ Working Feeds**: 14 feeds
- **❌ Failing Feeds**: 19 feeds
- **Success Rate**: 42% (14/33)

---

## ✅ WORKING FEEDS

These feeds are successfully generating RSS with articles:

| Custom Service Feed ID | Source Name | Source URL | Items | Status |
|------------------------|-------------|------------|-------|--------|
| `nfl-com` | NFL.com News | https://www.nfl.com/news | 8 items | ✅ **WORKING** |
| `nba-com-news` | NBA.com News | https://www.nba.com/news | 26 items | ✅ **WORKING** |
| `nhl-com-news` | NHL.com News | https://www.nhl.com/news | 41 items | ✅ **WORKING** |
| `hockeywriters` | The Hockey Writers | https://thehockeywriters.com/hockey-headlines/ | 49 items | ✅ **WORKING** |
| `hockeynews` | The Hockey News | https://thehockeynews.com/rss/THNHOME/full | 50 items | ✅ **WORKING** |
| `onefootball-home` | OneFootball | https://onefootball.com/en/home | 29 items | ✅ **WORKING** |
| `worldsoccertalk` | World Soccer Talk | https://worldsoccertalk.com/news/ | 15 items | ✅ **WORKING** |
| `bundesliga-com` | Bundesliga.com | https://www.bundesliga.com/en/bundesliga/news | 12 items | ✅ **WORKING** |
| `sportingnews-cfb` | Sporting News College Football | https://www.sportingnews.com/us/ncaa-football/news | 21 items | ✅ **WORKING** |
| `saturdaydownsouth` | Saturday Down South | https://www.saturdaydownsouth.com/ | 15 items | ✅ **WORKING** |
| `on3-cfb` | On3 College Football | https://www.on3.com/category/football/news/ | 30 items | ✅ **WORKING** |
| `golfmonthly` | Golf Monthly | https://www.golfmonthly.com/news | 24 items | ✅ **WORKING** |
| `boxingnews24` | Boxing News 24 | https://www.boxingnews24.com/ | 11 items | ✅ **WORKING** |
| `badlefthook` | Bad Left Hook | https://www.badlefthook.com/ | 40 items | ✅ **WORKING** |

---

## ❌ FAILING FEEDS

These feeds are returning "No articles found" after trying Cheerio, Puppeteer, and Playwright:

| Custom Service Feed ID | Source Name | Source URL | Status |
|------------------------|-------------|------------|--------|
| `247sports-cfb` | 247Sports College Football | https://247sports.com/news/?sport=football | ❌ **FAILED** - No articles found |
| `collegefootballnews` | College Football News | https://collegefootballnews.com/ | ❌ **FAILED** - No articles found |
| `si-cfb` | Sports Illustrated College Football | https://www.si.com/college/college-football | ❌ **FAILED** - No articles found |
| `golfdigest` | Golf Digest | https://www.golfdigest.com/golf-news | ❌ **FAILED** - No articles found |
| `pgatour-com` | PGA Tour.com | https://www.pgatour.com/news | ❌ **FAILED** - No articles found |
| `golfwrx` | GolfWRX | https://www.golfwrx.com/ | ❌ **FAILED** - No articles found |
| `si-golf` | Sports Illustrated Golf | https://www.si.com/golf/ | ❌ **FAILED** - No articles found |
| `si-ufc` | Sports Illustrated UFC | https://www.si.com/fannation/mma/ufc | ❌ **FAILED** - No articles found |
| `mmajunkie` | MMA Junkie | https://mmajunkie.usatoday.com/ | ❌ **FAILED** - No articles found |
| `mmamania` | MMA Mania | https://www.mmamania.com/ | ❌ **FAILED** - No articles found |
| `sherdog` | Sherdog | https://www.sherdog.com/ | ❌ **FAILED** - No articles found |
| `mma-core` | MMA Core | https://mma-core.com/ | ❌ **FAILED** - No articles found |
| `ufc-com` | UFC.com | https://www.ufc.com/trending/all | ❌ **FAILED** - No articles found |
| `tapology` | Tapology | https://www.tapology.com/news | ❌ **FAILED** - No articles found |
| `mmafighting` | MMA Fighting | https://www.mmafighting.com/ | ❌ **FAILED** - No articles found |
| `ringmagazine-rss` | Ring Magazine | https://ringmagazine.com/en/news | ❌ **FAILED** - No articles found |
| `boxingscene` | Boxing Scene | https://www.boxingscene.com/articles | ❌ **FAILED** - No articles found |
| `boxing247` | Boxing 247 | https://www.boxing247.com/ | ❌ **FAILED** - No articles found |
| `transfermarkt-rss` | Transfermarkt RSS | https://www.transfermarkt.co.uk/news | ❌ **FAILED** - No articles found |

---

## Analysis by Category

### ✅ Working Categories
- **NFL/NBA/NHL**: All major league sites working (3/3)
- **Hockey**: Both The Hockey Writers and The Hockey News working (2/2)
- **Soccer**: OneFootball, World Soccer Talk, Bundesliga.com working (3/3)
- **College Football**: Sporting News, Saturday Down South, On3 working (3/6)
- **Golf**: Golf Monthly working (1/4)
- **Boxing**: Boxing News 24 and Bad Left Hook working (2/5)

### ❌ Failing Categories
- **College Football**: 247Sports, College Football News, SI CFB failing (3/6)
- **Golf**: Golf Digest, PGA Tour, GolfWRX, SI Golf failing (4/4)
- **MMA**: All 8 MMA feeds failing (8/8)
- **Boxing**: Boxing Scene, Boxing 247, Ring Magazine failing (3/5)
- **Transfermarkt**: Failing (1/1)

---

## Recommendations

1. **Continue using RSS.app backups** for all 19 failing feeds until browser scraping issues are resolved
2. **Investigate connection errors** - Many sites appear to be blocking automated browsers
3. **Consider alternative approaches**:
   - Use proxies or VPN services for blocked sites
   - Implement different user agents per site
   - Use API access where available (e.g., Reddit API for Reddit feeds)
4. **The Athletic feeds** (`nytimes-athletic-nhl`, `nytimes-athletic-cfb`) cannot be scraped due to React app complexity - must remain on RSS.app

---

## Notes

- All failing feeds are configured with `useBrowserFallback: true` (Cheerio → Puppeteer → Playwright)
- The single working browser-scraping feed (`badlefthook`) proves the infrastructure works when sites don't block it
- Connection errors (`socket hang up`, `ECONNRESET`) are occurring with both Puppeteer and Playwright
- Many sites appear to be blocking automated browsers despite stealth measures

