# EPI X-Ray - Complete User Guide

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your Account](#creating-your-account)
3. [Uploading Event Logs](#uploading-event-logs)
4. [Discovering Your Process](#discovering-your-process)
5. [Analyzing Process Performance](#analyzing-process-performance)
6. [Detecting Anomalies with AI](#detecting-anomalies-with-ai)
7. [Checking Conformance](#checking-conformance)
8. [Finding Automation Opportunities](#finding-automation-opportunities)
9. [Running What-If Simulations](#running-what-if-simulations)
10. [Managing Your Privacy](#managing-your-privacy)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## 🚀 Getting Started

### What You'll Need

- **Event Log Data**: CSV file with your process execution data
- **Minimum Requirements**: 
  - At least 50 events
  - 3 required columns: `caseId`, `activity`, `timestamp`
  - Optional: `resource` (person/system who performed the activity)

### CSV Format Example

```csv
caseId,activity,timestamp,resource
ORD-001,Receive Order,2025-01-15 09:00:00,System
ORD-001,Check Inventory,2025-01-15 09:05:00,Sarah
ORD-001,Process Payment,2025-01-15 09:10:00,System
ORD-001,Ship Order,2025-01-15 14:30:00,John
ORD-001,Delivery Complete,2025-01-16 10:00:00,System
ORD-002,Receive Order,2025-01-15 09:15:00,System
...
```

**Column Descriptions:**
- **caseId**: Unique identifier for each process instance (e.g., order number, ticket ID, patient ID)
- **activity**: Name of the activity/step being performed
- **timestamp**: When the activity occurred (ISO format or common date formats)
- **resource** (optional): Who/what performed the activity

---

## 👤 Creating Your Account

### Step 1: Sign Up

1. Open EPI X-Ray in your browser
2. Click the **"Sign Up"** tab on the landing page
3. Enter your information:
   - **Full Name**: Your first and last name
   - **Email**: Valid email address (converted to lowercase automatically)
   - **Password**: Minimum 12 characters with:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - Example: `MySecurePass2025`

4. Click **"Sign Up"**
5. You'll see a success message and be logged in automatically

### Step 2: Log In (Returning Users)

1. Click the **"Login"** tab
2. Enter your email and password
3. Click **"Login"**

**Security Note:** You have 5 login attempts per 15 minutes. After that, you'll need to wait before trying again.

---

## 📤 Uploading Event Logs

### Step 1: Navigate to Dashboard

After logging in, you'll land on the **Dashboard** page showing an overview of your processes.

### Step 2: Create a New Process

1. Click the **"+ New Analysis"** button (top right)
2. In the modal that appears, enter:
   - **Process Name**: Descriptive name (e.g., "Order Fulfillment Q1 2025")
   - **Description** (optional): Additional details about the process

3. Click **"Create Process"**

### Step 3: Upload Event Log

1. After creating the process, you'll be redirected to the process detail page
2. Click **"Upload Event Log"** or drag-and-drop your CSV file
3. Wait for the upload to complete
4. You'll see a confirmation message

**File Requirements:**
- **Format**: CSV only
- **Max Size**: 50 MB
- **Required Columns**: caseId, activity, timestamp
- **Encoding**: UTF-8

### Common Upload Issues

❌ **"Missing required columns"**
- Solution: Ensure your CSV has exactly: `caseId`, `activity`, `timestamp` (case-sensitive)

❌ **"Invalid timestamp format"**
- Solution: Use ISO format (YYYY-MM-DD HH:MM:SS) or standard date formats

❌ **"File too large"**
- Solution: Split into multiple files or filter to most recent data

---

## 🔍 Discovering Your Process

Once you've uploaded event logs, it's time to discover the actual process model.

### Step 1: Navigate to Process Discovery

1. From the **Dashboard**, click on your process
2. Click the **"Process Discovery"** tab in the left sidebar
3. You'll see your uploaded event logs listed

### Step 2: Run Process Discovery

1. Click the **"Discover Process Model"** button
2. The Alpha Miner algorithm will analyze your event logs
3. Wait 10-30 seconds (depends on data size)
4. You'll see an interactive process flowchart appear

### Understanding the Process Flowchart

**Node Colors:**
- 🟢 **Green**: Start activities (how processes begin)
- 🔵 **Blue**: Intermediate activities (middle steps)
- 🔴 **Red**: End activities (how processes finish)

**Edge Thickness:**
- **Thick lines**: High-frequency transitions (common paths)
- **Thin lines**: Low-frequency transitions (rare paths)
- **Animated edges**: Very high-frequency paths (>50% of cases)

**Interactive Controls:**
- **Zoom**: Scroll wheel or pinch gesture
- **Pan**: Click and drag the canvas
- **Fit View**: Button to zoom to fit all nodes
- **Mini-map**: Small overview in bottom-right corner

### Step 3: Analyze the Model

**What to Look For:**
- **Start Points**: How many different ways does your process start?
- **End Points**: How many different endings exist?
- **Parallel Paths**: Activities happening simultaneously
- **Loops**: Arrows going backward (rework indicators)
- **Rare Paths**: Thin edges (might be errors or exceptions)

**Example Insights:**
> "I see my order process has 3 different start activities - that's unusual! Turns out we have manual, web, and phone orders starting differently. Also, there's a loop from 'Quality Check' back to 'Manufacturing' - that's rework happening."

---

## 📊 Analyzing Process Performance

### Step 1: Navigate to Analytics

1. Click on your process from the Dashboard
2. Click **"Analytics"** in the left sidebar

### Step 2: Review Performance Metrics

You'll see several key metrics:

#### Overall Metrics
- **Average Cycle Time**: How long the entire process takes (start to finish)
- **Median Cycle Time**: Middle value (less affected by outliers)
- **95th Percentile**: 95% of cases finish within this time
- **Throughput**: Cases completed per day/hour
- **Total Cases**: Number of process instances

#### Activity Statistics

For each activity, you'll see:
- **Average Duration**: Typical time spent
- **Execution Count**: How many times performed
- **Resource Count**: How many people/systems do this
- **% of Total Time**: Contribution to overall cycle time

#### Bottleneck Analysis

The system automatically identifies bottlenecks using statistical analysis:
- **Critical Bottlenecks**: Activities causing the most delay
- **Impact**: How much they slow down the process
- **Recommendations**: AI suggestions to resolve them

### Step 3: Interpret the Data

**Key Questions to Ask:**
1. **Is cycle time acceptable?** Compare to your SLA or goals
2. **Where are the bottlenecks?** Focus improvement efforts here
3. **Which activities take longest?** Candidates for automation
4. **Are resources balanced?** Look for overloaded people/systems

**Example Analysis:**
> **Finding:** "Credit Check" has 95th percentile of 4.2 hours vs. 20-minute average
> 
> **Interpretation:** 5% of credit checks take 10x longer than normal
> 
> **Action:** Investigate those cases - likely waiting for manual review

---

## 🤖 Detecting Anomalies with AI

AI-powered anomaly detection helps you find unusual patterns and problems.

### Step 1: Run Anomaly Detection

1. Navigate to your process
2. Click **"Detect Anomalies"** button
3. AI will analyze your event logs (takes 30-60 seconds)
4. You'll see a comprehensive anomaly report

### Step 2: Review the Anomaly Report

**Summary Dashboard:**
- **Total Anomalies**: Count of issues found
- **By Severity**:
  - 🔴 Critical: X issues
  - 🟠 High: X issues
  - 🟡 Medium: X issues
  - 🟢 Low: X issues

### Understanding Anomaly Types

#### 1. Duration Outliers
**What It Detects:** Activities taking unusually long/short times

**Example:**
```
Activity: "Document Review"
Severity: CRITICAL
Description: Took 3.2 hours (5.8 std dev from mean of 22 minutes)
Impact: Delays case by 3+ hours
Recommendation: Investigate case #ORD-4523 - likely stuck in queue
```

**Action:** Check if document was complex, reviewer was unavailable, or system issue

#### 2. Sequence Violations
**What It Detects:** Rare or unexpected activity sequences

**Example:**
```
Activity Sequence: "Quote Sent → Invoice Paid"
Severity: HIGH
Description: Found in only 2 out of 450 cases (0.4%)
Impact: Skipped approval step, compliance risk
Recommendation: Review cases #ORD-123, #ORD-456 for policy violation
```

**Action:** Determine if this is a valid exception or a process bypass

#### 3. Resource Anomalies
**What It Detects:** Unusual workload distribution or skill dilution

**Example:**
```
Resource: "John_Smith"
Severity: CRITICAL
Description: Processed 245 activities (3.8 std dev from team mean of 67)
Impact: Burnout risk, single point of failure
Recommendation: Redistribute workload or add team capacity
```

**Action:** Balance workload across team, cross-train others

#### 4. Temporal Anomalies
**What It Detects:** Unusual activity patterns by time of day

**Example:**
```
Time: 02:00 AM
Severity: HIGH
Description: Activity spike with 87 events (4.2 std dev from hourly mean of 15)
Impact: Off-hours processing, potential automation running wild
Recommendation: Investigate automated system behavior
```

**Action:** Check if automated system is malfunctioning

#### 5. Frequency Anomalies
**What It Detects:** Activities repeated too many times (rework)

**Example:**
```
Activity: "Approval_Request"
Severity: CRITICAL
Description: Executed 12 times in case #ORD-4523
Impact: Severe rework, process inefficiency
Recommendation: Investigate why approvals keep getting rejected
```

**Action:** Fix root cause of rejections (missing data, unclear requirements)

### Step 3: Read AI Insights

Below the anomaly list, you'll see 3-5 **AI-Generated Insights**:

**Example AI Insight:**
> "The high frequency of duration outliers in 'Credit Check' (23 cases) suggests a systemic bottleneck during peak hours (10 AM - 2 PM). Consider implementing automated credit scoring for orders below $10,000 to reduce manual review load by 60%. Additionally, the resource anomaly for John_Smith indicates he's handling 3.8x the team average - redistribute 40% of his workload to prevent burnout and reduce single-point-of-failure risk."

**What to Do with AI Insights:**
1. **Prioritize by Severity**: Address Critical and High issues first
2. **Validate with Team**: Confirm AI findings with process owners
3. **Create Action Plan**: Assign owners and deadlines for each issue
4. **Track Progress**: Re-run anomaly detection after fixes to verify improvement

---

## ✅ Checking Conformance

Conformance checking validates if your process executes as designed.

### Step 1: Run Conformance Check

1. Navigate to your process
2. First, ensure you have a **Discovered Model** (see "Discovering Your Process")
3. Click **"Check Conformance"** button
4. The token-based replay algorithm will analyze your event logs (30-60 seconds)

### Step 2: Review Fitness Score

**Fitness Score Interpretation:**
- **100%**: Perfect conformance - all cases follow the model exactly
- **90-99%**: Excellent - minor deviations, mostly conformant
- **80-89%**: Good - some deviations worth investigating
- **70-79%**: Fair - significant deviations, process improvements needed
- **<70%**: Poor - major conformance issues, urgent action required

### Step 3: Analyze Deviations

You'll see a detailed breakdown of deviation types:

#### Missing Transitions
**What It Means:** Required steps were skipped

**Example:**
```
Case: ORD-123
Deviation: Missing transition from "Manager Approval" to "CFO Approval"
Impact: Skipped manager review, control weakness
```

**Action:** Determine if skip was intentional (emergency) or error

#### Unexpected Activities
**What It Means:** Activities occurred that shouldn't exist

**Example:**
```
Case: ORD-456
Deviation: Unexpected activity "Emergency Override"
Impact: Process bypassed normal controls
```

**Action:** Review if override was justified and properly documented

#### Wrong-Order Execution
**What It Means:** Activities happened in incorrect sequence

**Example:**
```
Case: ORD-789
Deviation: "Ship Order" occurred before "Process Payment"
Impact: Shipped without payment confirmation
```

**Action:** Fix process to enforce payment before shipping

### Step 4: Export Conformance Report

1. Click **"Export Report"** to download detailed conformance analysis
2. Share with stakeholders
3. Use for compliance audits

**Use Cases:**
- **Audit Compliance**: Prove adherence to SOX, HIPAA, ISO requirements
- **Process Control**: Identify where training is needed
- **Continuous Improvement**: Track conformance over time

---

## ⚙️ Finding Automation Opportunities

The AI analyzes your process to identify which tasks should be automated.

### Step 1: Navigate to Automation Opportunities

1. Click **"Automation Opportunities"** in the left sidebar
2. You'll see a dashboard of automation candidates

### Step 2: Review Automation Scores

For each activity, you'll see:

**Automation Potential (0-100%):**
- **90-100%**: Perfect candidate - highly repetitive, rule-based
- **70-89%**: Good candidate - some complexity, but automatable
- **50-69%**: Moderate candidate - requires AI/ML for decisions
- **<50%**: Poor candidate - requires human judgment

**Additional Metrics:**
- **Frequency**: How often performed (per month)
- **Avg. Duration**: Time spent per execution
- **Annual Time Cost**: Total hours spent annually
- **Est. Annual Savings**: Dollar value of automation

### Step 3: Review Recommendations

Click on any automation opportunity to see:

**Recommended Automation Approach:**
- **RPA (Robotic Process Automation)**: For UI-based tasks
- **API Integration**: For system-to-system automation
- **Business Rules Engine**: For decision automation
- **OCR + AI**: For document processing
- **Workflow Automation**: For orchestration

**Implementation Details:**
- Estimated cost
- Implementation time
- Required skills/tools
- ROI and payback period

### Example Automation Opportunity

```
Activity: "Invoice Data Entry"

Automation Potential: 95%
Frequency: 450 times/month
Avg. Duration: 8 minutes
Annual Time Cost: 720 hours

Recommended Approach: OCR + RPA Bot
- Extract data from PDF invoices using OCR
- Validate against purchase orders
- Auto-enter into ERP system

Implementation:
- Cost: $15,000
- Time: 3 weeks
- Skills: OCR specialist, RPA developer

ROI:
- Annual Savings: $36,000 (720 hours × $50/hour)
- ROI: 240%
- Payback Period: 5 months
```

### Step 4: Prioritize Automation Projects

**Sort by:**
1. **ROI**: Highest return first
2. **Payback Period**: Fastest payback first
3. **Automation Potential**: Easiest to automate first
4. **Frequency**: Highest volume first

**Build Your Automation Roadmap:**
1. Select top 5 opportunities
2. Estimate total implementation cost
3. Calculate total annual savings
4. Assign project owners
5. Set timelines

---

## 🔄 Running What-If Simulations

Test process changes before implementing them in reality using digital twin simulation.

### Step 1: Navigate to Scenarios

1. Click **"What-If Scenarios"** in the left sidebar
2. You'll see two tabs:
   - **Create Scenario**: Set up new simulation
   - **Saved Scenarios**: View previous simulations

### Step 2: Create a New Scenario

1. Click **"Create Scenario"** tab
2. Select a process from the dropdown
3. Enter scenario details:
   - **Scenario Name**: Descriptive name (e.g., "Automate Data Entry")
   - **Description**: What you're testing

### Step 3: Configure Duration Multipliers

Duration multipliers adjust how long activities take:

**Global Multiplier:**
- Apply to ALL activities
- Example: `0.9` = 10% faster across the board

**Activity-Specific Multipliers:**
- Apply to individual activities
- Example: `"Data Entry": 0.1` = 90% faster (automation impact)

**Common Scenarios:**

**Automation Impact:**
```json
{
  "Data_Entry": 0.1,        // 90% reduction (RPA bot)
  "Document_Review": 0.5    // 50% reduction (AI assist)
}
```

**Resource Addition:**
```json
{
  "Credit_Check": 0.6       // 40% faster (2 → 3 analysts)
}
```

**Process Optimization:**
```json
{
  "*": 0.85                 // 15% faster globally (training)
}
```

### Step 4: Set Simulation Parameters

**Number of Cases:**
- How many process instances to simulate
- Default: 100
- Recommendation: Match your monthly volume

**Arrival Rate:**
- Time between new case starts (in milliseconds)
- Default: 300,000ms (5 minutes)
- Example: 600,000ms = 10 minutes between cases

### Step 5: Run Simulation

1. Click **"Run Simulation"**
2. Wait 5-15 seconds for results
3. Review the simulation output

### Step 6: Analyze Results

**Key Metrics:**

**Baseline Comparison:**
- Baseline cycle time: X days
- Simulated cycle time: Y days
- **Improvement:** % reduction

**Throughput:**
- Baseline: X cases/hour
- Simulated: Y cases/hour
- **Improvement:** % increase

**Bottleneck Shift:**
- Baseline bottleneck: Activity A
- Simulated bottleneck: Activity B
- **Insight:** "After automating Data Entry, Credit Check becomes the new bottleneck"

**Activity-Level Details:**
- Processing time
- Utilization rate
- Completion count

### Example Simulation Results

```
Scenario: "Automate Invoice Processing"

Parameters:
- Data_Entry: 0.1 (90% reduction via OCR + RPA)
- Approval_Request: 0.7 (30% reduction via parallel approvals)
- Cases: 100
- Arrival Rate: 300,000ms

Results:
✅ Cycle Time: 4.2 days → 2.8 days (33% improvement)
✅ Throughput: 5.1 cases/hour → 7.8 cases/hour (53% increase)
⚠️ New Bottleneck: "Credit_Check" (was "Data_Entry")
   
Recommendation: 
After automating data entry, credit check becomes the constraint. 
Consider implementing automated credit scoring for orders <$10K to 
achieve an additional 25% cycle time reduction.
```

### Step 7: Save and Compare Scenarios

1. Each simulation is automatically saved
2. Click **"Saved Scenarios"** tab to view history
3. Compare multiple scenarios side-by-side
4. Export results for presentations

**Use Cases:**
- **Business Case Development**: Show ROI of automation projects
- **Capacity Planning**: Test impact of volume increases
- **Resource Allocation**: Optimize team size and distribution
- **Risk Assessment**: Evaluate impact of losing key resources

---

## 📊 Real-Time Process Monitoring

Monitor your processes as they execute with live instance tracking and intelligent alerts.

### Step 1: Navigate to Monitoring Dashboard

1. Click **"Monitoring"** in the left sidebar
2. You'll see the real-time monitoring dashboard

### Step 2: View Active Process Instances

**Live Metrics Display:**
- **Total Active Instances**: Currently running process cases
- **Completed Today**: Cases finished in last 24 hours
- **Average Health Score**: Overall process health (0-100%)
- **Active Alerts**: Number of current issues

**Instance List:**
Each active instance shows:
- **Case ID**: Unique identifier
- **Process Name**: Which process it belongs to
- **Current Activity**: What step it's on right now
- **Status**: Running, Waiting, Completed, Failed
- **Duration**: How long it's been running
- **Health Score**: Individual case health (0-100%)

### Step 3: Understanding Health Scores

**Health Score Calculation:**
- **90-100%** 🟢: Excellent - on track, no issues
- **70-89%** 🟡: Good - minor delays, within acceptable range
- **50-69%** 🟠: Warning - significant delays, attention needed
- **<50%** 🔴: Critical - major issues, immediate action required

**Factors Affecting Health:**
- Cycle time compared to average
- Time stuck in current activity
- Number of deviations from expected path
- Resource availability

### Step 4: Managing Alerts

**Alert Types:**
- **SLA Breach**: Process exceeds time threshold
- **Stuck Instance**: No activity for extended period
- **Resource Bottleneck**: Activity waiting for resources
- **Conformance Violation**: Deviating from expected process

**Alert Management:**
1. View alert list sorted by severity (Critical → Low)
2. Click on an alert to see details:
   - Instance ID affected
   - Root cause analysis
   - Recommended action
3. Mark as **Acknowledged** when reviewing
4. Mark as **Resolved** after fixing

### Step 5: Automatic Instance Sync

**Background Synchronization:**
- Every 60 seconds, system automatically syncs all instances
- Updates instance statuses
- Recalculates health scores
- Generates new alerts if needed
- No manual refresh required!

**Manual Sync:**
- Click **"Sync Now"** button for immediate update
- Useful when you know new instances started
- Shows loading indicator during sync

### Example Monitoring Scenario

```
Alert: SLA Breach - Critical
Case ID: ORD-4567
Process: Order Fulfillment
Current Activity: Credit Check
Duration: 4.2 hours (SLA: 2 hours)
Health Score: 32% (Critical)

Root Cause: Waiting for manual approval from credit team
Recommendation: Escalate to supervisor or use automated credit scoring for this amount

Action Taken:
1. Acknowledged alert
2. Escalated to Credit Manager
3. Approved within 15 minutes
4. Marked as Resolved
```

---

## 📝 Advanced Reporting & Exports

Generate comprehensive reports in PDF, Excel, and PowerPoint formats.

### Step 1: Navigate to Reports

1. Click **"Reports"** in the left sidebar
2. You'll see the reports dashboard with:
   - Create new report button
   - Report history table
   - Quick filters

### Step 2: Create a New Report

1. Click **"Generate New Report"** button
2. Fill in report details:
   - **Report Name**: Descriptive name (e.g., "Q1 Process Performance")
   - **Process**: Select from dropdown
   - **Report Type**: Choose format (PDF, Excel, or PowerPoint)
   - **Date Range**: Optional filter by time period

3. Click **"Generate Report"**
4. Wait 5-10 seconds for generation
5. Download automatically starts

### Step 3: Report Types & Contents

#### PDF Report (Executive Summary)
**Perfect For:** Management presentations, compliance documentation

**Includes:**
- Executive summary with key metrics
- Process overview and statistics
- Performance analytics charts (cycle time, throughput)
- Top bottlenecks identified
- Anomaly summary with severity breakdown
- Automation opportunities ranked by ROI
- Conformance score and deviation count
- AI-generated insights and recommendations

**Use Cases:**
- Board meetings
- Compliance audits
- Executive dashboards
- Client reporting

#### Excel Report (Detailed Analysis)
**Perfect For:** Deep dives, data analysis, pivot tables

**Includes Multiple Worksheets:**
1. **Summary**: KPIs and overview metrics
2. **Event Logs**: Full raw data export
3. **Activity Statistics**: Duration, frequency, resource data
4. **Bottlenecks**: Detailed bottleneck analysis
5. **Anomalies**: Complete anomaly list with severity
6. **Automation**: ROI calculations for each opportunity
7. **Conformance**: Deviation details and fitness scores

**Use Cases:**
- Data analysis
- Custom visualizations
- Integration with BI tools
- Archival purposes

#### PowerPoint Report (Presentation)
**Perfect For:** Stakeholder meetings, training sessions

**Includes Slides:**
1. **Title Slide**: Process name and date range
2. **Executive Summary**: Key findings and metrics
3. **Process Overview**: Model visualization
4. **Performance Metrics**: Cycle time, throughput charts
5. **Bottleneck Analysis**: Top 5 bottlenecks with impact
6. **Automation Opportunities**: Top 3 by ROI
7. **Recommendations**: AI-generated action items
8. **Next Steps**: Implementation roadmap

**Use Cases:**
- Stakeholder presentations
- Training materials
- Process improvement workshops
- Management reviews

### Step 4: View Report History

**Report History Table:**
- **Report Name**: What you named it
- **Type**: PDF/Excel/PowerPoint icon
- **Process**: Which process analyzed
- **Generated**: Date and time
- **Status**: Completed, Failed, Processing
- **Actions**: Download or Delete

**Filtering:**
- Filter by report type
- Filter by process
- Search by name
- Sort by date

### Step 5: Download and Share

1. Find your report in history table
2. Click **"Download"** icon
3. File downloads to your browser's download folder
4. Share with stakeholders via email or cloud storage

**Automatic Filenames:**
- PDF: `Order_Fulfillment_Report_2025-11-09.pdf`
- Excel: `Invoice_Process_Analysis_2025-11-09.xlsx`
- PowerPoint: `HR_Onboarding_Presentation_2025-11-09.pptx`

### Example Reporting Workflow

```
Scenario: Monthly executive review

Step 1: Generate PowerPoint Report
- Process: Order Fulfillment
- Name: "November Order Processing Review"
- Type: PowerPoint
- Date Range: Nov 1-30, 2025

Step 2: Generate Excel Report
- Same process and date range
- For CFO deep dive analysis

Step 3: Present to Executives
- Use PowerPoint slides in meeting
- Answer questions using Excel data
- Share both files afterward

Result: 
- Executives see 33% cycle time improvement
- Identify $120K automation opportunity
- Approve implementation budget
```

---

## 💰 Cost Analysis & ROI Calculator

Understand the financial impact of your processes and calculate automation ROI.

### Step 1: Navigate to Cost Analysis

1. Click **"Cost Analysis"** in the left sidebar
2. You'll see the cost dashboard

### Step 2: Automatic Cost Calculation

**EPI X-Ray automatically calculates:**
- **Activity Costs**: Based on duration × average hourly rate
- **Resource Costs**: Labor costs by person/system
- **Total Process Cost**: Sum of all activities in a process
- **Cost per Case**: Average cost to complete one instance
- **Annual Costs**: Projected yearly expenditure

**Standard Assumptions:**
- Average hourly rate: $50/hour (customizable)
- Working hours: 2,080 hours/year
- Overhead multiplier: 1.3× (benefits, infrastructure)

### Step 3: View Cost Breakdown

**Process-Level Metrics:**
- **Total Cases Analyzed**: Number of instances
- **Average Cost per Case**: Typical case cost
- **Total Cost**: Sum across all cases
- **Most Expensive Activities**: Top 5 by total cost

**Activity-Level Details:**
For each activity:
- **Average Duration**: Time spent
- **Execution Count**: How many times performed
- **Cost per Execution**: Single execution cost
- **Total Cost**: Frequency × cost per execution
- **% of Total**: Contribution to overall process cost

### Step 4: Calculate Automation ROI

1. Click on an automation opportunity
2. System shows:
   - **Current Annual Cost**: What you spend now
   - **Post-Automation Cost**: What you'd spend after automation
   - **Annual Savings**: Difference
   - **Implementation Cost**: One-time investment
   - **ROI %**: Return on investment percentage
   - **Payback Period**: Months to break even

**ROI Formula:**
```
ROI % = ((Annual Savings - Implementation Cost) / Implementation Cost) × 100
Payback Period = Implementation Cost / Monthly Savings
```

### Step 5: Interpret ROI Results

**ROI Scoring:**
- **>200%** 🟢: Excellent - high priority
- **100-200%** 🟡: Good - strong candidate
- **50-100%** 🟠: Fair - consider if strategic
- **<50%** 🔴: Poor - deprioritize

**Example ROI Calculation:**

```
Activity: "Invoice Data Entry"

Current State:
- Frequency: 450 times/month (5,400/year)
- Avg. Duration: 8 minutes (0.133 hours)
- Hourly Rate: $50
- Annual Cost: 5,400 × 0.133 × $50 = $35,910

Automation Proposal:
- Tool: OCR + RPA Bot
- Implementation Cost: $15,000
- Post-Automation Duration: 0.8 minutes (0.013 hours)
- New Annual Cost: 5,400 × 0.013 × $50 = $3,510
- Annual Savings: $35,910 - $3,510 = $32,400

ROI Analysis:
- ROI %: ((32,400 - 15,000) / 15,000) × 100 = 116%
- Payback Period: 15,000 / 2,700 = 5.6 months
- 3-Year NPV: $82,200

Decision: APPROVE - High ROI, fast payback
```

### Step 6: Export Cost Analysis

1. Click **"Export Cost Analysis"** button
2. Choose format (Excel or PDF)
3. Share with finance team for budgeting
4. Use for capital expenditure approvals

---

## 🤖 AI Process Assistant

Chat with your AI assistant to get instant insights about your processes.

### Step 1: Open AI Assistant

1. Click **"AI Assistant"** in the left sidebar
2. You'll see the chat interface with:
   - Conversation history
   - Input box at bottom
   - Example questions to get started

### Step 2: Ask Questions

**What You Can Ask:**

**Performance Questions:**
- "What are the top 3 bottlenecks in my order process?"
- "Why is the average cycle time so high?"
- "Which activities take the longest?"

**Automation Questions:**
- "What should I automate first?"
- "Calculate ROI for automating invoice data entry"
- "How much can I save by automating credit checks?"

**Troubleshooting Questions:**
- "Why did case ORD-12345 take so long?"
- "What's causing the bottleneck in approval?"
- "How can I reduce cycle time by 30%?"

**Comparison Questions:**
- "Compare Q1 vs Q2 performance"
- "How does my process compare to industry benchmarks?"
- "What changed since last month?"

### Step 3: Review AI Responses

**AI Responses Include:**
- **Direct Answer**: Clear, actionable response
- **Supporting Data**: Metrics and statistics
- **Recommendations**: Specific action items
- **Priority Levels**: What to tackle first
- **ROI Estimates**: Financial impact

**Example Conversation:**

```
You: What are my biggest bottlenecks?

AI: Based on your Order Fulfillment process analysis, here are the top 3 bottlenecks:

1. **Credit Check** (CRITICAL)
   - Average Duration: 2.4 hours
   - 95th Percentile: 8.1 hours
   - Impact: Delays 34% of orders by 6+ hours
   - Root Cause: Manual review queue, 2 analysts for 450 cases/month
   - Recommendation: Implement automated credit scoring for orders <$10K (80% of volume)
   - Estimated Impact: 45% cycle time reduction, $67K annual savings

2. **Manager Approval** (HIGH)
   - Average Duration: 14.2 hours
   - 95th Percentile: 31.5 hours
   - Impact: Adds 1.2 days to average cycle time
   - Root Cause: Single approver, vacation/busy periods create backlog
   - Recommendation: Add backup approver and set auto-approval threshold
   - Estimated Impact: 22% cycle time reduction, $28K annual savings

3. **Inventory Check** (MEDIUM)
   - Average Duration: 45 minutes
   - Impact: Manual lookup in 3 different systems
   - Recommendation: Integrate inventory systems with API
   - Estimated Impact: 12% cycle time reduction, $15K annual savings

Priority Action: Start with Credit Check automation - highest ROI and impact.
```

### Step 4: Follow Recommendations

1. AI provides specific action items
2. Copy recommendations to your task list
3. Share with team for implementation
4. Re-analyze process after changes to measure improvement

### Step 5: Context-Aware Conversations

**AI Remembers:**
- Previous questions in the conversation
- Your processes and their data
- Recent analyses and reports
- Anomalies and issues detected

**Example Followup:**

```
You: How much would it cost to implement that credit check automation?

AI: For the Credit Check automation I just recommended:

Implementation Costs:
- Credit Scoring API: $5,000 setup + $200/month
- Integration Development: $12,000 (3 weeks)
- Testing & Training: $3,000
- Total One-Time: $20,000
- Annual Recurring: $2,400

Expected Savings:
- Current Annual Cost: $87,360 (2 analysts × 40% time)
- Post-Automation Cost: $20,160 (0.5 analyst + API fees)
- Annual Savings: $67,200

ROI Analysis:
- ROI: 236% first year
- Payback Period: 3.6 months
- 3-Year NPV: $181,600

Recommendation: Strong business case - proceed with implementation.
```

---

## 👥 Collaboration Features

Work together with your team on process analysis using comments and shared insights.

### Step 1: Navigate to a Process

1. Go to Dashboard
2. Click on any process you want to collaborate on
3. Scroll to the Comments section (bottom of process detail page)

### Step 2: Add Comments

1. Type your comment in the text box
2. **Mention team members**: Use @name to notify someone
3. **Share insights**: Describe what you found
4. **Ask questions**: Get input from colleagues
5. Click **"Post Comment"**

**Good Comment Examples:**

```
"Found a major bottleneck in Credit Check - taking 3x longer than expected. @Sarah can you investigate why?"

"Great news! After implementing the RPA bot for data entry, we've reduced cycle time by 41%. Updated metrics attached."

"@John please review the conformance report - seeing 23% deviation rate in approval workflow. Might need retraining."
```

### Step 3: Reply to Comments

1. Click **"Reply"** on any comment
2. Type your response
3. Click **"Post Reply"**
4. Thread appears indented under original comment

**Reply Example:**

```
Original Comment by Sarah:
"Credit check delays caused by new compliance requirements added last month."

Your Reply:
"Thanks @Sarah! Can we automate the compliance checks? I'll generate an ROI analysis."
```

### Step 4: View Comment History

**Comments Show:**
- **Author**: Who posted it
- **Timestamp**: When posted
- **Edit History**: If modified (shows "Edited")
- **Replies**: Threaded conversations

**Sorting:**
- Newest first (default)
- Oldest first
- Most replies first

### Step 5: Edit or Delete Comments

**Edit Comment:**
1. Click **"Edit"** icon (⋯ menu)
2. Update text
3. Click **"Save"**
4. Shows "Edited" indicator

**Delete Comment:**
1. Click **"Delete"** icon (⋯ menu)
2. Confirm deletion
3. Comment removed (replies also deleted)

**Note:** You can only edit/delete your own comments.

### Example Collaboration Workflow

```
Day 1 - Analysis Phase:
Sarah: "Starting analysis of Q3 order fulfillment data. Will update with findings."

Day 2 - Findings:
Sarah: "Analysis complete. Key findings:
- Cycle time increased 18% vs Q2
- New bottleneck in shipping validation
- 127 conformance violations
Full report attached. @John please review bottleneck. @Mike check violations."

Day 3 - Investigation:
John: "Shipping validation bottleneck caused by new carrier API being slow. Investigating alternatives."
Mike: "@Sarah most violations are minor - missing timestamps. Will add validation in form."

Day 4 - Resolution:
John: "Switched to faster carrier API. Testing shows 65% speed improvement. @Sarah please re-analyze."
Sarah: "Re-analyzed with new data. Cycle time back to Q2 levels! Great work @John!"

Result: Team collaboration identified and resolved issue in 4 days.
```

---

## 📊 Custom KPI Builder

Create and monitor your own custom KPIs with threshold-based alerts.

### Step 1: Navigate to Custom KPIs

1. Click **"Custom KPIs"** in the left sidebar
2. You'll see the KPI dashboard with:
   - Existing KPIs (if any)
   - Create New KPI button
   - Alert history

### Step 2: Create a New KPI

1. Click **"Create New KPI"** button
2. Fill in KPI details:

**Basic Information:**
- **KPI Name**: Descriptive name (e.g., "Order Processing Speed")
- **Description**: What it measures and why it matters
- **Process**: Select which process to monitor
- **Update Frequency**: How often to calculate (Hourly, Daily, Weekly)

**Calculation Method:**
- **Metric Type**: Choose what to measure
  - Average Cycle Time
  - Case Count
  - Throughput (cases/hour)
  - Bottleneck Duration
  - Cost per Case
  - Conformance Rate
  - Automation Rate
  - Custom Formula

**Threshold Settings:**
- **Target Value**: Your goal (e.g., 24 hours)
- **Warning Threshold**: When to show warning (e.g., >30 hours)
- **Critical Threshold**: When to alert (e.g., >48 hours)

### Step 3: Set Up Alerts

**Alert Configuration:**
- **Enable Alerts**: Toggle on/off
- **Alert Channels**: 
  - In-app notifications
  - Email (future)
  - Slack (future)
  - Webhook (future)
- **Alert Frequency**: 
  - Immediate
  - Hourly digest
  - Daily summary

**Alert Conditions:**
- Exceeds critical threshold
- Below target for X days
- Trending worse by X%
- Sudden spike or drop

### Step 4: Monitor KPI Dashboard

**KPI Cards Show:**
- **Current Value**: Latest measurement
- **Status Indicator**:
  - 🟢 Green: Meeting target
  - 🟡 Yellow: Warning threshold
  - 🔴 Red: Critical threshold
- **Trend**: Up/down arrow with %
- **Last Updated**: Timestamp
- **Quick Actions**: Edit, Delete, View History

**Dashboard Features:**
- Sort by status (Critical first)
- Filter by process
- Search KPIs by name
- Export KPI data

### Step 5: Review Alerts

**Alert List Shows:**
- **KPI Name**: Which KPI triggered
- **Severity**: Critical, Warning, Info
- **Message**: What happened
- **Triggered At**: When it occurred
- **Current Value**: Metric value
- **Threshold**: What was exceeded
- **Actions**: Acknowledge, Snooze, View Details

**Alert Management:**
1. Click on alert to see details
2. View trend chart
3. See root cause analysis (AI-generated)
4. Mark as **Acknowledged** when reviewing
5. Mark as **Resolved** after fixing
6. Snooze for X hours if need time

### Example Custom KPI Setup

```
KPI Name: "High-Value Order Cycle Time"

Description: "Monitor cycle time for orders >$50K to ensure VIP service level"

Configuration:
- Process: Order Fulfillment
- Metric: Average Cycle Time
- Filter: Order Value > $50,000
- Update Frequency: Hourly
- Target: 18 hours
- Warning: >24 hours
- Critical: >36 hours

Alerts Enabled: Yes
- Channel: In-app + Email
- Frequency: Immediate

Result:
- Created on Nov 9, 2025
- Current Value: 16.2 hours 🟢 (Meeting target)
- Alerts Triggered: 0

Day 3 Update:
- Current Value: 38.4 hours 🔴 (Critical!)
- Alert Generated: "High-Value Order Cycle Time exceeded critical threshold"
- Root Cause: Credit check delays for large amounts
- Action Taken: Expedited credit team review
- Resolution: Back to 17.1 hours within 4 hours
```

### Step 6: KPI Best Practices

**Do:**
- ✅ Align KPIs with business objectives
- ✅ Set realistic thresholds based on historical data
- ✅ Review KPIs weekly to ensure relevance
- ✅ Share KPI dashboards with stakeholders
- ✅ Document why KPIs matter in description

**Don't:**
- ❌ Create too many KPIs (focus on critical few)
- ❌ Set unrealistic targets
- ❌ Ignore alerts repeatedly
- ❌ Forget to update thresholds as process improves

---

## 🔐 Managing Your Privacy

EPI X-Ray is fully GDPR compliant with comprehensive privacy controls.

### Viewing Your Consent Preferences

1. Click your profile icon (top right)
2. Select **"Privacy Settings"**
3. You'll see all consent types:
   - Privacy Policy
   - Analytics Tracking
   - Marketing Communications
   - Third-Party Data Sharing

### Updating Consents

1. Toggle any consent on/off
2. Click **"Save Preferences"**
3. Changes are logged with timestamp and IP address

**Note:** You can revoke consents at any time without affecting core functionality.

### Exporting Your Data

**GDPR Article 20: Right to Data Portability**

1. Click profile icon → **"Export My Data"**
2. Wait 5-10 seconds for data compilation
3. Download JSON file containing:
   - Your profile information
   - All processes and event logs
   - Documents and uploads
   - Audit logs
   - Simulation scenarios
   - Consent history

**File Format:** JSON (machine-readable, can import to other systems)

### Deleting Your Account

**GDPR Article 17: Right to Erasure**

⚠️ **WARNING:** This action is IRREVERSIBLE. All your data will be permanently deleted.

1. Click profile icon → **"Delete Account"**
2. Enter your password for confirmation
3. Type **"DELETE"** (all caps) in the confirmation field
4. Click **"Permanently Delete Account"**

**What Gets Deleted:**
- User account
- All processes and event logs
- All documents and uploads
- AI insights and analysis results
- Simulation scenarios
- Audit logs
- Consent records

**Timeframe:** Immediate and irreversible

---

## 🔧 Troubleshooting

### Login Issues

**Problem:** "Invalid email or password"
- Check for typos in email/password
- Ensure Caps Lock is off
- Email is case-insensitive, password is case-sensitive
- After 5 failed attempts, wait 15 minutes

**Problem:** "Too many login attempts"
- You've exceeded 5 attempts in 15 minutes
- Wait 15 minutes before trying again
- Check if you're using the correct email

### Upload Issues

**Problem:** "Missing required columns"
- CSV must have exactly: `caseId`, `activity`, `timestamp`
- Column names are case-sensitive
- Check for extra spaces in column headers

**Problem:** "Invalid timestamp format"
- Use: `YYYY-MM-DD HH:MM:SS` format
- Example: `2025-01-15 09:30:00`
- Avoid Excel date formats (serialized numbers)

**Problem:** "File too large"
- Max file size: 50 MB
- Filter data to most recent 6 months
- Or split into multiple processes

### Process Discovery Issues

**Problem:** No process model appears
- Ensure you have at least 50 events
- Check that caseIds have multiple activities
- Verify timestamp chronological order
- Try refreshing the page

**Problem:** Process model looks incorrect
- Verify data quality (no missing activities)
- Check for data entry errors in activity names
- Ensure timestamps are accurate

### AI Features Not Working

**Problem:** "AI analysis temporarily unavailable"
- AI service may be experiencing high load
- Wait 5 minutes and try again
- Check your internet connection
- Contact support if persists >1 hour

**Problem:** Anomaly detection returns no results
- Need at least 50 events for statistical analysis
- Ensure variety in cases (not all identical)
- Check that data spans multiple days/weeks

### Simulation Issues

**Problem:** Simulation results seem unrealistic
- Check duration multipliers (0.1 = 90% reduction, not 10%)
- Verify arrival rate is appropriate for your process
- Ensure base process model is accurate
- Consider if parameters are too aggressive

**Problem:** "No process model found"
- Run Process Discovery first
- Ensure discovery completed successfully
- Refresh page and try again

---

## ⚡ Platform Performance

EPI X-Ray is designed for speed and responsiveness. Recent performance optimizations ensure blazing-fast analysis.

### What You'll Experience

**Fast Dashboard Loading:**
- Dashboard stats load in <200ms (was 8+ seconds)
- 95% improvement in page load times
- Automatic caching for frequently accessed data

**Optimized Queries:**
- Efficient database aggregations (3 optimized queries vs. 20+ sequential)
- Smart caching reduces server load
- Real-time data without lag

**Smart Caching:**
- 30-second cache for process lists and analytics
- 60-second cache for user authentication
- Private cache headers ensure data security

**When to Expect Fast Performance:**
- Dashboard metrics: Instant (<300ms)
- Process list: <100ms after first load
- Analytics: 1-2 seconds for complex calculations
- Reports: 5-10 seconds for generation

**If Pages Load Slowly:**
1. First load after restart takes longer (compiling)
2. Very large datasets (>100K events) may take extra time
3. Complex AI analysis runs on-demand (15-30 seconds)
4. Hard refresh your browser if cached data seems stale

**Performance Tips:**
- Use date filters to reduce data size
- Archive old processes you no longer analyze
- Run heavy analyses (AI, simulations) during off-peak hours
- Clear browser cache if experiencing issues

---

## 💡 Best Practices

### Data Quality

**Do:**
- ✅ Use consistent activity naming (e.g., "Check_Inventory", not "check inventory" or "Check inventory")
- ✅ Include resource information when available
- ✅ Ensure timestamps are accurate and chronological
- ✅ Use meaningful caseIds that can be traced back to source systems
- ✅ Include enough data (recommend 3+ months, 1000+ events)

**Don't:**
- ❌ Mix different processes in one CSV
- ❌ Use generic activity names (e.g., "Activity 1", "Step 2")
- ❌ Include test data or system errors
- ❌ Upload incomplete cases unless intentional

### Process Analysis Workflow

**Recommended Sequence:**

1. **Upload Event Logs** → Get raw data into system
2. **Discover Process Model** → Understand the actual process
3. **Run Performance Analytics** → Identify bottlenecks
4. **Detect Anomalies** → Find unusual patterns
5. **Check Conformance** → Validate against standards
6. **Find Automation Opportunities** → Identify ROI projects
7. **Simulate What-If Scenarios** → Test improvements
8. **Implement Changes** → Execute in production
9. **Re-analyze** → Validate improvements

### Interpretation Guidelines

**Cycle Time:**
- Compare to SLA commitments
- Look at 95th percentile, not just average
- Investigate cases >2× standard deviation

**Bottlenecks:**
- Focus on activities that consume >20% of total time
- Consider both duration AND frequency
- Look for systemic issues, not one-off problems

**Anomalies:**
- Prioritize Critical and High severity
- Validate with process owners before taking action
- Re-run after fixes to verify improvement

**Automation:**
- Start with high ROI, low complexity projects
- Pilot with one activity before scaling
- Measure actual results vs. predicted ROI

### Security Best Practices

**Passwords:**
- Use unique password (not reused from other sites)
- Minimum 12 characters
- Include uppercase, lowercase, numbers
- Consider password manager

**Data Protection:**
- Only upload necessary data
- Anonymize sensitive information if possible
- Regularly export your data as backup
- Delete old processes when no longer needed

**Access Control:**
- Log out after use on shared computers
- Don't share login credentials
- Review audit logs periodically

---

## 📞 Getting Help

### Documentation

- **Features Guide**: Complete feature descriptions (FEATURES.md)
- **User Guide**: This document (USER_GUIDE.md)
- **Task Mining Roadmap**: Future capabilities (TASK_MINING_ROADMAP.md)

### Common Questions

**Q: How much data do I need?**  
A: Minimum 50 events, recommend 1000+ events spanning 3+ months for meaningful insights.

**Q: Can I analyze multiple processes?**  
A: Yes! Create separate processes for each distinct workflow (order fulfillment, invoice processing, etc.)

**Q: Is my data secure?**  
A: Yes. All data is isolated per user, encrypted in transit, and stored securely. See Security Features in FEATURES.md.

**Q: How accurate is the AI?**  
A: AI insights are 85%+ accurate based on GPT-4.1 model. Always validate with domain experts before implementing changes.

**Q: Can I delete a process?**  
A: Yes. Navigate to the process → Settings → Delete Process. This deletes all associated event logs and analysis.

**Q: What file formats are supported?**  
A: Currently CSV only. Support for Excel, JSON, and database connections planned.

**Q: Can I collaborate with team members?**  
A: Not currently. Team collaboration and role-based access control are on the roadmap.

---

## 🎓 Advanced Tips

### Optimizing Process Discovery

- **Clean Data**: Remove duplicate entries before upload
- **Merge Activities**: Combine similar activities (e.g., "Check Inventory" + "Check Stock" → "Check Inventory")
- **Filter Noise**: Remove system errors and test data
- **Enrich Data**: Add resource information for better insights

### Improving Conformance Scores

1. **Standardize Training**: Ensure all team members follow same process
2. **Document Exceptions**: When deviations are necessary, document why
3. **Automate Controls**: Prevent skipped steps with system enforcement
4. **Monitor Trends**: Track conformance over time to identify degradation

### Maximizing Automation ROI

1. **Start Small**: Pilot one activity, measure results, then scale
2. **Involve Users**: Get buy-in from people currently doing the work
3. **Measure Baselines**: Document current performance before automation
4. **Track Benefits**: Measure actual time/cost savings vs. predictions
5. **Iterate**: Continuously improve automations based on feedback

### Advanced Simulation Techniques

**Scenario Stacking:**
Test multiple changes together:
```json
{
  "Data_Entry": 0.1,        // Automation
  "Approval": 0.7,          // Parallel processing
  "*": 0.9                  // 10% improvement from training
}
```

**Sensitivity Analysis:**
Run same scenario with varying parameters to find optimal configuration.

**Capacity Planning:**
Model different arrival rates to determine resource requirements:
- Arrival rate 600,000ms = Low volume
- Arrival rate 300,000ms = Current volume
- Arrival rate 150,000ms = High volume (2x growth)

---

## ✅ Quick Reference

### CSV Format
```csv
caseId,activity,timestamp,resource
CASE-001,Start,2025-01-15 09:00:00,System
CASE-001,Process,2025-01-15 09:15:00,John
CASE-001,End,2025-01-15 10:30:00,System
```

### Keyboard Shortcuts
- **Process Flowchart**: Scroll to zoom, drag to pan, double-click to reset
- **Tables**: Click column headers to sort

### Common Multipliers
- `0.1` = 90% reduction (heavy automation)
- `0.5` = 50% reduction (moderate improvement)
- `0.7` = 30% reduction (incremental optimization)
- `0.9` = 10% reduction (training/tools)
- `1.5` = 50% increase (volume growth)
- `2.0` = 100% increase (double volume)

### Severity Levels
- 🔴 **Critical**: Immediate action (process failure risk)
- 🟠 **High**: Significant impact (performance/cost)
- 🟡 **Medium**: Notable issues (manageable)
- 🟢 **Low**: Minor optimizations

---

**Last Updated:** November 8, 2025  
**Version:** 1.0.0  
**Platform:** EPI X-Ray Process Mining & Automation Platform

Need help? Check FEATURES.md for detailed feature descriptions or TASK_MINING_ROADMAP.md for future capabilities.
