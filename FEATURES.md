# EPI X-Ray - Complete Feature Documentation

## 🚀 Platform Overview

EPI X-Ray is an enterprise-grade **Process Mining and Automation Platform** that helps organizations discover, analyze, optimize, and automate their business processes. Built with cutting-edge AI technology, real process mining algorithms, and comprehensive security features.

---

## 📊 Core Process Mining Features

### 1. **Process Discovery**

Automatically discover your actual business processes from event logs using industry-standard algorithms.

**Algorithms Implemented:**
- **Alpha Miner Algorithm**: Discovers process models by analyzing activity relationships
- **Inductive Miner**: Discovers process models with guaranteed soundness properties

**What It Does:**
- Identifies all activities in your process
- Discovers start and end points
- Maps out activity sequences and transitions
- Calculates transition frequencies
- Generates visual process flowcharts

**Key Outputs:**
- Interactive process flowchart with ReactFlow visualization
- Activity relationship analysis (causal, parallel, choice patterns)
- Transition frequency heatmaps
- Start and end activity identification

**Use Case Example:**
> Upload your order fulfillment event logs → EPI X-Ray discovers that orders go through 12 steps, with 3 parallel approval paths, and identifies that 15% of orders loop back for rework.

---

### 2. **Conformance Checking** ✅

Validate if your actual process execution matches your designed process model.

**Algorithm:** Token-Based Replay (Industry Standard Petri Net Conformance)

**How It Works:**
- Replays event logs against discovered process models
- Uses forced firing algorithm to handle deviations
- Detects missing transitions, unexpected activities, wrong-order execution
- Calculates fitness scores using standard formula: (consumed - missing) / (consumed + remaining)

**Deviation Types Detected:**
- **Missing Transitions**: Required steps that were skipped
- **Unexpected Activities**: Steps that shouldn't exist in the process
- **Wrong-Order Execution**: Activities happening in incorrect sequence
- **Incomplete Cases**: Processes that didn't reach completion

**Fitness Score:**
- 100% = Perfect conformance
- 80-99% = Good with minor deviations
- 60-79% = Moderate issues requiring attention
- <60% = Significant process violations

**Use Case Example:**
> Your invoice approval process model requires Manager Approval → CFO Approval. Conformance checking reveals 23% of cases skip the manager and go directly to CFO, violating your control policies.

---

### 3. **Performance Analytics** 📈

Deep dive into process performance metrics to identify bottlenecks and optimization opportunities.

**Metrics Calculated:**
- **Cycle Time**: Total time from process start to completion (average, median, 95th percentile)
- **Throughput**: Number of cases completed per time period
- **Bottleneck Analysis**: Statistical identification of slowest activities
- **Activity Statistics**: Duration, frequency, and utilization for each step
- **Rework Rate**: Percentage of cases requiring repeated activities
- **Wait Time**: Time spent between activities

**Statistical Analysis:**
- Mean, median, standard deviation
- 95th percentile analysis
- Z-score calculation for outlier detection
- Activity-level performance metrics

**Visualizations:**
- Cycle time distribution histograms
- Bottleneck heatmaps
- Activity duration box plots
- Throughput trend charts

**Use Case Example:**
> Analytics reveal that "Credit Check" activity has a 95th percentile duration of 4.2 hours (vs. 20-minute average), causing a major bottleneck that delays 12% of all orders by 2+ days.

---

## 🤖 AI-Powered Features

### 4. **Anomaly Detection** 🔍

AI-powered detection of unusual patterns and deviations in your business processes.

**5 Types of Anomalies Detected:**

#### A. Duration Outliers
- Activities taking unusually long or short times
- Z-score analysis (>3 standard deviations from mean)
- Severity based on deviation magnitude

**Example:**
> "Document Review took 3.2 hours (5.8 std dev from mean of 22 minutes) - CRITICAL severity"

#### B. Sequence Violations
- Rare or unique activity sequences
- Activities happening in unexpected order
- Frequency-based analysis

**Example:**
> "Unusual sequence 'Quote Sent → Invoice Paid' found in only 2 out of 450 cases (0.4%) - HIGH severity"

#### C. Resource Anomalies
- Unusual workload distribution
- Too many people performing specialized tasks
- Workload imbalances

