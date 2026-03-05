# Complete List of Failing Feeds

## Test Results: 36 Working, 56 Failing

---

## ❌ HTTP 503 Errors (Scraped Websites - Need Scraper Fixes)

These feeds are configured but the scrapers are failing. They may need updated selectors or the websites may be blocking requests.

1. **RzsFiWRkJWt232Z1** → `nfl-com` (NFL.com News)
2. **gpNdeo4WRun54WuS** → `nba-com-news` (NBA.com News)
3. **tjqR23Xwa5us4EGS** → `nhl-com-news` (NHL.com News)
4. **Zf7Ng96ruXO870Ee** → `hockeywriters` (The Hockey Writers)
5. **V79dVmqWDC7pLACZ** → `hockeynews` (The Hockey News)
6. **SBZfeZPSsLT2mwmU** → `onefootball-home` (OneFootball)
7. **f5rbTpdVjq93AlTY** → `worldsoccertalk` (World Soccer Talk)
8. **fg5UIrrq1YikBxyg** → `bundesliga-com` (Bundesliga.com)
9. **HL9rA42ELIkqWXJg** → `reddit-nwsl` (Reddit r/NWSL)
10. **UNtqy55sZPAGDxWp** → `reddit-ligue1` (Reddit r/Ligue1)
11. **o3KVLBimGj35TqzR** → `reddit-ligamx` (Reddit r/LigaMX)
12. **ydzB00a4yYWWhOJE** → `nytimes-athletic-cfb` (The Athletic College Football)
13. **SQahLIzekjAsW3lk** → `247sports-cfb` (247Sports College Football)
14. **tBrt5dpIhevVbeQi** → `reddit-cfb` (Reddit r/CFB)
15. **d2PbmQcxqRMOPRvs** → `collegefootballnews` (College Football News)
16. **ZX6NqXnTRPsqJl24** → `sportingnews-cfb` (Sporting News College Football)
17. **TC8CR6Epre8sOBbW** → `si-cfb` (Sports Illustrated College Football)
18. **ftJXlnwUtPK98zMT** → `bleacherreport-cfb` (Bleacher Report College Football)
19. **LsKtD2ijrBKLHTPy** → `saturdaydownsouth` (Saturday Down South)
20. **L3knSpnVPuEqu9F3** → `on3-cfb` (On3 College Football)
21. **GNRqjlnU2hDoUspd** → `golfdigest` (Golf Digest)
22. **PGlnIglwoK57BFgx** → `pgatour-com` (PGA Tour.com)
23. **SBEwIpFRnxpFz5yO** → `golfwrx` (GolfWRX)
24. **yoYhJTH3khDR6VnA** → `golfmonthly` (Golf Monthly)
25. **Kk2DP7BQ6R63genW** → `si-golf` (Sports Illustrated Golf)
26. **52JoNIj0uJyAO8Ro** → `si-ufc` (Sports Illustrated UFC)
27. **DZNQ6V2829Gsq89j** → `mmajunkie` (MMA Junkie)
28. **9HbNO7koG4FRO0EZ** → `mmamania` (MMA Mania)
29. **2NV0LB8BpoemNq2N** → `sherdog` (Sherdog)
30. **X39lxMdIQOjTjP4s** → `mma-core` (MMA Core)
31. **C3NmUDHJr8cWHBCk** → `ufc-com` (UFC.com)
32. **sZGhLnyeUeeeDnBs** → `tapology` (Tapology)
33. **6KutJNC4K8DelGwZ** → `mmafighting` (MMA Fighting)
34. **aScu4PsqcyQ1kfFt** → `ringmagazine-rss` (Ring Magazine)
35. **TBwd9L3O8cQywuxX** → `boxingnews24` (Boxing News 24)
36. **i1VCLI9hScfbZjgu** → `badlefthook` (Bad Left Hook)
37. **FpEL1AAFV73VieeD** → `boxingscene` (Boxing Scene)
38. **xBIj1RcHaBcd7WfJ** → `boxing247` (Boxing 247)

---

## ❌ HTTP 504 Errors (NewsNow Feeds - Timeout)

These NewsNow feeds are timing out. They may work on retry, or may need longer timeout settings. The `scrapeNewsNow` function processes up to 30 articles with 200ms delays, which can take 6+ seconds.

39. **zRogbCPNliFNNTuM** → `newsnow-f1` (NewsNow Formula 1)
40. **Y86rdhcYGEJTzVVE** → `newsnow-europaleague` (NewsNow UEFA Europa League)
41. **1miuV1gDF41iBCUm** → `newsnow-ncaabasketball` (NewsNow NCAA Basketball)
42. **O8juJbxSctWCFqdV** → `newsnow-ncaafootball` (NewsNow NCAA Football)
43. **R0LMNrxS5mPorbsV** → `newsnow-pgatour` (NewsNow PGA Tour)
44. **II7WkAEfi65q8OMI** → `newsnow-ufc` (NewsNow UFC)
45. **8UNhLRsk0v8buOUz** → `newsnow-boxing` (NewsNow Boxing)
46. **Nh0zQXRLhhvfmuTh** → `newsnow-tennis` (NewsNow Tennis)
47. **vOF2I7lq3n3IsV8K** → `newsnow-nascar` (NewsNow NASCAR)
48. **Eaaaqyki6E6nnMZR** → `newsnow-wnba` (NewsNow WNBA)
49. **InHgRAqAOeKlilq8** → `newsnow-livgolf` (NewsNow LIV Golf)
50. **VkQvfkJZA51pa8EB** → `newsnow-motogp` (NewsNow MotoGP)
51. **0afVGov5MVxxBF7B** → `newsnow-lpga` (NewsNow LPGA)
52. **Zo7JsQDXIT8D0pCD** → `newsnow-indycar` (NewsNow IndyCar)
53. **VqavgJOoX0LKkfkb** → `newsnow-trackandfield` (NewsNow Track and Field)
54. **0zeKHWCVNtBCrCro** → `newsnow-europaconferenceleague` (NewsNow UEFA Europa Conference League)
55. **_QoQmejtlVFZhkOXP** → `nwsl-bundle` (NWSL Bundle)

---

## ❌ Other Errors

56. **W5qj2Lq2skC4hTyn** → `transfermarkt-rss` (Transfermarkt RSS) - **Error: Not valid RSS/Atom XML**
   - The Transfermarkt RSS feed URL may not be returning valid RSS. May need to scrape the website instead.

---

## Summary by Error Type

- **HTTP 503 (Scraper Failures):** 38 feeds
- **HTTP 504 (Timeouts):** 17 feeds  
- **Invalid RSS Format:** 1 feed

**Total Failing:** 56 feeds

---

## Recommendations

### For HTTP 503 Errors:
- Update scraper selectors for each website
- Check if websites are blocking requests (may need better User-Agent or headers)
- Consider alternative sources or native RSS feeds if available

### For HTTP 504 Errors (NewsNow):
- Increase Cloud Run timeout settings
- Reduce number of articles processed (from 30 to 20 or 15)
- Increase delay between requests (from 200ms to 300ms) to be more respectful
- Consider processing these feeds asynchronously

### For Invalid RSS:
- Check if Transfermarkt has a different RSS endpoint
- Consider scraping the website instead of using RSS

