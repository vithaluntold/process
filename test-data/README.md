# Test Data for EPI X-Ray Platform

## 📊 Quick Overview

This directory contains **4 comprehensive test datasets** designed to showcase all features of the EPI X-Ray process mining platform. Each dataset represents a realistic business process with intentional patterns, anomalies, and optimization opportunities.

---

## 📁 Files

| File | Process | Cases | Events | Purpose |
|------|---------|-------|--------|---------|
| `order-fulfillment.csv` | E-Commerce Orders | 500 | 4,763 | Bottlenecks, rework, automation |
| `invoice-processing.csv` | Accounts Payable | 300 | 2,309 | Conformance violations, approval loops |
| `customer-support.csv` | Help Desk Tickets | 400 | 2,591 | Resource imbalances, temporal anomalies |
| `loan-approval.csv` | Loan Applications | 200 | 2,412 | Duration outliers, document rework |

**Total:** 1,400 cases, 12,075 events

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Log In
Open EPI X-Ray and log in (or create an account)

### Step 2: Create Process
1. Click **"+ New Process"**
2. Name: "Order Fulfillment Test"
3. Click **"Create"**

### Step 3: Upload Data
1. Click **"Upload Event Log"**
2. Select `order-fulfillment.csv`
3. Wait for upload confirmation

### Step 4: Discover Process
1. Click **"Discover Process Model"**
2. Wait 15-30 seconds
3. View interactive flowchart

### Step 5: Run AI Analysis
1. Click **"Detect Anomalies"**
2. Wait 30-60 seconds
3. Review AI insights

**You should see:**
- 🔴 15-25 CRITICAL anomalies (duration outliers in Credit Check)
- 🟠 20-30 HIGH anomalies (sequence violations)
- 🟡 40-60 MEDIUM anomalies (resource imbalances)
- 3-5 AI-generated actionable insights

---

## 📋 What Each Dataset Tests

### 1️⃣ Order Fulfillment
**Best for demonstrating:**
- ✅ Bottleneck identification (Credit Check activity)
- ✅ Rework detection (Payment Failed loops)
- ✅ Conformance violations (missing Manager Approval)
- ✅ Automation opportunities (high ROI activities)

**Key Activities:**
```
Receive Order → Validate → Check Inventory → Credit Check → 
Process Payment → Pick Items → Pack → Ship → Deliver
```

**Expected Results:**
- Avg Cycle Time: 3.5-4.2 days
- Top Bottleneck: Credit Check (35-45% of time)
- Rework Rate: 8-12%
- Automation Savings: $100K-150K/year

---

### 2️⃣ Invoice Processing
**Best for demonstrating:**
- ✅ Data entry rework loops
- ✅ Approval rejection patterns
- ✅ High automation potential (95% for data entry)
- ✅ Conformance violations

**Key Activities:**
```
Receive → OCR Scan → Manual Entry → Match PO → 
Manager Approval → CFO Approval → Payment
```

**Expected Results:**
- Avg Cycle Time: 9-12 days
- Rework Rate: 25-35% (highest of all datasets)
- Conformance Score: 65-75%
- Automation Savings: $75K-100K/year

---

### 3️⃣ Customer Support
**Best for demonstrating:**
- ✅ Resource workload imbalances
- ✅ Temporal anomalies (off-hours activity)
- ✅ Escalation pattern analysis
- ✅ Ticket reopen tracking

**Key Activities:**
```
Create Ticket → Assign → Initial Response → 
[Escalate → Specialist Review] → Provide Solution → Close
```

**Expected Results:**
- Avg Resolution: 4-8 hours
- Escalation Rate: 40%
- Reopen Rate: 10%
- Resource Imbalance: Alice_Green 50% overloaded

---

### 4️⃣ Loan Approval
**Best for demonstrating:**
- ✅ Extreme duration outliers
- ✅ Document collection delays
- ✅ Multi-iteration rework loops
- ✅ Complex approval workflows

**Key Activities:**
```
Application → Document Collection → Review → Credit Check → 
Verification → Underwriting → Approval → Signing → Disbursement
```

**Expected Results:**
- Avg Cycle Time: 7-14 days
- Top Bottleneck: Document Collection (40-50% of time)
- Rework Rate: 30-40%
- Duration Outliers: 20-30 CRITICAL cases

---

## 🎯 Testing All Features

### Core Process Mining
- [ ] **Process Discovery**: Run on all 4 datasets
- [ ] **Performance Analytics**: Review cycle time, throughput, bottlenecks
- [ ] **Activity Statistics**: Check duration and frequency metrics

