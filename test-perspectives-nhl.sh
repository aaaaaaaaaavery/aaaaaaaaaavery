#!/bin/bash
# Test Perspectives Pipeline for NHL

curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
  -H "Content-Type: application/json" \
  -d '{
    "league": "NHL",
    "keywordSource": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyIIgOCR5htCszBylkLxwx41MSrVZ61t_xw9FmzVSTi7tiFSS9-cQObaRPuQQi9WgzC4uRIhV1il6C/pub?gid=0&single=true&output=csv"
  }'

