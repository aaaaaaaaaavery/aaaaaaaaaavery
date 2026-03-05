#!/bin/bash

PROJECT="flashlive-daily-scraper"
echo "--------------------------------------------"
echo "GCP Cost Audit & Rough Estimates for project: $PROJECT"
echo "--------------------------------------------"

TOTAL_COST=0

# 1️⃣ Cloud Run services
echo ""
echo "=== Cloud Run Services ==="
gcloud run services list --project=$PROJECT --format="table(SERVICE, REGION, URL, LAST_DEPLOYED_BY, LAST_DEPLOYED_AT)" | tee cloudrun_list.txt

CLOUD_RUN_ESTIMATE=0
while read SERVICE REGION URL LAST_DEPLOYED_BY LAST_DEPLOYED_AT; do
  # skip header
  [[ "$SERVICE" == "SERVICE" ]] && continue
  # Rough estimate: assume 1 vCPU, 512MB RAM, 24/7
  CPU_COST=$(echo "scale=2; 1*24*30*0.10" | bc)    # 1 vCPU-hour $0.10
  MEM_COST=$(echo "scale=2; 0.5*24*30*0.01" | bc)   # 0.5GB RAM
  REQUESTS_COST=0.4  # assume 1M requests
  SERVICE_COST=$(echo "$CPU_COST + $MEM_COST + $REQUESTS_COST" | bc)
  CLOUD_RUN_ESTIMATE=$(echo "$CLOUD_RUN_ESTIMATE + $SERVICE_COST" | bc)
  echo "  $SERVICE → Rough estimated monthly cost: $${SERVICE_COST}"
done < cloudrun_list.txt
TOTAL_COST=$(echo "$TOTAL_COST + $CLOUD_RUN_ESTIMATE" | bc)
rm cloudrun_list.txt

# 2️⃣ Cloud Functions
echo ""
echo "=== Cloud Functions ==="
gcloud functions list --project=$PROJECT --format="table(NAME, STATE, TRIGGER, REGION, ENVIRONMENT)" | tee functions_list.txt

CF_ESTIMATE=0
while read NAME STATE TRIGGER REGION ENVIRONMENT; do
  [[ "$NAME" == "NAME" ]] && continue
  # Rough estimate: 256MB, 100ms execution, 1M invocations
  EXEC_COST=$(echo "scale=4; (256/1024)*0.0000025*100" | bc)
  INVOC_COST=0.40  # 1M invocations
  FUNC_COST=$(echo "$EXEC_COST + $INVOC_COST" | bc)
  CF_ESTIMATE=$(echo "$CF_ESTIMATE + $FUNC_COST" | bc)
  echo "  $NAME → Rough estimated monthly cost: $${FUNC_COST}"
done < functions_list.txt
TOTAL_COST=$(echo "$TOTAL_COST + $CF_ESTIMATE" | bc)
rm functions_list.txt

# 3️⃣ GCR / Artifact Registry Docker images
echo ""
echo "=== GCR / Artifact Registry Docker Images ==="
TOTAL_BYTES=0
for IMAGE in $(gcloud container images list --repository=gcr.io/$PROJECT --format="get(NAME)"); do
  echo "Repository: $IMAGE"
  for DIGEST in $(gcloud container images list-tags $IMAGE --format="get(DIGEST)"); do
    SIZE=$(gcloud container images describe $IMAGE@$DIGEST --format="get(image_summary.size_bytes)")
    SIZE=${SIZE:-0}
    TOTAL_BYTES=$((TOTAL_BYTES + SIZE))
    SIZE_MB=$(echo "scale=2; $SIZE/1024/1024" | bc)
    echo "  Digest: $DIGEST → Size: ${SIZE_MB} MB"
  done
done
TOTAL_GB=$(echo "scale=2; $TOTAL_BYTES/1024/1024/1024" | bc)
GCR_COST=$(echo "scale=2; $TOTAL_GB*0.10" | bc)
echo "Estimated GCR storage cost: $${GCR_COST}"
TOTAL_COST=$(echo "$TOTAL_COST + $GCR_COST" | bc)

# 4️⃣ Cloud Storage buckets
echo ""
echo "=== Cloud Storage Buckets ==="
for BUCKET in $(gsutil ls -p $PROJECT); do
  SIZE=$(gsutil du -s $BUCKET | awk '{print $1}')
  SIZE=${SIZE:-0}
  SIZE_MB=$(echo "scale=2; $SIZE/1024/1024" | bc)
  SIZE_GB=$(echo "scale=2; $SIZE/1024/1024/1024" | bc)
  COST=$(echo "scale=2; $SIZE_GB*0.02" | bc)  # standard storage
  echo "$BUCKET → Size: ${SIZE_MB} MB → Estimated monthly cost: $${COST}"
  TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
done

echo ""
echo "--------------------------------------------"
echo "ROUGH TOTAL ESTIMATED MONTHLY COST: $${TOTAL_COST}"
echo "--------------------------------------------"
echo "- Cloud Run and Cloud Functions estimates assume light usage. Real cost may vary based on traffic."
echo "- Storage and GCR estimates based on current sizes and typical pricing."
echo "- For exact costs, check GCP Billing Reports or enable BigQuery billing export."

