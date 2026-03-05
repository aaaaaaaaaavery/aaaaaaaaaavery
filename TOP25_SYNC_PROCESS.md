# Top 25 Rankings Sync Process

## Overview

The Top 25 rankings sync is now integrated into `channel-lookup-deploy/index.js` and uses the **same alias matching logic** as channel lookup. This ensures consistent team name matching across the system.

## How It Works

### 1. Strict Alias Matching

**Key Principle**: Teams can ONLY match rankings if they're in the **same alias group**.

- ✅ `Iowa St.` → canonical `Iowa State` → matches ranking `Iowa State` → canonical `Iowa State` ✓
- ✅ `Iowa St` → canonical `Iowa State` → matches ranking `Iowa State` → canonical `Iowa State` ✓
- ❌ `Florida` → canonical `Florida` → does NOT match ranking `Florida State` → canonical `Florida State` ✗
- ❌ `Florida St.` → canonical `Florida State` → does NOT match ranking `Florida` → canonical `Florida` ✗

### 2. The Process

When you run the channel lookup function, it automatically:

1. **Loads alias mappings** from Firestore
2. **Matches channels** from Google Sheets to games
3. **Syncs Top 25 rankings** to games (for NCAAM and NCAAW only)

### 3. Matching Logic

#### Building Rankings Map:
- For each ranking team name (e.g., "Iowa State"):
  - Get canonical name from alias mappings → "Iowa State"
  - Normalize → "iowa state"
  - Store ranking under "iowa state"

#### Matching Game Teams:
- For each game team name (e.g., "Iowa St."):
  - Get canonical name from alias mappings → "Iowa State"
  - Normalize → "iowa state"
  - Look up in rankings map → finds ranking under "iowa state"
  - **STRICT CHECK**: Verify ranking's canonical name matches game team's canonical name
  - Match! ✓

#### Preventing False Matches:
- Game team "Florida" → canonical "Florida" → normalized "florida"
- Ranking "Florida State" → canonical "Florida State" → normalized "florida state"
- Lookup "florida" in map → finds "florida state" entry
- **STRICT CHECK**: "Florida" !== "Florida State" → **NO MATCH** ✗

## Setup Process

### Step 1: Set Up Alias Mappings

In your Google Sheet, make sure teams are in separate alias groups:

```
NCAAM | Iowa State | Iowa St | Iowa St.
NCAAM | Florida State | Florida St | Florida St. | FSU
NCAAM | Florida | Florida
```

**CRITICAL**: "Florida" and "Florida State" must be in **separate rows** (different alias groups).

### Step 2: Load Mappings to Firestore

```bash
node load-supplemental-team-mappings.cjs
```

### Step 3: Scrape Top 25 Rankings

```bash
node scrape-ncaam-standings.cjs
node scrape-ncaaw-standings.cjs
```

### Step 4: Run Channel Lookup (Includes Top 25 Sync)

The channel lookup function now automatically syncs Top 25 rankings:

```bash
# Deploy and trigger the channel-lookup function
# OR run locally if you have the setup
```

## Troubleshooting

### Issue: Iowa State Not Showing Ranking

**Check**:
1. Is "Iowa State" in your alias mappings?
2. Is the ranking stored in Firestore with team name "Iowa State" (or one of its aliases)?
3. Does the game team name map to canonical "Iowa State"?

**Fix**: Make sure your alias mapping includes all variations:
```
NCAAM | Iowa State | Iowa St | Iowa St.
```

### Issue: Arkansas Ranking on Kansas

**Check**:
1. Are "Arkansas" and "Kansas" in separate alias groups?
2. Are the rankings stored correctly in Firestore?

**Fix**: Ensure they're in separate rows in your Google Sheet (different canonical names).

### Issue: Florida and Florida State Both Getting Same Ranking

**Root Cause**: They're in the same alias group OR matching logic isn't strict enough.

**Fix**: 
1. Make sure they're in **separate rows** in your Google Sheet:
   ```
   NCAAM | Florida State | Florida St | Florida St. | FSU
   NCAAM | Florida | Florida
   ```
2. The new strict matching ensures "Florida" (canonical "Florida") will NOT match "Florida State" (canonical "Florida State")

## How Strict Matching Works

The matching logic ensures:

1. **If team is in alias mappings**:
   - Get canonical name (e.g., "Florida St." → "Florida State")
   - Only match rankings with the **same canonical name**
   - "Florida" (canonical "Florida") ≠ "Florida State" (canonical "Florida State") → NO MATCH

2. **If team is NOT in alias mappings**:
   - Use team name as-is
   - Only match rankings also not in mappings
   - Prevents cross-contamination between mapped and unmapped teams

## Key Functions

- `getCanonicalNameFromAlias(name, league)` - Returns canonical name if team is in mappings, null otherwise
- `normalizeTeamName(name, league)` - Normalizes team name using alias mappings
- `loadTop25Rankings(leagueKey)` - Loads rankings and builds map using canonical names
- `syncTop25ToGames(leagueKey)` - Matches game teams to rankings using strict canonical name matching

## Important Notes

1. **NCAAF stays hardcoded** - NCAAF rankings don't use alias mappings
2. **Strict matching only** - Teams only match if canonical names match exactly
3. **No substring matching** - "Kansas" will never match "Arkansas"
4. **Separate alias groups** - "Florida" and "Florida State" must be in separate rows
