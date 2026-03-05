# RSS.app Feeds Used as Backups

These RSS.app feeds are being used because the corresponding custom RSS feed service feeds are failing.

## Summary
- **Total RSS.app backup feeds**: ~49 feeds (NFL.com, NBA.com, NHL.com, The Hockey Writers, The Hockey News, OneFootball, World Soccer Talk, Bundesliga.com now working - removed from backups)
- **HTTP 503 Errors (Scraper failures)**: ~30 feeds (NFL.com, NBA.com, NHL.com, The Hockey Writers, The Hockey News, OneFootball, World Soccer Talk, Bundesliga.com fixed)
- **HTTP 504 Errors (Timeouts)**: ~16 feeds
- **Invalid RSS Format**: ~1 feed
- **Other/Unknown**: ~1 feed

---

## HTTP 503 Errors (Scraper Failures) - Using RSS.app as Backup

These feeds failed in the custom service due to scraper issues, so RSS.app feeds are used instead:

| RSS.app Feed ID | Custom Service Feed ID | Source Name | Source URL | Status |
|----------------|------------------------|-------------|------------|--------|
| ~~**RzsFiWRkJWt232Z1**~~ | `nfl-com` | NFL.com News | https://www.nfl.com/news | ✅ **WORKING** - No longer using RSS.app backup |
| **gpNdeo4WRun54WuS** | `nba-com-news` | NBA.com News | https://www.nba.com/news | ✅ **WORKING** - No longer using RSS.app backup |
| **tjqR23Xwa5us4EGS** | `nhl-com-news` | NHL.com News | https://www.nhl.com/news | ✅ **WORKING** - No longer using RSS.app backup |
| **Zf7Ng96ruXO870Ee** | `hockeywriters` | The Hockey Writers | https://thehockeywriters.com/hockey-headlines/ | ✅ **WORKING** - No longer using RSS.app backup |
| **V79dVmqWDC7pLACZ** | `hockeynews` | The Hockey News | https://thehockeynews.com/rss/THNHOME/full | ✅ **WORKING** - No longer using RSS.app backup |
| **6DIuDmmR4diUZR4q** | `nytimes-athletic-nhl` | The Athletic NHL | https://www.nytimes.com/athletic/nhl/ | ⚠️ **NOTE**: Cannot scrape (React app with complex JSON). Must create in RSS.app email@thporth.com account |
| **SBZfeZPSsLT2mwmU** | `onefootball-home` | OneFootball | https://onefootball.com/en/home | ✅ **WORKING** - No longer using RSS.app backup |
| **f5rbTpdVjq93AlTY** | `worldsoccertalk` | World Soccer Talk | https://worldsoccertalk.com/news/ | ✅ **WORKING** - No longer using RSS.app backup |
| **fg5UIrrq1YikBxyg** | `bundesliga-com` | Bundesliga.com | https://www.bundesliga.com/en/bundesliga/news | ✅ **WORKING** - No longer using RSS.app backup |
| **HL9rA42ELIkqWXJg** | `reddit-nwsl` | Reddit r/NWSL | https://www.reddit.com/r/NWSL/ | ⚠️ **NOTE**: Will use Reddit API (skipped for now) |
| **UNtqy55sZPAGDxWp** | `reddit-ligue1` | Reddit r/Ligue1 | https://www.reddit.com/r/Ligue1/ | ⚠️ **NOTE**: Will use Reddit API (skipped for now) |
| **o3KVLBimGj35TqzR** | `reddit-ligamx` | Reddit r/LigaMX | https://www.reddit.com/r/LigaMX/ | ⚠️ **NOTE**: Will use Reddit API (skipped for now) |
| **ydzB00a4yYWWhOJE** | `nytimes-athletic-cfb` | The Athletic College Football | https://www.nytimes.com/athletic/college-football/ | ⚠️ **NOTE**: Cannot scrape (React app with complex JSON). Must create in RSS.app email@thporth.com account |
| **SQahLIzekjAsW3lk** | `247sports-cfb` | 247Sports College Football | https://247sports.com/news/?sport=football | ✅ **WORKING** - No longer using RSS.app backup |
| **tBrt5dpIhevVbeQi** | `reddit-cfb` | Reddit r/CFB | https://www.reddit.com/r/CFB/ | ⚠️ **NOTE**: Will use Reddit API (skipped for now) |
| **d2PbmQcxqRMOPRvs** | `collegefootballnews` | College Football News | https://collegefootballnews.com/ | ❌ **STILL FAILING** - Needs investigation |
| **ZX6NqXnTRPsqJl24** | `sportingnews-cfb` | Sporting News College Football | https://www.sportingnews.com/us/ncaa-football/news | ✅ **WORKING** - No longer using RSS.app backup |
| **TC8CR6Epre8sOBbW** | `si-cfb` | Sports Illustrated College Football | https://www.si.com/college/college-football | ✅ **WORKING** - No longer using RSS.app backup |
| **LsKtD2ijrBKLHTPy** | `saturdaydownsouth` | Saturday Down South | https://www.saturdaydownsouth.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **L3knSpnVPuEqu9F3** | `on3-cfb` | On3 College Football | https://www.on3.com/category/football/news/ | ✅ **WORKING** - No longer using RSS.app backup |
| **GNRqjlnU2hDoUspd** | `golfdigest` | Golf Digest | https://www.golfdigest.com/golf-news | ✅ **WORKING** - No longer using RSS.app backup |
| **PGlnIglwoK57BFgx** | `pgatour-com` | PGA Tour.com | https://www.pgatour.com/news | ✅ **WORKING** - No longer using RSS.app backup |
| **SBEwIpFRnxpFz5yO** | `golfwrx` | GolfWRX | https://www.golfwrx.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **yoYhJTH3khDR6VnA** | `golfmonthly` | Golf Monthly | https://www.golfmonthly.com/news | ✅ **WORKING** - No longer using RSS.app backup |
| **Kk2DP7BQ6R63genW** | `si-golf` | Sports Illustrated Golf | https://www.si.com/golf/ | ✅ **WORKING** - No longer using RSS.app backup |
| **52JoNIj0uJyAO8Ro** | `si-ufc` | Sports Illustrated UFC | https://www.si.com/fannation/mma/ufc | ✅ **WORKING** - No longer using RSS.app backup |
| **DZNQ6V2829Gsq89j** | `mmajunkie` | MMA Junkie | https://mmajunkie.usatoday.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **9HbNO7koG4FRO0EZ** | `mmamania` | MMA Mania | https://www.mmamania.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **2NV0LB8BpoemNq2N** | `sherdog` | Sherdog | https://www.sherdog.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **X39lxMdIQOjTjP4s** | `mma-core` | MMA Core | https://mma-core.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **C3NmUDHJr8cWHBCk** | `ufc-com` | UFC.com | https://www.ufc.com/trending/all | ✅ **WORKING** - No longer using RSS.app backup |
| **sZGhLnyeUeeeDnBs** | `tapology` | Tapology | https://www.tapology.com/news | ✅ **WORKING** - No longer using RSS.app backup |
| **6KutJNC4K8DelGwZ** | `mmafighting` | MMA Fighting | https://www.mmafighting.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **aScu4PsqcyQ1kfFt** | `ringmagazine-rss` | Ring Magazine | https://ringmagazine.com/en/news | ✅ **WORKING** - No longer using RSS.app backup |
| **TBwd9L3O8cQywuxX** | `boxingnews24` | Boxing News 24 | https://www.boxingnews24.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **i1VCLI9hScfbZjgu** | `badlefthook` | Bad Left Hook | https://www.badlefthook.com/ | ✅ **WORKING** - No longer using RSS.app backup |
| **FpEL1AAFV73VieeD** | `boxingscene` | Boxing Scene | https://www.boxingscene.com/articles | ✅ **WORKING** - No longer using RSS.app backup |
| **xBIj1RcHaBcd7WfJ** | `boxing247` | Boxing 247 | https://www.boxing247.com/ | ✅ **WORKING** - No longer using RSS.app backup |

