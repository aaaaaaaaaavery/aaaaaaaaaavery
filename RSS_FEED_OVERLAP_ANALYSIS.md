# RSS Feed Overlap Analysis

This document identifies feeds that appear in BOTH `RSS_APP_BACKUP_FEEDS.md` and `RSS_APP_FEEDS_ALREADY_ON_SITE.md`.

## Overlap Explanation

**RSS_APP_BACKUP_FEEDS.md** lists RSS.app feeds that are being used as **backups** because the custom RSS feed service feeds failed.

**RSS_APP_FEEDS_ALREADY_ON_SITE.md** lists source URLs that are already on the site (either via RSS.app feeds OR custom service).

**Overlap means**: A source URL appears in BOTH documents, which means:
- The custom service tried to create a feed for this source (but failed)
- An RSS.app feed is being used as a backup for this source
- The source URL is already on the site (via the RSS.app backup feed)

---

## ✅ Overlapping Feeds (Source URLs in Both Documents)

These source URLs appear in BOTH documents:

| Source URL | RSS.app Feed ID (Backup) | Custom Service Feed ID (Failed) | Status on Site |
|------------|--------------------------|--------------------------------|----------------|
| **https://www.nytimes.com/athletic/nhl/** | `6DIuDmmR4diUZR4q` | `nytimes-athletic-nhl` | ✅ On Site (RSS.app backup) |
| **https://www.si.com/nba** | `0MaiPBu2UKvcQmyT` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://bleacherreport.com/nba** | `k6Vxs5GaPOehD9B3` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.bbc.com/sport/football/premier-league** | `KIxs5SCBkVuAWcRr` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.sportsmole.co.uk/football/premier-league/** | `qVMKN8SmPBqcCH7z` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.skysports.com/premier-league-news** | `IrtseC3G2pfQi6Va` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.sportingnews.com/us/premier-league** | `3J967vogi1qGdK1Y` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.sportbible.com/premier-league** | `30ZdeDXrftk47uLL` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.autosport.com/f1/news/** | `FTRMdb2vszxBak3x` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.planetf1.com/news** | `nkkpJtqSSgCLnGGt` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.reddit.com/r/CollegeBasketball/new/** | `vf2zYxzTRTJ0llPk` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://www.reddit.com/r/INDYCAR/new/** | `8qBnW4yImPpMqMDD` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://rss.app/rss-feed?keyword=NCAA%20Baseball&region=US&lang=en** | `t7vZR372K7n5ceeg` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://rss.app/rss-feed?keyword=LPGA%20Tour&region=US&lang=en** | `tqz9SwQPuclR1mSF` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |
| **https://rss.app/rss-feed?keyword=IndyCar&region=US&lang=en** | `tBzOR3X3d0NpmoAA` | N/A (intentional RSS.app) | ✅ On Site (RSS.app) |

---

## 📊 Overlap Summary

### Total Overlapping Feeds: ~15 feeds

**Breakdown:**
- **Backup feeds (HTTP 503/504)**: 1 feed
  - The Athletic NHL (failed in custom service, using RSS.app backup)
  
- **Intentional RSS.app feeds**: ~14 feeds
  - These are feeds that were likely always intended to use RSS.app (not backups)
  - Examples: SI NBA, B/R NBA, BBC Soccer, Sports Mole, Sky Sports, etc.

---

## Key Insights

1. **Most overlaps are intentional**: The majority of overlapping feeds are in the "Other RSS.app Feeds (Not Necessarily Backups)" section, meaning they were likely always intended to use RSS.app, not as backups.

2. **Only 1 true backup overlap**: Only **The Athletic NHL** (`6DIuDmmR4diUZR4q`) is a true backup that appears in both documents - it failed in the custom service (HTTP 503) and is using RSS.app as backup.

3. **Reddit feeds**: Some Reddit feeds appear in both documents, but they're listed as "intentional" RSS.app feeds, not backups.

4. **RSS.app keyword feeds**: Some RSS.app keyword feeds (like "NCAA Baseball", "LPGA Tour", "IndyCar") appear in both documents, but they're listed as intentional, not backups.

---

## Recommendations

1. **The Athletic NHL**: This is the only true backup overlap. Consider fixing the custom service scraper for this feed, or keep using RSS.app if it's working well.

2. **Intentional RSS.app feeds**: These are working as intended - no action needed.

3. **No conflicts**: There are no conflicts or issues with the overlaps - they're just documenting the same sources in different contexts.

