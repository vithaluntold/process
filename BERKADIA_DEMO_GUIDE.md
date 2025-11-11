# EPI X-Ray Platform - Berkadia Demo Guide

## Executive Summary

**Platform**: EPI X-Ray - Enterprise Process Intelligence and Optimization  
**Demo Focus**: Commercial Real Estate Loan Servicing (Berkadia Use Case)  
**Duration**: 20-25 minutes  
**Audience**: Operations executives, IT leaders, Process improvement teams  

**Value Proposition**: Transform disconnected business systems (Salesforce, Excel, Mainframe) into unified process intelligence with AI-powered insights, automation opportunities, and ROI quantification.

---

## 🎯 Demo Objectives

By the end of this demo, stakeholders will understand:
1. How EPI X-Ray discovers processes across disconnected systems
2. Real-time visibility into bottlenecks and performance issues
3. AI-driven automation recommendations with ROI calculations
4. Simulation capabilities for testing improvements before implementation
5. Cross-system workflow visualization for operational transparency

---

## 📋 Pre-Demo Setup (5 minutes)

### Environment Preparation

1. **Set Master Encryption Key** (for API key generation):
   ```bash
   # Generate secure key
   openssl rand -base64 32
   
   # Add to environment
   MASTER_ENCRYPTION_KEY=<generated-key>
   ```

2. **Verify Server Running**:
   - Navigate to `http://localhost:5000` (or your deployment URL)
   - Confirm login page loads

3. **Create Demo Account** (if needed):
   - Email: `demo@berkadia.com`
   - Password: `Demo123!`

4. **Open Browser Tabs**:
   - Tab 1: Platform homepage (for navigation)
   - Tab 2: Berkadia demo page ready
   - Tab 3: Task Mining page (for desktop agent demo)

---

## 🎬 Demo Flow (20-25 minutes)

### **Part 1: The Business Problem** (3 minutes)

#### Script:
*"Let me show you a common challenge we see in commercial real estate: Berkadia processes loans through three separate systems - Salesforce for origination, Excel for underwriting, and mainframe for servicing. Each system operates in isolation, creating blind spots and delays."*

#### Actions:
1. Navigate to **Berkadia Demo** page
2. Point to the three system cards:
   - 🔵 **Salesforce**: Lead capture and origination
   - 🟢 **Excel**: Credit analysis and underwriting
   - 🟣 **Mainframe**: Loan boarding and servicing

#### Key Talking Points:
- Manual handoffs between systems cause 2-3 day delays
- No unified view of loan status across systems
- SLA breaches due to invisible bottlenecks
- Compliance risks from process deviations

**Business Impact**: 
- Average loan cycle time: **18.5 days** (target: 15 days)
- SLA compliance: **73%** (target: 95%)
- Manual effort: **42% of tasks** could be automated

---

### **Part 2: Data Integration** (4 minutes)

#### Script:
*"EPI X-Ray connects to these systems through API-based adapters, creating a unified event log. Let me show you how we import data from all three systems."*

#### Actions:
1. **Select Process**:
   - Click "Create New: Berkadia Loan Servicing"
   
2. **Review System Cards**:
   - Show Salesforce, Excel, Mainframe data files
   - Explain: "Each CSV represents actual workflow data from these systems"

3. **Import Demo Data**:
   - Click "Import Berkadia Demo Data"
   - Watch real-time import status (Salesforce → Excel → Mainframe)
   - Point out: "In production, this happens automatically via APIs"

4. **Review Import Success**:
   - Show total events imported
   - Display statistics: cycle time, automation potential, savings

#### Key Talking Points:
- **No rip-and-replace**: Works alongside existing systems
- **Event-driven architecture**: Captures every activity automatically
- **Source system tagging**: Maintains data lineage
- **Time to value**: Pilot deployments in 2-4 weeks

**Expected Results**:
- ~50+ events imported across 3 systems
- 5 loan applications tracked end-to-end

---

### **Part 3: Executive Dashboard - The "So What?"** (5 minutes)

#### Script:
*"Now that we have unified data, let's see what insights emerge. This executive dashboard shows you exactly where problems are and what they're costing you."*

#### Actions:
1. **Scroll to Executive Dashboard** (appears after import)

2. **Review Hero KPIs** (top cards):
   - **Average Cycle Time**: 18.5 days vs. 15-day target ⚠️
   - **SLA Compliance**: 73% (missing target by 22 points) ⚠️
   - **Automation Potential**: 42% of manual tasks
   - **Projected Savings**: $2.4M annually