**Example:**
> "Resource 'John_Smith' processed 245 activities (3.8 std dev from team mean of 67) - CRITICAL workload imbalance"

#### D. Temporal Anomalies
- Unusual activity patterns by time of day
- Off-hours processing
- Unexpected activity spikes

**Example:**
> "Activity spike at 02:00 with 87 events (4.2 std dev from hourly mean of 15) - HIGH severity"

#### E. Frequency Anomalies
- Activities repeated too many times
- Rework loops and cycles
- Inefficiency indicators

**Example:**
> "Activity 'Approval_Request' executed 12 times in case #4523 - CRITICAL rework issue"

**AI Insights Generated:**
Each anomaly report includes 3-5 AI-generated insights explaining:
- **Root Causes**: Why the anomaly is occurring
- **Business Impact**: How it affects your operations
- **Recommendations**: Specific actions to resolve the issue
- **Priority Level**: Which anomalies to address first

**Severity Levels:**
- 🔴 **Critical**: Immediate action required (process failure risk)
- 🟠 **High**: Significant impact on performance/cost
- 🟡 **Medium**: Notable but manageable issues
- 🟢 **Low**: Minor optimization opportunities

---

### 5. **AI Process Insights** 💡

GPT-4.1-powered analysis that acts like a 24/7 process mining consultant.

**Insight Categories:**

#### Bottlenecks
- Identifies activities causing delays
- Explains root causes (workload, dependencies, resource constraints)
- Quantifies impact on overall cycle time

#### Optimization Opportunities
- Suggests specific process improvements
- Identifies steps that can be removed, reordered, or parallelized
- Estimates time/cost savings from each improvement

#### Automation Candidates
- Analyzes which tasks are best suited for automation
- Calculates automation potential (0-100%)
- Recommends specific automation tools (RPA, APIs, business rules)
- Estimates ROI and implementation complexity

#### Compliance & Risk
- Identifies potential compliance violations
- Highlights activities with high error rates
- Suggests control improvements

#### Efficiency Improvements
- Resource reallocation recommendations
- Workload balancing suggestions
- Process simplification opportunities

**AI Model:** OpenAI GPT-4.1 (latest model as of August 2025)

**Example Insight:**
> "Your invoice approval process has 3 manual handoffs that add 2.1 days of cycle time. Recommend: (1) Automate initial validation using OCR + business rules (saves 1.2 days, $45K/year ROI), (2) Implement parallel approvals for invoices <$5K (saves 0.7 days, reduces bottleneck by 65%), (3) Eliminate redundant manager review for pre-approved vendors (saves 0.2 days). Total potential: 2.1 days cycle time reduction, $120K annual savings, 3-week implementation."

---

### 6. **Predictive Analytics** 🔮

AI learns from your historical data to predict future process behavior.

**Predictions Generated:**
- **Cycle Time Forecasting**: Predict completion time for new cases
- **Bottleneck Prediction**: Identify potential bottlenecks before they occur
- **Resource Utilization Trends**: Forecast future capacity needs
- **Deviation Risk**: Probability that a case will violate the standard process
- **Failure Prediction**: Likelihood of process failure or SLA breach

**Machine Learning Approach:**
- Historical pattern analysis
- Time series forecasting
- Anomaly trend detection
- Risk scoring algorithms

**Use Case Example:**
> "Based on current trends, Q4 will see a 23% increase in order volume. Predictive analytics forecasts that 'Credit Check' will become a bottleneck, causing 18% of orders to miss their 5-day SLA. Recommend adding 2 credit analysts or implementing automated credit scoring for orders <$10K."

---

### 7. **Automation Opportunities** ⚙️

AI identifies which manual tasks should be automated and calculates the ROI.

**Analysis Factors:**
- **Repetitiveness**: How often the task is performed
- **Rule-Based**: Whether the task follows clear rules
- **Structured Data**: If inputs/outputs are well-defined
- **Error-Prone**: Tasks with high human error rates
- **Time-Consuming**: Duration of manual execution

**Automation Potential Score (0-100%):**
- **90-100%**: Perfect automation candidate (highly repetitive, rule-based)
- **70-89%**: Good candidate (some complexity, but automatable)
- **50-69%**: Moderate candidate (requires AI/ML for decision-making)
- **<50%**: Poor candidate (requires human judgment/creativity)

