# Feed Replacement Mapping

This document maps failing feeds to their RSS.app replacement URLs based on the source URLs provided.

## Matched Feeds (Source URL → RSS.app Feed)

### UEFA Champions League
- **Breaking**: `newsnow-championsleague`
  - Source: `https://www.newsnow.co.uk/h/Sport/Football/UEFA+Champions+League`
  - Replace with: `https://rss.app/feeds/j3EAnbrpQMEYzW57.xml`

### FA Cup
- **News**: `newsnow-facup`
  - Source: `https://www.newsnow.co.uk/h/Sport/Football/FA+Cup`
  - Replace with: `https://rss.app/feeds/6hu4o6gj1agGCz5i.xml`

### NWSL
- **News > Headlines**: `newsnow-nwsl`
  - Source: `https://www.newsnow.com/us/Sports/Soccer/NWSL`
  - Replace with: `https://rss.app/feeds/PE7NGL6ftSREkzv9.xml`
- **News > Breaking**: `newsnow-nwsl` (same feed)
  - Source: `https://www.newsnow.com/us/Sports/Soccer/NWSL`
  - Replace with: `https://rss.app/feeds/PE7NGL6ftSREkzv9.xml`

### NCAAM
- **Breaking**: `newsnow-ncaabasketball`
  - Source: `https://www.newsnow.com/us/Sports/NCAA+Basketball`
  - Replace with: `https://rss.app/feeds/1miuV1gDF41iBCUm.xml`
- **Headlines > Headlines**: `newsnow-ncaabasketball` (same feed)
  - Source: `https://www.newsnow.com/us/Sports/NCAA+Basketball`
  - Replace with: `https://rss.app/feeds/1miuV1gDF41iBCUm.xml`

### UFC
- **Headlines > MMA Junkie**: `mmajunkie`
  - Source: `https://mmajunkie.usatoday.com/`
  - Replace with: `https://rss.app/feeds/DZNQ6V2829Gsq89j.xml`
- **Headlines > Tapology**: `tapology`
  - Source: `https://www.tapology.com/news`
  - Replace with: `https://rss.app/feeds/sZGhLnyeUeeeDnBs.xml`
- **Headlines > MMA Fighting**: `mmafighting`
  - Source: `https://www.mmafighting.com/`
  - Replace with: `https://rss.app/feeds/6KutJNC4K8DelGwZ.xml`
- **Headlines > UFC.com**: `ufc-com`
  - Source: `https://www.ufc.com/trending/all`
  - Replace with: `https://rss.app/feeds/C3NmUDHJr8cWHBCk.xml`
- **Headlines > MMA-Core**: `mma-core`
  - Source: `https://mma-core.com/`
  - Replace with: `https://rss.app/feeds/X39lxMdIQOjTjP4s.xml`
- **Headlines > Sherdog**: `sherdog`
  - Source: `https://www.sherdog.com/`
  - Replace with: `https://rss.app/feeds/2NV0LB8BpoemNq2N.xml`
- **Headlines > MMA Mania**: `mmamania`
  - Source: `https://www.mmamania.com/`
  - Replace with: `https://rss.app/feeds/9HbNO7koG4FRO0EZ.xml`

### Boxing
- **Headlines > Ring**: `ringmagazine-rss`
  - Source: `https://ringmagazine.com/en/news`
  - Replace with: `https://rss.app/feeds/aScu4PsqcyQ1kfFt.xml`
- **Headlines > Boxing 24/7**: `boxingnews24`
  - Source: `https://www.boxingnews24.com/`
  - Replace with: `https://rss.app/feeds/TBwd9L3O8cQywuxX.xml`
- **Headlines > Headlines**: (commented out in HTML, but if needed)
  - Source: `https://rss.app/rss-feed?keyword=boxing&region=US&lang=en`
  - Replace with: `https://rss.app/feeds/t5VOWN5DnuNwIVYF.xml`

### NASCAR Cup Series
- **Headlines > Headlines**: `newsnow-nascar`
  - Source: `https://www.newsnow.com/us/Sports/NASCAR`
  - Replace with: `https://rss.app/feeds/vOF2I7lq3n3IsV8K.xml`

### Tennis
- **Headlines > Tennis.com**: `tennis-com`
  - Source: `https://www.tennis.com/news/all-news/`
  - Replace with: (Not found in replacement list - may need to keep scraper or find alternative)
- **Headlines > Tennis Gazzette**: `tennisgazette`
  - Source: `https://www.thetennisgazette.com/news/`
  - Replace with: (Not found in replacement list - may need to keep scraper or find alternative)
- **Headlines > Yahoo**: `yahoo-tennis-rss`
  - Source: `https://sports.yahoo.com/ten/rss/`
  - Replace with: `https://rss.app/feeds/Nh0zQXRLhhvfmuTh.xml` (Note: This is NewsNow Tennis feed, not Yahoo)

## Feeds NOT Found in Replacement List

These feeds are failing but do not have corresponding entries in your replacement list:

### Premier League
- **Headlines > Sports Mole** (`sportsmole-premierleague`) - Source: `https://www.sportsmole.co.uk/football/premier-league/`
- **Headlines > Sky** (`skysports-premierleague`) - Source: `https://www.skysports.com/premier-league-news`
- **Headlines > Sporting News** (`sportingnews-premierleague`) - Source: `https://www.sportingnews.com/us/premier-league`
- **Headlines > talkSPORT** (`talksport-premierleague`) - Source: `https://talksport.com/football/premier-league/feed/`
- **Headlines > TEAMTalk** (`teamtalk-premierleague`)

### UEFA Champions League
- **Headlines > Google News** - Already using RSS.app feed
- **Headlines > The Athletic** (`athletic-championsleague`)

### MLS
- **Headlines > Google News** - Currently using RSS.app feed `https://rss.app/feeds/rAadgaUcXJa3grIV.xml`
- **Headlines > FLM** - Currently using RSS.app feed `https://rss.app/feeds/liWpcUXYMINvUeWS.xml`

### Boxing
- **Headlines > Boxing Scene** (`boxingscene`) - Source: `https://www.boxingscene.com/articles` (Note: Already has RSS feed `https://www.boxingscene.com/feed`)

### Tennis
- **Headlines > Tennis.com** (`tennis-com`) - Source: `https://www.tennis.com/news/all-news/`
- **Headlines > Tennis Gazzette** (`tennisgazette`) - Source: `https://www.thetennisgazette.com/news/`

## Notes

1. **Tennis > Yahoo**: The replacement list shows `https://www.newsnow.com/us/Sports/Tennis` → `https://rss.app/feeds/Nh0zQXRLhhvfmuTh.xml`, but the current feed is `yahoo-tennis-rss` with source `https://sports.yahoo.com/ten/rss/`. You may want to replace the Yahoo feed with the NewsNow Tennis feed.

2. **Boxing Scene**: Already has a direct RSS feed (`https://www.boxingscene.com/feed`) configured as `isDirectRSS: true`, so it should work. If it's failing, it may be a different issue.

3. **MLS Google News & FLM**: These are already using RSS.app feeds directly in the HTML, so they may need different RSS.app feed URLs from your replacement list.

4. **Premier League feeds**: None of the failing Premier League feeds (Sports Mole, Sky, Sporting News, talkSPORT, TEAMTalk) appear in your replacement list, so you'll need to either:
   - Find RSS.app feeds for these sources
   - Keep them as scrapers
   - Remove them from the site

