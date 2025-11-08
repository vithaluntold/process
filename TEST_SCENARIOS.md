# EPI X-Ray - Comprehensive Test Scenarios

## 📊 Overview

This document describes the comprehensive test data and scenarios created to showcase all features of the EPI X-Ray platform. Each dataset is designed to trigger specific AI features, anomalies, and optimization opportunities.

---

## 🎯 Test Datasets Generated

### 1. Order Fulfillment Process
**File:** `test-data/order-fulfillment.csv`  
**Cases:** 500 orders  
**Events:** 4,763 activities  
**Time Period:** January-March 2025

#### Process Flow
```
Receive Order → Validate Order → Check Inventory → Credit Check → 
Credit Approval → Process Payment → Pick Items → Pack Order → 
Generate Shipping Label → Ship Order → Delivery Complete
```

#### Designed Features to Showcase:

**A. Bottlenecks** 🔴
- **Credit Check**: 5% of cases take 24-96 hours (vs. 15-45 min average)
  - Expected: Duration outlier anomalies (CRITICAL severity)
  - Bottleneck identified in performance analytics
  - AI recommendation: Automated credit scoring for orders <$10K

**B. Rework Patterns** 🔄
- **Payment Failed → Payment Retry**: 8% of cases experience payment failures
  - Expected: Frequency anomaly detection
  - Rework rate calculation in analytics
  - AI insight: Payment gateway timeout issues

- **Quality Check → Re-Pick Items**: 3.3% of orders require repicking
  - Expected: Process inefficiency identification
  - Automation opportunity: Barcode scanning system

**C. Conformance Violations** ⚠️
- **Missing Manager Approval**: Some high-value orders skip manager review (6.7% of cases)
  - Expected: Sequence violation anomalies
  - Conformance fitness score <100%
  - Missing transition detection

- **Direct CFO Approval**: Rare cases skip manager and go straight to CFO
  - Expected: Unexpected activity detection
  - High severity conformance deviation

**D. Resource Anomalies** 👥
- **John_Smith (Inventory)**: Handles significantly more cases than Emma_Wilson
  - Expected: Resource anomaly detection
  - Workload imbalance identification
  - AI recommendation: Redistribute workload

**E. Automation Opportunities** ⚙️
- **Manual Data Entry** activities with high frequency
- **Repetitive validation** tasks
- **Expected:** 90-95% automation potential scores
  - OCR for document scanning
  - RPA for data entry
  - API integration for system checks
- **ROI:** $35K-50K annual savings per automated activity

#### Expected Analytics Results:
- **Avg Cycle Time:** 3.5-4.2 days
- **Throughput:** ~60-80 cases/day
- **Top Bottleneck:** Credit Check (contributes 35-45% of cycle time)
- **Rework Rate:** 8-12%
- **Conformance Score:** 85-92%

---

### 2. Invoice Processing
**File:** `test-data/invoice-processing.csv`  
**Cases:** 300 invoices  
**Events:** 2,309 activities  
**Time Period:** January-March 2025

#### Process Flow
```
Receive Invoice → OCR Scan → Manual Data Entry → Match to PO → 
Manager Approval → CFO Approval → Schedule Payment → 
Process Payment → Payment Complete
```

#### Designed Features to Showcase:

**A. Data Entry Rework** 🔄
- **Data Validation Failed → Re-entry**: 10% of invoices require data re-entry
  - Expected: Frequency anomaly (activity repeated multiple times)
  - HIGH severity rework loops
  - Automation potential: 95% for OCR + validation

**B. Approval Loops** 🔁
- **Approval Rejected → Clarification → Re-Approval**: 20% of invoices face approval rejection
  - Expected: Complex rework pattern detection
  - Process inefficiency identification
  - AI insight: Unclear approval criteria

**C. Conformance Issues** ⚠️
- **Missing Manager Approval**: 30% of high-value invoices skip manager
  - Expected: CRITICAL conformance violation
  - Wrong-order execution detection
  - Compliance risk flagged

