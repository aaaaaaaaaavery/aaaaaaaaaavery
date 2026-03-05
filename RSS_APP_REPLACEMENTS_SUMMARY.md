# RSS.app Feed Replacements Summary

## Feeds Created and Replaced

All feeds have been created in `rss-feed-service/index.js` and updated in `index.html`.

### ✅ Successfully Created Feeds

1. **Yahoo Premier League** (`yahoo-premierleague`)
   - Source: `https://sports.yahoo.com/soccer/premier-league/rss/`
   - Type: Direct RSS feed
   - Replaced: `OlgI95YoXAeS1Lyb` (OneFootball tab in Premier League)

2. **TEAMTalk Premier League** (`teamtalk-premierleague`)
   - Source: `https://www.teamtalk.com/english-premiership`
   - Type: Browser scraping with fallback
   - Replaced: `PBkEtFlIayIUTcNp` (TEAMTalk tab in Premier League)

3. **The Athletic Champions League** (`athletic-championsleague`)
   - Source: `https://www.nytimes.com/athletic/football/champions-league/`
   - Type: Browser scraping with fallback
   - Replaced: `NO1HAlGkT9Ya9p34` (The Athletic tab in UEFA Champions League)

4. **RaceFans F1** (`racefans-f1`)
   - Source: `https://www.racefans.net/category/formula-1/`
   - Type: Browser scraping with fallback
   - Replaced: `nhdoUlCkVjA4oXEH` (RaceFans tab in Formula One)

5. **SI Champions League** (`si-championsleague`)
   - Source: `https://www.si.com/soccer/champions-league`
   - Type: Browser scraping with fallback
   - Replaced: `3zS8zHZWlrY4F0TM` (SI tab in UEFA Champions League)

6. **SI La Liga** (`si-laliga`)
   - Source: `https://www.si.com/soccer/la-liga`
   - Type: Browser scraping with fallback
   - Replaced: `3QnoBYzr3leLRwZf` (SI tab in La Liga)

7. **SI NFL** (`si-nfl`)
   - Source: `https://www.si.com/nfl`
   - Type: Browser scraping with fallback
   - Replaced: `KoszNpQLJ70ZBJbs` (SI tab in NFL)

8. **SI Premier League** (`si-premierleague`)
   - Source: `https://www.si.com/soccer/premier-league`
   - Type: Browser scraping with fallback
   - Replaced: `CgpGWf4RQSblPcSP` (SI tab in Premier League)

9. **Bleacher Report MLB** (`bleacherreport-mlb`)
   - Source: `https://bleacherreport.com/mlb`
   - Type: Browser scraping with fallback
   - Note: Not found in index.html - may need to be added

10. **MLS Soccer.com** (`mlssoccer-com`)
    - Source: `https://www.mlssoccer.com/news/`
    - Type: Browser scraping with fallback
    - Replaced: `XgOB7BUJbxy6FsjC` (MLSSoccer.com tab in MLS)

11. **NBC Sports ProFootballTalk** (`nbcsports-profootballtalk`)
    - Source: `https://www.nbcsports.com/nfl/profootballtalk`
    - Type: Browser scraping with fallback
    - Replaced: `YUKCB1afohjvJMle` (PFT tab in NFL)

12. **Bleacher Report NFL** (`bleacherreport-nfl`)
    - Source: `https://bleacherreport.com/nfl`
    - Type: Browser scraping with fallback
    - Replaced: `LCbkYBU74yt9AnT5` (B/R tab in NFL)

13. **The Athletic NHL** (`athletic-nhl`)
    - Source: `https://www.nytimes.com/athletic/nhl/`
    - Type: Browser scraping with fallback
    - Replaced: `6DIuDmmR4diUZR4q` (The Athletic tab in NHL)

14. **Sky Sports Football** (`skysports-football`)
    - Source: `https://www.skysports.com/football`
    - Type: Browser scraping with fallback
    - Replaced: `7sTylsAUGavU2YDz` (Sky Sports tab in Soccer)

15. **FourFourTwo** (`fourfourtwo`)
    - Source: `https://www.fourfourtwo.com/`
    - Type: Browser scraping with fallback
    - Replaced: `bXOgyqHWCvZHvUmF` (FourFourTwo tab in Soccer)

16. **AS.com Soccer** (`as-com-soccer`)
    - Source: `https://en.as.com/soccer/`
    - Type: Browser scraping with fallback
    - Replaced: `UM3B0Vem8qh04dDU` (AS tab in Soccer)

17. **The Race** (`the-race`)
    - Source: `https://www.the-race.com/rss/`
    - Type: Direct RSS feed
    - Replaced: `4gKjQaVgX2DJolme` (The Race tab in Formula One)

## Notes

- All feeds use browser scraping with fallback (Cheerio → Puppeteer → Playwright) except:
  - `yahoo-premierleague` (Direct RSS)
  - `the-race` (Direct RSS)
- All feeds have been updated in `index.html`
- Bleacher Report MLB feed was created but not found in index.html - may need to be added if it exists elsewhere

## Next Steps

1. Deploy the RSS feed service to Cloud Run
2. Test each feed to ensure they're working
3. If any feeds fail, we may need to adjust selectors or add more specific browser config

