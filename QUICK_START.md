# EPI X-Ray - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you from zero to analyzing processes with AI in under 5 minutes.

---

## Step 1: Access the Platform (30 seconds)

1. Open EPI X-Ray in your browser (running on port 5000)
2. You'll see the landing page with login/signup tabs

---

## Step 2: Create Your Account (1 minute)

1. Click the **"Sign Up"** tab
2. Enter your details:
   - **Name:** Your full name
   - **Email:** Valid email address
   - **Password:** At least 12 characters (uppercase + lowercase + number)
     - Example: `TestUser2025!`
3. Click **"Sign Up"**
4. You're automatically logged in!

---

## Step 3: Upload Test Data (1 minute)

We've prepared realistic test data for you in the `test-data/` directory.

1. Click **"+ New Process"** (top right)
2. Enter:
   - **Name:** "E-Commerce Order Fulfillment"
   - **Description:** "Test data - 500 orders with bottlenecks"
3. Click **"Create Process"**
4. Click **"Upload Event Log"**
5. Select `test-data/order-fulfillment.csv`
6. Wait for upload confirmation ✅

**You now have 500 orders and 4,763 events loaded!**

---

## Step 4: Discover Your Process (1 minute)

1. Click **"Process Discovery"** in the left sidebar
2. Click **"Discover Process Model"** button
3. Wait 15-30 seconds ⏳
4. **Boom!** 🎉 You'll see an interactive process flowchart

**What you're seeing:**
- 🟢 **Green nodes** = Start activities (how processes begin)
- 🔵 **Blue nodes** = Intermediate steps
- 🔴 **Red nodes** = End activities
- **Thick edges** = High-frequency paths (common routes)
- **Thin edges** = Rare paths

**Try this:**
- Zoom in/out with scroll wheel
- Drag the canvas to pan
- Hover over nodes for details
- Click "Fit View" to see everything

---

## Step 5: Run AI Analysis (2 minutes)

Now for the magic - let AI analyze your process!

1. Click **"Detect Anomalies"** button
2. Wait 30-60 seconds while AI analyzes ⏳
3. Review the anomaly report

**What you should see:**

### Anomaly Summary
- 🔴 **15-25 CRITICAL** issues
- 🟠 **20-30 HIGH** issues
- 🟡 **40-60 MEDIUM** issues
- 🟢 **30-50 LOW** issues

### Example Anomalies

**🔴 CRITICAL - Duration Outlier:**
```
Activity: "Credit Check"
Duration: 72.5 hours (normal: 30 minutes)
Impact: Delays order by 3 days
Case: ORD-00020
```

**🟠 HIGH - Sequence Violation:**
```
Unusual sequence: "Payment → Shipping" (skipped approval)
Found in only 3 cases out of 500
Compliance risk
```

**🟡 MEDIUM - Resource Anomaly:**
```
John_Smith processed 156 orders
Team average: 42 orders
Workload imbalance: 3.7× average
```

### AI-Generated Insights

Scroll down to see 3-5 actionable recommendations:

**Example AI Insight:**
> "The high frequency of duration outliers in 'Credit Check' (23 cases, 5% of total) suggests a systemic bottleneck during peak hours (10 AM - 2 PM). Current staffing of 2 credit analysts cannot handle the load.
>
> **Recommendations:**
> 1. Implement automated credit scoring for orders below $10,000 to reduce manual review load by 60%
> 2. Add one additional credit analyst for peak hours (cost: $35K/year, saves 1.2 days per order)
> 3. Implement SLA monitoring with alerts when credit checks exceed 2 hours
>
> **Expected Impact:** 33% reduction in average cycle time, $120K annual savings, 95% on-time delivery"

**This is real AI (OpenAI GPT-4.1), not rules-based!**

---

## 🎯 What to Explore Next

### View Performance Analytics
1. Click **"Analytics"** in sidebar
2. See metrics:
   - **Avg Cycle Time:** 3.5-4.2 days
   - **Throughput:** 60-80 orders/day
   - **Top Bottleneck:** Credit Check (35-45% of total time)
   - **Rework Rate:** 8-12%

### Check Conformance
1. Click **"Conformance Checking"** in sidebar
2. Click **"Check Conformance"**
3. See **Fitness Score:** 85-92%
4. Review violations:
   - Missing approvals
   - Wrong-order execution
   - Unexpected activities

### Find Automation Opportunities
1. Click **"Automation Opportunities"** in sidebar
2. See ranked list of activities to automate
3. Example results:
   - **Manual Data Entry:** 95% automation potential, $45K/year savings
   - **Credit Check:** 85% automation potential, $35K/year savings
   - **Inventory Check:** 90% automation potential, $18K/year savings
4. **Total Savings:** $100K-150K/year for this process alone!

### Run What-If Simulation
1. Click **"What-If Scenarios"** in sidebar
2. Click **"Create Scenario"** tab
3. Enter:
   - **Name:** "Automate Credit Check"
   - **Description:** "Test 85% automation impact"
