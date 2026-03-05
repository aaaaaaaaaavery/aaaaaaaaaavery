#!/bin/bash
PROJECT="flashlive-daily-scraper"
echo "GCP Quick Cost Audit for project: $PROJECT"
echo "--------------------------------------------"
TOTAL_COST=0

# Cloud Run rough cost assumptions
HOURS=$((24*30))
CPU_PER_HOUR=0.10
MEM_PER_GB_HOUR=0.01
REQ_COST=0.40

for SVC in $(gcloud run services list --project=$PROJECT --format="value(SERVICE)"); do
  CPU_COST=$(echo "$CPU_PER_HOUR * $HOURS" | bc)
  MEM_COST=$(echo "$MEM_PER_GB_HOUR * $HOURS * 0.5" | bc)
  COST=$(echo "$CPU_COST + $MEM_COST + $REQ_COST" | bc)
  TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
  echo "Cloud Run: $SVC → \$${COST}"
done

# Cloud Functions rough cost assumptions
CF_MEM_GB=0.25
CF_EXEC_SEC=0.1
CF_INVOC_COST=0.40
CF_UNIT_PRICE=0.0000025

for FUNC in $(gcloud functions list --project=$PROJECT --format="value(NAME)"); do
  EXEC_COST=$(echo "$CF_MEM_GB * $CF_EXEC_SEC / 0.1 * $CF_UNIT_PRICE * 10000000" | bc)
  COST=$(echo "$EXEC_COST + $CF_INVOC_COST" | bc)
  TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
  echo "Cloud Function: $FUNC → \$${COST}"
done

# GCR Docker images
TOTAL_BYTES=0
for IMAGE in $(gcloud container images list --repository=gcr.io/$PROJECT --format="get(NAME)"); do
  for DIGEST in $(gcloud container images list-tags $IMAGE --format="get(DIGEST)"); do
    SIZE=$(gcloud container images describe $IMAGE@$DIGEST --format="get(image_summary.size_bytes)")
    SIZE=${SIZE:-0}
    TOTAL_BYTES=$((TOTAL_BYTES + SIZE))
  done
done
TOTAL_GB=$(echo "scale=2; $TOTAL_BYTES/1024/1024/1024" | bc)
GCR_COST=$(echo "scale=2; $TOTAL_GB*0.10" | bc)
TOTAL_COST=$(echo "$TOTAL_COST + $GCR_COST" | bc)
echo "GCR storage → $TOTAL_GB GB → \$${GCR_COST}"

# Cloud Storage buckets
for BUCKET in $(gsutil ls -p $PROJECT); do
  SIZE=$(gsutil du -s $BUCKET | awk '{print $1}')
  SIZE=${SIZE:-0}
  SIZE_GB=$(echo "scale=2; $SIZE/1024/1024/1024" | bc)
  COST=$(echo "scale=2; $SIZE_GB*0.02" | bc)
  TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
  echo "Cloud Storage: $BUCKET → ${SIZE_GB} GB → \$${COST}"
done

echo "--------------------------------------------"
echo "ROUGH TOTAL ESTIMATED MONTHLY COST: \$${TOTAL_COST}"
echo "--------------------------------------------"

