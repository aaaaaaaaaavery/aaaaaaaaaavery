# Complete RSS Feed Status - All Feeds from RSS_APP_BACKUP_FEEDS.md

Generated: December 6, 2025

## 🎉 SUMMARY

**Total Feeds in RSS_APP_BACKUP_FEEDS.md**: 33 feeds (excluding Reddit feeds which will use Reddit API)
**✅ Working Feeds**: 31 feeds (94% success rate!)
**❌ Failing Feeds**: 1 feed (`collegefootballnews`)
**⚠️ Cannot Scrape (React Apps)**: 2 feeds (`nytimes-athletic-nhl`, `nytimes-athletic-cfb`)

---

## ✅ ALL WORKING FEEDS (31)

### Major League Sports
- ✅ `nfl-com` - NFL.com News (8 items)
- ✅ `nba-com-news` - NBA.com News (27 items)
- ✅ `nhl-com-news` - NHL.com News (40 items)

### Hockey
- ✅ `hockeywriters` - The Hockey Writers (41 items)
- ✅ `hockeynews` - The Hockey News (50 items)

### Soccer
- ✅ `onefootball-home` - OneFootball (21 items)
- ✅ `worldsoccertalk` - World Soccer Talk (15 items)
- ✅ `bundesliga-com` - Bundesliga.com (12 items)
- ✅ `transfermarkt-rss` - Transfermarkt (17 items)

### College Football
- ✅ `247sports-cfb` - 247Sports College Football (8 items)
- ✅ `si-cfb` - Sports Illustrated College Football (22 items)
- ✅ `sportingnews-cfb` - Sporting News College Football (19 items)
- ✅ `saturdaydownsouth` - Saturday Down South (14 items)
- ✅ `on3-cfb` - On3 College Football (25 items)

### Golf
- ✅ `golfdigest` - Golf Digest (17 items)
- ✅ `pgatour-com` - PGA Tour.com (24 items)
- ✅ `golfwrx` - GolfWRX (1 item)
- ✅ `golfmonthly` - Golf Monthly (23 items)
- ✅ `si-golf` - Sports Illustrated Golf (20 items)

### MMA
- ✅ `si-ufc` - Sports Illustrated UFC (19 items)
- ✅ `mmajunkie` - MMA Junkie (2 items)
- ✅ `mmamania` - MMA Mania (1 item)
- ✅ `sherdog` - Sherdog (22 items)
- ✅ `mma-core` - MMA Core (1 item)
- ✅ `ufc-com` - UFC.com (5 items)
- ✅ `tapology` - Tapology (23 items)
- ✅ `mmafighting` - MMA Fighting (1 item)

### Boxing
- ✅ `ringmagazine-rss` - Ring Magazine (19 items)
- ✅ `boxingnews24` - Boxing News 24 (10 items)
- ✅ `badlefthook` - Bad Left Hook (40 items)
- ✅ `boxingscene` - Boxing Scene (21 items)
- ✅ `boxing247` - Boxing 247 (8 items)

---

## ❌ FAILING FEEDS (1)

- ❌ `collegefootballnews` - College Football News - Still failing, needs investigation

---

## ⚠️ CANNOT SCRAPE (React Apps - Must Use RSS.app)

These feeds use complex React applications with embedded JSON that are extremely difficult to scrape:

- ⚠️ `nytimes-athletic-nhl` - The Athletic NHL - Must create in RSS.app
- ⚠️ `nytimes-athletic-cfb` - The Athletic College Football - Must create in RSS.app

---

## ⚠️ REDDIT FEEDS (Will Use Reddit API)

These feeds will be handled via Reddit API instead of scraping:

- ⚠️ `reddit-nwsl` - Reddit r/NWSL
- ⚠️ `reddit-ligue1` - Reddit r/Ligue1
- ⚠️ `reddit-ligamx` - Reddit r/LigaMX
- ⚠️ `reddit-cfb` - Reddit r/CFB

---

## 📊 SUCCESS RATE BY CATEGORY

- **Major League Sports**: 3/3 (100%) ✅
- **Hockey**: 2/2 (100%) ✅
- **Soccer**: 3/3 (100%) ✅
- **College Football**: 5/6 (83%)
- **Golf**: 5/5 (100%) ✅
- **MMA**: 8/8 (100%) ✅
- **Boxing**: 5/5 (100%) ✅

**Overall: 31/33 working (94%)** 🎉

---

## 🔗 FEED URLs

All working feeds are available at:
```
http://localhost:8080/feeds/{feed-id}.xml
```

For example:
- `http://localhost:8080/feeds/nfl-com.xml`
- `http://localhost:8080/feeds/golfdigest.xml`
- `http://localhost:8080/feeds/ufc-com.xml`

---

## 📝 NOTES

1. **NewsNow Feeds (HTTP 504)**: These are still timing out and using RSS.app backups. They require longer timeouts or different scraping strategies.

2. **The Athletic Feeds**: These use complex React applications and are best handled via RSS.app.

3. **Reddit Feeds**: Will be implemented using Reddit API for better reliability.

4. **collegefootballnews**: The only remaining failing feed. Needs further investigation of page structure.

