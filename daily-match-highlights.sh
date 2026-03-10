#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   YOUTUBE_API_KEY="your_key" ./daily-match-highlights.sh "March 5, 2026"
# If date is omitted, this script uses yesterday (America/New_York) for NBA/NHL.
# Premier League uses each game's own date from premierleague.json.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MATCHER="$ROOT_DIR/match-youtube-highlights.cjs"
DEFAULT_DATE="$(TZ=America/New_York date -v-1d '+%B %-d, %Y' 2>/dev/null || TZ=America/New_York date -d 'yesterday' '+%B %-d, %Y')"
TODAY_DATE="$(TZ=America/New_York date '+%B %-d, %Y')"
DATE_ARG="${1:-$DEFAULT_DATE}"

NBA_PLAYLIST="PLlVlyGVtvuVlek5UOvwJaRDtuAI1FgGZf"
NHL_PLAYLIST="PL1NbHSfosBuFyu867mbHHhB2G6fx7jtiH"
PREMIER_LEAGUE_PLAYLIST="PLXEMPXZ3PY1hMzinDc1TvSm8U2NUyz-0E"
MLS_PLAYLIST="PLcj4z4KsbIoXrLpj2pOVr_maRaxhW902-"
LIGAMX_PLAYLIST="PL5MdN4O9NWTWAqny6JWloIRfS4DNAdb3U"
SERIEA_PLAYLIST="PLFTjYT0jsEKzS9FjcjjoKjihaqZ0uEyKP"
BUNDESLIGA_PLAYLIST="PL3uJGozO1imdWwTzbnNXTuiXbLJhFb83r"
LIGUE1_PLAYLIST="PL5dXR9bHuKvnWwEHClY5GL3QDzKEn4av_"
FACUP_PLAYLIST="PLvnfVnc10KYh8PapZ5DXB-xy0Q8yH0Qay"
LALIGA_PLAYLIST="PLKj1QUtwqLN-i1rzwTy60ukT1vxHOyrEe"
SUPERLIG_PLAYLIST="PLREq_OnJpFaRT2WY8UTDz-Bbty-BQIMmj"
WBC_PLAYLIST="PLL-lmlkrmJal3m1rov-FXlDLLaHpPJL6L"
WBC_CHANNEL_URL="https://www.youtube.com/@MLB/videos"
FACUP_CHANNEL_URL="https://www.youtube.com/@thefacup/videos"
WTA_CHANNEL_URL="https://www.youtube.com/@WTA/videos"
NCAAM_PLAYLISTS="https://www.youtube.com/playlist?list=PL2RRF9GtC9s1v7L7tO5Astcl4Z8xq3BqQ,https://youtube.com/playlist?list=PLn3nHXu50t5zIzgZhRCXRsZcRIfapIxEV,https://youtube.com/playlist?list=PLhh7fyF6r5qVV2_RonsHodwkwe-GGt_Jl,https://youtube.com/playlist?list=PLSrXjFYZsRuMeW1ttMkXz4cQy9bap9fIB,https://youtube.com/playlist?list=PLmkjXprBSRGMmLrdClEpgvhPQ2DijUXG6,https://youtube.com/playlist?list=PL1Vg1LQKb_yhAKOVNRK2hCBmYuDQdf1K6,https://youtube.com/playlist?list=PLSoN6Th-EepNAj-4G-KbtcJB4w3Q__KOb"
LIV_PLAYLIST="https://www.youtube.com/playlist?list=PLoWyc6xDZR3XkJnpIwPJfcMeO9bThLvsV"

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

FAILED_MATCHES=0

run_matcher_cmd() {
  local league_name="$1"
  shift

  if ! "$@"; then
    echo "[highlights] Warning: $league_name match step failed; continuing."
    FAILED_MATCHES=$((FAILED_MATCHES + 1))
  fi
}

run_match() {
  local json_file="$1"
  local playlist_id="$2"
  local league_name="$3"

  echo ""
  echo "[highlights] Matching $league_name videos for date: $DATE_ARG"

  if [[ ! -s "$json_file" ]]; then
    echo "[highlights] Skipping $league_name: JSON file is missing or empty ($json_file)"
    return 0
  fi

  run_matcher_cmd "$league_name" env YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --playlist "$playlist_id" \
    --date "$DATE_ARG"
}

run_match_with_filter() {
  local json_file="$1"
  local playlist_id="$2"
  local league_name="$3"
  local title_filter="$4"

  echo ""
  echo "[highlights] Matching $league_name videos for date: $DATE_ARG"

  if [[ ! -s "$json_file" ]]; then
    echo "[highlights] Skipping $league_name: JSON file is missing or empty ($json_file)"
    return 0
  fi

  run_matcher_cmd "$league_name" env YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --playlist "$playlist_id" \
    --date "$DATE_ARG" \
    --titleMustInclude "$title_filter"
}

