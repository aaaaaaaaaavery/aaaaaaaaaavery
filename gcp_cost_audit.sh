#!/bin/bash

PROJECT="flashlive-daily-scraper"
echo "--------------------------------------------"
echo "GCP Cost Audit for project: $PROJECT"
echo "--------------------------------------------"

# 1️⃣ Cloud Run services
echo ""
echo "=== Cloud Run Services ==="
gcloud run services list --project=$PROJECT --format="table(SERVICE, REGION, URL, LAST_DEPLOYED_BY, LAST_DEPLOYED_AT)"

# 2️⃣ Cloud Functions
echo ""
echo "=== Cloud Functions ==="
gcloud functions list --project=$PROJECT --format="table(NAME, STATE, TRIGGER, REGION, ENVIRONMENT)"

# 3️⃣ GCR / Artifact Registry Docker images
echo ""
echo "=== GCR / Artifact Registry Docker Images (sizes) ==="
for IMAGE in $(gcloud container images list --repository=gcr.io/$PROJECT --format="get(NAME)"); do
  echo "Repository: $IMAGE"
  for DIGEST in $(gcloud container images list-tags $IMAGE --format="get(DIGEST)"); do
    SIZE=$(gcloud container images describe $IMAGE@$DIGEST --format="get(image_summary.size_bytes)")
    SIZE=${SIZE:-0}
    SIZE_MB=$(echo "scale=2; $SIZE/1024/1024" | bc)
    echo "  Digest: $DIGEST → Size: ${SIZE_MB} MB"
  done
done

# 4️⃣ Cloud Storage buckets
echo ""
echo "=== Cloud Storage Buckets ==="
for BUCKET in $(gsutil ls -p $PROJECT); do
  SIZE=$(gsutil du -s $BUCKET | awk '{print $1}')
  SIZE_MB=$(echo "scale=2; $SIZE/1024/1024" | bc)
  echo "$BUCKET → ${SIZE_MB} MB"
done

echo ""
echo "=== Notes ==="
echo "- Cloud Run and Cloud Functions: cost depends on CPU, memory, invocations, and uptime."
echo "- Storage / GCR: only charged if images or buckets are non-empty."
echo "- App Engine / Compute Engine: not detected (likely $0 unless you enable)."
echo "--------------------------------------------"




