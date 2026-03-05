# Apify Social Data Guide - Getting Social Content for Games

## What is Apify?

Apify is a web scraping and automation platform that provides pre-built "Actors" (scrapers) for various websites, including social media platforms like Twitter, Reddit, Facebook, and Instagram.

## How to Get Social Data for Games (e.g., "Grizzlies vs. Trail Blazers")

### Step 1: Choose the Right Apify Actors

For social data about games, you'll want to use:

1. **Twitter/X Scraper** - Search for tweets about the game
   - Actor: `apify/twitter-scraper` or similar
   - Search by: hashtags, keywords, team names, game matchup
   - Example searches: "#Grizzlies", "Grizzlies Trail Blazers", "Memphis vs Portland"

2. **Reddit Scraper** - Get posts and comments from relevant subreddits
   - Actor: `apify/reddit-scraper` or similar
   - Search in: r/nba, r/memphisgrizzlies, r/ripcity, etc.
   - Search for: game threads, post-game discussions

3. **Instagram Scraper** (optional) - Get posts from team accounts
   - Actor: `apify/instagram-scraper`
   - Monitor: Official team accounts, player accounts

### Step 2: Set Up Your Search Queries

For a game like "Grizzlies vs. Trail Blazers", you'd configure:

**Twitter Search:**
```
Keywords: "Grizzlies Trail Blazers" OR "Memphis Portland" OR "#Grizzlies" OR "#TrailBlazers"
Time Range: Game day (or last 24 hours)
Max Results: 100-500 tweets
```

**Reddit Search:**
```
Subreddits: r/nba, r/memphisgrizzlies, r/ripcity
Keywords: "Grizzlies", "Trail Blazers", game thread
Sort by: New or Hot
Max Results: 50-200 posts
```

### Step 3: Run the Actors

1. **Sign up for Apify** (free account gets $5 in credits)
2. **Find the Actor** in the Apify Store
3. **Configure the input** with your search parameters
4. **Run the Actor** - it will scrape the data
5. **Download results** as JSON, CSV, or via API

### Step 4: Process the Data

The Actors will return data like:
- **Twitter**: Tweet text, author, timestamp, likes, retweets, replies
- **Reddit**: Post title, content, author, upvotes, comments, timestamp

You can then:
- Filter by relevance
- Sort by engagement (likes, upvotes)
- Extract key insights
- Store in your database

---

## Pricing Breakdown

### Apify Subscription Plans

| Plan | Monthly Cost | Included Credits | Cost per CU* | Best For |
|------|-------------|------------------|--------------|----------|
| **Free** | $0 | $5 | $0.30 | Testing, small projects |
| **Starter** | $39 | $39 | $0.30 | Small-scale scraping |
| **Scale** | $199 | $199 | $0.25 | Medium-scale, regular use |
| **Business** | $999 | $999 | $0.20 | Large-scale, high volume |

*CU = Compute Unit (1 CU = 1 GB-hour of RAM)

### Cost Per Game Example

**Scenario: Scraping social data for one NBA game**

**Twitter Scraper:**
- Search: "Grizzlies Trail Blazers" (last 24 hours)
- Estimated CUs: 0.5-1 CU per run
- Cost: $0.15-$0.30 per game (on Free/Starter plan)

**Reddit Scraper:**
- Search: 3 subreddits, 50 posts each
- Estimated CUs: 0.3-0.5 CU per run
- Cost: $0.09-$0.15 per game (on Free/Starter plan)

**Total per game: ~$0.24-$0.45**

### Monthly Cost Estimates

**Light Usage (10 games/month):**
- Twitter: 10 × $0.30 = $3.00
- Reddit: 10 × $0.15 = $1.50
- **Total: ~$4.50/month** ✅ Covered by Free plan ($5 credit)

**Medium Usage (50 games/month):**
- Twitter: 50 × $0.30 = $15.00
- Reddit: 50 × $0.15 = $7.50
- **Total: ~$22.50/month** ✅ Covered by Starter plan ($39 credit)

**Heavy Usage (200 games/month):**
- Twitter: 200 × $0.30 = $60.00
- Reddit: 200 × $0.15 = $30.00
- **Total: ~$90/month** ✅ Covered by Scale plan ($199 credit)

**Very Heavy Usage (1000 games/month):**
- Twitter: 1000 × $0.30 = $300.00
- Reddit: 1000 × $0.15 = $150.00
- **Total: ~$450/month** ⚠️ Would need Business plan or pay overage

