# Live-Polling Optimization Analysis

## User's Desired Optimization

1. ✅ **Poll once at the beginning of the day** to list all games, and move scores to yesterday's section
2. ✅ **Start polling live games every 5 minutes** once the games are live
3. ❌ **Only poll every 5 minutes the games that are live** (not scheduled or final)

---

## Current Implementation Status

### ✅ **Partially Implemented:**

1. **Morning Run Detection** (Line 2950-2951)
   - ✅ Detects if it's the morning run by checking if today's games exist
   - ✅ Morning run fetches ALL games and imports Google Sheets games
   - ✅ Morning run cleans up old games (moves them to yesterday's section)

2. **Filtering During Polling** (Lines 4237-4270)
   - ✅ Filters OUT scheduled games during polling runs
   - ✅ Only processes live/final games during polling
   - ✅ Skips scheduled games when writing to Firestore

### ❌ **NOT Optimized Yet:**

1. **API Fetching Optimization** (Lines 3000-4168)
   - ❌ Still fetches **ALL games** from ESPN API for today on every polling run
   - ❌ Then filters them client-side after fetching
   - ❌ Should only fetch games that are already known to be live

2. **Firestore Read Optimization** (Line 4225, 4293-4300)
   - ❌ Still reads **ALL today's games** from Firestore on every poll
   - ❌ Still reads **ALL games for multiple dates** (for deletion checking)
   - ❌ Should only read games that are live, or skip if no live games exist

---

## Current Flow (Polling Run)

1. **Morning Run Detection** (✅ Works)
   - Checks if today's games exist → if not, it's morning run

2. **API Fetching** (❌ Not Optimized)
   - Fetches ALL games from ESPN API for today
   - Fetches ALL leagues/dates configured
   - Cost: ~200-500 API calls per execution

3. **Firestore Read** (❌ Not Optimized)
   - Reads ALL today's games from Firestore (line 4225)
   - Reads ALL games for multiple dates (lines 4293-4300)
   - Cost: ~800-4,000 Firestore reads per execution

4. **Filtering** (✅ Works)
   - Filters out scheduled games
   - Only processes live/final games
   - But already fetched/read them all!

5. **Write Updates** (✅ Works)
   - Only writes changed games
   - Skips unchanged games

---

## What's Missing: Optimal Flow (Polling Run)

### **Step 1: Check for Live Games First**
Before fetching anything, check Firestore for games that are:
- Currently IN PROGRESS
- Or scheduled for today (within next 2 hours)

### **Step 2: Only Fetch Live Games**
- If no live games exist → skip API fetch entirely
- If live games exist → only fetch those specific game IDs from ESPN API
- Don't fetch all games and filter them

### **Step 3: Skip Unnecessary Firestore Reads**
- Only read games that are currently live (for comparison)
- Don't read all games for all dates unless checking deletions

---

## Current Cost Impact

**Per Polling Execution (every 5 minutes):**
- API calls: ~200-500 calls (fetching all games)
- Firestore reads: ~800-4,000 reads (reading all games)
- Firestore writes: ~50-200 writes (only changed games)

**Daily (288 executions):**
- API calls: ~57,600-144,000 calls/day
- Firestore reads: ~230,400-1,152,000 reads/day
- Cost: ~$0.35/day (~$10.50/month) for Firestore reads

---

## Potential Savings with Full Optimization

**If we only fetch/read live games:**

**Per Polling Execution (assuming ~10-20 live games):**
- API calls: ~10-20 calls (only live games)
- Firestore reads: ~10-20 reads (only live games)
- Firestore writes: ~10-20 writes (only changed games)

**Daily (288 executions, assuming average 15 live games):**
- API calls: ~4,320 calls/day (95% reduction!)
- Firestore reads: ~4,320 reads/day (96% reduction!)
- Cost: ~$0.002/day (~$0.06/month) for Firestore reads

**Potential Savings: ~$10.44/month (~99% reduction)**

---

## Implementation Plan

### **Option 1: Check Firestore First (Recommended)**
1. Before fetching from ESPN API, query Firestore for games with:
   - `gameDate == today` AND `Match Status == 'IN PROGRESS'`
2. If no live games → skip API fetch, exit early
3. If live games exist → only fetch those specific game IDs from ESPN API
4. Only read those specific games from Firestore for comparison

### **Option 2: Cache Live Game IDs**
1. Keep a list of live game IDs in memory (or a separate Firestore collection)
2. On polling run, only fetch those game IDs
3. Update the list as games go live/final

### **Option 3: Hybrid Approach**
1. Morning run: Fetch all games (unchanged)
2. Polling runs: 
   - First check Firestore for live games
   - If no live games → skip
   - If live games → only fetch those game IDs
   - Also check for scheduled games within next 2 hours (to discover new live games)

---

## Recommendation

**Implement Option 1 (Check Firestore First)**
- Easiest to implement
- Biggest cost savings
- Minimal code changes
- Most reliable (Firestore is source of truth)

**Code Changes Needed:**
1. Add early exit if no live games exist (before API fetch)
2. Query Firestore for live game IDs first
3. Only fetch those game IDs from ESPN API
4. Optimize Firestore reads to only read those specific games
