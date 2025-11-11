# EPI X-Ray: Complete Product & Business Guide

## Table of Contents
1. [Log File Formats & Sample Data](#log-file-formats--sample-data)
2. [Feature Deep Dive](#feature-deep-dive)
3. [Competitive Positioning](#competitive-positioning)
4. [Pricing Strategy](#pricing-strategy)
   - 4.1 SaaS Subscription Pricing
   - 4.2 On-Premise Licensing
   - 4.3 Custom Development & Implementation
   - 4.4 Pricing Rationale
   - 4.5 Pricing Comparison (Annual Cost)
   - 4.6 Enterprise-Scale Pricing (2,000-3,500 Users)
5. [Future Roadmap](#future-roadmap)
6. [Client Integration Guide](#client-integration-guide)

---

## 1. Log File Formats & Sample Data

### 1.1 Process Discovery - Event Log Format

**Required Format:** CSV or Excel with the following columns

```csv
case_id,activity,timestamp,resource,cost
CASE001,Submit Request,2024-01-15 09:00:00,John Smith,50
CASE001,Review Request,2024-01-15 10:30:00,Sarah Johnson,75
CASE001,Approve Request,2024-01-15 14:00:00,Mike Davis,100
CASE001,Process Payment,2024-01-15 15:30:00,System,25
CASE002,Submit Request,2024-01-15 09:15:00,Jane Doe,50
CASE002,Review Request,2024-01-15 11:00:00,Sarah Johnson,75
CASE002,Reject Request,2024-01-15 12:00:00,Mike Davis,100
```

**Minimum Required Columns:**
- `case_id`: Unique identifier for each process instance
- `activity`: Name of the activity/task
- `timestamp`: ISO 8601 format (YYYY-MM-DD HH:MM:SS)

**Optional Enhanced Columns:**
- `resource`: Person/system performing the activity
- `cost`: Cost associated with the activity
- `department`: Department responsible
- `priority`: Priority level (High/Medium/Low)
- `customer_id`: Customer identifier
- `product_id`: Product identifier

**Sample Data (100+ cases recommended for accurate discovery)**

### 1.2 Conformance Checking - Reference Process Model

**Format:** BPMN XML or JSON

```json
{
  "process_name": "Purchase Order Process",
  "start_activities": ["Submit Request"],
  "end_activities": ["Process Payment", "Reject Request"],
  "valid_transitions": [
    {"from": "Submit Request", "to": "Review Request"},
    {"from": "Review Request", "to": "Approve Request"},
    {"from": "Review Request", "to": "Reject Request"},
    {"from": "Approve Request", "to": "Process Payment"}
  ],
  "constraints": {
    "mandatory_activities": ["Submit Request", "Review Request"],
    "mutually_exclusive": [["Approve Request", "Reject Request"]]
  }
}
```

### 1.3 Performance Analytics - Metrics Log

**Format:** CSV with performance indicators

```csv
date,process_name,cycle_time_hours,throughput,conformance_rate,cost,resource_utilization
2024-01-15,Purchase Order,12.5,45,0.92,5600,0.78
2024-01-16,Purchase Order,11.8,48,0.95,5200,0.82
2024-01-17,Purchase Order,13.2,42,0.89,6100,0.75
```

### 1.4 Automation Opportunities - Activity Details

**Format:** CSV with detailed activity data

```csv
activity_name,frequency,avg_duration_minutes,variability,human_decision_required,system_accessible,data_structured
Data Entry,450,15.5,0.3,false,true,true
Document Review,320,45.2,0.6,true,false,false
Email Notification,480,2.1,0.1,false,true,true
Approval Decision,210,30.5,0.8,true,true,true
```

### 1.5 Predictive Analytics - Time Series Data

**Format:** CSV with historical metrics

```csv
date,process_id,cycle_time,throughput,resource_count,case_volume
2024-01-01,PROC001,12.5,45,8,180
2024-01-02,PROC001,11.8,48,8,192
2024-01-03,PROC001,13.2,42,7,168
2024-01-04,PROC001,10.5,52,9,208
```

### 1.6 Task Mining - Desktop Activity Logs

**Format:** JSON from Desktop Capture Agent

```json
{
  "user_id": "user123",
  "timestamp": "2024-01-15T09:00:00Z",
  "application": "SAP ERP",
  "window_title": "Purchase Order Entry",
  "activity_type": "typing",
  "duration_ms": 15000,
  "keys_pressed": 245,
  "mouse_clicks": 12,
  "screenshots_enabled": false,
  "context": {
    "process": "Purchase Order Creation",
    "step": "Data Entry"
  }
}
```

### 1.7 Cost Analysis - Financial Data

```csv
activity,fixed_cost,variable_cost_per_case,labor_cost_per_hour,frequency_per_month
Submit Request,0,5,35,450
Review Request,0,8,45,450
Approve Request,0,12,55,380
Process Payment,50,3,25,380
```

### 1.8 Real-Time Monitoring - Instance Status

```json
{
  "instance_id": "INST_2024_001",
  "process_id": 11,
  "status": "in_progress",
  "current_activity": "Review Request",
  "started_at": "2024-01-15T09:00:00Z",
  "expected_completion": "2024-01-15T15:00:00Z",
  "current_duration_hours": 4.5,
  "health_score": 0.85,
  "alerts": []
}
```

---

## 2. Feature Deep Dive

### 2.1 Process Discovery

**What It Does:**
Automatically generates visual process maps from raw event logs using the Alpha Miner algorithm. No manual modeling required.

**Key Capabilities:**
- Discovers actual process flows (not idealized versions)
- Identifies all activities, transitions, and variants
- Calculates frequency and performance for each path
- Detects start and end activities automatically
- Supports multiple discovery algorithms (Alpha Miner, Inductive Miner)

**Business Value:**
- **Time Savings:** Reduces process documentation time from weeks to minutes
- **Accuracy:** Shows what actually happens, not what the handbook says
- **Variant Analysis:** Identifies 80+ process variants in complex workflows

**How to Use:**
1. Upload event log CSV (minimum 50 cases recommended)
2. Map columns to required fields (case_id, activity, timestamp)
3. Click "Discover Process Model"
4. View interactive process map with frequency indicators

**Technical Implementation:**
- Uses Alpha Miner algorithm for dependency graph construction
- Detects patterns using footprint matrix analysis
- Visualizes using ReactFlow with auto-layout
- Color-coded nodes: Green=Start, Red=End, Cyan=Activities
- Edge thickness represents transition frequency

### 2.2 Conformance Checking

**What It Does:**
Compares actual process execution against reference models to detect deviations.

**Two Sub-Modules:**

#### A. Token-Based Replay
- Simulates token flow through Petri net
- Identifies missing tokens (skipped activities)
- Detects remaining tokens (incomplete paths)
- Calculates fitness score (0-1)

#### B. Anomaly Detection
- Five detection algorithms:
  1. **Isolation Forest:** Detects outliers in multi-dimensional space
  2. **Statistical Z-Score:** Finds values beyond 3 standard deviations
  3. **Moving Average:** Identifies deviations from trends
  4. **Interquartile Range (IQR):** Detects outliers using quartile analysis
  5. **DBSCAN Clustering:** Finds density-based anomalies

**Business Value:**
- **Compliance:** Ensures regulatory adherence (SOX, GDPR, ISO)
- **Risk Mitigation:** Detects fraud and process violations early
- **Quality Control:** Maintains process standardization

**Metrics:**
- Conformance Rate: % of cases following the model
- Deviation Types: Skipped, Inserted, Reordered activities
- Severity Classification: Low/Medium/High/Critical

### 2.3 Performance Analytics

**What It Does:**
Tracks KPIs and provides deep performance insights.

**Key Metrics:**
- **Cycle Time:** End-to-end process duration
- **Throughput:** Cases completed per time period
- **Resource Utilization:** % time resources are active
- **Bottleneck Analysis:** Identifies slowest activities
- **Waiting Time:** Time between activities
- **Conformance Rate:** % of compliant cases

**Visualizations:**
- Time series trends
- Activity duration heatmaps
- Resource performance comparison
- Bottleneck identification charts

**Business Value:**
- **Operational Efficiency:** Identify and eliminate bottlenecks
- **Capacity Planning:** Optimize resource allocation
- **SLA Management:** Track and improve service levels

### 2.4 Automation Opportunities (Automachina)

**What It Does:**
AI-powered identification of tasks suitable for automation with ROI calculation.

**Analysis Criteria:**
- **Rule-Based Logic:** Tasks with clear if-then patterns
- **Repetitiveness:** High-frequency activities
- **Data Availability:** Structured, system-accessible data
- **Decision Complexity:** Low human judgment required
- **Variability:** Low variation in execution

**Automation Scoring:**
- 0-100 score based on multiple factors
- ROI calculation with NPV projections
- Implementation complexity assessment
- Time-to-value estimation

**Output:**
- Ranked list of automation opportunities
- Estimated annual savings per opportunity
- Technology recommendations (RPA, API, Low-code)
- Implementation roadmap

**Business Value:**
- **Cost Reduction:** 30-70% reduction in manual effort
- **Error Reduction:** Eliminates human errors
- **Scalability:** Handle volume without headcount increase

### 2.5 Predictive Analytics Suite

**Three Integrated Modules:**

#### A. Anomaly Detection
- Real-time detection of unusual patterns
- AI-generated insights explaining anomalies
- Severity classification (Low/Medium/High/Critical)
- Historical anomaly tracking

#### B. Forecasting
- **Hybrid Algorithm:**
  - Holt-Winters (12+ data points)
  - Linear Regression (medium data)
  - Moving Average (sparse data)
- **Predictions:**
  - Cycle time forecasts (30/60/90 days)
  - Throughput predictions
  - Resource utilization forecasts
- **Confidence Intervals:** 95% confidence bands
- **EWMA Denoising:** Reduces noise in predictions

#### C. Scenario Analysis (What-If)
- **Three Scenarios:**
  - Optimistic: +30% resources, +30% speed
  - Expected: Baseline
  - Pessimistic: -30% resources, -50% speed
- **Discrete-Event Simulation:** Models actual process flow
- **Outputs:**
  - Cycle time impacts
  - Throughput changes
  - SLA breach probabilities
  - Risk assessment scores

**Business Value:**
- **Proactive Management:** Anticipate issues before they occur
- **Strategic Planning:** Model impact of changes before implementation
- **Risk Mitigation:** Quantify downside scenarios

### 2.6 Real-Time Monitoring

**What It Does:**
Live tracking of running process instances with automated health scoring.

**Features:**
- **Active Instance Dashboard:** Real-time status of all running cases
- **Health Scoring:** AI-calculated health metrics (0-1)
- **Smart Alerts:** Automated warnings for:
  - SLA breach risks
  - Stuck instances
  - Performance degradation
  - Anomalous behavior
- **Performance Metrics:**
  - Current cycle time vs. average
  - Expected completion time
  - Resource workload

**Alert Types:**
- **Critical:** Immediate action required
- **Warning:** Attention needed soon
- **Info:** Informational updates

**Business Value:**
- **Incident Prevention:** Catch issues before they impact customers
- **Operational Visibility:** Real-time situational awareness
- **Faster Response:** Reduce mean time to resolution (MTTR)

### 2.7 Task Mining

**What It Does:**
Desktop activity analysis to understand how people actually work.

**Components:**

#### Desktop Capture Agent (Electron App)
- Real-time activity monitoring
- Application usage tracking
- Mouse/keyboard interaction logging
- Optional screenshot capture
- Privacy-first design with consent management

#### Pattern Detection
- AI-powered activity classification
- Process step identification
- Time waste detection
- Multi-tasking analysis

#### Automation Opportunity Engine
- Identifies repetitive manual tasks
- Calculates time spent on each activity
- Prioritizes automation opportunities
- Links desktop activities to process steps

**Privacy & Security:**
- User consent required before tracking
- Encrypted data transmission (AES-256-GCM)
- Opt-out anytime
- GDPR compliant

**Business Value:**
- **Hidden Work Discovery:** Reveals unrecorded activities
- **Automation Identification:** 40%+ of work is automatable
- **Training Needs:** Identifies inefficient work patterns

### 2.8 Cost Analysis & ROI Calculator

**What It Does:**
Comprehensive financial analysis of process performance.

**Capabilities:**
- **Cost Attribution:** Activity-level cost tracking
- **ROI Calculations:**
  - Net Present Value (NPV)
  - Payback period
  - Internal Rate of Return (IRR)
- **Total Cost of Ownership (TCO):** Full process costs
- **Scenario Modeling:** Compare as-is vs. to-be states

**Cost Components:**
- Labor costs (hourly rates × time)
- System costs (licenses, infrastructure)
- Overhead allocation
- Error/rework costs

**Business Value:**
- **Investment Justification:** Build business cases for improvements
- **Budget Planning:** Accurate cost forecasting
- **Profitability Analysis:** Process-level P&L

### 2.9 Custom KPI Builder

**What It Does:**
Create custom metrics tailored to your business needs.

**Features:**
- **Formula Builder:** SQL-like expression language
- **Threshold Alerts:** Automated notifications
- **Multi-Process KPIs:** Aggregate across processes
- **Real-Time Calculation:** Live metric updates

**Example KPIs:**
- First-Time Resolution Rate
- Customer Satisfaction Score
- Error Rate by Department
- Revenue per Process Instance

**Business Value:**
- **Flexibility:** Track what matters to your business
- **Governance:** Monitor custom compliance metrics
- **Benchmarking:** Compare against internal standards

### 2.10 Reports & Exports

**What It Does:**
Professional report generation in multiple formats.

**Export Formats:**
- **PDF:** Executive summaries, dashboards
- **Excel:** Detailed data tables, pivot-ready
- **PowerPoint:** Presentation-ready slides

**Report Types:**
- Executive Dashboard Summary
- Process Performance Report
- Conformance Analysis Report
- Automation Opportunity Report
- Custom Report Builder

**Scheduling:**
- One-time exports
- Scheduled daily/weekly/monthly
- Email distribution lists

**Business Value:**
- **Stakeholder Communication:** Professional deliverables
- **Compliance Documentation:** Audit-ready reports
- **Data Portability:** Use in other tools

### 2.11 AI Process Assistant

**What It Does:**
Natural language chatbot for process mining insights.

**Capabilities:**
- Ask questions in plain English
- Get AI-generated insights
- Process-specific context awareness
- Data-driven answers backed by actual metrics

**Multi-LLM Support:**
- Replit AI
- OpenAI GPT-4
- Mistral AI
- DeepSeek
- Groq
- Together AI

**Example Queries:**
- "What are the main bottlenecks in my purchase order process?"
- "Which activities should I automate first?"
- "Why did conformance drop last week?"
- "Compare cycle times between departments"

**Business Value:**
- **Democratized Analytics:** Non-technical users can get insights
- **Faster Insights:** Instant answers vs. manual analysis
- **Guided Optimization:** AI suggests improvement actions

### 2.12 Document Upload & Email Parsing

**What It Does:**
AI-powered extraction of process steps from unstructured documents.

**Supported Formats:**
- Emails (.eml, .msg)
- Word documents
- PDFs
- Text files

**AI Extraction:**
- Identifies process steps
- Extracts temporal sequences
- Maps to standard activities
- Generates event logs

**Business Value:**
- **Legacy Documentation:** Convert old process docs to executable models
- **Communication Mining:** Discover processes from email threads
- **Rapid Onboarding:** Document tribal knowledge quickly

### 2.13 API Integrations

**What It Does:**
Secure API key management for desktop agent and third-party integrations.

**Features:**
- **API Key Generation:** Cryptographically secure keys
- **Scope Management:** Granular permissions
- **Key Rotation:** Automated rotation policies
- **Usage Tracking:** Monitor API consumption
- **Revocation:** Instant key deactivation

**Security:**
- AES-256-GCM encryption at rest
- Rate limiting
- IP whitelisting
- Audit logging

**Business Value:**
- **Secure Automation:** Safe system-to-system integration
- **Ecosystem Integration:** Connect to existing tools
- **Scalability:** Programmatic access for enterprise deployments

### 2.14 Digital Twin & What-If Scenarios

**What It Does:**
Create virtual replicas of processes to simulate changes before implementation.

**Digital Twin Components:**
- **Process Model:** Visual representation
- **Historical Data:** Past performance metrics
- **Resource Pool:** Available capacity
- **Business Rules:** Constraints and logic

**What-If Analysis:**
- **Change Parameters:**
  - Case volume (10-500 cases)
  - Activity duration (0.5x-2.0x multipliers)
  - Resource capacity
  - Business rules
- **Simulation Engine:** Discrete-event simulation
- **Impact Analysis:**
  - Cycle time changes
  - Throughput impacts
  - Bottleneck shifts
  - SLA compliance predictions

**Scenario Comparison:**
- Side-by-side baseline vs. optimized
- Visual impact indicators
- Quantified improvements
- Risk assessment

**Business Value:**
- **Risk-Free Testing:** Test changes without disrupting operations
- **Optimization:** Find optimal resource allocation
- **Change Impact Assessment:** Quantify before committing

---

## 3. Competitive Positioning

### 3.1 Market Landscape

**Top Competitors:**
1. **Celonis** (Market Leader)
2. **UiPath Process Mining**
3. **Microsoft Power Automate Process Advisor**
4. **SAP Signavio**
5. **IBM Process Mining**
6. **ARIS Process Mining (Software AG)**

### 3.2 EPI X-Ray Advantages

| Feature | EPI X-Ray | Celonis | UiPath | Microsoft | SAP Signavio |
|---------|-----------|---------|--------|-----------|--------------|
| **Pricing** | $299-$999/mo | $25K-$100K+/yr | $15K-$50K/yr | $5K-$30K/yr | $20K-$80K/yr |
| **Setup Time** | <1 day | 2-4 weeks | 1-2 weeks | 3-5 days | 1-2 weeks |
| **On-Prem Option** | ✅ | ✅ (Enterprise only) | ✅ (Enterprise only) | ❌ | ✅ (Enterprise only) |
| **Multi-LLM AI** | ✅ | ❌ | ❌ | ✅ (Azure OpenAI) | ❌ |
| **Task Mining** | ✅ Included | ✅ (Add-on $$$) | ✅ Included | ✅ Included | ❌ |
| **Digital Twin** | ✅ | ✅ | ✅ | Limited | ✅ |
| **Real-Time Monitoring** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom KPI Builder** | ✅ | ✅ | Limited | ✅ | ✅ |
| **ROI Calculator** | ✅ Automated | Manual | Manual | Manual | Manual |
| **Docker Deployment** | ✅ | ❌ | ❌ | N/A (Cloud) | ❌ |
| **Open Data Model** | ✅ | ❌ | ❌ | ✅ | ❌ |

### 3.3 Key Differentiators

**1. SMB-Friendly Pricing**
- 70-90% cheaper than enterprise solutions
- No minimum seat requirements
- Transparent pricing

**2. Rapid Deployment**
- Docker-based deployment in <30 minutes
- No professional services required
- Self-service onboarding

**3. Multi-LLM AI Flexibility**
- Choose your AI provider
- No vendor lock-in
- Use your existing OpenAI credits

**4. Complete Task Mining**
- Included free (competitors charge $10K+)
- Privacy-first design
- Desktop + process integration

**5. Developer-Friendly**
- REST API for everything
- Open data model
- PostgreSQL backend (not proprietary)

**6. Modern Tech Stack**
- Next.js 15 + React 19
- Real-time updates
- Mobile-responsive

### 3.4 Missing Features (Roadmap Items)

**Compared to Enterprise Leaders:**

1. **Process Intelligence Hub**
   - Central repository for all process documentation
   - Version control for process models
   - Collaboration features (comments, approvals)

2. **Advanced Simulation**
   - Monte Carlo simulation
   - Resource optimization algorithms
   - Constraint-based planning

3. **Process Orchestration**
   - Execute processes directly from platform
   - Integration with workflow engines (Camunda, etc.)
   - Low-code process editor

4. **Machine Learning Studio**
   - Custom ML model training
   - Predictive maintenance models
   - Churn prediction

5. **Multi-Tenant Architecture**
   - White-label capabilities
   - Customer portal
   - Usage-based billing automation

6. **Advanced Connectors**
   - Pre-built connectors for 100+ systems
   - Real-time data streaming (Kafka, etc.)
   - API gateway for legacy systems

7. **Process Benchmarking**
   - Industry benchmarks database
   - Peer comparison analytics
   - Best practice library

8. **Advanced Governance**
   - Role-based access control (RBAC) with AD/LDAP
   - Compliance frameworks (SOX, HIPAA)
   - Audit trail with blockchain

9. **Process Mining as a Service (PMaaS)**
   - Managed service offering
   - Dedicated process mining consultants
   - Success metrics tracking

---

## 4. Pricing Strategy

### 4.1 SaaS Subscription Pricing

#### Tier 1: **Starter** - $299/month
- **Target:** Small teams (1-10 users)
- **Includes:**
  - Process Discovery
  - Basic Performance Analytics
  - Conformance Checking
  - Up to 5 processes
  - 10,000 process instances/month
  - Standard reports (PDF, Excel)
  - Email support
- **Use Case:** Departmental process analysis

#### Tier 2: **Professional** - $699/month
- **Target:** Mid-market (11-50 users)
- **Includes:**
  - Everything in Starter
  - Automation Opportunities
  - Predictive Analytics (all modules)
  - Real-Time Monitoring
  - Task Mining (5 agents)
  - Custom KPI Builder
  - Up to 25 processes
  - 50,000 process instances/month
  - Advanced reports (PowerPoint)
  - AI Assistant (basic)
  - Priority email support
- **Use Case:** Multi-department optimization

#### Tier 3: **Enterprise** - $1,999/month
- **Target:** Large organizations (51+ users)
- **Includes:**
  - Everything in Professional
  - Unlimited processes
  - 500,000 process instances/month
  - Digital Twin & Scenarios
  - Task Mining (unlimited agents)
  - Cost Analysis & ROI Calculator
  - Multi-LLM AI (all providers)
  - API access
  - Document upload & parsing
  - SSO/SAML
  - Dedicated account manager
  - Phone + chat support
  - SLA guarantee (99.9% uptime)
- **Use Case:** Enterprise-wide transformation

#### Add-Ons (All Tiers):
- **Extra Process Instances:** $50/10,000 instances
- **Additional Task Mining Agents:** $49/agent/month
- **White-Label Branding:** $499/month
- **Professional Services:** $200/hour

### 4.2 On-Premise Licensing

#### Perpetual License Pricing

**Small Deployment (1-25 users):**
- **License Fee:** $15,000 (one-time)
- **Annual Maintenance:** $3,000/year (20%)
- **Includes:**
  - All Professional tier features
  - Self-hosted deployment
  - Docker containers
  - PostgreSQL database
  - 1 year of updates

**Medium Deployment (26-100 users):**
- **License Fee:** $45,000 (one-time)
- **Annual Maintenance:** $9,000/year (20%)
- **Includes:**
  - All Enterprise tier features
  - High-availability setup
  - Load balancing configuration
  - 1 year of updates

**Large Deployment (101-500 users):**
- **License Fee:** $120,000 (one-time)
- **Annual Maintenance:** $24,000/year (20%)
- **Includes:**
  - Everything in Medium
  - Multi-region deployment
  - Disaster recovery setup
  - Dedicated support engineer
  - Quarterly business reviews

**Enterprise (500-1,999 users):**
- **Custom Pricing** (typically $200K-$500K)
- **Includes:**
  - Unlimited users
  - Source code access (optional)
  - Custom development
  - SLA guarantees
  - 24/7 support

**Enterprise-Scale (2,000-3,500+ users):**
- **See Section 4.6 below** for detailed pricing tiers
- **SaaS:** $360K-$567K/year (per-user cost decreases with volume)
- **On-Prem:** $420K-$672K Year 1, then $70K-$112K/year maintenance
- **Includes:** Full enterprise features + implementation services ($150K value)
- **Reference:** See "EPI_X-Ray_Enterprise_Scale_Pricing.md" for complete details

### 4.3 Custom Development & Implementation

**Project-Based Services:**

| Service | Price Range | Timeline |
|---------|-------------|----------|
| **Standard Implementation** | $5,000 - $15,000 | 2-4 weeks |
| - Installation & configuration | | |
| - Data connector setup (3-5 systems) | | |
| - User training (up to 20 users) | | |
| - Basic customization | | |
| | | |
| **Advanced Implementation** | $20,000 - $50,000 | 4-8 weeks |
| - Everything in Standard | | |
| - Custom connector development (5-10 systems) | | |
| - Process model customization | | |
| - Integration with existing tools | | |
| - Advanced training (50+ users) | | |
| - Custom reports & dashboards | | |
| | | |
| **Enterprise Transformation** | $75,000 - $250,000 | 8-16 weeks |
| - Everything in Advanced | | |
| - Multi-process analysis (10+ processes) | | |
| - Custom algorithm development | | |
| - Change management support | | |
| - Executive coaching | | |
| - Continuous improvement program setup | | |

**Feature Customization:**

| Customization | Price | Timeline |
|---------------|-------|----------|
| Custom Discovery Algorithm | $10,000 - $25,000 | 3-6 weeks |
| Custom Connector (per system) | $3,000 - $8,000 | 1-2 weeks |
| Custom Report Template | $500 - $2,000 | 3-5 days |
| Custom Dashboard | $2,000 - $5,000 | 1-2 weeks |
| Workflow Integration | $5,000 - $15,000 | 2-4 weeks |
| Custom ML Model | $15,000 - $40,000 | 6-12 weeks |
| White-Label Customization | $10,000 - $30,000 | 4-8 weeks |

### 4.4 Pricing Rationale

**Why These Price Points Work:**

**SaaS Tiers:**
- **Starter ($299):** 
  - Competes with Microsoft ($400/mo) but fuller features
  - Captures departmental budgets without approval
  - Quick wins build enterprise demand

- **Professional ($699):**
  - Sweet spot for mid-market
  - 1/10th the cost of UiPath ($7K/mo equivalent)
  - Full ROI in 3-6 months for typical customer

- **Enterprise ($1,999):**
  - 1/20th the cost of Celonis ($40K+/mo)
  - Includes features others charge extra for
  - Still affordable for 200-person organizations

**On-Premise:**
- **Perpetual Model:** Preferred by regulated industries (finance, healthcare)
- **20% Maintenance:** Industry standard
- **Price Point:** $150/user for small deployment vs. $500-$1000/user for competitors

**Services:**
- **Hourly Rate ($200):** Mid-range for specialized consulting
- **Implementation Packages:** Bundled savings vs. hourly
- **Custom Development:** Competitive with software dev shops

### 4.5 Pricing Comparison (Annual Cost)

| Scenario | EPI X-Ray | Celonis | UiPath | Savings |
|----------|-----------|---------|--------|---------|
| **20 users, 5 processes** | | | | |
| - SaaS | $3,588/yr | $35,000/yr | $18,000/yr | 80-90% |
| - On-Prem | $18,000 (incl. maint.) | $60,000 (incl. maint.) | $40,000 (incl. maint.) | 55-70% |
| | | | | |
| **100 users, 25 processes** | | | | |
| - SaaS | $23,988/yr | $120,000/yr | $60,000/yr | 75-80% |
| - On-Prem | $54,000 (incl. maint.) | $180,000 (incl. maint.) | $120,000 (incl. maint.) | 55-70% |

### 4.6 Enterprise-Scale Pricing (2,000-3,500 Users)

For organizations with 2,000+ users, EPI X-Ray offers volume-based pricing with significant per-user cost reductions and included professional services.

#### SaaS Subscription (Annual Contract with Volume Discounts)

| User Count | Annual Cost | Per-User/Year | vs. Celonis | vs. UiPath |
|------------|-------------|---------------|-------------|------------|
| **2,000** | $359,880 | $180 | **80% ↓** | **70% ↓** |
| **2,500** | $435,000 | $174 | **81% ↓** | **71% ↓** |
| **3,000** | $504,000 | $168 | **81% ↓** | **72% ↓** |
| **3,500** | $567,000 | $162 | **82% ↓** | **73% ↓** |

**Volume Discounts:** 25-33% off standard per-user pricing at enterprise scale.

#### On-Premise Perpetual License

| User Count | License (One-Time) | Annual Maintenance (20%) | Year 1 Total | Year 2+ Annual |
|------------|-------------------|--------------------------|--------------|----------------|
| **2,000** | $350,000 | $70,000 | $420,000 | $70,000 |
| **2,500** | $425,000 | $85,000 | $510,000 | $85,000 |
| **3,000** | $495,000 | $99,000 | $594,000 | $99,000 |
| **3,500** | $560,000 | $112,000 | $672,000 | $112,000 |

**Per-User Cost:** $160-$175/user (license) + $32-$35/user/year (maintenance)

#### 5-Year Total Cost of Ownership

**2,000 Users:**
- **SaaS (5-year):** $1,799,400
- **On-Prem (5-year):** $700,000
- **On-Prem Savings:** $1,099,400 (61%) - breaks even in 14 months

**3,000 Users:**
- **SaaS (5-year):** $2,520,000
- **On-Prem (5-year):** $990,000
- **On-Prem Savings:** $1,530,000 (61%) - breaks even in 14 months

#### What's Included at Enterprise Scale

**All Features Unlimited:**
✅ Unlimited processes, process instances, data storage  
✅ Complete platform: Discovery, conformance, analytics, automation, predictive, real-time monitoring, task mining, digital twin, AI assistant, cost analysis, custom KPIs, reports & exports  
✅ Unlimited task mining agents for all users  
✅ Multi-LLM AI with 6+ providers  

**Enterprise Infrastructure:**
✅ 99.95% SLA (SaaS) / 99.99% SLA (On-Prem HA)  
✅ Multi-region deployment with disaster recovery  
✅ Auto-scaling to 10K concurrent users  
✅ <50ms API response times with advanced caching  

**Security & Compliance:**
✅ SOC 2 Type II, GDPR, HIPAA, ISO 27001  
✅ SSO/SAML, RBAC, AD/LDAP integration  
✅ AES-256 encryption, audit logging  

**Premium Support:**
✅ 24/7 support with <1hr response SLA  
✅ Dedicated account manager + technical account manager  
✅ Quarterly business reviews  
✅ Dedicated Slack channel with engineering team  

**Professional Services ($150K Value - Included!):**
✅ 12-16 week implementation with on-site support  
✅ Integration of 20+ systems  
✅ 3-5 years historical data migration  
✅ Training for all users  
✅ 10 custom reports + 5 executive dashboards  
✅ 40 hours/year optimization consulting  

#### ROI at Enterprise Scale

**Typical Results for 2,000-User Organizations:**

**Manufacturing:**
- Annual Benefit: $1.41M (cycle time -39%, 12 FTEs saved)
- Investment: $360K/year
- **ROI: 292% | Payback: 3.1 months**

**Healthcare:**
- Annual Benefit: $20M (patient capacity +7K, readmissions -6pts)
- Investment: $420K Year 1
- **ROI: 4,662% | Payback: 7.6 days**

**Financial Services:**
- Annual Benefit: $7.9M (processing time -53%, volume +$362M)
- Investment: $360K/year
- **ROI: 2,095% | Payback: 16.7 days**

**Logistics:**
- Annual Benefit: $32.8M (maverick spend -57%, payment errors -88%)
- Investment: $420K Year 1
- **ROI: 7,702% | Payback: 4.7 days**

#### Competitive Savings (2,000-3,500 Users)

At enterprise scale, EPI X-Ray saves **$440K-$2.58M per year** vs. competitors:

- **vs. Celonis:** 80-82% cheaper
- **vs. UiPath:** 70-73% cheaper
- **vs. SAP Signavio:** 74-77% cheaper
- **vs. Microsoft:** 55-59% cheaper

#### Payment Options

**SaaS:**
- Annual contract: 15% discount (price locked 3 years)
- 3-year contract: 25% discount
- Monthly: No commitment (full price)

**On-Premise:**
- Full payment: 5% discount
- Financed: 30% down, 70% over 12 months (0% interest)
- Subscription-to-own: 3 annual payments converts to perpetual

#### Next Steps for Enterprise Buyers

1. **Executive Briefing** (60 min) - Product demo + ROI analysis
2. **Proof of Concept** (2-4 weeks) - $25K, credited to purchase
3. **Custom Proposal** - Tailored pricing and implementation plan
4. **Deployment** - Begin Week 1 post-signature

**For complete enterprise-scale details, see:** `EPI_X-Ray_Enterprise_Scale_Pricing.md`

**Contact:** enterprise@epixray.com | 1-800-EPI-XRAY

---

## 5. Future Roadmap

### Phase 1: Q2 2025 (Next 3 Months)

**1. Enhanced AI Capabilities**
- GPT-4 Turbo integration for faster responses
- Custom AI model training for industry-specific insights
- Automatic root cause analysis for bottlenecks
- AI-generated improvement recommendations

**2. Advanced Connectors**
- SAP ERP connector
- Salesforce connector
- ServiceNow connector
- Microsoft Dynamics connector
- Oracle ERP connector

**3. Mobile App**
- iOS & Android native apps
- Push notifications for alerts
- Mobile dashboards
- Quick approvals on-the-go

**4. Collaboration Features**
- Process comments with @mentions
- Shared workspaces
- Approval workflows for changes
- Team activity feeds

### Phase 2: Q3 2025 (3-6 Months)

**1. Process Intelligence Hub**
- Central process repository
- Version control for process models
- Process catalog with search
- Best practice templates library

**2. Advanced Simulation**
- Monte Carlo simulation (1000+ iterations)
- Resource optimization algorithms
- Multi-objective optimization
- Sensitivity analysis

**3. Process Orchestration**
- Visual process designer (drag-and-drop)
- Execute processes from platform
- Integration with Camunda, Zeebe
- Low-code activity creation

**4. Benchmarking Database**
- Industry benchmarks (20+ industries)
- Peer comparison analytics
- Best-in-class metrics
- Anonymized data sharing (opt-in)

### Phase 3: Q4 2025 (6-9 Months)

**1. Machine Learning Studio**
- Custom ML model builder (no-code)
- Predictive maintenance models
- Churn prediction
- Demand forecasting
- Anomaly detection customization

**2. Process Mining as a Service**
- Managed service offering
- Dedicated process mining analysts
- Monthly optimization reviews
- Guaranteed ROI (or money back)

**3. Advanced Governance**
- Full RBAC with AD/LDAP integration
- Compliance frameworks (SOX, HIPAA, GDPR)
- Blockchain audit trail
- Data lineage tracking

**4. Multi-Tenant SaaS**
- White-label capabilities
- Customer portal for resellers
- Usage-based billing automation
- Tenant isolation

### Phase 4: Q1 2026 (9-12 Months)

**1. Real-Time Data Streaming**
- Kafka integration
- Apache Pulsar support
- Kinesis support
- Change Data Capture (CDC)

**2. Advanced Analytics**
- Process path prediction
- What-if scenario recommendations
- Automated A/B testing
- Causal inference analysis

**3. Ecosystem Marketplace**
- Community-contributed connectors
- Custom algorithm marketplace
- Template exchange
- Partner integrations

**4. Process Mining Co-Pilot**
- Proactive insights (no queries needed)
- Automated daily briefings
- Anomaly alerts with context
- Improvement action tracking

### Long-Term Vision (12-24 Months)

**1. Autonomous Process Optimization**
- AI automatically suggests and implements improvements
- Closed-loop optimization
- Continuous learning from outcomes
- Self-healing processes

**2. Cross-Organizational Process Mining**
- Supply chain process mining
- Partner/vendor process integration
- Ecosystem-wide optimization
- Blockchain-based trust layer

**3. Process Mining for Edge/IoT**
- Manufacturing process mining
- Logistics tracking
- Smart building optimization
- Healthcare patient journey mining

**4. Natural Language Process Modeling**
- Describe process in plain English
- AI generates BPMN model
- Automatic executable workflow creation
- Voice-based process interaction

---

## 6. Client Integration Guide

### 6.1 Data Collection Strategies

**Option 1: Database Direct Connect (Easiest)**

**How It Works:**
- Read-only connection to client's database
- Query transaction tables directly
- Transform data to event log format
- No code changes to client systems

**Best For:**
- Clients with database access
- Structured data in RDBMS
- Minimal IT restrictions

**Steps:**
1. Get read-only database credentials
2. Identify relevant tables (orders, transactions, etc.)
3. Map columns to event log format
4. Set up scheduled queries (daily/hourly)
5. Automated import to EPI X-Ray

**Example SQL Query:**
```sql
SELECT 
  order_id as case_id,
  status_change as activity,
  timestamp,
  user_name as resource,
  cost
FROM order_status_history
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)
ORDER BY order_id, timestamp
```

**Option 2: Application Logging (Most Accurate)**

**How It Works:**
- Client adds logging to their application code
- Events sent to EPI X-Ray API in real-time
- Captures complete context

**Best For:**
- Custom applications
- Real-time monitoring needs
- Microservices architectures

**Implementation:**
```javascript
// JavaScript example
const logEvent = async (caseId, activity, resource) => {
  await fetch('https://your-epi-xray.com/api/events', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      case_id: caseId,
      activity: activity,
      timestamp: new Date().toISOString(),
      resource: resource
    })
  });
};

// Usage in client code
async function approveOrder(orderId, approver) {
  await logEvent(orderId, 'Approve Order', approver);
  // ... rest of business logic
}
```

**Option 3: Middleware/Proxy (Non-Invasive)**

**How It Works:**
- Install lightweight proxy between client app and database
- Captures all database writes
- Transforms to event logs automatically
- Zero application code changes

**Best For:**
- Legacy systems that can't be modified
- Vendor applications (SAP, Oracle)
- Quick proof-of-concepts

**Implementation:**
1. Deploy EPI X-Ray Data Capture Agent
2. Configure as database proxy
3. Client app connects to proxy instead of DB
4. Proxy forwards queries + logs events
5. Events automatically imported

**Option 4: File-Based Import (Simplest)**

**How It Works:**
- Client exports CSV/Excel from existing systems
- Upload manually or via SFTP
- Scheduled batch processing

**Best For:**
- Initial analysis
- Systems without API access
- Monthly/quarterly reviews

**Steps:**
1. Define export template
2. Client IT exports on schedule
3. SFTP to EPI X-Ray import folder
4. Automated processing

**Option 5: API Integration (Modern Systems)**

**How It Works:**
- Connect to client's REST APIs
- Poll for changes periodically
- Transform responses to event logs

**Best For:**
- SaaS applications (Salesforce, ServiceNow)
- Cloud platforms
- Modern architectures

**Example Connectors:**
- **Salesforce:** OpportunityHistory object
- **ServiceNow:** Incident change logs
- **Jira:** Issue transition history
- **HubSpot:** Deal stage changes

**Option 6: Desktop Capture Agent (Task Mining)**

**How It Works:**
- Install Electron app on user desktops
- Captures application usage
- Links to process instances
- Consent-based tracking

**Best For:**
- Unstructured work
- Manual processes
- Tribal knowledge capture

**Steps:**
1. Deploy agent via MSI/DMG installer
2. Users grant consent
3. Agent tracks application usage
4. Data encrypted and sent to platform
5. AI links activities to processes

### 6.2 Common ERP/System Integrations

#### SAP Integration

**Data Sources:**
- SAP Business Workflow (SWI2)
- Change Documents (CDHDR/CDPOS)
- Application Logs
- Custom Z-tables

**Extraction Methods:**
1. **SAP RFC:** Remote Function Call
2. **SAP OData Services:** RESTful API
3. **SAP HANA Views:** Direct SQL
4. **Flat File Extract:** Background job

**Sample Events:**
- Purchase Requisition Created
- PO Approval Step 1
- PO Approval Step 2
- Goods Receipt Posted
- Invoice Verified
- Payment Posted

#### Salesforce Integration

**Data Sources:**
- OpportunityHistory
- CaseHistory
- Custom Object History Tracking

**API:** Salesforce REST API

**Sample Query:**
```sql
SELECT OpportunityId, StageName, CreatedDate, CreatedBy.Name
FROM OpportunityFieldHistory
WHERE Field = 'StageName'
ORDER BY OpportunityId, CreatedDate
```

#### ServiceNow Integration

**Data Sources:**
- sys_audit (Change logs)
- sys_journal_field (Activity logs)
- Workflow context

**API:** ServiceNow REST API

**Sample Events:**
- Incident Created
- Assigned to Tier 1
- Escalated to Tier 2
- Resolved
- Closed

#### Microsoft Dynamics 365

**Data Sources:**
- Audit Log
- Workflow instances
- Custom entities

**API:** Dynamics Web API (OData)

#### Oracle ERP

**Data Sources:**
- Workflow tables (WF_ITEM_ACTIVITY_STATUSES)
- Audit tables
- Approval hierarchies

**Extraction:** Database views or Oracle Integration Cloud

### 6.3 Implementation Approaches

#### Approach A: Pilot Department (Recommended)

**Timeline:** 2-4 weeks

**Steps:**
1. **Week 1: Discovery**
   - Identify pilot process (e.g., Purchase-to-Pay)
   - Map data sources
   - Extract 3 months of historical data
   - Upload to EPI X-Ray

2. **Week 2: Analysis**
   - Run process discovery
   - Identify bottlenecks
   - Calculate automation opportunities
   - Generate ROI report

3. **Week 3: Validation**
   - Review findings with process owners
   - Validate insights
   - Prioritize improvements

4. **Week 4: Expansion Planning**
   - Present results to stakeholders
   - Plan enterprise rollout
   - Estimate scaling costs

**Investment:** $5,000-$10,000 (Professional services + software)

#### Approach B: Enterprise Rollout

**Timeline:** 8-12 weeks

**Steps:**
1. **Weeks 1-2: Requirements Gathering**
   - Identify all in-scope processes
   - Technical architecture review
   - Security & compliance assessment

2. **Weeks 3-4: Infrastructure Setup**
   - On-prem or cloud decision
   - Install platform
   - Configure authentication (SSO)

3. **Weeks 5-7: Data Integration**
   - Build connectors for all systems
   - Historical data import
   - Real-time streaming setup

4. **Weeks 8-10: Training & Rollout**
   - Train power users
   - Deploy task mining agents
   - Launch monitoring dashboards

5. **Weeks 11-12: Optimization**
   - Fine-tune algorithms
   - Custom report development
   - Establish governance

**Investment:** $75,000-$150,000 (Services + software)

#### Approach C: Managed Service

**Ongoing Engagement**

**Model:**
- EPI X-Ray team manages entire platform
- Client provides data access
- Monthly deliverables:
  - Process performance report
  - Top 5 improvement opportunities
  - ROI tracking dashboard
  - Executive presentation

**Pricing:** $5,000-$15,000/month

**Best For:**
- Clients without analytics teams
- Continuous improvement programs
- Guaranteed outcomes

### 6.4 Data Security & Compliance

**Data Handling:**
- **Encryption:** AES-256 at rest, TLS 1.3 in transit
- **Anonymization:** PII scrubbing capabilities
- **Retention:** Configurable (default 2 years)
- **Deletion:** Right to be forgotten (GDPR)

**Compliance:**
- SOC 2 Type II (in progress)
- GDPR compliant
- HIPAA ready (BAA available)
- ISO 27001 aligned

**Deployment Options:**
- **Cloud (Multi-Tenant):** AWS/Azure
- **Cloud (Single-Tenant):** Dedicated instance
- **On-Premise:** Client data center
- **Hybrid:** Analytics in cloud, data on-prem

---

## 7. Go-to-Market Strategy

### 7.1 Ideal Customer Profile (ICP)

**Primary Target:**
- **Industry:** Manufacturing, Financial Services, Healthcare, Logistics
- **Company Size:** 200-5,000 employees
- **Revenue:** $50M-$1B annually
- **Pain Points:**
  - High operational costs
  - Compliance requirements
  - Digital transformation initiatives
  - Process inefficiencies

**Buying Committee:**
- **Economic Buyer:** CFO, COO
- **Technical Buyer:** CIO, Head of IT
- **User Buyer:** VP Operations, Process Excellence Manager
- **Champion:** Lean/Six Sigma practitioners

### 7.2 Sales Motion

**Inbound:**
1. Free trial (14 days)
2. Sample data provided
3. Self-service onboarding
4. Automated ROI calculation
5. Upgrade to paid

**Outbound:**
1. Identify target accounts
2. Process pain point research
3. Custom ROI analysis
4. Executive briefing
5. Pilot project
6. Enterprise agreement

**Partner Channel:**
- System integrators (SI)
- Management consultants
- RPA vendors
- BPM tool vendors

**Pricing for Partners:**
- 20% referral fee
- 30% reseller margin
- Co-branded offerings

### 7.3 Competitive Positioning Statement

**For** mid-market operations leaders **who need to** optimize business processes and reduce costs, **EPI X-Ray** is a process mining platform **that** delivers enterprise-grade insights at SMB-friendly pricing. **Unlike** Celonis or UiPath, **our product** includes AI-powered automation detection, task mining, and digital twin simulation in a single platform starting at just $299/month, with deployment in days instead of months.

---

## 8. Technical Architecture Summary

### 8.1 Technology Stack

**Frontend:**
- Next.js 15.5.4 (App Router)
- React 19.1.0
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- ReactFlow (process visualization)
- Framer Motion (animations)

**Backend:**
- Next.js API Routes
- Node.js runtime
- Drizzle ORM
- PostgreSQL (Neon)
- JWT authentication
- WebSocket (real-time updates)

**AI/ML:**
- Multi-LLM support (OpenAI, Mistral, DeepSeek, etc.)
- Replit AI integration
- Custom algorithms (Alpha Miner, Holt-Winters, etc.)

**Infrastructure:**
- Docker containerization
- Next.js Turbo (development)
- Vercel (cloud option)
- Self-hosted (on-prem option)

**Security:**
- bcryptjs (password hashing)
- AES-256-GCM (key encryption)
- JWT tokens (session management)
- Rate limiting
- CSRF protection

### 8.2 Deployment Options

**Option 1: Cloud (Recommended for SaaS)**
```bash
# Deploy to Vercel
vercel deploy --prod
```

**Option 2: Docker (Recommended for On-Prem)**
```bash
# Build and run
docker-compose up -d
```

**Option 3: Kubernetes (Enterprise)**
```bash
# Deploy to K8s cluster
kubectl apply -f k8s/deployment.yaml
```

### 8.3 Scalability

**Current Capacity:**
- 100,000 process instances/day
- 1,000 concurrent users
- 50 processes per tenant

**Scaling Plan:**
- Horizontal: Add more Next.js instances
- Database: Read replicas + connection pooling
- Caching: Redis for hot data
- CDN: Static assets on edge

---

## Conclusion

EPI X-Ray represents a **new generation of process mining tools** designed for the modern enterprise:

✅ **Accessible:** 70-90% cheaper than competitors  
✅ **Fast:** Deploy in days, not months  
✅ **Complete:** All features included, no hidden add-ons  
✅ **Flexible:** Cloud, on-prem, or hybrid  
✅ **Modern:** AI-powered insights out of the box  

**The market opportunity is massive:** The process mining market is expected to reach $10.5B by 2030 (CAGR 33%), yet 80% of mid-market companies still can't afford current solutions.

**EPI X-Ray bridges that gap.**

---

## Appendix: Sample Data Files

*See separate files for full sample datasets:*
- `sample_event_log.csv` - Purchase order process (500 cases)
- `sample_performance_metrics.csv` - 90 days of KPI data
- `sample_task_mining.json` - Desktop activity logs
- `sample_cost_data.csv` - Activity cost breakdown

---

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Author:** EPI X-Ray Product Team  
**Contact:** info@epixray.com