---

## HTTP 504 Errors (Timeouts) - Using RSS.app as Backup

These NewsNow feeds timed out in the custom service, so RSS.app feeds are used instead:

| RSS.app Feed ID | Custom Service Feed ID | Source Name | Source URL | Status |
|----------------|------------------------|-------------|------------|--------|
| **zRogbCPNliFNNTuM** | `newsnow-f1` | NewsNow Formula 1 | https://www.newsnow.com/us/Sports/F1 | ❌ HTTP 504 (Timeout) |
| **Y86rdhcYGEJTzVVE** | `newsnow-europaleague` | NewsNow UEFA Europa League | https://www.newsnow.co.uk/h/Sport/Football/UEFA+Europa+League | ❌ HTTP 504 (Timeout) |
| **1miuV1gDF41iBCUm** | `newsnow-ncaabasketball` | NewsNow NCAA Basketball | https://www.newsnow.com/us/Sports/NCAA+Basketball | ❌ HTTP 504 (Timeout) |
| **O8juJbxSctWCFqdV** | `newsnow-ncaafootball` | NewsNow NCAA Football | https://www.newsnow.com/us/Sports/NCAA+Football | ❌ HTTP 504 (Timeout) |
| **R0LMNrxS5mPorbsV** | `newsnow-pgatour` | NewsNow PGA Tour | https://www.newsnow.com/us/Sports/Golf/PGA+Tour | ❌ HTTP 504 (Timeout) |
| **II7WkAEfi65q8OMI** | `newsnow-ufc` | NewsNow UFC | https://www.newsnow.com/us/Sports/MMA/UFC | ❌ HTTP 504 (Timeout) |
| **8UNhLRsk0v8buOUz** | `newsnow-boxing` | NewsNow Boxing | https://www.newsnow.com/us/Sports/Boxing | ❌ HTTP 504 (Timeout) |
| **Nh0zQXRLhhvfmuTh** | `newsnow-tennis` | NewsNow Tennis | https://www.newsnow.com/us/Sports/Tennis | ❌ HTTP 504 (Timeout) |
| **vOF2I7lq3n3IsV8K** | `newsnow-nascar` | NewsNow NASCAR | https://www.newsnow.com/us/Sports/NASCAR | ❌ HTTP 504 (Timeout) |
| **Eaaaqyki6E6nnMZR** | `newsnow-wnba` | NewsNow WNBA | https://www.newsnow.co.uk/h/Sport/US+Sports/WNBA | ❌ HTTP 504 (Timeout) |
| **InHgRAqAOeKlilq8** | `newsnow-livgolf` | NewsNow LIV Golf | https://www.newsnow.com/us/Sports/Golf/LIV+Golf | ❌ HTTP 504 (Timeout) |
| **VkQvfkJZA51pa8EB** | `newsnow-motogp` | NewsNow MotoGP | https://www.newsnow.co.uk/h/Sport/Motorsport/MotoGP | ❌ HTTP 504 (Timeout) |
| **0afVGov5MVxxBF7B** | `newsnow-lpga` | NewsNow LPGA | https://www.newsnow.com/us/Sports/Golf/LPGA | ❌ HTTP 504 (Timeout) |
| **Zo7JsQDXIT8D0pCD** | `newsnow-indycar` | NewsNow IndyCar | https://www.newsnow.com/us/Sports/IndyCar | ❌ HTTP 504 (Timeout) |
| **VqavgJOoX0LKkfkb** | `newsnow-trackandfield` | NewsNow Track and Field | https://www.newsnow.com/us/Sports/Track+and+Field | ❌ HTTP 504 (Timeout) |
| **0zeKHWCVNtBCrCro** | `newsnow-europaconferenceleague` | NewsNow UEFA Europa Conference League | https://www.newsnow.co.uk/h/Sport/Football/UEFA+Europa+Conference+League | ❌ HTTP 504 (Timeout) |

