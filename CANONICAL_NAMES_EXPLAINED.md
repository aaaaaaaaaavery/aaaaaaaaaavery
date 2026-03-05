# What Are "Canonical Names"?

## Simple Definition

A **canonical name** is the **single, preferred display name** that all variations of a team name map to. It's the "master" name that represents the team.

## In Your Google Sheet

In your Google Sheet, the **canonical name** is what you put in **Column B** (the "Display Name" column).

### Example 1: Iowa State

```
Row in Google Sheet:
Column A: NCAAM
Column B: Iowa State          ← This is the CANONICAL NAME
Column C: Iowa St.
Column D: Iowa St
Column E: ISU
```

**What this means:**
- All variations (`Iowa St.`, `Iowa St`, `ISU`) map to the canonical name: **`Iowa State`**
- When the system sees any of these variations, it converts them to `Iowa State`
- The canonical name `Iowa State` is what gets displayed and used for matching

### Example 2: Florida vs Florida State (Different Teams!)

```
Row 1:
Column A: NCAAM
Column B: Florida State       ← CANONICAL NAME #1
Column C: Florida St.
Column D: Florida St
Column E: FSU

Row 2:
Column A: NCAAM
Column B: Florida              ← CANONICAL NAME #2 (DIFFERENT!)
Column C: (empty)
```

**What this means:**
- `Florida St.` → canonical name: **`Florida State`**
- `Florida` → canonical name: **`Florida`**
- These are **different canonical names**, so they represent **different teams**
- The system uses canonical names to prevent `Florida` from matching `Florida State`

## How It Works in Code

### When Building Rankings Map:

1. Ranking comes in as: `"Iowa St."`
2. System looks up in alias mappings: `"Iowa St."` → finds canonical name: **`"Iowa State"`**
3. System stores ranking under normalized canonical name: `"iowa state"`

### When Matching Game Teams:

1. Game team is: `"Iowa St"`
2. System looks up in alias mappings: `"Iowa St"` → finds canonical name: **`"Iowa State"`**
3. System normalizes: `"Iowa State"` → `"iowa state"`
4. System looks up in rankings map: finds ranking under `"iowa state"`
5. **STRICT CHECK**: Does ranking's canonical name (`"Iowa State"`) match game team's canonical name (`"Iowa State"`)? **YES** → Match! ✓

### Preventing False Matches:

1. Game team is: `"Florida"`
2. System looks up: `"Florida"` → finds canonical name: **`"Florida"`**
3. System normalizes: `"Florida"` → `"florida"`
4. System looks up in rankings map: finds ranking under `"florida state"` (from `"Florida State"` ranking)
5. **STRICT CHECK**: Does ranking's canonical name (`"Florida State"`) match game team's canonical name (`"Florida"`)? **NO** → **BLOCKED** ✗

## Key Points

1. **Canonical name = Column B** in your Google Sheet
2. **All variations map to ONE canonical name**
3. **Different canonical names = different teams**
4. **Matching only happens if canonical names match exactly**

## Why This Matters

Without canonical names, you'd have problems like:
- `"Florida"` matching `"Florida State"` rankings (wrong!)
- `"Kansas"` matching `"Arkansas"` rankings (wrong!)
- `"Iowa St."` not matching `"Iowa State"` rankings (missing match!)

With canonical names:
- `"Florida"` → canonical `"Florida"` ≠ `"Florida State"` → canonical `"Florida State"` → **NO MATCH** ✓
- `"Iowa St."` → canonical `"Iowa State"` = `"Iowa State"` → canonical `"Iowa State"` → **MATCH** ✓

## Visual Example

```
Google Sheet:
┌─────────┬─────────────────┬──────────────┬─────────────┐
│ League │ Display Name    │ Variation 1  │ Variation 2 │
├─────────┼─────────────────┼──────────────┼─────────────┤
│ NCAAM   │ Iowa State      │ Iowa St.     │ Iowa St     │ ← Canonical: "Iowa State"
│ NCAAM   │ Florida State   │ Florida St.  │ FSU         │ ← Canonical: "Florida State"
│ NCAAM   │ Florida         │ (none)       │ (none)      │ ← Canonical: "Florida"
└─────────┴─────────────────┴──────────────┴─────────────┘

When system sees "Iowa St.":
  → Looks up in mappings
  → Finds canonical name: "Iowa State"
  → Uses "Iowa State" for all matching

When system sees "Florida":
  → Looks up in mappings
  → Finds canonical name: "Florida"
  → Uses "Florida" for matching
  → Will NOT match "Florida State" (different canonical name!)
```

## Summary

- **Canonical name** = The "master" name from Column B
- **All variations** (Columns C, D, E, etc.) map to the canonical name
- **Matching happens** only when canonical names match exactly
- **Different canonical names** = different teams (prevents false matches)