- **CFO Approval Bypass**: Some invoices under threshold get CFO approval
  - Expected: Unexpected activity detection
  - Process inefficiency (unnecessary approval)

**D. Extreme Automation Potential** ⚙️
- **Manual Data Entry**: 300 executions, 10-30 min each
  - **Expected Automation:** 95% potential
  - **Recommended Tool:** OCR + RPA
  - **ROI:** $45K/year savings
  - **Payback:** 4-5 months

- **Match to PO**: Rule-based, highly repetitive
  - **Expected Automation:** 85% potential
  - **Recommended Tool:** Business rules engine
  - **ROI:** $28K/year savings

**E. Duration Outliers** 📊
- **Manager Approval**: Some approvals take 2-6 hours (vs. 30-90 min average)
  - Expected: Duration outlier detection
  - MEDIUM severity anomalies
  - AI insight: Manager availability bottleneck

#### Expected Analytics Results:
- **Avg Cycle Time:** 9-12 days (includes payment terms)
- **Throughput:** ~20-25 invoices/day
- **Top Bottleneck:** Manual Data Entry (30-40% of processing time)
- **Rework Rate:** 25-35% (high due to data validation and approval loops)
- **Conformance Score:** 65-75% (significant violations)
- **Total Automation Savings:** $75K-100K/year

---

### 3. Customer Support
**File:** `test-data/customer-support.csv`  
**Cases:** 400 tickets  
**Events:** 2,591 activities  
**Time Period:** January-March 2025

#### Process Flow
```
Ticket Created → Assign to Agent → Initial Response → 
[Escalate to Specialist → Specialist Review] → 
Provide Solution → Close Ticket
```

#### Designed Features to Showcase:

**A. Resource Imbalance** 👥
- **Alice_Green**: Assigned 12.5% of tickets (vs. 8.3% expected)
  - Expected: Resource anomaly (HIGH severity)
  - Workload imbalance detection
  - AI recommendation: Round-robin assignment

**B. Temporal Anomalies** ⏰
- **Off-Hours Activity Spike**: 2% of tickets created at 2 AM
  - Expected: Temporal anomaly detection
  - MEDIUM severity unusual pattern
  - AI insight: Automated system creating duplicate tickets

**C. Escalation Patterns** 📈
- **40% of tickets escalated** to specialists
  - Expected: High escalation rate flagged
  - AI recommendation: Agent training needed
  - Resource allocation optimization

**D. Rework Detection** 🔄
- **Ticket Reopened**: 10% of closed tickets reopened
  - Expected: Frequency anomaly
  - Quality issue identification
  - AI insight: Insufficient initial resolution

- **Multiple Follow-ups**: Some tickets require 2-4 follow-up cycles
  - Expected: Process inefficiency
  - Customer satisfaction risk

**E. Complexity Analysis** 🎯
- **Simple Tickets** (60%): Resolved by agent in 1-2 hours
  - Automation potential: 70-80%
  - Chatbot/self-service opportunity

- **Complex Tickets** (40%): Require specialist, 4-8 hours
  - Lower automation potential: 30-40%
  - AI-assist recommendation

#### Expected Analytics Results:
- **Avg Resolution Time:** 4-8 hours
- **First Response Time:** 30-60 minutes
- **Escalation Rate:** 40%
- **Reopen Rate:** 10%
- **Agent Utilization:** Imbalanced (Alice 12.5%, others 7-9%)
- **Automation Potential:** Self-service FAQ, chatbot for tier-1 issues

---

### 4. Loan Approval Process
**File:** `test-data/loan-approval.csv`  
**Cases:** 200 loan applications  
**Events:** 2,412 activities  
**Time Period:** January-March 2025

#### Process Flow
```
Application Received → Document Collection → Initial Review → 
Credit Check → Income Verification → Risk Assessment → 
Underwriting → Manager Approval → Compliance Check → 
Loan Approved/Denied → Document Signing → Funds Disbursed
```

#### Designed Features to Showcase:

