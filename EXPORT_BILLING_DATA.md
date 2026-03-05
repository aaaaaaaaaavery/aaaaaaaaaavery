# How to Export GCP Billing Data for Analysis

## Quick Method: Export CSV (5 minutes)

### Steps:

1. **Go to Billing Console**:
   ```
   https://console.cloud.google.com/billing
   ```

2. **Select Your Billing Account**:
   - Click on your billing account (you should see "flashlive-daily-scraper" mentioned)

3. **Navigate to Reports**:
   - Click "Reports" in the left sidebar

4. **Set Time Range**:
   - Use the date picker to select: **January 1, 2025 - January 31, 2026** (or your desired range)

5. **Choose Grouping**:
   - Click "Group by" dropdown
   - Select one of:
     - **Service** - To see costs per service (Cloud Run, App Engine, etc.)
     - **Project** - To see costs per project
     - **SKU** - For detailed line-item breakdown

6. **Export CSV**:
   - Click the **"Download CSV"** button (top right of the table)
   - The CSV will download with all the data

### What's in the CSV:

- Date range
- Service/Project name
- Usage cost
- Savings (if any)
- Subtotal
- Currency

---

## Detailed Method: BigQuery Export (Best for Analysis)

### Step 1: Enable BigQuery Export

1. **Go to Billing Export**:
   ```
   https://console.cloud.google.com/billing
   ```
   - Select your billing account
   - Click **"Billing export"** in left menu
   - Click **"Export to BigQuery"** tab

2. **Create Dataset** (if needed):
   ```bash
   gcloud alpha billing projects describe flashlive-daily-scraper
   # Note your billing account ID
   
   # Create BigQuery dataset
   bq mk --dataset --location=us-central1 PROJECT_ID:billing_export
   ```

3. **Enable Export**:
   - In the Billing Export page
   - Select your dataset (or create new one)
   - Click **"Save"**
   - Wait ~24 hours for data to start appearing

### Step 2: Query in BigQuery

Go to: https://console.cloud.google.com/bigquery

#### Query 1: Costs by Service (Current Month)
```sql
SELECT 
  service.description as service_name,
  SUM(cost) as total_cost,
  currency,
  COUNT(*) as line_items
FROM `flashlive-daily-scraper.billing_export.gcp_billing_export_resource_v1_XXXXXX`
WHERE 
  _PARTITIONTIME >= TIMESTAMP('2026-01-01')
  AND _PARTITIONTIME < TIMESTAMP('2026-02-01')
GROUP BY service_name, currency
ORDER BY total_cost DESC;
```

**Note**: Replace `XXXXXX` with your actual table ID (check in BigQuery console)

#### Query 2: Daily Costs by Service
```sql
SELECT 
  DATE(usage_start_time) as date,
  service.description as service_name,
  SUM(cost) as daily_cost,
  currency
FROM `flashlive-daily-scraper.billing_export.gcp_billing_export_resource_v1_XXXXXX`
WHERE 
  _PARTITIONTIME >= TIMESTAMP('2026-01-01')
  AND _PARTITIONTIME < TIMESTAMP('2026-02-01')
GROUP BY date, service_name, currency
ORDER BY date DESC, daily_cost DESC;
```

#### Query 3: Costs by Project
```sql
SELECT 
  project.name as project_name,
  service.description as service_name,
  SUM(cost) as total_cost,
  currency
FROM `flashlive-daily-scraper.billing_export.gcp_billing_export_resource_v1_XXXXXX`
WHERE 
  _PARTITIONTIME >= TIMESTAMP('2026-01-01')
  AND _PARTITIONTIME < TIMESTAMP('2026-02-01')
GROUP BY project_name, service_name, currency
ORDER BY total_cost DESC;
```

#### Query 4: Detailed SKU Breakdown
```sql
SELECT 
  service.description as service_name,
  sku.description as sku_name,
  SUM(cost) as total_cost,
  SUM(usage.amount) as usage_amount,
  usage.unit as unit,
  currency
FROM `flashlive-daily-scraper.billing_export.gcp_billing_export_resource_v1_XXXXXX`
WHERE 
  _PARTITIONTIME >= TIMESTAMP('2026-01-01')
  AND _PARTITIONTIME < TIMESTAMP('2026-02-01')
GROUP BY service_name, sku_name, unit, currency
ORDER BY total_cost DESC
LIMIT 50;
```

### Step 3: Export Query Results

1. After running a query in BigQuery
2. Click **"Save results"** button
3. Choose **"CSV (local file)"**
4. Download the file

---

## Alternative: Use Billing API

### Install Billing API Client:

```bash
# Enable Billing API
gcloud services enable cloudbilling.googleapis.com

# Get billing account ID
gcloud billing accounts list

# Export costs using API
gcloud alpha billing accounts get-usage \
  BILLING_ACCOUNT_ID \
  --start-time=2026-01-01 \
  --end-time=2026-02-01
```

### Python Script Example:

```python
from google.cloud import billing_v1
from datetime import datetime

# Initialize client
client = billing_v1.CloudBillingClient()

# Get billing account
billing_account = "billingAccounts/BILLING_ACCOUNT_ID"

# Note: Billing API doesn't directly export costs
# Use BigQuery export or Console CSV export instead
```

---

## Recommended Approach

**For Quick Analysis**: Use CSV export from Console (Method 1)
- Fastest way to get data
- Good enough for most analysis
- Can do it right now

**For Deep Analysis**: Set up BigQuery export (Method 2)
- Best for historical trend analysis
- Can create custom queries
- Better for monthly reports
- Takes ~24 hours to set up

---

## What to Do with Exported Data

1. **Import to Excel/Google Sheets**:
   - Open CSV in spreadsheet
   - Create pivot tables by service/project
   - Visualize trends

2. **Compare Month-over-Month**:
   - Export January 2025, January 2026
   - Compare service costs
   - Identify increases

3. **Identify Anomalies**:
   - Look for unexpected spikes
   - Compare day-by-day costs
   - Find which service caused increases

4. **Share with Team**:
   - Export and share CSV
   - Create summary reports
   - Document optimization decisions

---

## Quick Command Reference

```bash
# List billing accounts
gcloud billing accounts list

# Get project billing info
gcloud beta billing projects describe flashlive-daily-scraper

# List services and costs (requires BigQuery export)
# Use BigQuery console or SQL queries above
```

---

## Need Help?

If you have trouble exporting:
1. Make sure you have "Billing Account Viewer" or "Billing Account User" role
2. Check that billing export is enabled
3. Verify date range includes data
4. Try a smaller date range first
