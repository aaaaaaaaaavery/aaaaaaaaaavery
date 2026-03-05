# Native RSS Feeds Search Results

## Failing Feeds - Source URLs

1. **si-nba** (Sports Illustrated NBA)
   - Source URL: `https://www.si.com/nba`
   - RSS.app Feed ID: `0MaiPBu2UKvcQmyT`
   - Native RSS: ❌ Not found

2. **bleacherreport-nba** (Bleacher Report NBA)
   - Source URL: `https://bleacherreport.com/nba`
   - RSS.app Feed ID: `k6Vxs5GaPOehD9B3`
   - Native RSS: ❌ Not found

3. **autosport-f1** (Autosport F1)
   - Source URL: `https://www.autosport.com/f1/news/`
   - RSS.app Feed ID: `FTRMdb2vszxBak3x`
   - Native RSS: ❌ Not found

4. **planetf1** (Planet F1)
   - Source URL: `https://www.planetf1.com/news`
   - RSS.app Feed ID: `nkkpJtqSSgCLnGGt`
   - Native RSS: ❌ Not found

5. **nhl-video-recaps** (NHL Game Recaps)
   - Source URL: `https://www.nhl.com/video/topic/game-recaps/`
   - RSS.app Feed ID: `6hslZAxd7onqWIfw`
   - Native RSS: ❌ Not found

6. **bbc-premierleague** (BBC Premier League)
   - Source URL: `https://www.bbc.com/sport/football/premier-league`
   - RSS.app Feed ID: `9rFQ7zMHhTXb4Mxs`
   - Native RSS: ✅ **FOUND**: `https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml`

## Summary

- **BBC Premier League**: ✅ Native RSS feed found and **CONFIGURED**: `https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml`
- **All others**: ❌ No native RSS feeds found - **REVERTED to RSS.app**

## Actions Taken

1. ✅ Reverted failing scraped feeds to RSS.app in `index.html`:
   - si-nba → `0MaiPBu2UKvcQmyT`
   - bleacherreport-nba → `k6Vxs5GaPOehD9B3`
   - autosport-f1 → `FTRMdb2vszxBak3x`
   - planetf1 → `nkkpJtqSSgCLnGGt`
   - nhl-video-recaps → `6hslZAxd7onqWIfw`

2. ✅ Updated BBC Premier League to use native RSS feed:
   - Changed from scraper to direct RSS proxy
   - Updated `index.html` to use new feed URL