run_match_per_game_date() {
  local json_file="$1"
  local playlist_id="$2"
  local league_name="$3"
  local title_filter="${4:-}"
  local max_date_drift_days="${5:-}"
  local max_video_age_hours="${6:-}"

  echo ""
  echo "[highlights] Matching $league_name videos using per-game dates from JSON"

  if [[ ! -s "$json_file" ]]; then
    echo "[highlights] Skipping $league_name: JSON file is missing or empty ($json_file)"
    return 0
  fi

  local cmd=(env YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --playlist "$playlist_id" \
    --usePerGameDate true)

  if [[ -n "$title_filter" ]]; then
    cmd+=(--titleMustInclude "$title_filter")
  fi

  if [[ -n "$max_date_drift_days" ]]; then
    cmd+=(--maxDateDriftDays "$max_date_drift_days")
  fi

  if [[ -n "$max_video_age_hours" ]]; then
    cmd+=(--maxVideoAgeHours "$max_video_age_hours")
  fi

  run_matcher_cmd "$league_name" "${cmd[@]}"
}

run_match_per_game_date_channel() {
  local json_file="$1"
  local channel_url="$2"
  local league_name="$3"
  local title_filter="$4"

  echo ""
  echo "[highlights] Matching $league_name videos from channel using per-game dates from JSON"

  if [[ ! -s "$json_file" ]]; then
    echo "[highlights] Skipping $league_name: JSON file is missing or empty ($json_file)"
    return 0
  fi

  run_matcher_cmd "$league_name" env YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --channelUrl "$channel_url" \
    --usePerGameDate true \
    --titleMustInclude "$title_filter"
}

run_match_array_league() {
  local json_file="$1"
  local league_key="$2"
  local playlist_id="$3"
  local league_name="$4"
  local title_filter="$5"
  local run_date="$6"

  echo ""
  echo "[highlights] Matching $league_name videos from playlist for selected league entry"

  if [[ ! -s "$json_file" ]]; then
    echo "[highlights] Skipping $league_name: JSON file is missing or empty ($json_file)"
    return 0
  fi

  run_matcher_cmd "$league_name" env YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --leagueKey "$league_key" \
    --playlist "$playlist_id" \
    --date "$run_date" \
    --titleMustInclude "$title_filter"
}

run_match_array_league_channel() {
  local json_file="$1"
  local league_key="$2"
  local channel_url="$3"
  local league_name="$4"
  local title_filter="$5"
  local run_date="$6"

  echo ""
  echo "[highlights] Matching $league_name videos from channel for selected league entry"

  if [[ ! -s "$json_file" ]]; then
    echo "[highlights] Skipping $league_name: JSON file is missing or empty ($json_file)"
    return 0
  fi

  run_matcher_cmd "$league_name" env YOUTUBE_API_KEY="$YOUTUBE_API_KEY" node "$MATCHER" \
    --json "$json_file" \
    --leagueKey "$league_key" \
    --channelUrl "$channel_url" \
    --date "$run_date" \
    --titleMustInclude "$title_filter"
}

run_match "$ROOT_DIR/recaps-manual/daily/nba.json" "$NBA_PLAYLIST" "NBA"
run_match "$ROOT_DIR/recaps-manual/daily/nhl.json" "$NHL_PLAYLIST" "NHL"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/premierleague.json" "$PREMIER_LEAGUE_PLAYLIST" "Premier League" "premier league highlights"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/mls.json" "$MLS_PLAYLIST" "MLS" "highlights"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/ligamx.json" "$LIGAMX_PLAYLIST" "Liga MX" "" "" "48"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/seriea.json" "$SERIEA_PLAYLIST" "Serie A" "serie a"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/bundesliga.json" "$BUNDESLIGA_PLAYLIST" "Bundesliga" "bundesliga"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/ligue1.json" "$LIGUE1_PLAYLIST" "Ligue 1" "ligue 1" "2"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/facup.json" "$FACUP_PLAYLIST" "FA Cup" "fa cup"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/laliga.json" "$LALIGA_PLAYLIST" "LaLiga" "laliga"
run_match_per_game_date "$ROOT_DIR/recaps-manual/daily/superlig.json" "$SUPERLIG_PLAYLIST" "Super Lig" "super lig"
run_match_per_game_date_channel "$ROOT_DIR/recaps-manual/daily/wbc.json" "$WBC_CHANNEL_URL" "WBC" "world baseball classic"

echo ""
echo "Done. Updated files:"
echo "- recaps-manual/daily/nba.json"
echo "- recaps-manual/daily/nhl.json"
echo "- recaps-manual/daily/premierleague.json"
echo "- recaps-manual/daily/mls.json"
echo "- recaps-manual/daily/ligamx.json"
echo "- recaps-manual/daily/seriea.json"
echo "- recaps-manual/daily/bundesliga.json"
echo "- recaps-manual/daily/ligue1.json"
echo "- recaps-manual/daily/facup.json"
echo "- recaps-manual/daily/laliga.json"
echo "- recaps-manual/daily/superlig.json"
echo "- recaps-manual/daily/wbc.json"

if [[ "$FAILED_MATCHES" -gt 0 ]]; then
  echo ""
  echo "Completed with warnings: $FAILED_MATCHES league match step(s) failed."
fi
