# Artifact Registry Cost Optimization Guide

## Current Situation
- **Cost**: $17.94/month
- **Storage**: ~180 GB
- **Services**: 15 Cloud Run services
- **Average per service**: ~12 GB

---

## 🎯 Optimization Strategies (Beyond Just Keeping 1 Image)

### Strategy 1: Use Smaller Base Images ⭐ **HIGHEST IMPACT**

**Current**: Most services use `node:20-slim` (~200-250 MB)
**Better**: Use `node:20-alpine` (~50-70 MB)

**Savings**: ~70-80% reduction in base image size = **~$12-14/month saved**

#### Example Optimization:

**Before (node:20-slim):**
```dockerfile
FROM node:20-slim
# Base image: ~200-250 MB
```

**After (node:20-alpine):**
```dockerfile
FROM node:20-alpine
# Base image: ~50-70 MB
# Savings: ~150-180 MB per image
```

**Note**: Alpine uses musl libc instead of glibc. Most Node.js apps work fine, but some native modules may need adjustment.

**For services with Chromium** (flashlive-scraper, rss-feed-service):
- Alpine doesn't have Chromium packages easily available
- **Alternative**: Use `node:20-slim` but optimize Chromium installation
- Or use `mcr.microsoft.com/playwright:v1.40.0-focal` (smaller than installing Chromium manually)

---

### Strategy 2: Multi-Stage Builds ⭐ **HIGH IMPACT**

Build in one stage, copy only runtime files to final stage.

**Savings**: Removes build dependencies, node_modules dev dependencies = **~$5-8/month saved**

#### Example Optimization:

**Before:**
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production  # Includes all dependencies
COPY . .
CMD ["node", "index.js"]
```

**After (Multi-stage):**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Runtime stage
FROM node:20-alpine
WORKDIR /app
# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
# Copy only necessary files
COPY package*.json ./
COPY index.js ./
# Remove unnecessary files
RUN rm -rf /app/node_modules/.cache
CMD ["node", "index.js"]
```

**Benefits**:
- Removes build tools and dev dependencies
- Smaller final image
- Faster deployments

---

### Strategy 3: Optimize Chromium Installation ⭐ **HIGH IMPACT**

Your services that need Chromium are the biggest images. Optimize them:

**Current approach** (rss-feed-service):
```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    # ... 20+ packages
    && rm -rf /var/lib/apt/lists/*
```

**Optimized approach**:
```dockerfile
# Use Playwright base image (includes Chromium, optimized)
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Or use minimal Chromium installation
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        chromium-browser \
        fonts-liberation \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*
```

**Savings**: ~30-40% reduction in Chromium-related images = **~$5-7/month saved**

---

### Strategy 4: Use .dockerignore Files ⭐ **MEDIUM IMPACT**

Prevent copying unnecessary files into images.

