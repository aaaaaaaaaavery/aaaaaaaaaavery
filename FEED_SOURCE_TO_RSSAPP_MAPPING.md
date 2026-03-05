# Feed Source URL to RSS.app Mapping

This document shows which source URL maps to which RSS.app feed for each failing feed on your site.

## Direct Mappings (Source URL → RSS.app Feed)

| Site Location | Feed ID | Current Source URL | RSS.app Replacement URL |
|--------------|---------|-------------------|-------------------------|
| **UEFA Champions League > Breaking** | `newsnow-championsleague` | `https://www.newsnow.co.uk/h/Sport/Football/UEFA+Champions+League` | `https://rss.app/feeds/j3EAnbrpQMEYzW57.xml` |
| **FA Cup > News** | `newsnow-facup` | `https://www.newsnow.co.uk/h/Sport/Football/FA+Cup` | `https://rss.app/feeds/6hu4o6gj1agGCz5i.xml` |
| **NWSL > News > Headlines** | `newsnow-nwsl` | `https://www.newsnow.com/us/Sports/Soccer/NWSL` | `https://rss.app/feeds/PE7NGL6ftSREkzv9.xml` |
| **NWSL > News > Breaking** | `newsnow-nwsl` | `https://www.newsnow.com/us/Sports/Soccer/NWSL` | `https://rss.app/feeds/PE7NGL6ftSREkzv9.xml` |
| **NCAAM > Breaking** | `newsnow-ncaabasketball` | `https://www.newsnow.com/us/Sports/NCAA+Basketball` | `https://rss.app/feeds/1miuV1gDF41iBCUm.xml` |
| **NCAAM > Headlines > Headlines** | `newsnow-ncaabasketball` | `https://www.newsnow.com/us/Sports/NCAA+Basketball` | `https://rss.app/feeds/1miuV1gDF41iBCUm.xml` |
| **UFC > Headlines > MMA Junkie** | `mmajunkie` | `https://mmajunkie.usatoday.com/` | `https://rss.app/feeds/DZNQ6V2829Gsq89j.xml` |
| **UFC > Headlines > Tapology** | `tapology` | `https://www.tapology.com/news` | `https://rss.app/feeds/sZGhLnyeUeeeDnBs.xml` |
| **UFC > Headlines > MMA Fighting** | `mmafighting` | `https://www.mmafighting.com/` | `https://rss.app/feeds/6KutJNC4K8DelGwZ.xml` |
| **UFC > Headlines > UFC.com** | `ufc-com` | `https://www.ufc.com/trending/all` | `https://rss.app/feeds/C3NmUDHJr8cWHBCk.xml` |
| **UFC > Headlines > MMA-Core** | `mma-core` | `https://mma-core.com/` | `https://rss.app/feeds/X39lxMdIQOjTjP4s.xml` |
| **UFC > Headlines > Sherdog** | `sherdog` | `https://www.sherdog.com/` | `https://rss.app/feeds/2NV0LB8BpoemNq2N.xml` |
| **UFC > Headlines > MMA Mania** | `mmamania` | `https://www.mmamania.com/` | `https://rss.app/feeds/9HbNO7koG4FRO0EZ.xml` |
| **Boxing > Headlines > Ring** | `ringmagazine-rss` | `https://ringmagazine.com/en/news` | `https://rss.app/feeds/aScu4PsqcyQ1kfFt.xml` |
| **Boxing > Headlines > Boxing 24/7** | `boxingnews24` | `https://www.boxingnews24.com/` | `https://rss.app/feeds/TBwd9L3O8cQywuxX.xml` |
| **Boxing > Headlines > Headlines** | (commented out) | `https://rss.app/rss-feed?keyword=boxing&region=US&lang=en` | `https://rss.app/feeds/t5VOWN5DnuNwIVYF.xml` |
| **NASCAR Cup Series > Headlines > Headlines** | `newsnow-nascar` | `https://www.newsnow.com/us/Sports/NASCAR` | `https://rss.app/feeds/vOF2I7lq3n3IsV8K.xml` |
| **Tennis > Headlines > Yahoo** | `yahoo-tennis-rss` | `https://sports.yahoo.com/ten/rss/` | `https://rss.app/feeds/Nh0zQXRLhhvfmuTh.xml` |

## Special Cases

### Tennis > Headlines > Yahoo
**Note**: The current source is `https://sports.yahoo.com/ten/rss/` (Yahoo Tennis RSS), but your replacement list shows:
- Source: `https://www.newsnow.com/us/Sports/Tennis`
- Replace with: `https://rss.app/feeds/Nh0zQXRLhhvfmuTh.xml`

This suggests you want to replace the Yahoo Tennis feed with a NewsNow Tennis feed.

## Feeds NOT in Your Replacement List

These feeds are failing but do NOT have entries in your replacement list. You'll need to either find RSS.app feeds for them or handle them differently:

| Site Location | Feed ID | Current Source URL |
|--------------|---------|-------------------|
| **Premier League > Headlines > Sports Mole** | `sportsmole-premierleague` | `https://www.sportsmole.co.uk/football/premier-league/` |
| **Premier League > Headlines > Sky** | `skysports-premierleague` | `https://www.skysports.com/premier-league-news` |
| **Premier League > Headlines > Sporting News** | `sportingnews-premierleague` | `https://www.sportingnews.com/us/premier-league` |
| **Premier League > Headlines > talkSPORT** | `talksport-premierleague` | `https://talksport.com/football/premier-league/feed/` |
| **Premier League > Headlines > TEAMTalk** | `teamtalk-premierleague` | (Unknown source URL) |
| **UEFA Champions League > Headlines > Google News** | (RSS.app feed) | Already using RSS.app directly |
| **UEFA Champions League > Headlines > The Athletic** | `athletic-championsleague` | (Unknown source URL) |
| **MLS > Headlines > Google News** | (RSS.app feed) | Already using RSS.app `https://rss.app/feeds/rAadgaUcXJa3grIV.xml` |
| **MLS > Headlines > FLM** | (RSS.app feed) | Already using RSS.app `https://rss.app/feeds/liWpcUXYMINvUeWS.xml` |
| **Tennis > Headlines > Tennis.com** | `tennis-com` | `https://www.tennis.com/news/all-news/` |
| **Tennis > Headlines > Tennis Gazzette** | `tennisgazette` | `https://www.thetennisgazette.com/news/` |

## Summary

**Total failing feeds**: 29
**Feeds with RSS.app replacements**: 18
**Feeds without replacements**: 11