**ROI Calculation:**
- Time saved per execution
- Frequency of execution
- Hourly labor cost
- Implementation cost estimate
- Annual savings projection
- Payback period

**Recommended Tools:**
- **RPA Bots**: For UI automation (e.g., data entry, form filling)
- **API Integration**: For system-to-system automation
- **Business Rules Engine**: For decision automation
- **OCR + AI**: For document processing
- **Workflow Automation**: For orchestration

**Example Output:**
```
Activity: "Invoice Data Entry"
- Automation Potential: 95%
- Frequency: 450 times/month
- Avg. Duration: 8 minutes
- Annual Time Cost: 720 hours
- Recommended Tool: OCR + RPA
- Est. Implementation: $15K, 3 weeks
- Annual Savings: $36K
- ROI: 240%, Payback: 5 months
```

---

### 8. **Task Mining** 🖱️ **NEW FEATURE**

Capture and analyze desktop-level user activities to discover repetitive manual tasks and identify automation opportunities.

**What It Captures:**
- Desktop application usage
- User interactions (clicks, keystrokes, form fills)
- Window titles and application context
- Task sequences and patterns
- Time spent on each activity

**Recording Sessions:**
- Create recording sessions with privacy consent
- Track device type, OS, and session duration
- Capture activity timeline with timestamps
- Store metadata for pattern analysis

**Pattern Detection (AI-Powered):**
- **Repetitive Sequence Identification**: Finds tasks performed multiple times
- **Automation Potential Scoring**: Calculates 0-100% automation feasibility
- **Time Savings Estimation**: Predicts hours saved through automation
- **Activity Clustering**: Groups similar activities across sessions

**Pattern Analysis Algorithms:**
```
- findRepetitiveSequences(): Detects recurring activity patterns
- analyzePatternWithAI(): Uses GPT-4o-mini to analyze automation potential
- detectBottlenecks(): Identifies slow, time-consuming activities
- clusterSimilarActivities(): Groups related tasks by type and application
```

**Automation Recommendations:**
- **RPA Scripts**: For UI-based repetitive tasks
- **Macros**: For keyboard/mouse automation
- **Scripts**: For programmatic task automation
- **Workflows**: For multi-system orchestration

**Automation Opportunity Types:**
- Data entry automation (OCR + RPA)
- Email processing and routing
- Report generation
- CRM/ERP updates
- File management tasks

**Application Usage Analytics:**
- Top applications by time spent
- Interaction counts per application
- Productivity scoring
- Category-based insights

**Task Mining Dashboard:**
- Active recording sessions
- Total activities captured
- Patterns discovered
- Estimated time savings (monthly)
- Top applications usage chart
- Pattern cards with automation potential
- Automation recommendation cards

**Privacy & GDPR Compliance:**
- Explicit user consent required before recording
- Privacy controls for sensitive data
- Data retention policies
- Right to deletion
- Audit trail of all recordings

**Use Case Example:**
> Task mining reveals Sarah performs "Copy invoice data from email to SAP" 45 times per week, taking 3 minutes each time. AI analysis shows 85% automation potential. Recommendation: Implement RPA bot with OCR to extract invoice data and auto-populate SAP. Estimated savings: 2.25 hours/week (120 hours/year), $6,000 annual ROI.

**Competitive Advantage:**
- Desktop-level visibility (complements process mining)
- AI-powered pattern detection
- Automated ROI calculations
- Integration with process discovery
- Enterprise-grade privacy controls

---

## 🔄 Digital Twin & Simulation

### 9. **Digital Twin Simulation**

Create a virtual replica of your process to test changes before implementing them in reality.

**Simulation Engine:**
- **Type**: Discrete-Event Simulation (production-ready)
- **Features**:
  - Event queue with time-based execution
  - Probabilistic activity duration sampling (Box-Muller normal distribution)
  - Case lifecycle management (start → activities → completion)
  - Token flow through discovered process models

**What You Can Simulate:**
- Number of cases to process
- Arrival rate (time between new cases)
- Activity duration adjustments
- Process path probabilities

**Simulation Outputs:**
- Total and completed case counts
- Average cycle time
- Throughput (cases/hour)
- Activity-level statistics:
  - Processing time
  - Utilization rate
  - Completion count
- Bottleneck identification
- Case time distribution

---