**Create `.dockerignore` in each service:**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
*.md
.DS_Store
coverage
.vscode
.idea
*.test.js
*.spec.js
test/
tests/
__tests__/
```

**Savings**: ~10-20% reduction per image = **~$2-3/month saved**

---

### Strategy 5: Combine RUN Commands ⭐ **SMALL IMPACT**

Reduce Docker layers (each layer adds overhead).

**Before:**
```dockerfile
RUN apt-get update
RUN apt-get install -y chromium
RUN rm -rf /var/lib/apt/lists/*
```

**After:**
```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends chromium && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/* && \
    rm -rf /var/tmp/*
```

**Savings**: ~5-10% reduction = **~$1-2/month saved**

---

### Strategy 6: Set Up Lifecycle Policies ⭐ **HIGH IMPACT**

Automatically delete old images after X days.

**Using gcloud CLI:**
```bash
# Set lifecycle policy to keep only last 3 versions, delete older than 30 days
gcloud artifacts docker images list \
  --repository=YOUR_REPO_NAME \
  --location=us-central1 \
  --project=flashlive-daily-scraper \
  --format="value(package,version)" | \
  sort -k1,1 -k2,2r | \
  awk 'NR>3 {print $1":"$2}' | \
  xargs -I {} gcloud artifacts docker images delete {} \
    --repository=YOUR_REPO_NAME \
    --location=us-central1 \
    --quiet
```

**Or use Artifact Registry Lifecycle Policies** (if available):
```yaml
# lifecycle-policy.yaml
version: 1
action:
  type: DELETE
  condition:
    olderThan: 30d
    tagState: TAGGED
    tagPrefixes:
      - "latest"
```

**Savings**: Automatic cleanup = **~$5-10/month saved** (keeps only what you need)

---

### Strategy 7: Use Cloud Build with Automatic Cleanup ⭐ **MEDIUM IMPACT**

Configure Cloud Build to automatically delete old images after deployment.

**Update `cloudbuild.yaml`:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/flashlive-scraper:$SHORT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['tag', 'gcr.io/$PROJECT_ID/flashlive-scraper:$SHORT_SHA', 'gcr.io/$PROJECT_ID/flashlive-scraper:latest']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/flashlive-scraper:$SHORT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/flashlive-scraper:latest']
  # Cleanup: Delete images older than 30 days
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - '-c'
      - |
        # Delete images older than 30 days (keep latest 3)
        gcloud artifacts docker images list \
          --repository=YOUR_REPO \
          --location=us-central1 \
          --format="value(package,version,create_time)" | \
          awk -v cutoff=$(date -d '30 days ago' -u +%Y-%m-%dT%H:%M:%S) \
          '$3 < cutoff {print $1":"$2}' | \
          head -n -3 | \
          xargs -r -I {} gcloud artifacts docker images delete {} \
            --repository=YOUR_REPO \
            --location=us-central1 \
            --quiet || true
```

**Savings**: Automatic cleanup = **~$3-5/month saved**

---

### Strategy 8: Delete Unused Services ⭐ **HIGH IMPACT**

Fewer services = less storage needed.

**Services to delete** (from DELETE_UNUSED_SERVICES.md):
- channel-lookup
- fetchandstoreevents
- fetchtodaygames
- fetchtomorrowgames
- fetchupcominggames
- flashlive-archiver
- flashlive-poller
- flashlive-scraper-test
- flashlive-scraper-v2
- import-from-sheets
- parsefuturegames
- polllivegames

**Savings**: ~12 services × ~12 GB = ~144 GB = **~$14/month saved**

**After deletion**: Keep only:
- flashlive-scraper
- rss-feed-service (if needed)
- standings-fetcher

---

### Strategy 9: Use Distroless Images (Advanced) ⭐ **MEDIUM IMPACT**

For services that don't need shell/package manager.

**Example:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage (distroless)
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY index.js ./
CMD ["index.js"]
```

**Benefits**:
- Extremely small (~20-30 MB)
- More secure (no shell, no package manager)
- **Note**: Only works if you don't need Chromium or other system packages

**Savings**: ~60-70% reduction = **~$3-5/month saved** (for services that can use it)

---

### Strategy 10: Compress Images Before Push ⭐ **SMALL IMPACT**

Use Docker's compression or external tools.

**Option A: Use Docker BuildKit compression:**
```bash
DOCKER_BUILDKIT=1 docker build --compress -t image:tag .
```

**Option B: Use dive to analyze and optimize:**
```bash
# Analyze image layers
dive image:tag
# Remove unnecessary layers/files
```

**Savings**: ~5-10% reduction = **~$1-2/month saved**

---

## 📊 Combined Optimization Impact

### If You Implement All Strategies:

| Strategy | Monthly Savings | Difficulty |
|----------|----------------|------------|
| **1. Alpine base images** | $12-14 | Easy |
| **2. Multi-stage builds** | $5-8 | Medium |
| **3. Optimize Chromium** | $5-7 | Medium |
| **4. .dockerignore** | $2-3 | Easy |
| **5. Combine RUN commands** | $1-2 | Easy |
| **6. Lifecycle policies** | $5-10 | Medium |
| **7. Cloud Build cleanup** | $3-5 | Medium |
| **8. Delete unused services** | $14 | Easy |
| **9. Distroless (where possible)** | $3-5 | Hard |
| **10. Compression** | $1-2 | Easy |
| **TOTAL POTENTIAL** | **$41-58/month** | |

**New Artifact Registry Cost**: **$0-5/month** (down from $17.94/month)

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (This Week)
1. ✅ **Delete unused services** → Save $14/month
2. ✅ **Add .dockerignore files** → Save $2-3/month
3. ✅ **Set up lifecycle policies** → Save $5-10/month
4. **Total Phase 1 Savings**: **$21-27/month**

### Phase 2: Image Optimization (Next Week)
5. ✅ **Switch to Alpine base images** → Save $12-14/month
6. ✅ **Multi-stage builds** → Save $5-8/month
7. ✅ **Optimize Chromium installation** → Save $5-7/month
8. **Total Phase 2 Savings**: **$22-29/month**

### Phase 3: Advanced (Optional)
9. ✅ **Cloud Build cleanup** → Save $3-5/month
10. ✅ **Distroless for simple services** → Save $3-5/month

---

## 📝 Specific Recommendations for Your Services

### flashlive-scraper (Main Service)
**Current**: `node:20-slim` + Chromium (~500 MB-1 GB)
**Optimized**:
```dockerfile
# Use Playwright base image (includes optimized Chromium)
FROM mcr.microsoft.com/playwright:v1.40.0-focal
# Or use Alpine + minimal Chromium
FROM node:20-alpine
RUN apk add --no-cache chromium
```
**Savings**: ~40-50% reduction = **~$3-5/month**

### rss-feed-service
**Current**: `node:20-slim` + Chromium + many packages (~800 MB-1.2 GB)
**Optimized**: Same as flashlive-scraper
**Savings**: ~40-50% reduction = **~$3-5/month**

### standings-fetcher
**Current**: `node:20-slim` (~200-250 MB)
**Optimized**: `node:20-alpine` (~50-70 MB)
**Savings**: ~70% reduction = **~$1-2/month**

### yesterday-scores
**Current**: `node:20-alpine` ✅ (already optimized!)
**No changes needed**

---

## 🚀 Implementation Script

Create a script to optimize all Dockerfiles:

```bash
#!/bin/bash
# optimize-dockerfiles.sh

# 1. Add .dockerignore to all services
for dir in */; do
  if [ -f "$dir/Dockerfile" ]; then
    cat > "$dir/.dockerignore" << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
*.md
.DS_Store
coverage
.vscode
.idea
*.test.js
*.spec.js
test/
tests/
__tests__/
EOF
    echo "Created .dockerignore for $dir"
  fi
done

# 2. List current image sizes
echo "Current image sizes:"
gcloud artifacts docker images list \
  --repository=YOUR_REPO \
  --location=us-central1 \
  --format="table(package,version,create_time,image_size_bytes)"
```

---

## ✅ Expected Results

**Current**: $17.94/month (~180 GB)
**After Phase 1**: $0-3/month (~0-30 GB)
**After Phase 2**: $0-2/month (~0-20 GB)

**Total Savings**: **$15-18/month** (85-100% reduction)

---

## 🔍 How to Verify Savings

```bash
# Check current storage
gcloud artifacts docker images list \
  --repository=YOUR_REPO \
  --location=us-central1 \
  --format="value(image_size_bytes)" | \
  awk '{sum+=$1} END {print "Total: " sum/1024/1024/1024 " GB"}'

# After optimizations, check again
# Should see significant reduction
```

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Artifact Registry Pricing](https://cloud.google.com/artifact-registry/pricing)
- [Alpine Linux](https://alpinelinux.org/)
- [Distroless Images](https://github.com/GoogleContainerTools/distroless)