3. **Analyze Top Bottlenecks**:
   - **Document Verification**: 4.2 days average (manual review)
   - **Credit Report Pull**: 2.8 days (waiting on vendor)
   - **Appraisal Processing**: 3.5 days (external dependency)

4. **Review Automation Recommendations**:
   - **#1: Automate Document Verification**
     - ROI: **340%**
     - Payback: **3.2 months**
     - Annual Savings: **$180K**
     - Priority: **HIGH**
   
   - **#2: Credit Report API Integration**
     - ROI: **285%**
     - Payback: **4.1 months**
     - Annual Savings: **$145K**
     - Priority: **HIGH**
   
   - **#3: Automated Email Notifications**
     - ROI: **220%**
     - Payback: **5.8 months**
     - Annual Savings: **$95K**
     - Priority: **MEDIUM**

#### Key Talking Points:
- **Data-driven insights**: Not guesswork, actual process data
- **ROI quantification**: Every recommendation includes financial impact
- **Priority scoring**: Focus on high-impact, quick-win opportunities
- **Benchmark comparison**: See how you compare to industry standards

**Demo Impact Moment**:
*"These three automation opportunities alone would save $420K annually with an average payback period of 4.4 months. That's real money in your first year."*

---

### **Part 4: Unified Process Visualization** (4 minutes)

#### Script:
*"Let's visualize how work actually flows across these disconnected systems. This is the first time you'll see your end-to-end loan process in one view."*

#### Actions:
1. **Scroll to Unified Process Map**

2. **Explain Color Coding**:
   - 🔵 **Blue nodes**: Salesforce activities (lead capture, initial screening)
   - 🟢 **Green nodes**: Excel activities (credit analysis, underwriting)
   - 🟣 **Purple nodes**: Mainframe activities (loan boarding, servicing)

3. **Explore Interactive Features**:
   - **Zoom in** on specific activities
   - **Show edge thickness**: Represents frequency of transitions
   - **Animated edges**: High-frequency paths (>50% of transitions)
   - **Event counts**: Number displayed on each node

4. **Identify Handoff Points**:
   - Point to transitions between blue → green → purple
   - Explain: "These color changes show where data moves between systems"
   - Highlight: "These handoffs are where delays typically occur"

5. **System Statistics**:
   - Salesforce events: X
   - Excel events: Y
   - Mainframe events: Z

#### Key Talking Points:
- **End-to-end transparency**: First time seeing complete workflow
- **Cross-system dependencies**: Understand how systems interact
- **Manual handoffs visible**: See where automation can help
- **Real process vs. intended process**: Discover hidden workarounds

**Insight to Highlight**:
*"Notice how many activities happen in Excel? That's manual work happening outside your core systems - prime candidates for automation."*

---

### **Part 5: Email-to-Workflow Extraction** (3 minutes)

#### Script:
*"A lot of your business process lives in email - approvals, questions, escalations. Our AI can extract structured workflow data from those unstructured communications."*

#### Actions:
1. **Switch to Email Parser Tab**