### 10. **What-If Scenario Analysis** 🎯

Test potential process improvements before making real changes.

**Scenario Types:**

#### Process Optimization
- What if we reduce activity X duration by 30%?
- What if we add 2 more resources to activity Y?
- What if we remove activity Z entirely?

#### Resource Planning
- What if order volume increases by 50%?
- What if we lose a key team member?
- What if we outsource a specific activity?

#### Automation Impact
- What if we automate data entry (reduces duration by 90%)?
- What if we implement parallel approvals?
- What if we add automated validation?

**How It Works:**
1. Select base process model
2. Define scenario parameters:
   - Global duration multiplier (e.g., 0.7 = 30% faster)
   - Activity-specific multipliers (e.g., "Data Entry": 0.1 for automation)
   - Number of cases to simulate
   - Arrival rate adjustments
3. Run simulation
4. Compare results to baseline

**Example Scenario:**
```
Scenario: "Automate Invoice Data Entry"

Parameters:
- Activity "Data_Entry": duration × 0.1 (90% reduction)
- Cases: 100
- Arrival rate: 300,000ms (5 min between cases)

Results:
- Baseline cycle time: 4.2 days
- Simulated cycle time: 2.8 days
- Improvement: 33% faster
- Bottleneck shift: Credit_Check now becomes bottleneck
- Throughput increase: 5.1 → 7.8 cases/hour
```

**Database Persistence:**
- All scenarios saved with parameters and results
- Compare multiple scenarios side-by-side
- Track scenario history over time

---

## 🔐 Security & Compliance

### 11. **Enterprise-Grade Security**

**Authentication:**
- Custom JWT-based authentication (portable, no external dependencies)
- bcrypt password hashing (12 salt rounds)
- Minimum 12-character passwords (uppercase, lowercase, numbers required)
- HTTP-only cookies with SameSite protection
- 7-day session expiry

**Rate Limiting:**
- Login: 5 attempts per 15 minutes per IP
- Signup: 3 attempts per hour per IP
- Trusted proxy IP validation (Cloudflare, Replit)
- Automatic cleanup of expired entries
- Returns 429 with retry-after headers

**CSRF Protection:**
- 32-byte random token generation
- Tokens required on all POST/PUT/DELETE requests
- SameSite strict cookie policy
- Token validation on mutation endpoints

**Authorization:**
- Database-level ownership enforcement
- All queries filtered by userId at WHERE clause level
- Returns 404 for unauthorized access (not 403 to prevent enumeration)
- No cross-user data access possible

**Input Validation:**
- Comprehensive Zod schemas for all inputs
- Email validation and normalization
- Name sanitization (control character removal)
- XSS prevention
- SQL injection protection via parameterized queries

**Audit Logging:**
- All authentication actions logged
- GDPR actions tracked (export, deletion, consent)
- IP addresses, user agents, timestamps recorded
- Immutable audit trail

---

### 12. **GDPR Compliance** ✅

Full compliance with EU General Data Protection Regulation.

#### Right to Data Portability (Article 20)
**Endpoint:** `GET /api/gdpr/export`

**Features:**
- Complete data export as downloadable JSON
- Includes ALL user data:
  - User profile (excluding password)
  - All processes with event logs, models, activities
  - Documents and uploads
  - Audit logs (full history)
  - Simulation scenarios
  - User consents
- Timestamped filename for tracking
- Action logged in audit trail

**Example Export:**
```json
{
  "exportDate": "2025-11-08T10:30:00Z",
  "user": { "id": 123, "name": "John Doe", "email": "john@example.com" },
  "processes": [...],
  "documents": [...],
  "auditLogs": [...],
  "simulationScenarios": [...],
  "consents": [...]
}
```

#### Right to Erasure (Article 17)
**Endpoint:** `POST /api/gdpr/delete-account`

**Features:**
- Password confirmation required
- Must type "DELETE" to confirm
- **Complete cascading deletion** of ALL related data:
  - Event logs (via processes)
  - Simulation scenarios
  - Performance metrics
  - Activities, process models, discovered models
  - AI insights, conformance results, deviations
  - Automation opportunities
  - Processes, documents, user consents
  - Audit logs
  - User account
- Deletion logged before purge
- Session & CSRF cookies cleared
- Irreversible action

