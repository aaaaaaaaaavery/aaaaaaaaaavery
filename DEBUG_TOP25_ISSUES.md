# Debugging Top 25 Ranking Issues

## What Was Changed

1. **Added debug logging** to see exactly what's happening during matching
2. **Ensured alias mappings are loaded** before syncing rankings
3. **Strict canonical name matching** - teams only match if canonical names match exactly

## How to Debug

When you run the channel lookup function, you'll now see detailed logs:

### When Building Rankings Map:
```
📊 Ranking #2: "Iowa State" → canonical "Iowa State" → normalized "iowa state"
📊 Ranking #17: "Arkansas" → canonical "Arkansas" → normalized "arkansas"
📊 Ranking #19: "Florida" → canonical "Florida" → normalized "florida"
```

### When Matching Games:
```
🔍 Processing game: Iowa St vs Kansas
  ✅ Matched: "Iowa St" → canonical "Iowa State" → rank 2 (ranking: "Iowa State")
  ⚠️  No ranking found for "Kansas" → canonical "Kansas" → normalized "kansas"
```

### When Blocking False Matches:
```
🔍 Processing game: Florida vs Florida State
  ❌ BLOCKED: "Florida" → canonical "Florida" vs ranking "Florida State" → canonical "Florida State" (different canonical names)
  ✅ Matched: "Florida State" → canonical "Florida State" → rank 19 (ranking: "Florida State")
```

## Common Issues to Check

### Issue 1: Iowa State Not Matching

**Check the logs for**:
- Does ranking show: `"Iowa State" → canonical "Iowa State"`?
- Does game show: `"Iowa St" → canonical "Iowa State"`?
- Are they both normalized to `"iowa state"`?

**If not matching**:
- Check your alias mapping: Does it include `Iowa St` → `Iowa State`?
- Run: `node load-supplemental-team-mappings.cjs`

### Issue 2: Arkansas Ranking on Kansas

**Check the logs for**:
- Does ranking show: `"Arkansas" → canonical "Arkansas"`?
- Does game show: `"Kansas" → canonical "Kansas"`?
- Are they normalized differently? (`"arkansas"` vs `"kansas"`)

**If matching incorrectly**:
- Check if "Kansas" is somehow in the same alias group as "Arkansas"
- Check your Google Sheet - they should be in separate rows

### Issue 3: Florida Matching Florida State

**Check the logs for**:
- Does ranking show: `"Florida" → canonical "Florida"`?
- Does ranking show: `"Florida State" → canonical "Florida State"`?
- Does game show: `"Florida" → canonical "Florida"`?
- Does it show: `❌ BLOCKED: different canonical names`?

**If matching incorrectly**:
- Check your Google Sheet - are they in separate rows?
- Check if both have different canonical names in the mappings
- The logs will show if canonical names match (they shouldn't)

## What the Logs Tell You

1. **✅ Matched**: Correct match - canonical names match
2. **❌ BLOCKED**: False match prevented - canonical names don't match (this is GOOD!)
3. **⚠️ No ranking found**: Team name not found in rankings map (either not ranked or alias issue)

## Next Steps

1. **Run the function** and check the logs
2. **Look for the problematic teams** (Iowa State, Arkansas/Kansas, Florida/Florida State)
3. **Check what canonical names are being used**
4. **Verify your alias mappings** match what the logs show

## Expected Behavior

- **Iowa St** → canonical **Iowa State** → matches ranking **Iowa State** ✓
- **Arkansas** → canonical **Arkansas** → matches ranking **Arkansas** ✓
- **Kansas** → canonical **Kansas** → matches ranking **Kansas** ✓
- **Florida** → canonical **Florida** → matches ranking **Florida** ✓
- **Florida State** → canonical **Florida State** → matches ranking **Florida State** ✓
- **Florida** → canonical **Florida** → does NOT match ranking **Florida State** ✗ (BLOCKED)
- **Florida State** → canonical **Florida State** → does NOT match ranking **Florida** ✗ (BLOCKED)