2. **Load Sample Email**:
   - Click "Load Sample Email"
   - Show the email thread (3 messages about loan #45823)

3. **Parse Email**:
   - Click "Parse Email Thread"
   - Watch AI extraction in progress (GPT-4o)
   - Review structured results

4. **Walk Through Extracted Data**:
   
   **Process Steps Identified**:
   - Application received (Oct 15)
   - Financial docs submitted (Oct 22)
   - Credit review completed (Oct 28)
   - Appraisal pending (Nov 12 expected)
   - Environmental report needed
   - Commitment letter target (Nov 19)
   
   **Bottlenecks Detected**:
   - Appraisal vendor delay
   - Credit report expiring (90 days from July 30)
   - SLA breach risk (30-day target missed)
   
   **Action Items**:
   - Escalate with appraisal vendor (Mike - High priority)
   - Pull fresh credit report if delayed past Nov 15
   - Schedule borrower update call Monday
   
   **Decision Points**:
   - Pre-qualification approved (Oct 18)
   - Final approval pending appraisal + environmental

#### Key Talking Points:
- **Unstructured data → structured insights**: Turn emails into process steps
- **Automatic bottleneck detection**: AI identifies delays mentioned in conversations
- **Action item extraction**: Know who needs to do what by when
- **Timeline reconstruction**: See complete audit trail

**Use Cases**:
- Project status updates
- Customer support escalations
- Compliance audit trails
- Cross-departmental collaboration

---

### **Part 6: Task Mining & Desktop Agent** (3 minutes)

#### Script:
*"Beyond system-level processes, we can also analyze what individuals are doing on their desktops - this is where we find the hidden manual work."*

#### Actions:
1. **Navigate to Task Mining** page

2. **Show Desktop Agent Tab**

3. **Generate API Key**:
   - Click "Generate API Key"
   - Enter label: "Demo Workstation"
   - Set expiry: 365 days
   - Click "Generate API Key"
   
4. **Display Keys** (shown only once):
   - API Key: `epix_a8b2c9d4e5f6...` (copy button)
   - Encryption Key: `VGhpc...` (copy button)
   - Explain: "These are shown only once for security"

5. **Show Existing Keys**:
   - List view with masked keys
   - Metadata: created date, last used, expiry
   - Revoke functionality

6. **Explain Desktop Agent**:
   - **What it captures**: Keystrokes, mouse events, app usage
   - **Privacy controls**: User consent required, blur sensitive data
   - **Security**: AES-256 encryption before transmission
   - **System tray**: Runs in background, pause/resume anytime

#### Key Talking Points:
- **Micro-level insights**: Understand individual work patterns
- **RPA opportunity discovery**: Find repetitive tasks to automate
- **Productivity analytics**: See which apps consume most time
- **GDPR compliant**: Full transparency and user control

**Example Insights**:
- "Sarah spends 3 hours/day copying data between Excel and Salesforce"
- "Document verification involves 47 clicks per loan - prime RPA candidate"
- "Users switch between 8 different applications during underwriting"

---

### **Part 7: AI Process Assistant** (2 minutes)

#### Script:
*"Throughout this journey, you can ask our AI assistant questions about your processes in plain English."*

#### Actions:
1. **Navigate to any process details page**

2. **Open AI Assistant panel**

3. **Ask Sample Questions**:

   **Q: "What are our biggest bottlenecks in loan processing?"**  
   A: *"Based on analysis of 5 loan applications, the primary bottlenecks are:
   1. Document Verification (4.2 days avg) - manual review process
   2. Appraisal Processing (3.5 days avg) - external vendor dependency
   3. Credit Report Pull (2.8 days avg) - manual request process
   
   Combined, these three activities account for 10.5 days of your 18.5-day average cycle time (57%)."*

   **Q: "What automation would give us the best ROI?"**  
   A: *"Top 3 automation opportunities by ROI:
   1. **Document Verification OCR** - 340% ROI, $180K annual savings
   2. **Credit Bureau API Integration** - 285% ROI, $145K savings  
   3. **Automated Status Notifications** - 220% ROI, $95K savings
   
   Implementing all three would reduce cycle time from 18.5 → 12.3 days (33% improvement) with $420K total annual savings."*

   **Q: "How does our DSCR calculation time compare to industry benchmarks?"**  
   A: *"Your DSCR calculations average 0.8 days (6.4 hours). Industry benchmark for automated DSCR is 0.1 days (< 1 hour). This represents a 700% opportunity for improvement through automation."*

#### Key Talking Points:
- **Natural language queries**: No SQL or technical skills needed
- **Context-aware**: Understands your specific process data
- **Financial intelligence**: Every answer includes ROI perspective
- **Domain knowledge**: Pre-loaded with CRE/mortgage terminology

---

### **Part 8: Digital Twin Simulation** (optional, 2 minutes)

#### Script:
*"Before implementing any changes, you can simulate them in a digital twin of your process to see the impact."*

#### Actions:
1. **Navigate to Simulations** page

2. **Create New Simulation**:
   - Select "Berkadia Loan Servicing" process
   - Scenario: "Automate Document Verification"
   
3. **Set Parameters**:
   - Reduce document verification duration by 80% (4.2 → 0.8 days)
   - Number of cases: 100
   - Run simulation

4. **Review Results**:
   - **Before**: 18.5 days avg cycle time
   - **After**: 14.1 days avg cycle time
   - **Improvement**: 24% faster
   - **Throughput**: +18 cases/month
   - **Cost savings**: $15K/month

#### Key Talking Points:
- **Risk-free testing**: Validate improvements before implementation
- **What-if scenarios**: Test multiple automation strategies
- **Capacity planning**: Understand throughput impacts
- **ROI validation**: Confirm projected savings

---

## 🎯 Key Demo Outcomes

By the end, stakeholders should see:

### **Immediate Value**
- ✅ Unified view of cross-system processes (first time ever)
- ✅ Quantified bottlenecks with root cause analysis
- ✅ Automation opportunities with ROI calculations
- ✅ Real data from their actual systems

### **Strategic Insights**
- 📊 **18.5 → 12.3 days**: Achievable cycle time reduction
- 💰 **$2.4M annually**: Total automation savings potential
- ⚡ **42% manual work**: Can be automated
- 📈 **340% ROI**: On top automation opportunity

### **Competitive Advantages**
- 🚀 **2-4 weeks**: Time to pilot deployment
- 🔒 **No rip-and-replace**: Works with existing systems
- 🤖 **AI-powered**: Continuous improvement recommendations
- 📱 **Desktop + cloud**: Complete process visibility

---

## 💡 Expected Questions & Answers

### **Q: "How does this integrate with our existing systems?"**
A: *"EPI X-Ray uses API-based integrations and event listeners. For systems without APIs, we offer CSV imports, database connectors, and email parsing. Most pilots start with 2-3 systems and expand from there. Integration typically takes 1-2 weeks per system."*

### **Q: "What about data security and privacy?"**
A: *"All data is encrypted at rest and in transit (AES-256). We're GDPR compliant with full audit trails. For task mining, employees must provide explicit consent, and sensitive data can be automatically blurred. You control data retention policies."*

### **Q: "How accurate is the ROI calculation?"**
A: *"ROI calculations use your actual process data: activity durations × resource costs × frequency. You can customize hourly rates, implementation costs, and maintenance costs. Conservative estimates help ensure realistic projections."*

### **Q: "Can we customize the dashboards and KPIs?"**
A: *"Yes! The Custom KPI Builder lets you define any metric with threshold-based alerts. Dashboards are configurable by role (executive, manager, analyst). You can also export raw data for custom analysis."*

### **Q: "What if our process changes frequently?"**
A: *"That's the beauty of process mining - it automatically discovers your as-is process. As workflows evolve, the system adapts. You'll get alerts when processes deviate from norms, helping you manage change."*

### **Q: "Do we need to train the AI?"**
A: *"No training required. We use GPT-4o with domain-specific knowledge bases pre-loaded (CRE, finance, etc.). The AI learns from your process data automatically. You can add company-specific terminology if needed."*

### **Q: "What's the implementation timeline?"**
A: *"Typical timeline:
- Week 1-2: System integration and data ingestion
- Week 3-4: Process discovery and validation
- Week 5-6: Stakeholder training and dashboard customization
- Week 7-8: Production rollout and optimization
Most clients see first insights within 2 weeks."*

### **Q: "How does your pricing compare to competitors?"**
A: *"EPI X-Ray is transparent at $178-$958/month with no setup fees and all infrastructure included. Over 3 years, you'd invest $39K total. Compare that to enterprise solutions like Celonis ($740K over 3 years) or UiPath Process Mining ($130K over 3 years). We're 70-95% less expensive. Plus, we include hosting, AI, security, and support - competitors charge separately for those."*

### **Q: "What are your pricing tiers?"**
A: *"Four flexible tiers (plus applicable taxes):
- **Starter**: $178/month (5 processes, 2 users, 1K AI queries/month) - ideal for pilot
- **Professional**: $478/month (20 processes, 10 users, 5K AI queries/month) - growing teams
- **Enterprise**: $958/month (unlimited processes, 50 users, 20K AI queries/month) - full deployment
- **Custom**: Contact us (50+ users, custom AI limits, dedicated support, SLA guarantees)

All tiers include infrastructure, hosting, security, support, and core features. AI usage above limits billed at $0.05/query. Payment gateway fees (2-3%) and GST/taxes apply."*

### **Q: "What about desktop agent adoption?"**
A: *"Completely voluntary and transparent. Employees see exactly what's being tracked. Many clients start with volunteer groups (process champions) to demonstrate value before broader rollout. Privacy controls ensure compliance."*

---

## 📊 Success Metrics to Track Post-Demo

### Immediate (Week 1-2)
- [ ] Pilot process identified
- [ ] System integration requirements gathered
- [ ] Stakeholder alignment on goals

### Short-term (Month 1-3)
- [ ] First process discovered and validated
- [ ] Top 3 bottlenecks identified
- [ ] Automation opportunities prioritized
- [ ] Pilot ROI measured

### Long-term (Month 3-6)
- [ ] First automation implemented
- [ ] Cycle time improvement validated
- [ ] Cost savings realized
- [ ] Expansion to additional processes

---

## 🎁 Leave-Behind Materials

### For Executives
- Executive summary deck (8 slides)
- ROI calculator spreadsheet
- Industry benchmark comparison
- Case study: Similar CRE company

### For IT Leaders
- Technical architecture diagram
- Integration specifications
- Security & compliance documentation
- API documentation

### For Process Owners
- Berkadia demo recording
- User guide for AI assistant
- Custom KPI builder tutorial
- Desktop agent setup guide

---

## 🚀 Next Steps (Call to Action)

### Option 1: Pilot Program (Recommended)
- **Duration**: 8 weeks
- **Scope**: 1-2 processes, 2-3 systems
- **Investment**: $XX,XXX
- **Deliverables**: Process maps, automation roadmap, ROI analysis
- **Success criteria**: 20%+ cycle time improvement or $XXK savings identified

### Option 2: Proof of Concept
- **Duration**: 4 weeks
- **Scope**: 1 process, historical data only
- **Investment**: $XX,XXX
- **Deliverables**: Process discovery, bottleneck analysis
- **Success criteria**: Actionable insights identified

### Option 3: Desktop Agent Trial
- **Duration**: 2 weeks
- **Scope**: 5-10 volunteers, 1 department
- **Investment**: $X,XXX
- **Deliverables**: Task mining insights, RPA opportunities
- **Success criteria**: 5+ automation candidates identified

---

## 📞 Post-Demo Follow-Up

### Within 24 Hours
- Send thank you email with demo recording
- Share leave-behind materials
- Propose pilot scope and timeline

### Within 1 Week
- Schedule technical deep-dive (if needed)
- Provide formal proposal with pricing
- Connect with reference customers

### Within 2 Weeks
- Answer all stakeholder questions
- Finalize pilot agreement
- Kickoff planning session

---

## 🎯 Demo Success Criteria

You've delivered a great demo if:
- ✅ Stakeholders see their actual pain points reflected
- ✅ ROI numbers resonate as realistic and achievable
- ✅ Clear "aha moments" during visualization reveals
- ✅ Technical team asks integration questions
- ✅ Business team discusses next steps
- ✅ Commitment to pilot or POC

---

## 📝 Demo Checklist

### Before Demo
- [ ] Environment running (localhost:5000 or prod URL)
- [ ] MASTER_ENCRYPTION_KEY set
- [ ] Demo account created
- [ ] Browser tabs pre-loaded
- [ ] Backup slides ready (if demo fails)
- [ ] Screen recording started

### During Demo
- [ ] Introduce platform capabilities upfront
- [ ] Focus on business outcomes, not features
- [ ] Use stakeholder's terminology (DSCR, LTV, etc.)
- [ ] Pause for questions after each section
- [ ] Show real data, not mocks
- [ ] Emphasize ROI at every step

### After Demo
- [ ] Capture questions and action items
- [ ] Schedule follow-up meeting
- [ ] Send materials within 24 hours
- [ ] Internal debrief on what worked
- [ ] Update demo based on feedback

---

## 🏆 Power Tips for Maximum Impact

1. **Start with their pain**: Reference actual problems they've mentioned
2. **Use their lingo**: DSCR, LTV, Fannie Mae, Freddie Mac, HUD
3. **Show, don't tell**: Let data speak through visualizations
4. **Anchor on ROI**: Every feature ties to dollars saved
5. **Make it interactive**: Let them ask AI assistant questions
6. **Create urgency**: "Every month delayed costs $200K in missed savings"
7. **Social proof**: "Similar CRE firms see 30-40% cycle time reduction"
8. **Be transparent**: Acknowledge limitations, don't oversell

---

## 🎬 Closing Statement

*"What you've seen today is how EPI X-Ray transforms disconnected systems into unified process intelligence. For Berkadia, that means going from 18.5 → 12.3 days on loan processing, achieving 340% ROI on automation, and saving $2.4M annually. The question isn't whether process mining will improve your operations - the data proves it will. The question is: how soon do you want to start?"*

---

**Demo Guide Version**: 1.0  
**Last Updated**: November 2024  
**Platform Version**: EPI X-Ray v1.0 (Next.js 15.5.4)  
**Demo Dataset**: Berkadia Loan Servicing (5 loans, 3 systems, 50+ events)