---

## Invalid RSS Format - Using RSS.app as Backup

| RSS.app Feed ID | Custom Service Feed ID | Source Name | Source URL | Status |
|----------------|------------------------|-------------|------------|--------|
| **W5qj2Lq2skC4hTyn** | `transfermarkt-rss` | Transfermarkt RSS | https://www.transfermarkt.co.uk/news | ✅ **WORKING** - No longer using RSS.app backup (now scraping website) |

---

## Other RSS.app Feeds (Not Necessarily Backups)

These RSS.app feeds may be intentionally used (not necessarily backups):

### Breaking/Headlines Feeds:
- **AYtjYuHSzf8VXPWV** - MLB Breaking (may be intentional) - Source: Unknown
- **0MaiPBu2UKvcQmyT** - SI NBA (may be intentional) - Source: https://www.si.com/nba
- **k6Vxs5GaPOehD9B3** - B/R NBA (may be intentional) - Source: https://bleacherreport.com/nba
- **YUKCB1afohjvJMle** - PFT NFL (may be intentional) - Source: Unknown
- **KoszNpQLJ70ZBJbs** - SI NFL (may be intentional) - Source: Unknown
- **LCbkYBU74yt9AnT5** - B/R NFL (may be intentional) - Source: Unknown
- **qKDoR3HZOMRmExUP** - Sports Mole Soccer (may be intentional) - Source: Unknown
- **7sTylsAUGavU2YDz** - Sky Sports Soccer (may be intentional) - Source: Unknown
- **B9IZq10WgLEwHyYf** - The Guardian Soccer (may be intentional) - Source: Unknown
- **KIxs5SCBkVuAWcRr** - BBC Soccer (may be intentional) - Source: https://www.bbc.com/sport/football/premier-league
- **UM3B0Vem8qh04dDU** - AS Soccer (may be intentional) - Source: Unknown
- **bXOgyqHWCvZHvUmF** - FourFourTwo Soccer (may be intentional) - Source: Unknown
- **joZlHdOrkZ6ijBM8** - FOX Sports Soccer (may be intentional) - Source: Unknown
- **yB1knLblnebjjIez** - Google News Champions League (may be intentional) - Source: Unknown
- **3zS8zHZWlrY4F0TM** - SI Champions League (may be intentional) - Source: Unknown
- **NO1HAlGkT9Ya9p34** - The Athletic Champions League (may be intentional) - Source: Unknown
- **CgpGWf4RQSblPcSP** - SI Premier League (may be intentional) - Source: Unknown
- **OlgI95YoXAeS1Lyb** - OneFootball Premier League (may be intentional) - Source: Unknown
- **qVMKN8SmPBqcCH7z** - Sports Mole Premier League (may be intentional) - Source: https://www.sportsmole.co.uk/football/premier-league/
- **IrtseC3G2pfQi6Va** - Sky Premier League (may be intentional) - Source: https://www.skysports.com/premier-league-news
- **4ztlqsjqgVdJj7Gz** - Football Talk Premier League (may be intentional) - Source: Unknown
- **3J967vogi1qGdK1Y** - Sporting News Premier League (may be intentional) - Source: https://www.sportingnews.com/us/premier-league
- **co5skijSzgAW0vTJ** - Daily Mail Premier League (may be intentional) - Source: Unknown
- **JSvDlnImnrDjDgsk** - talkSPORT Premier League (may be intentional) - Source: Unknown
- **30ZdeDXrftk47uLL** - SPORTbible Premier League (may be intentional) - Source: https://www.sportbible.com/premier-league
- **PBkEtFlIayIUTcNp** - TEAMTalk Premier League (may be intentional) - Source: Unknown
- **XgOB7BUJbxy6FsjC** - MLSSoccer.com (may be intentional) - Source: Unknown
- **rAadgaUcXJa3grIV** - Google News MLS (may be intentional) - Source: Unknown
- **liWpcUXYMINvUeWS** - FLM MLS (may be intentional) - Source: Unknown
- **3QnoBYzr3leLRwZf** - SI La Liga (may be intentional) - Source: Unknown
- **UnTi09biy7NcbQpv** - Sports Mole La Liga (may be intentional) - Source: Unknown
- **Oj48mcyrNfIxbqp9** - Google News La Liga (may be intentional) - Source: Unknown
- **NeOHPCIlHddJXJCU** - Cult of Calcio Serie A (may be intentional) - Source: Unknown
- **zIPPZ5Zh9GDpvIbV** - Bulinews Bundesliga (may be intentional) - Source: Unknown
- **tr10VModrXb2evce** - Liga MX Headlines (may be intentional) - Source: Unknown
- **tnA7WHOi3hNDP2Wr** - NWSL Headlines (may be intentional) - Source: Unknown
- **PE7NGL6ftSREkzv9** - NWSL Breaking (may be intentional) - Source: Unknown
- **tbxA99undrBg8j4I** - Ligue 1 Headlines (may be intentional) - Source: Unknown
- **AdN94t2aMmFNKpiW** - Ligue 1 Breaking (may be intentional) - Source: Unknown
- **tw7ijzsLkAnmByMf** - UEFA Europa League Headlines (may be intentional) - Source: Unknown
- **tpoJCJ6SHNu5XMoG** - UEFA Europa Conference League Headlines (may be intentional) - Source: Unknown
- **JVcUSNygCvK6E5WZ** - F1.com (may be intentional) - Source: Unknown
- **1RmEBIvrTB2Vl8wg** - Motorsport F1 (may be intentional) - Source: Unknown
- **4gKjQaVgX2DJolme** - The Race F1 (may be intentional) - Source: Unknown
- **FTRMdb2vszxBak3x** - Autosport F1 (may be intentional) - Source: https://www.autosport.com/f1/news/
- **nkkpJtqSSgCLnGGt** - Planet F1 (may be intentional) - Source: https://www.planetf1.com/news
- **nhdoUlCkVjA4oXEH** - RaceFans F1 (may be intentional) - Source: Unknown
- **tOYU1riYpjBIE6yi** - NCAA Women's Basketball (may be intentional) - Source: Unknown
- **t7vZR372K7n5ceeg** - NCAA Baseball (may be intentional) - Source: https://rss.app/rss-feed?keyword=NCAA%20Baseball&region=US&lang=en
- **tRKTEhHvoInenyd4** - NCAA Softball (may be intentional) - Source: Unknown
- **tqz9SwQPuclR1mSF** - LPGA Tour Headlines (may be intentional) - Source: https://rss.app/rss-feed?keyword=LPGA%20Tour&region=US&lang=en
- **tBzOR3X3d0NpmoAA** - IndyCar Headlines (may be intentional) - Source: https://rss.app/rss-feed?keyword=IndyCar&region=US&lang=en
- **8qBnW4yImPpMqMDD** - IndyCar Reddit (may be intentional) - Source: https://www.reddit.com/r/INDYCAR/new/
- **vf2zYxzTRTJ0llPk** - NCAAM Reddit (may be intentional) - Source: https://www.reddit.com/r/CollegeBasketball/new/

---

## Notes

1. **HTTP 503 Errors**: These indicate scraper failures. The websites may have changed their HTML structure, or the scrapers need updated selectors.

2. **HTTP 504 Errors**: These are NewsNow feeds that timed out. They may work on retry, but the scraping process is slow (6+ seconds per feed).

3. **Invalid RSS**: Transfermarkt RSS feed doesn't return valid XML format.

4. **Recommendations**:
   - For HTTP 503: Update scrapers or find alternative sources
   - For HTTP 504: Increase timeout settings or process asynchronously
   - For Invalid RSS: Scrape website instead of using RSS

5. **Total Backup Feeds**: Approximately **57 RSS.app feeds** are being used as backups for failed custom service feeds.