**A. Extreme Duration Outliers** 🔴
- **Document Collection**: Some cases take 48-120 hours (vs. 24-48 hours average)
  - Expected: CRITICAL duration outliers
  - Z-score > 5 standard deviations
  - AI insight: Missing documents cause severe delays

- **Underwriting**: 6.7% of cases take 48-120 hours (vs. 4-24 hours average)
  - Expected: HIGH severity bottleneck
  - Complex risk assessment flagged
  - Resource capacity issue

**B. Document Rework Loops** 🔄
- **Request Missing Documents**: Some cases have 2-4 iterations
  - Expected: Frequency anomaly (CRITICAL severity)
  - Process inefficiency identification
  - AI recommendation: Upfront document checklist

**C. Approval Complexity** 📋
- **Additional Review Required**: 16.7% of loans need extra underwriting
  - Expected: Rework pattern detection
  - Quality control insight
  - AI suggestion: Pre-screening criteria improvement

**D. Conformance Patterns** ✅
- **Manager Approval**: Required for high-value loans (>70th percentile)
  - Expected: Good conformance for standard process
  - Some violations where small loans get manager approval
  - Process optimization: Raise approval threshold

**E. Automation Opportunities** ⚙️
- **Credit Check**: 100% automated already
- **Income Verification**: 60% automation potential
  - API integration with payroll providers
  - Document OCR for pay stubs
  - ROI: $22K/year

- **Risk Assessment**: 40% automation potential
  - ML model for risk scoring
  - Reduce manual underwriter time by 50%
  - ROI: $55K/year

#### Expected Analytics Results:
- **Avg Cycle Time:** 7-14 days
- **Approval Rate:** 85%
- **Denial Rate:** 15%
- **Top Bottleneck:** Document Collection (40-50% of cycle time)
- **Secondary Bottleneck:** Underwriting (20-30% of cycle time)
- **Rework Rate:** 30-40% (document requests)
- **Automation Savings:** $75K-100K/year

---

## 🧪 Comprehensive Testing Workflow

### Phase 1: Data Upload
1. Log in to EPI X-Ray
2. Create 4 new processes:
   - "E-Commerce Order Fulfillment"
   - "Accounts Payable Invoice Processing"
   - "Customer Support Ticketing"
   - "Loan Approval Workflow"
3. Upload corresponding CSV files to each process

### Phase 2: Process Discovery
For each process:
1. Navigate to "Process Discovery" tab
2. Click "Discover Process Model"
3. Wait for algorithm to complete (15-30 seconds)
4. Review generated flowchart

**Expected Observations:**
- **Order Fulfillment**: 15+ activities, parallel paths, loops visible
- **Invoice Processing**: 8-10 activities, approval hierarchy, rework loops
- **Customer Support**: 6-8 activities, escalation paths
- **Loan Approval**: 10-12 activities, sequential with conditional branches

### Phase 3: Performance Analytics
For each process:
1. Navigate to "Analytics" tab
2. Review metrics dashboard

**Expected Results:**

| Metric | Order Fulfillment | Invoice Processing | Customer Support | Loan Approval |
|--------|-------------------|--------------------|-----------------| --------------|
| Avg Cycle Time | 3.5-4.2 days | 9-12 days | 4-8 hours | 7-14 days |
| Throughput | 60-80/day | 20-25/day | 25-30/day | 10-15/day |
| Top Bottleneck | Credit Check | Manual Data Entry | Specialist Review | Document Collection |
| Rework Rate | 8-12% | 25-35% | 10% | 30-40% |

### Phase 4: Anomaly Detection
For each process:
1. Click "Detect Anomalies" button
2. Wait for AI analysis (30-60 seconds)
3. Review anomaly report

**Expected Anomalies:**

**Order Fulfillment:**
- 🔴 15-25 CRITICAL: Duration outliers in Credit Check
- 🟠 20-30 HIGH: Sequence violations (missing approvals)
- 🟡 40-60 MEDIUM: Resource workload imbalances
- 🟢 30-50 LOW: Various minor issues