---

## Step-by-Step Walkthrough

### Example: Getting Twitter Data for "Grizzlies vs. Trail Blazers"

1. **Go to Apify Store**: https://apify.com/store
2. **Search for "Twitter Scraper"**
3. **Select an Actor** (e.g., `apify/twitter-scraper`)
4. **Click "Try for free"** or "Run"
5. **Configure Input**:
   ```json
   {
     "searchQueries": [
       "Grizzlies Trail Blazers",
       "Memphis Portland",
       "#Grizzlies",
       "#TrailBlazers"
     ],
     "maxTweets": 100,
     "sort": "relevance"
   }
   ```
6. **Click "Start"**
7. **Wait for completion** (usually 1-5 minutes)
8. **Download results** as JSON or CSV
9. **Process data** in your application

### Example: Getting Reddit Data

1. **Search for "Reddit Scraper"** in Apify Store
2. **Select an Actor** (e.g., `apify/reddit-scraper`)
3. **Configure Input**:
   ```json
   {
     "subreddits": ["nba", "memphisgrizzlies", "ripcity"],
     "searchQuery": "Grizzlies Trail Blazers",
     "sort": "new",
     "maxPosts": 50
   }
   ```
4. **Run and download results**

---

## Integration with Your System

### Option 1: Manual Runs (One-time) - EXPLAINED

**What it means:**
- You manually go to the Apify website and click "Run" for each game you want social data for
- You wait for the scraper to finish (usually 1-5 minutes)
- You download the results as a JSON or CSV file
- You manually process/import that data into your system

**Step-by-step example:**
1. Game happens: "Grizzlies vs. Trail Blazers" on Tuesday night
2. Wednesday morning, you want social data for that game
3. You log into Apify website
4. You find the "Twitter Scraper" Actor
5. You enter search terms: "Grizzlies Trail Blazers"
6. You click "Start" button
7. You wait 2-3 minutes for it to finish
8. You download the results file (JSON or CSV)
9. You open that file and copy/paste or import the data into your system

**When to use this:**
- Testing the system
- One-off requests for specific games
- Low volume (a few games per week)
- You don't mind doing it manually

**Cost:**
- You only pay for what you use (pay-per-use)
- No monthly subscription required
- Each run costs ~$0.24-$0.45 per game
- If you run 10 games manually, you pay ~$2.40-$4.50 total
- You can use the Free plan's $5 credit for this

**Pros:**
- No subscription needed
- Full control over when/what to scrape
- Good for testing
- Pay only for what you use

**Cons:**
- Manual work (you have to do it yourself each time)
- Not automated
- Time-consuming if you need data for many games
- Easy to forget to do it

---

### Option 2: Scheduled Runs (Automated)

**What it means:**
- You set up Actors to run automatically on a schedule (e.g., every day at 9 AM)
- Apify automatically scrapes data for games that happened
- Apify sends the data to your server via webhook (like a notification)
- Your server receives the data and processes it automatically

**Step-by-step example:**
1. You configure Apify to run "Twitter Scraper" every day at 9 AM
2. You set up a webhook URL (e.g., `https://your-server.com/webhook/apify`)
3. Every morning at 9 AM, Apify automatically:
   - Runs the Twitter scraper for yesterday's games
   - Gets the results
   - Sends the data to your webhook URL
4. Your server receives the data and stores it in your database
5. You don't have to do anything - it's all automatic

**When to use this:**
- You want it automated
- You need data for many games regularly
- You want it to happen without manual work

**Cost:**
- Requires a subscription plan (Starter $39/month or higher)
- Plus pay-per-use costs (~$0.24-$0.45 per game)
- Example: $39/month subscription + $22.50 for 50 games = $61.50/month total

**Pros:**
- Fully automated
- No manual work
- Runs on schedule automatically
- Data arrives automatically

**Cons:**
- Requires subscription
- More expensive
- Need to set up webhook endpoint on your server
- Less control over individual runs

---

### Option 3: API Integration

**What it means:**
- You write code that calls Apify's API
- Your code automatically triggers scrapers when needed
- Data comes back via API response
- Fully integrated into your system

**Step-by-step example:**
1. A game finishes: "Grizzlies vs. Trail Blazers"
2. Your system automatically detects the game is over
3. Your code calls Apify's API:
   ```javascript
   const result = await apify.actor('twitter-scraper').call({
     searchQueries: ['Grizzlies Trail Blazers']
   });
   ```