#### Consent Management (Article 7)
**Endpoints:** 
- `GET /api/gdpr/consent` - View all consents
- `POST /api/gdpr/consent` - Update consent

**Consent Types:**
- Privacy policy acceptance
- Analytics tracking
- Marketing communications
- Third-party data sharing

**Tracking:**
- Timestamp of consent
- IP address
- User agent (browser info)
- Consent version
- Accept/revoke actions
- Full audit trail

**User Rights:**
- View all granted consents
- Revoke any consent at any time
- Re-grant previously revoked consents
- Download consent history

---

## 📊 Visualization & UI

### 13. **Interactive Process Flowcharts**

**Technology:** ReactFlow with custom enhancements

**Features:**
- **Auto-Layout**: Automatic node positioning using Dagre algorithm
- **Color-Coded Nodes**:
  - 🟢 Green: Start activities
  - 🔵 Blue: Intermediate activities
  - 🔴 Red: End activities
- **Edge Thickness**: Proportional to transition frequency
- **Animated Edges**: High-frequency paths pulse/animate
- **Interactive Controls**:
  - Zoom in/out
  - Pan
  - Fit to view
  - Mini-map for navigation
- **Background Grid**: Professional appearance
- **Tooltips**: Hover for activity details

---

### 14. **Responsive Dashboard**

**Design:**
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Brand Colors**: Custom cyan (oklch(0.72 0.14 195)) with dark mode support
- **Animations**: Framer Motion for modals, transitions
  - Button click animations (active:scale-95)
  - Card hover lifts
  - Icon rotation animations
- **Dark/Light Mode**: Full theme support with toggle in header
- **Mobile Responsive**: Sheet navigation, adaptive spacing
- **Components**: Skeleton loaders, empty states, theme toggle

---

## 🚀 Coming Soon: Task Mining

Planned expansion to capture desktop-level activity for even deeper insights.

**Key Features (Roadmap):**
- Desktop agent for screen recording
- OCR for text extraction
- Task sequence discovery
- AI-powered productivity analytics
- RPA bot auto-generation
- Privacy-safe employee monitoring

**See:** `TASK_MINING_ROADMAP.md` for complete 15-month implementation plan

---

## 💾 Technical Architecture

**Frontend:**
- Next.js 15.5.4
- React 19.1.0
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- ReactFlow for process visualization

**Backend:**
- Next.js API routes
- PostgreSQL database (Neon)
- Drizzle ORM (type-safe queries)
- JWT authentication
- OpenAI GPT-4.1 integration

**AI Integration:**
- Replit AI Integrations (OpenAI)
- No API key management needed
- Retry logic with exponential backoff
- Rate limit handling

**Deployment:**
- Runs on port 5000
- Environment-based configuration
- Production-ready security
- Scalable architecture

---

## 📈 Business Value

**Time Savings:**
- 60-80% reduction in process analysis time
- Instant bottleneck identification
- Automated conformance checking

**Cost Reduction:**
- Identify automation opportunities worth $100K-$500K annually
- Reduce process cycle time by 30-50%
- Eliminate rework and errors

**Risk Mitigation:**
- Real-time compliance monitoring
- Anomaly detection prevents failures
- Audit trail for regulatory compliance

**Strategic Insights:**
- Data-driven decision making
- Predictive analytics for planning
- Digital twin for risk-free testing

---

## 🎯 Use Cases

### Manufacturing
- Production line optimization
- Quality control conformance
- Equipment maintenance processes

### Financial Services
- Loan approval workflows
- Compliance monitoring
- Fraud detection patterns

### Healthcare
- Patient intake processes
- Treatment pathway analysis
- Claims processing optimization

### E-Commerce
- Order fulfillment analysis
- Returns process optimization
- Customer service workflows

### HR & Recruitment
- Hiring process optimization
- Onboarding workflow analysis
- Employee lifecycle tracking

---

## 📞 Support & Documentation

- **Features Guide**: This document (FEATURES.md)
- **User Guide**: Step-by-step instructions (USER_GUIDE.md)
- **Task Mining Roadmap**: Future capabilities (TASK_MINING_ROADMAP.md)
- **Technical Docs**: Database schema (shared/schema.ts)

---

**Last Updated:** November 8, 2025  
**Version:** 1.0.0  
**Platform:** EPI X-Ray Process Mining & Automation Platform