**Invoice Processing:**
- 🔴 25-35 CRITICAL: Data entry rework loops
- 🟠 30-40 HIGH: Approval rejection patterns
- 🟡 20-30 MEDIUM: Conformance violations
- 🟢 15-25 LOW: Duration variations

**Customer Support:**
- 🔴 5-10 CRITICAL: Temporal anomalies (2 AM activity)
- 🟠 15-20 HIGH: Resource imbalance (Alice overload)
- 🟡 30-40 MEDIUM: Escalation rate issues
- 🟢 20-30 LOW: Minor inefficiencies

**Loan Approval:**
- 🔴 20-30 CRITICAL: Document collection delays
- 🟠 15-25 HIGH: Underwriting bottlenecks
- 🟡 25-35 MEDIUM: Document rework loops
- 🟢 10-20 LOW: Various optimizations

### Phase 5: AI Insights Review
For each anomaly report, verify:
1. **AI-generated insights** appear (3-5 per report)
2. Insights explain **root causes**
3. Insights provide **actionable recommendations**
4. Insights include **impact estimates**

**Example Expected Insight:**
> "The high frequency of duration outliers in 'Credit Check' (23 cases, 5% of total) suggests a systemic bottleneck during peak hours (10 AM - 2 PM). Current staffing of 2 credit analysts cannot handle the load. Recommend: (1) Implement automated credit scoring for orders below $10,000 to reduce manual review load by 60%, freeing up analysts for complex cases. (2) Add one additional credit analyst for peak hours (estimated cost: $35K/year, time saved: 1.2 days per order). (3) Implement SLA monitoring with alerts when credit checks exceed 2 hours. Expected impact: 33% reduction in average cycle time, $120K annual savings, 95% on-time delivery improvement."

### Phase 6: Conformance Checking
For each process:
1. Navigate to "Conformance Checking" tab
2. Click "Check Conformance"
3. Review fitness score and deviations

**Expected Fitness Scores:**
- **Order Fulfillment:** 85-92% (good, some violations)
- **Invoice Processing:** 65-75% (fair, significant issues)
- **Customer Support:** 90-95% (excellent)
- **Loan Approval:** 88-93% (good)

**Expected Deviation Types:**
- Missing transitions (skipped steps)
- Unexpected activities (extra steps)
- Wrong-order execution (sequence violations)

### Phase 7: Automation Opportunities
For each process:
1. Navigate to "Automation Opportunities" tab
2. Review automation candidates

**Expected High-Potential Activities:**

| Activity | Process | Automation % | Annual Savings | Tool |
|----------|---------|--------------|----------------|------|
| Manual Data Entry | Invoice | 95% | $45K | OCR + RPA |
| Document Collection | Loan | 60% | $22K | API + OCR |
| Check Inventory | Order | 90% | $18K | API Integration |
| Initial Response | Support | 75% | $28K | Chatbot |
| Credit Check | Order | 85% | $35K | Credit API |

**Total Expected Savings:** $300K-400K/year across all processes

### Phase 8: What-If Simulation
For Order Fulfillment process:
1. Navigate to "What-If Scenarios"
2. Create scenario: "Automate Credit Check"
3. Set parameters:
   - Activity "Credit Check": duration × 0.15 (85% reduction)
   - Cases: 100
   - Arrival rate: 300,000ms
4. Run simulation

**Expected Results:**
- **Baseline Cycle Time:** 4.2 days
- **Simulated Cycle Time:** 2.8 days
- **Improvement:** 33% reduction
- **New Bottleneck:** Pick Items (warehouse capacity)
- **Throughput:** 5.2 → 7.8 cases/hour (+50%)

### Phase 9: GDPR Features
1. Navigate to Privacy Settings
2. Export data (should include all 4 processes)
3. Review consent management
4. (Optional) Test account deletion in non-production environment

---

## 📈 Expected Business Value Demonstration

### Time Savings
- **Order Fulfillment:** 1.4 days avg cycle time reduction (33%)
- **Invoice Processing:** 3.5 days avg cycle time reduction (29%)
- **Customer Support:** 2 hours avg resolution time reduction (25%)
- **Loan Approval:** 4 days avg cycle time reduction (29%)