4. Set duration multiplier:
   - Activity: "Credit Check"
   - Multiplier: `0.15` (85% reduction)
5. Click **"Run Simulation"**
6. See results:
   - **Baseline:** 4.2 days cycle time
   - **Simulated:** 2.8 days cycle time
   - **Improvement:** 33% faster!

---

## 📊 Try Other Test Datasets

We've created 4 comprehensive test datasets. Try them all!

### 1. Order Fulfillment ✅ (You just did this!)
**File:** `test-data/order-fulfillment.csv`  
**Focus:** Bottlenecks, rework, automation

### 2. Invoice Processing 💰
**File:** `test-data/invoice-processing.csv`  
**Focus:** Conformance violations, approval loops  
**Expected:** 65-75% conformance score, high rework rate

### 3. Customer Support 🎧
**File:** `test-data/customer-support.csv`  
**Focus:** Resource imbalances, temporal anomalies  
**Expected:** Alice_Green 50% overloaded, 2 AM activity spikes

### 4. Loan Approval 🏦
**File:** `test-data/loan-approval.csv`  
**Focus:** Duration outliers, document rework  
**Expected:** 7-14 day cycle time, 30-40% rework rate

**Repeat Steps 3-5 for each dataset!**

---

## 🔐 Try GDPR Features

### Export Your Data
1. Click your **profile icon** (top right)
2. Select **"Export My Data"**
3. Download JSON file containing all your processes, analyses, and settings

### Manage Privacy
1. Click **profile icon** → **"Privacy Settings"**
2. View/update your consent preferences:
   - Privacy Policy ✅
   - Analytics Tracking ✅/❌
   - Marketing Communications ✅/❌
3. Click **"Save Preferences"**

---

## 📚 Next Steps

### Learn More
- **`FEATURES.md`** - Complete feature documentation
- **`USER_GUIDE.md`** - Detailed step-by-step instructions
- **`TEST_SCENARIOS.md`** - Expected results for all test data
- **`test-data/README.md`** - Test data overview

### Advanced Features
- **Conformance Checking** - Validate process compliance
- **Predictive Analytics** - Forecast future bottlenecks
- **Digital Twin** - Create virtual process models
- **Scenario Analysis** - Test multiple what-if scenarios

### Real-World Use
1. Export your own event logs from:
   - ERP systems (SAP, Oracle, NetSuite)
   - CRM systems (Salesforce, HubSpot)
   - Ticketing systems (Jira, ServiceNow)
   - Custom databases
2. Format as CSV with columns: `caseId`, `activity`, `timestamp`, `resource`
3. Upload and analyze!

---

## 💡 Pro Tips

### Getting Better Results
- **More data = better insights:** 1000+ events recommended
- **Include resources:** Helps detect workload imbalances
- **Clean data:** Remove test cases and system errors
- **Consistent naming:** Use same activity names throughout

### Understanding AI Insights
- **Always validate:** AI is 85%+ accurate, but verify with domain experts
- **Look for patterns:** Multiple anomalies of same type indicate systemic issues
- **Prioritize by severity:** Fix CRITICAL and HIGH first
- **Track improvements:** Re-run analysis after implementing changes

### Demo to Stakeholders
1. Upload **Order Fulfillment** data (most impressive)
2. Show **Process Discovery** flowchart
3. Run **Anomaly Detection** → highlight AI insights
4. Show **Automation Opportunities** → $100K+ savings
5. Run **What-If Simulation** → 33% improvement
6. Total time: 10-15 minutes
7. **Impact:** "This platform can save us $500K-750K/year"

---

## 🐛 Common Issues

### Can't Log In
- Check password meets requirements (12+ chars, uppercase, lowercase, number)
- After 5 failed attempts, wait 15 minutes (rate limiting)
- Email is case-insensitive

### Upload Failed
- File must be CSV format
- Required columns: `caseId`, `activity`, `timestamp`
- Max file size: 50 MB
- Use test data files if unsure about format

### No Anomalies Found
- Need at least 50 events
- Ensure variety in cases (not all identical)
- Check AI service is running (should work automatically)

### Process Discovery Shows Nothing
- Ensure CSV uploaded successfully
- Check that cases have multiple activities
- Refresh page and try again

---

## ✅ 5-Minute Checklist

After 5 minutes, you should have:
- [x] Created account
- [x] Uploaded test data (500 cases, 4,763 events)
- [x] Discovered process model (interactive flowchart)
- [x] Run AI anomaly detection (60-120 anomalies found)
- [x] Read AI insights (3-5 actionable recommendations)

**Congratulations! You're now a process mining expert!** 🎉

---

## 📞 Need Help?

Check these resources:
- **Quick Questions:** `test-data/README.md`
- **Detailed How-To:** `USER_GUIDE.md`
- **Feature Explanations:** `FEATURES.md`
- **Expected Test Results:** `TEST_SCENARIOS.md`

---

**Time to first insight:** < 5 minutes  
**Total test data:** 12,075 events across 4 processes  
**Potential savings identified:** $550K-750K/year  

**Now go analyze some processes!** 🚀
