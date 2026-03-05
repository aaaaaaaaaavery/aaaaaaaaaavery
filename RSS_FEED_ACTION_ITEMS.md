# RSS Feed Consolidation - Action Items

## Quick Summary

**Total RSS.app feeds on site**: 120  
**email@thporth.com account**: 95 feeds (5 slots remaining)  
**Backup feeds (failing)**: ~57 feeds  
**Feeds NOT in email@thporth.com**: ~25-30 feeds  

### ⚠️ Important Constraint:
- **Twitter feeds MUST stay in RSS.app** (~40+ feeds) - Cannot move to Twitter API
- **Available slots after moving Reddit/YouTube**: ~16 slots freed (4 Reddit + 12 YouTube)
- **Net RSS.app usage**: ~85-95 feeds (after moving Reddit/YouTube, keeping Twitter)  

---

## 1. ✅ KEEP These Feeds (Already in email@thporth.com)

These feeds are confirmed to be in your email@thporth.com account and should be kept:

### News Sources:
- `0MaiPBu2UKvcQmyT` - SI NBA (https://www.si.com/nba)
- `KoszNpQLJ70ZBJbs` - SI NFL (https://www.si.com/nfl)
- `CgpGWf4RQSblPcSP` - SI Premier League (https://www.si.com/soccer/premier-league)
- `3zS8zHZWlrY4F0TM` - SI Champions League (https://www.si.com/soccer/champions-league)
- `3QnoBYzr3leLRwZf` - SI La Liga (https://www.si.com/soccer/la-liga)
- `Kk2DP7BQ6R63genW` - SI Golf (https://www.si.com/golf/)
- `52JoNIj0uJyAO8Ro` - SI UFC (https://www.si.com/fannation/mma/ufc)
- `TC8CR6Epre8sOBbW` - SI CFB (https://www.si.com/college/college-football)
- `LCbkYBU74yt9AnT5` - B/R NFL (https://bleacherreport.com/nfl)
- `k6Vxs5GaPOehD9B3` - B/R NBA (https://bleacherreport.com/nba)
- `YUKCB1afohjvJMle` - PFT NFL (https://www.nbcsports.com/nfl/profootballtalk)
- `KIxs5SCBkVuAWcRr` - BBC Soccer (https://www.bbc.com/sport/football)
- `B9IZq10WgLEwHyYf` - The Guardian Soccer (https://www.theguardian.com/football)
- `7sTylsAUGavU2YDz` - Sky Sports Soccer (https://www.skysports.com/football)
- `bXOgyqHWCvZHvUmF` - FourFourTwo (https://www.fourfourtwo.com/us)
- `qKDoR3HZOMRmExUP` - Sports Mole (https://www.sportsmole.co.uk/headlines/)
- `qVMKN8SmPBqcCH7z` - Sports Mole Premier League (https://www.sportsmole.co.uk/football/premier-league/)
- `UnTi09biy7NcbQpv` - Sports Mole La Liga (https://www.sportsmole.co.uk/football/la-liga.xml)
- `co5skijSzgAW0vTJ` - Daily Mail Premier League (https://www.dailymail.co.uk/sport/premierleague/index.html)
- `JSvDlnImnrDjDgsk` - talkSPORT Premier League (https://talksport.com/football/premier-league/)
- `4ztlqsjqgVdJj7Gz` - Football Talk Premier League (https://football-talk.co.uk/topics/premier-league/feed/)
- `PBkEtFlIayIUTcNp` - TEAMTalk Premier League (https://www.teamtalk.com/english-premiership)
- `3J967vogi1qGdK1Y` - Sporting News Premier League (https://www.sportingnews.com/us/premier-league)
- `30ZdeDXrftk47uLL` - SPORTbible Premier League (https://www.sportbible.com/premier-league)
- `UM3B0Vem8qh04dDU` - AS Soccer (https://en.as.com/soccer/)
- `XgOB7BUJbxy6FsjC` - MLSSoccer.com (https://www.mlssoccer.com/news/)
- `liWpcUXYMINvUeWS` - FLM MLS (https://fieldlevelmedia.com/soccer/mls/)
- `NeOHPCIlHddJXJCU` - Cult of Calcio Serie A (https://cultofcalcio.com/feed/)
- `zIPPZ5Zh9GDpvIbV` - Bulinews Bundesliga (https://bulinews.com/rss.xml)
- `6DIuDmmR4diUZR4q` - The Athletic NHL (https://www.nytimes.com/athletic/nhl/) ⚠️ **BACKUP**
- `NO1HAlGkT9Ya9p34` - The Athletic Champions League (https://www.nytimes.com/athletic/football/champions-league/)
- `JVcUSNygCvK6E5WZ` - F1.com (https://www.formula1.com/en/latest)
- `1RmEBIvrTB2Vl8wg` - Motorsport F1 (https://www.motorsport.com/f1/)
- `4gKjQaVgX2DJolme` - The Race F1 (https://www.the-race.com)
- `FTRMdb2vszxBak3x` - Autosport F1 (https://www.autosport.com/f1/news/)
- `nkkpJtqSSgCLnGGt` - Planet F1 (https://www.planetf1.com/news)
- `nhdoUlCkVjA4oXEH` - RaceFans F1 (https://www.racefans.net/category/formula-1/)
- `joZlHdOrkZ6ijBM8` - FOX Sports Soccer (API feed)

### Reddit:
- `8qBnW4yImPpMqMDD` - Reddit r/INDYCAR (https://www.reddit.com/r/INDYCAR/new/)
- `vf2zYxzTRTJ0llPk` - Reddit r/CollegeBasketball (https://www.reddit.com/r/CollegeBasketball/new/)

### RSS.app Keyword Feeds:
- `tRKTEhHvoInenyd4` - NCAA Softball (https://rss.app/rss-feed?keyword=NCAA%20Softball&region=US&lang=en)
- `0zeKHWCVNtBCrCro` - UEFA Conference League (https://rss.app/rss-feed?keyword=UEFA%20Conference%20League&region=US&lang=en)

---

## 2. ⚠️ FIX These Backup Feeds (57 feeds failing)

### Option A: Fix Custom Service (Recommended)
Fix the scrapers/timeouts in the custom RSS feed service, then replace RSS.app backup URLs in `index.html`.

### Option B: Recreate in email@thporth.com (If within 100 limit)
Only if fixing custom service is not feasible.

### High Priority Backups (Major Leagues):
1. **NFL.com** (`RzsFiWRkJWt232Z1`) - Custom service: `nfl-com` - ✅ **WORKING** (scraper built and functional)
2. **NBA.com** (`gpNdeo4WRun54WuS`) - Custom service: `nba-com-news` - ✅ **WORKING** (scraper built and functional)
3. **NHL.com** (`tjqR23Xwa5us4EGS`) - Custom service: `nhl-com-news` - ✅ **WORKING** (scraper built and functional)
4. **The Athletic NHL** (`6DIuDmmR4diUZR4q`) - Custom service: `nytimes-athletic-nhl` - HTTP 503 ⚠️ **IN email@thporth.com** - Keep this one

### Medium Priority Backups:
- **The Hockey Writers** (`Zf7Ng96ruXO870Ee`) - ✅ **WORKING** (scraper built and functional)
- **The Hockey News** (`V79dVmqWDC7pLACZ`) - ✅ **WORKING** (using direct RSS feed)
- **OneFootball** (`SBZfeZPSsLT2mwmU`) - ✅ **WORKING** (scraper built and functional)
- **World Soccer Talk** (`f5rbTpdVjq93AlTY`) - ✅ **WORKING** (scraper built and functional)
- **Bundesliga.com** (`fg5UIrrq1YikBxyg`) - ✅ **WORKING** (scraper built and functional)
- **The Athletic CFB** (`ydzB00a4yYWWhOJE`) - HTTP 503
- **247Sports CFB** (`SQahLIzekjAsW3lk`) - HTTP 503
- **College Football News** (`d2PbmQcxqRMOPRvs`) - HTTP 503
- **Sporting News CFB** (`ZX6NqXnTRPsqJl24`) - HTTP 503
- **Saturday Down South** (`LsKtD2ijrBKLHTPy`) - HTTP 503
- **On3 CFB** (`L3knSpnVPuEqu9F3`) - HTTP 503
- **Golf Digest** (`GNRqjlnU2hDoUspd`) - HTTP 503
- **PGA Tour.com** (`PGlnIglwoK57BFgx`) - HTTP 503
- **GolfWRX** (`SBEwIpFRnxpFz5yO`) - HTTP 503
- **Golf Monthly** (`yoYhJTH3khDR6VnA`) - HTTP 503
- **MMA/UFC feeds** (8 feeds) - HTTP 503
- **Boxing feeds** (5 feeds) - HTTP 503
- **Hockey feeds** (2 feeds) - HTTP 503

### NewsNow Timeout Backups (16 feeds):
- **NewsNow F1** (`zRogbCPNliFNNTuM`) - HTTP 504
- **NewsNow UEFA Europa League** (`Y86rdhcYGEJTzVVE`) - HTTP 504
- **NewsNow NCAA Basketball** (`1miuV1gDF41iBCUm`) - HTTP 504
- **NewsNow NCAA Football** (`O8juJbxSctWCFqdV`) - HTTP 504
- **NewsNow PGA Tour** (`R0LMNrxS5mPorbsV`) - HTTP 504
- **NewsNow UFC** (`II7WkAEfi65q8OMI`) - HTTP 504
- **NewsNow Boxing** (`8UNhLRsk0v8buOUz`) - HTTP 504
- **NewsNow Tennis** (`Nh0zQXRLhhvfmuTh`) - HTTP 504
- **NewsNow NASCAR** (`vOF2I7lq3n3IsV8K`) - HTTP 504
- **NewsNow WNBA** (`Eaaaqyki6E6nnMZR`) - HTTP 504
- **NewsNow LIV Golf** (`InHgRAqAOeKlilq8`) - HTTP 504
- **NewsNow MotoGP** (`VkQvfkJZA51pa8EB`) - HTTP 504
- **NewsNow LPGA** (`0afVGov5MVxxBF7B`) - HTTP 504
- **NewsNow IndyCar** (`Zo7JsQDXIT8D0pCD`) - HTTP 504
- **NewsNow Track and Field** (`VqavgJOoX0LKkfkb`) - HTTP 504
- **NewsNow UEFA Conference League** (`0zeKHWCVNtBCrCro`) - HTTP 504 ⚠️ **IN email@thporth.com** - Keep this one

### Reddit Backups (Move to Reddit API - FREE):
- **Reddit r/NWSL** (`HL9rA42ELIkqWXJg`) - HTTP 503 → **Use Reddit API**
- **Reddit r/Ligue1** (`UNtqy55sZPAGDxWp`) - HTTP 503 → **Use Reddit API**
- **Reddit r/LigaMX** (`o3KVLBimGj35TqzR`) - HTTP 503 → **Use Reddit API**
- **Reddit r/CFB** (`tBrt5dpIhevVbeQi`) - HTTP 503 → **Use Reddit API**

### Invalid RSS:
- **Transfermarkt** (`W5qj2Lq2skC4hTyn`) - Not valid RSS → **Scrape website**

---

## 3. 🔄 REPLACE These Feeds (NOT in email@thporth.com)

These feeds are on the site but NOT in your email@thporth.com account. They need to be replaced before you cancel the other RSS.app accounts.

### Feeds to Recreate in email@thporth.com (5 slots available):
**Priority order** (most important first):

1. **MLB Breaking** (`AYtjYuHSzf8VXPWV`) - Find source URL, recreate
2. **OneFootball Premier League** (`OlgI95YoXAeS1Lyb`) - Find source URL, recreate
3. **Google News MLS** (`rAadgaUcXJa3grIV`) - https://news.google.com/search?q=Major%20League%20Soccer&...
4. **Google News La Liga** (`Oj48mcyrNfIxbqp9`) - https://news.google.com/search?q=LaLiga&...
5. **Google News Champions League** (`yB1knLblnebjjIez`) - https://news.google.com/search?q=UEFA%20Champions%20League&...

### Feeds to Move to Custom Service or APIs:

**RSS.app Keyword Feeds** (can recreate in email@thporth.com if needed):
- `tnA7WHOi3hNDP2Wr` - NWSL Headlines (https://rss.app/rss-feed?keyword=NWSL&region=US&lang=en)
- `PE7NGL6ftSREkzv9` - NWSL Breaking (NewsNow) → Fix custom service
- `tbxA99undrBg8j4I` - Ligue 1 Headlines (https://rss.app/rss-feed?keyword=Ligue%201&region=US&lang=en)
- `AdN94t2aMmFNKpiW` - Ligue 1 Breaking (NewsNow) → Fix custom service
- `tw7ijzsLkAnmByMf` - UEFA Europa League Headlines (https://rss.app/rss-feed?keyword=UEFA%20Europa%20League&...)
- `tpoJCJ6SHNu5XMoG` - UEFA Europa Conference League Headlines
- `tOYU1riYpjBIE6yi` - NCAA Women's Basketball (https://rss.app/rss-feed?keyword=NCAA%20Women's%20Basketball&...)
- `t7vZR372K7n5ceeg` - NCAA Baseball (https://rss.app/rss-feed?keyword=NCAA%20Baseball&region=US&lang=en)
- `tqz9SwQPuclR1mSF` - LPGA Tour Headlines (https://rss.app/rss-feed?keyword=LPGA%20Tour&region=US&lang=en)
- `tBzOR3X3d0NpmoAA` - IndyCar Headlines (https://rss.app/rss-feed?keyword=IndyCar&region=US&lang=en)
- `tsB8keuq7AkVMhlt` - PGA Tour Headlines (https://rss.app/rss-feed?topicId=pga-tour)
- `tllqhjMEqKlOTnp9` - Golfweek (https://rss.app/rss-feed?keyword=Golfweek&region=US&lang=en)
- `teYHPC2ZpUGeMBx5` - LIV Golf Headlines (find source URL)
- `tZc6gJ6RpwkMyxaI` - NCAA Men's Basketball Headlines (find source URL)

---

## 4. 🎯 Recommended Priority Order

### Immediate (Before Canceling Other Accounts):
1. ✅ **Keep all email@thporth.com feeds** (already done)
2. 🔄 **Replace feeds NOT in email@thporth.com** (25-30 feeds)
   - Recreate top 5 in email@thporth.com (5 slots available)
   - Move rest to custom service or APIs

### Short-term (Fix High-Value Failures):
1. ✅ **NFL.com scraper is working** - Can remove RSS.app backup (`RzsFiWRkJWt232Z1`)
2. ✅ **NBA.com scraper is working** - Can remove RSS.app backup (`gpNdeo4WRun54WuS`)
3. ✅ **NHL.com scraper is working** - Can remove RSS.app backup (`tjqR23Xwa5us4EGS`)
3. **Fix NewsNow timeouts** (16 feeds) - Already have concurrency control
4. **Move Reddit feeds to Reddit API** (4 feeds) - FREE

### Medium-term (Optimize):
1. **Fix remaining HTTP 503 errors** (38 feeds)
2. **Move YouTube channels to YouTube API** (12 feeds) - FREE
3. **Keep Twitter lists in RSS.app** (40+ feeds) - ⚠️ **REQUIRED** (cannot move to API)

### Long-term (Complete Consolidation):
1. Remove all RSS.app feeds from other accounts
2. Update `index.html` with final feed URLs
3. Test all feeds
4. Document final state

---

## 5. Cost Savings Summary

**Before**:
- 3 RSS.app accounts
- ~120 RSS.app feeds on site

**After**:
- 1 RSS.app account (email@thporth.com)
- ~85-95 RSS.app feeds (Twitter lists MUST stay in RSS.app, ~40+ feeds)
- ~150+ custom service feeds
- ~10-15 Reddit API feeds
- ~20-30 YouTube API feeds
- ~40+ Twitter feeds (staying in RSS.app - REQUIRED)

**Savings**: 2 RSS.app accounts

---

## 6. Next Steps

1. **Review this document** and confirm which feeds are actually in your email@thporth.com account
2. **Identify source URLs** for feeds marked "Unknown" or "find source URL"
3. **Decide on priority** for fixing custom service vs. recreating in RSS.app
4. **Start with immediate items** (replace feeds NOT in email@thporth.com)
5. **Fix high-priority backups** (NFL.com, NBA.com, NHL.com)