### Cost Savings
- **Automation:** $300K-400K/year across all processes
- **Rework Reduction:** $150K-200K/year
- **Resource Optimization:** $100K-150K/year
- **Total:** $550K-750K annual savings

### Quality Improvements
- **Conformance:** 85% → 95%+ average
- **Rework Rate:** 20% → 5%
- **On-Time Delivery:** 75% → 95%
- **Customer Satisfaction:** +25 NPS points

---

## 🎯 Key Testing Checkpoints

### ✅ Core Process Mining
- [ ] Process discovery generates accurate flowcharts
- [ ] Performance analytics calculates correct metrics
- [ ] Bottleneck identification highlights key issues
- [ ] Activity statistics show duration and frequency

### ✅ AI Features
- [ ] Anomaly detection finds all 5 types of anomalies
- [ ] Severity classification (Critical, High, Medium, Low) correct
- [ ] AI insights are actionable and specific
- [ ] Confidence scores and impact levels provided

### ✅ Advanced Features
- [ ] Conformance checking detects violations
- [ ] Fitness scores calculated correctly
- [ ] Automation opportunities ranked by ROI
- [ ] What-if simulations show realistic improvements

### ✅ Security & Compliance
- [ ] Rate limiting prevents brute force
- [ ] CSRF tokens required for mutations
- [ ] Data export includes all user data
- [ ] Account deletion cascades properly

### ✅ User Experience
- [ ] Dashboard shows process overview
- [ ] Charts and visualizations render correctly
- [ ] Dark/light mode works throughout
- [ ] Mobile responsive design functions properly

---

## 🐛 Known Expected Behaviors

### Duration Variations
- Realistic processes have natural variation
- Some extreme outliers are intentional (to trigger anomaly detection)
- Not all cases follow the exact same path

### Conformance Violations
- Intentionally designed to showcase compliance issues
- Real-world processes often have exceptions
- Demonstrates value of conformance monitoring

### Resource Imbalances
- Workload distribution intentionally uneven
- Showcases resource anomaly detection
- Demonstrates need for load balancing

---

## 📞 Troubleshooting Test Scenarios

### Issue: No anomalies detected
**Solution:** 
- Ensure enough data loaded (minimum 50 events per process)
- Check that AI service is running (OPENAI_API_KEY configured)
- Try a different process (some have more obvious patterns)

### Issue: Conformance score is 100%
**Solution:**
- This shouldn't happen with test data - data may not have loaded correctly
- Re-upload CSV file
- Check that process discovery completed successfully

### Issue: Automation opportunities show 0% potential
**Solution:**
- Ensure performance analytics ran first
- Check that frequency and duration data exists
- Verify process has manual activities (not all automated)

### Issue: Simulation results seem unrealistic
**Solution:**
- Check duration multipliers (0.1 = 90% reduction, not 10%)
- Ensure base process model exists
- Verify arrival rate is reasonable (300,000ms = 5 min)

---

## 🎓 Demo Script

**Perfect 15-Minute Demo:**

1. **Login** (30 seconds)
2. **Upload Order Fulfillment CSV** (1 minute)
3. **Run Process Discovery** → Show flowchart (2 minutes)
4. **View Performance Analytics** → Highlight bottleneck (2 minutes)
5. **Detect Anomalies** → Show AI insights (3 minutes)
6. **Check Conformance** → Explain violations (2 minutes)
7. **Show Automation Opportunities** → ROI calculation (2 minutes)
8. **Run What-If Simulation** → Demonstrate impact (2 minutes)
9. **Export GDPR Data** → Show compliance (1 minute)

**Key Talking Points:**
- "Real AI (GPT-4.1), not rules-based"
- "Industry-standard algorithms (Alpha Miner, Token Replay)"
- "Production-ready security (GDPR compliant)"
- "$500K+ annual savings potential"
- "3-5 day implementation"

---

**Last Updated:** November 8, 2025  
**Test Data Generated:** 12,075 events across 1,400 process instances  
**Coverage:** 100% of platform features