4. Apify runs the scraper and returns data via API
5. Your code processes the data and stores it
6. Everything happens automatically in your code

**When to use this:**
- You want full programmatic control
- You want to trigger scrapers based on game events
- You're building a fully automated system
- You want data immediately when games finish

**Cost:**
- Requires a subscription plan (Starter $39/month or higher)
- Plus pay-per-use costs (~$0.24-$0.45 per game)
- Same as Option 2, but more flexible

**Pros:**
- Fully integrated with your code
- Trigger scrapers programmatically
- Get data immediately when needed
- Most flexible option

**Cons:**
- Requires subscription
- Need to write code to integrate
- More complex setup
- More expensive

### Example Integration Code

```javascript
// Trigger Apify Actor via API
const apifyClient = require('apify-client');

const client = new apifyClient.ApifyClient({
  token: 'YOUR_APIFY_TOKEN'
});

async function getSocialDataForGame(game) {
  const matchup = `${game.awayTeam} vs ${game.homeTeam}`;
  
  // Run Twitter scraper
  const twitterRun = await client.actor('apify/twitter-scraper').call({
    searchQueries: [matchup, `#${game.awayTeam}`, `#${game.homeTeam}`],
    maxTweets: 100
  });
  
  // Get results
  const twitterData = await client.dataset(twitterRun.defaultDatasetId).listItems();
  
  // Run Reddit scraper
  const redditRun = await client.actor('apify/reddit-scraper').call({
    subreddits: ['nba'],
    searchQuery: matchup,
    maxPosts: 50
  });
  
  const redditData = await client.dataset(redditRun.defaultDatasetId).listItems();
  
  return {
    twitter: twitterData.items,
    reddit: redditData.items
  };
}
```

---

## Cost Optimization Tips

1. **Use Free Plan for Testing**: Start with free $5 credit to test
2. **Batch Requests**: Scrape multiple games in one run if possible
3. **Limit Results**: Only get what you need (e.g., top 50 tweets vs 500)
4. **Cache Results**: Don't re-scrape the same game multiple times
5. **Choose Right Plan**: Scale plan ($199) is better value if using >$200/month

---

## Alternatives to Apify

### 1. **Reddit API (Free)**
- Official Reddit API is free
- Rate limits: 60 requests/minute
- **Cost**: $0
- **Best for**: Reddit data only

### 2. **Twitter API (Paid)**
- Twitter API v2: $100/month for basic tier
- Rate limits: Varies by tier
- **Cost**: $100-$5,000+/month
- **Best for**: Official Twitter data

### 3. **Custom Scrapers (Your RSS.app Clone)**
- Use your existing browser scraping system
- **Cost**: $0 (just server costs)
- **Best for**: If you can handle the complexity

### 4. **Bright Data / Oxylabs**
- Enterprise scraping services
- **Cost**: $500+/month
- **Best for**: Large-scale, enterprise needs

---

## Recommendation

**For your use case (social data for games):**

1. **Start with Free Plan** ($0, $5 credit)
   - Test with a few games
   - See if data quality meets your needs

2. **If it works, upgrade to Starter** ($39/month)
   - Can handle ~50 games/month
   - Good for testing the "Perspectives" feature

3. **For production, consider Scale** ($199/month)
   - Can handle 200+ games/month
   - Better CU pricing ($0.25 vs $0.30)

4. **Use Reddit API for Reddit** (Free)
   - Reddit API is free and reliable
   - Only use Apify for Twitter/Instagram

**Estimated Monthly Cost:**
- **Light usage (10-20 games)**: $0-$39/month
- **Medium usage (50-100 games)**: $39-$199/month
- **Heavy usage (200+ games)**: $199-$999/month

---

## Next Steps

1. **Sign up for Apify** (free account)
2. **Test with one game** using free credits
3. **Evaluate data quality** and usefulness
4. **Decide on plan** based on usage
5. **Integrate with your system** via API or webhooks

---

## Questions to Consider

1. **How many games per day/week/month?**
   - This determines which plan you need

2. **Which platforms are most important?**
   - Twitter? Reddit? Both? Instagram?

3. **How fresh does data need to be?**
   - Real-time during games? Or post-game analysis?

4. **What's your budget?**
   - Free plan for testing? Or ready to pay $39-$199/month?

Let me know if you want help setting up a specific Actor or integrating it with your system!

