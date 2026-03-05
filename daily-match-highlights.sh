#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   YOUTUBE_API_KEY="your_key" ./daily-match-highlights.sh "March 5, 2026"
# If date is omitted, this script uses yesterday (America/New_York) for NBA/NHL.
# Premier League uses each game's own date from premierleague.json.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MATCHER="$ROOT_DIR/match-youtube-highlights.cjs"
DEFAULT_DATE="$(TZ=America/New_York date -v-1d '+%B %-d, %Y' 2>/dev/null || TZ=America/New_York date -d 'yesterday' '+%B %-d, %Y')"
DATE_ARG="${1:-$DEFAULT_DATE}"

NBA_PLAYLIST="PLlVlyGVtvuVlek5UOvwJaRDtuAI1FgGZf"
NHL_PLAYLIST="PL1NbHSfosBuFyu867mbHHhB2G6fx7jtiH"
PREMIER_LEAGUE_PLAYLIST="PLXEMPXZ3PY1hMzinDc1TvSm8U2NUyz-0E"

if [[ ! -f "$MATCHER" ]]; then
  echo "Error: matcher script not found at $MATCHER"
  exit 1
fi

if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  echo "Error: set YOUTUBE_API_KEY environment variable first."
  echo "Example:"
  echo "  export YOUTUBE_API_KEY='your_key_here'"
  exit 1
fi

run_match() {
  local json_file="$1"
  local playlist_id="$2"
  local league_name="$3"

  echo ""
  echo "[highlights] Matching $league_name videos for date: $DATE_ARG"

  YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --playlist "$playlist_id" \
    --date "$DATE_ARG"
}

run_match_per_game_date() {
  local json_file="$1"
  local playlist_id="$2"
  local league_name="$3"
  local title_filter="$4"

  echo ""
  echo "[highlights] Matching $league_name videos using per-game dates from JSON"

  YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --playlist "$playlist_id" \
    --usePerGameDate true \
    --titleMustInclude "$title_filter"
}

run_match "$ROOT_DIR/recaps-manual/daily/nba.json" "$NBA_PLAYLIST" "NBA"
run_match "$ROOT_DIR/recaps-manual/daily/nhl.json" "$NHL_PLAYLIST" "NHL"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/premierleague.json" "$PREMIER_LEAGUE_PLAYLIST" "Premier League" "premier league highlights"

echo ""
echo "Done. Updated files:"
echo "- recaps-manual/daily/nba.json"
echo "- recaps-manual/daily/nhl.json"
echo "- recaps-manual/daily/premierleague.json"