### AI Features
- [ ] **Anomaly Detection**: Detect all 5 types (duration, sequence, resource, temporal, frequency)
- [ ] **AI Insights**: Verify 3-5 actionable insights generated per process
- [ ] **Automation Opportunities**: Check ROI calculations and tool recommendations

### Advanced Features
- [ ] **Conformance Checking**: Verify fitness scores and deviation detection
- [ ] **What-If Simulation**: Run scenario analysis (e.g., automate Credit Check)
- [ ] **Digital Twin**: Test different parameter combinations

### Security & Compliance
- [ ] **GDPR Export**: Export all data and verify completeness
- [ ] **Consent Management**: Update privacy preferences
- [ ] **Audit Logging**: Check that actions are logged

---

## 📖 Detailed Documentation

For comprehensive test scenarios and expected results, see:
- **`TEST_SCENARIOS.md`**: Complete testing guide with expected metrics
- **`FEATURES.md`**: Technical feature documentation
- **`USER_GUIDE.md`**: Step-by-step user instructions

---

## 🎓 Sample Demo Flow (15 Minutes)

**Impress stakeholders with this proven demo script:**

1. **Upload** `order-fulfillment.csv` (1 min)
2. **Discover** process model → Show flowchart (2 min)
3. **Analytics** → Highlight Credit Check bottleneck (2 min)
4. **Anomalies** → Show 23 CRITICAL duration outliers (3 min)
5. **AI Insights** → Read recommendations (2 min)
   - "Automate credit scoring for orders <$10K"
   - "Add 1 analyst for peak hours"
   - "Expected: 33% cycle time reduction, $120K savings"
6. **Conformance** → Show violations (85-92% score) (2 min)
7. **Automation** → Show $100K+ savings potential (2 min)
8. **Simulation** → Model automation impact (2 min)
   - Baseline: 4.2 days
   - Simulated: 2.8 days
   - Improvement: 33% faster

**Key Talking Points:**
- "Real AI (OpenAI GPT-4.1), not rules-based"
- "Industry-standard algorithms"
- "$500K+ annual savings across these 4 processes"
- "GDPR compliant, enterprise-ready security"

---

## 🐛 Troubleshooting

### Upload Issues
**Problem:** "Missing required columns"  
**Solution:** Files already have correct format (caseId, activity, timestamp, resource)

**Problem:** "Invalid timestamp format"  
**Solution:** Timestamps are ISO format - should work perfectly

### No Anomalies Detected
**Problem:** AI service not responding  
**Solution:** Check that OPENAI_API_KEY is configured in environment

### Conformance Score is 100%
**Problem:** This shouldn't happen with test data  
**Solution:** Re-upload CSV and ensure process discovery completed

---

## 📊 Expected Business Value

### Time Savings
- Order Fulfillment: -33% cycle time (1.4 days saved)
- Invoice Processing: -29% cycle time (3.5 days saved)
- Customer Support: -25% resolution time (2 hours saved)
- Loan Approval: -29% cycle time (4 days saved)

### Cost Savings
- Automation: $300K-400K/year
- Rework Reduction: $150K-200K/year
- Resource Optimization: $100K-150K/year
- **Total: $550K-750K/year**

### Quality Improvements
- Conformance: 85% → 95%+
- Rework Rate: 20% → 5%
- On-Time Delivery: 75% → 95%
- Customer Satisfaction: +25 NPS points

---

## 🔄 Regenerating Test Data

To create fresh test data:

```bash
npx tsx scripts/generate-test-data.ts
```

This will regenerate all 4 CSV files with:
- New timestamps (current date + offsets)
- Randomized resource assignments
- Varied durations and delays
- Same intentional anomaly patterns

---

## ✅ Test Checklist

Use this checklist to verify all features work:

### Basic Features
- [ ] CSV upload successful
- [ ] Process discovery generates flowchart
- [ ] Performance metrics calculated
- [ ] Bottlenecks identified

### AI Features
- [ ] Anomaly detection finds issues
- [ ] AI insights are actionable
- [ ] Severity classification works
- [ ] Confidence scores displayed

### Advanced Features
- [ ] Conformance checking detects violations
- [ ] Fitness scores <100% (intentional violations)
- [ ] Automation opportunities ranked
- [ ] ROI calculations shown
- [ ] Simulations produce realistic results

### Security
- [ ] Rate limiting prevents brute force
- [ ] CSRF tokens required
- [ ] Data export works
- [ ] Audit logging active

---

## 📞 Support

For issues or questions:
1. Check `TEST_SCENARIOS.md` for detailed expected results
2. Review `USER_GUIDE.md` for step-by-step instructions
3. Consult `FEATURES.md` for technical details

---

**Last Updated:** November 8, 2025  
**Generated:** 12,075 events across 1,400 process instances  
**Purpose:** Comprehensive platform testing and demonstration
