#!/bin/zsh

PROJECT="flashlive-daily-scraper"
gcloud config set project "$PROJECT" > /dev/null

TOTAL_BYTES=0

repos=$(gcloud artifacts repositories list --project="$PROJECT" --format="value(name,location,format)")

for repo_info in $repos; do
  REPO_NAME=$(echo $repo_info | cut -d' ' -f1)
  REPO_LOC=$(echo $repo_info | cut -d' ' -f2)
  REPO_FORMAT=$(echo $repo_info | cut -d' ' -f3)
  
  if [ "$REPO_FORMAT" = "DOCKER" ]; then
    images=$(gcloud artifacts docker images list "$REPO_LOC-docker.pkg.dev/$PROJECT/$REPO_NAME" --format="value(NAME)")
    for IMAGE in $images; do
      SIZE=$(gcloud artifacts docker images describe "$IMAGE" --format="get(imageSizeBytes)")
      TOTAL_BYTES=$((TOTAL_BYTES + SIZE))
    done
  fi
done

TOTAL_GB=$(echo "scale=2; $TOTAL_BYTES/1024/1024/1024" | bc)
MONTHLY_COST=$(echo "scale=2; $TOTAL_GB*0.10" | bc)

echo "----------------------------------------------------"
echo "Project: $PROJECT"
echo "Total Artifact Registry storage (Docker repos only): $TOTAL_GB GB"
echo "Estimated monthly cost: $${MONTHLY_COST}"
echo "----------------------------------------------------"

