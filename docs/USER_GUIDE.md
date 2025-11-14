# EPI-Q Portal - Complete User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Process Discovery](#process-discovery)
4. [Conformance Checking](#conformance-checking)
5. [Performance Analytics](#performance-analytics)
6. [Automation Opportunities with AutoMachine](#automation-opportunities-with-automachine)
7. [Predictive Analytics](#predictive-analytics)
8. [Task Mining](#task-mining)
9. [Digital Twin Simulation](#digital-twin-simulation)
10. [Real-Time Monitoring](#real-time-monitoring)
11. [Advanced Reporting](#advanced-reporting)
12. [Cost Analysis & ROI Calculator](#cost-analysis--roi-calculator)
13. [AI Process Assistant](#ai-process-assistant)
14. [Collaboration Features](#collaboration-features)
15. [Custom KPI Builder](#custom-kpi-builder)
16. [Multi-Tenant Administration](#multi-tenant-administration)
17. [Settings & Configuration](#settings--configuration)

---

## Getting Started

### Accessing the Portal

1. **Navigate to the EPI-Q Portal**
   - Open your web browser
   - Go to your EPI-Q Portal URL
   - You'll see the landing page with the EPI-Q logo

2. **Sign Up (First Time Users)**
   - Click the **"Sign Up"** tab on the right panel
   - Enter your email address
   - Create a strong password (minimum 8 characters, including uppercase, lowercase, number, and special character)
   - Click **"Create Account"**
   - You'll be automatically logged in

3. **Login (Returning Users)**
   - Click the **"Login"** tab (default)
   - Enter your registered email address
   - Enter your password
   - Click **"Log In"**
   - You'll be redirected to the dashboard

### First-Time Setup

After logging in for the first time:

1. **Upload Your First Event Log**
   - Navigate to any analysis page (e.g., Process Discovery)
   - Click **"Upload Event Logs"** button
   - Select a CSV file containing your process data
   - Required columns: Case ID, Activity, Timestamp
   - Optional columns: Resource, Cost, Additional attributes
   - Click **"Upload"**
   - Wait for the processing to complete

2. **Verify Data Upload**
   - Check the process selector dropdown
   - Your uploaded process should appear in the list
   - Select it to view the analysis

---

## Dashboard Overview

The dashboard is your command center, providing a high-level overview of all your processes.

### Key Metrics Cards

**1. Total Processes**
- Shows the total number of processes being monitored
- Click the card to navigate to the full process list

**2. Active Processes**
- Displays currently running process instances
- Real-time updates every 30 seconds
- Green indicator means healthy status

**3. Average Cycle Time**
- Shows the average time to complete a process instance
- Measured in days, hours, or minutes depending on scale
- Lower is generally better

**4. Automation Rate**
- Percentage of tasks that can be automated
- Based on AI analysis of repetitive patterns
- Higher percentages indicate greater automation potential

### Recent Process Activity

**Understanding the Activity Table:**
- **Process Name**: Identifier for each process
- **Status**: Health indicator (Healthy, Warning, Critical)
- **Last Updated**: Timestamp of most recent data
- **Actions**: Quick access to view details

**How to Use:**
1. Scan the status column for issues
2. Click on any process name to view detailed analytics
3. Use the search box to filter processes
4. Sort by clicking column headers

### Process Performance Chart

**Interpreting the Chart:**
- X-axis: Time period (last 7 days by default)
- Y-axis: Number of completed cases
- Bars: Daily completion count
- Hover over bars to see exact numbers

**Using the Chart:**
1. Identify trends in process completion rates
2. Spot unusual spikes or drops
3. Compare performance across different time periods
4. Click on specific dates to drill down

### Quick Actions Panel

**Available Actions:**
- **Upload Event Logs**: Add new process data
- **Create Custom KPI**: Define your own metrics
- **View Reports**: Access generated reports
- **Settings**: Configure platform preferences

---

## Process Discovery

Process Discovery automatically generates visual process maps from your event logs.

### Uploading Event Logs

**Step-by-Step:**

1. **Click "Upload Event Logs"**
   - Located at the top-right of the page
   - Or drag and drop files directly

2. **Prepare Your CSV File**
   - Required format:
     ```
     CaseID,Activity,Timestamp,Resource
     C001,Order Received,2024-01-01 09:00:00,John
     C001,Payment Processed,2024-01-01 09:15:00,System
     C001,Order Shipped,2024-01-01 10:00:00,Mary
     ```
   - Ensure timestamps are in a standard format
   - Case IDs should be consistent within each process instance

3. **Select File and Upload**
   - Click "Choose File" or drag file to upload zone
   - File size limit: 50MB
   - Supported format: CSV only
   - Click "Upload" button

4. **Wait for Processing**
   - Processing time depends on file size (typically 5-30 seconds)
   - Progress bar shows current status
   - Don't close the browser during upload

### Viewing the Process Map

**Understanding the Visualization:**

**Nodes (Activities):**
- **Green circles**: Start events (first activity in each case)
- **Red circles**: End events (last activity in each case)
- **Cyan circles**: Intermediate activities
- Size indicates frequency (larger = more common)

**Edges (Transitions):**
- **Arrow direction**: Shows flow from one activity to another
- **Thickness**: Indicates frequency of transition
- **Animated lines**: Show the most common paths
- **Labels**: Display transition frequency

**How to Navigate:**
1. **Zoom**: Use mouse wheel or pinch gesture
2. **Pan**: Click and drag the canvas
3. **Select Node**: Click any activity to see details
4. **Reset View**: Click "Fit View" button

### Process Statistics Panel

**Metrics Explained:**

1. **Total Cases**
   - Number of unique process instances
   - Each Case ID counts as one case

2. **Unique Activities**
   - Count of distinct activity types
   - Shows process complexity

3. **Average Path Length**
   - Mean number of activities per case
   - Indicates typical process duration

4. **Most Common Activity**
   - Activity that appears most frequently
   - May indicate bottlenecks

### Analyzing the Results

**Best Practices:**

1. **Identify Main Path**
   - Look for the thickest edges
   - These represent your standard process flow
   - Focus optimization efforts here first

2. **Spot Deviations**
   - Thin edges show rare paths
   - May indicate exceptions or errors
   - Investigate unusual patterns

3. **Find Loops**
   - Circular paths in the diagram
   - Often indicate rework or approvals
   - Consider if these are necessary

4. **Check Start/End Events**
   - Multiple start events may indicate different entry points
   - Multiple end events may show various outcomes
   - Ensure they align with expectations

### Filtering Options

**Apply Filters:**

1. **Date Range Filter**
   - Click the filter icon
   - Select start date and end date
   - Click "Apply" to refresh the map
   - Useful for comparing time periods

2. **Confidence Threshold**
   - Slider from 0% to 100%
   - Higher values show only most common paths
   - Lower values include rare transitions
   - Default: 50%

3. **Activity Filter**
   - Select specific activities to focus on
   - Hide irrelevant activities
   - Simplify complex processes

### Exporting Process Maps

**Export Options:**

1. **Export as PNG Image**
   - Click "Share" dropdown
   - Select "Export to PDF"
   - High-resolution image suitable for presentations
   - Includes all visible nodes and edges

2. **Export to PowerPoint**
   - Click "Share" → "Export to PowerPoint"
   - Creates a slide with the process map
   - Includes process statistics
   - Editable in PowerPoint

3. **Copy Link**
   - Click "Share" → "Copy Link"
   - Share with team members
   - Recipients can view the same analysis
   - Requires login to access

---

## Conformance Checking

Conformance Checking validates whether your actual processes follow the expected model.

### Setting Up Conformance Checking

**Step 1: Upload Process Model**

1. Navigate to **Process Analysis** page
2. Select the **"Conformance Checking"** tab
3. Click **"Upload BPMN Model"** (optional)
   - If no model exists, the system uses the discovered process
   - BPMN format recommended
   - XML format supported

**Step 2: Select Process**

1. Use the process selector dropdown
2. Choose the process you want to validate
3. System automatically loads the most recent data

### Understanding Token-Based Replay

**What It Means:**
- The system simulates "tokens" flowing through your process
- Tokens represent process instances (cases)
- Mismatches indicate conformance violations

**Conformance Metrics:**

1. **Fitness Score (0-100%)**
   - Percentage of cases that fit the model
   - 100% = Perfect conformance
   - 90-99% = Good
   - 80-89% = Acceptable
   - Below 80% = Review needed

2. **Precision Score (0-100%)**
   - How well the model predicts actual behavior
   - High precision = Model is specific and accurate
   - Low precision = Model allows too many variations

3. **Generalization Score**
   - Model's ability to handle unseen cases
   - Balances overfitting vs. underfitting

### Identifying Violations

**Violation Types:**

1. **Missing Tokens**
   - Activities executed that shouldn't happen
   - Highlighted in red on the process map
   - Click to see which cases involved

2. **Remaining Tokens**
   - Expected activities that didn't execute
   - Highlighted in orange
   - May indicate incomplete processes

3. **Wrong Timing**
   - Activities executed in wrong order
   - Shows temporal violations
   - Review business rules

**How to Investigate:**

1. **Click on Violation Markers**
   - Opens detail panel
   - Shows affected case IDs
   - Displays violation frequency

2. **Review Case Details**
   - Click "View Cases" button
   - See full execution trace
   - Compare to expected model

3. **Analyze Root Causes**
   - Look for patterns in violations
   - Check if certain resources cause more issues
   - Identify time periods with higher violations

### Fixing Conformance Issues

**Recommended Actions:**

1. **Update Process Model**
   - If violations are intentional exceptions
   - Incorporate them into the standard model
   - Click "Update Model"

2. **Fix Process Execution**
   - Train staff on correct procedures
   - Update process documentation
   - Implement process controls

3. **Set Up Alerts**
   - Configure notifications for violations
   - Navigate to Settings → Alerts
   - Set threshold (e.g., alert if fitness < 85%)

### Exporting Conformance Reports

1. Click **"Share"** dropdown
2. Select **"Export to Excel"**
3. Report includes:
   - Summary metrics
   - List of all violations
   - Case-by-case analysis
   - Recommendations

---

## Performance Analytics

Analyze process performance metrics, identify bottlenecks, and track KPIs.

### Key Performance Metrics

**1. Cycle Time Analysis**

**What It Shows:**
- Time from process start to completion
- Measured per case
- Displayed as average, median, min, max

**How to Use:**
1. View the cycle time chart
2. Identify outliers (unusually long cases)
3. Click on data points to drill down
4. Compare against target SLAs

**Interpreting the Chart:**
- **Bars**: Individual case durations
- **Line**: Average trend over time
- **Red zone**: Cases exceeding SLA
- **Green zone**: Cases within target

**2. Throughput Analysis**

**What It Shows:**
- Number of cases completed per time period
- Measures process efficiency
- Tracks productivity trends

**How to Use:**
1. Check daily/weekly/monthly throughput
2. Identify peak and low periods
3. Plan resource allocation accordingly
4. Set throughput targets

**3. Bottleneck Identification**

**What It Shows:**
- Activities causing the most delays
- Wait times between activities
- Resource utilization issues

**How to Identify Bottlenecks:**

1. **Look at the Bottleneck Table**
   - Activities listed by average wait time
   - Higher wait time = bigger bottleneck
   - Shows percentage of total delay

2. **Check Resource Utilization**
   - Over 90% = Resource constrained
   - Under 50% = Underutilized
   - Aim for 70-85% for balance

3. **Analyze Activity Duration**
   - Compare actual vs. expected duration
   - Large variance indicates inconsistency
   - Focus on high-impact activities

**Taking Action:**

1. **Add Resources**
   - If utilization is very high
   - Calculate ROI before hiring
   - Consider temporary staff for peaks

2. **Optimize Activity**
   - If duration is consistently high
   - Look for automation opportunities
   - Review and streamline procedures

3. **Rebalance Workload**
   - Shift work from bottlenecks
   - Cross-train staff
   - Implement queue management

### Resource Performance

**Understanding Resource Metrics:**

1. **Utilization Rate**
   - Percentage of time resource is working
   - Formula: (Active Time / Total Time) × 100
   - Displayed per resource

2. **Average Handling Time**
   - Mean time to complete activities
   - Varies by activity type
   - Compare resources for consistency

3. **Cases Handled**
   - Total number of cases per resource
   - Indicates workload distribution
   - Check for imbalances

**How to Use Resource Data:**

1. **Navigate to Resource Tab**
   - Click "Resources" in the analytics panel
   - View table of all resources

2. **Sort by Metrics**
   - Click column headers to sort
   - Identify top and bottom performers
   - Don't jump to conclusions—investigate context

3. **Drill Down by Resource**
   - Click on a resource name
   - View their specific activity history
   - See which activities they handle

4. **Balance Workload**
   - Identify overloaded resources
   - Redistribute work if possible
   - Consider training for efficiency

### Setting Performance Targets

**Creating SLA Targets:**

1. **Navigate to Settings**
   - Click gear icon
   - Select "Performance Targets"

2. **Define Metrics**
   - Select metric type (Cycle Time, Throughput, etc.)
   - Set target value
   - Choose warning threshold

3. **Apply to Processes**
   - Select which processes this applies to
   - Can set different targets per process
   - Save configuration

4. **Monitor Compliance**
   - Dashboard shows target vs. actual
   - Visual indicators (green/yellow/red)
   - Automatic alerts when targets missed

### Time-Based Analysis

**Comparing Time Periods:**

1. **Use Date Range Selector**
   - Click calendar icon
   - Choose "This Week" vs. "Last Week"
   - Or select custom date ranges

2. **View Comparison Charts**
   - Side-by-side metrics
   - Percentage change indicators
   - Trend arrows (up/down)

3. **Analyze Seasonality**
   - Look for recurring patterns
   - Plan for busy seasons
   - Adjust resources proactively

### Exporting Analytics

**Export Options:**

1. **PDF Report**
   - Comprehensive report with all charts
   - Includes executive summary
   - Professional formatting

2. **Excel Spreadsheet**
   - Raw data for further analysis
   - All metrics in separate sheets
   - Pivot-ready format

3. **PowerPoint Presentation**
   - Pre-formatted slides
   - Key charts and insights
   - Ready for stakeholder meetings

**Steps to Export:**
1. Click "Share" button
2. Select export format
3. Choose which sections to include
4. Click "Generate"
5. Download automatically starts

---

## Automation Opportunities with AutoMachine

Identify tasks with high automation potential and leverage automatic error resolution.

### Understanding Automation Scoring

**Automation Potential Score (0-100%):**
- **90-100%**: Excellent automation candidate
- **70-89%**: Good automation potential
- **50-69%**: Moderate potential, needs evaluation
- **Below 50%**: Low priority for automation

**Factors Considered:**
- Repetitiveness of task
- Rule-based nature
- Data availability
- Current manual effort
- Complexity level

### Viewing Automation Opportunities

**Step-by-Step:**

1. **Navigate to Automation Opportunities**
   - Click "Automation Opportunities" in the sidebar
   - Or use the dashboard quick link

2. **Upload Process Data**
   - If not already done, upload event logs
   - System analyzes patterns automatically
   - Processing takes 1-2 minutes

3. **Review Opportunity List**
   - Sorted by automation score (highest first)
   - Each card shows:
     - Task name
     - Automation score
     - Potential time savings
     - Estimated effort to automate

4. **Prioritize Opportunities**
   - Focus on high score + high impact
   - Consider implementation difficulty
   - Balance quick wins vs. long-term gains

### Automatic Error Resolution Feature

**What It Does:**
- Monitors your system for errors in real-time
- Automatically captures error logs
- Analyzes errors using AI
- Suggests or implements automatic fixes

**How It Works - 4-Step Process:**

**Step 1: Error Detection**
- System continuously monitors for errors
- Captures JavaScript errors, network failures, and exceptions
- No manual intervention needed

**Step 2: Log Analysis**
- AI analyzes error logs automatically
- Examines error messages, stack traces, and context
- Identifies error patterns and root causes

**Step 3: Issue Diagnosis**
- Determines the type of error:
  - Network errors
  - Null reference errors
  - Timeout errors
  - JSON parsing errors
  - Unknown errors
- Assesses severity and impact

**Step 4: Auto Resolution**
- Applies automatic fixes when possible:
  - **Network errors**: Retry with exponential backoff
  - **Null references**: Add null checks and defaults
  - **Timeouts**: Increase thresholds and add retry logic
  - **Parsing errors**: Add error handling and fallbacks
- Logs errors requiring manual review

### Using the Error Resolution Dashboard

**Dashboard Components:**

**1. Monitoring Status**
- **Active**: System is monitoring for errors
- **Paused**: Monitoring temporarily disabled
- Toggle with "Pause/Resume" button

**2. Key Metrics Cards:**

**Total Errors**
- Count of all captured errors in current session
- Includes both auto-resolved and pending

**Auto-Resolved**
- Number of errors fixed automatically
- Shows effectiveness of automation
- Green indicator for success

**Needs Review**
- Errors requiring manual intervention
- Click to see details
- Prioritize by severity

**3. Automatic Resolution Toggle**
- **Enabled** (default): System auto-fixes common errors
- **Disabled**: Only logs errors for manual review
- Click button to toggle

**4. Error Log Table**

Each error entry shows:
- **Status Badge**: 
  - Detected (initial state)
  - Analyzing (processing with spinner)
  - Resolved (green - successfully fixed)
  - Failed (red - needs manual review)
- **Timestamp**: When error occurred
- **Error Type**: Classification (NetworkError, TypeError, etc.)
- **Error Message**: Description of the issue
- **Resolution**: What fix was applied or suggested
- **Retry Button**: For failed errors, manually trigger resolution

**How to Use the Error Log:**

1. **Monitor Real-Time Errors**
   - Errors appear automatically when detected
   - Watch status change from Detected → Analyzing → Resolved/Failed
   - Toast notifications keep you informed

2. **Review Auto-Resolved Errors**
   - Check green "Resolved" badges
   - Verify fixes were appropriate
   - Learn what errors are being handled

3. **Handle Failed Errors**
   - Click "Retry" button for failed errors
   - System attempts resolution again
   - If still failing, review manually

4. **Understand Error Patterns**
   - Look for recurring error types
   - Identify systemic issues
   - Proactively fix root causes

### Manual Error Resolution

**For Errors Requiring Review:**

1. **Click on Error Entry**
   - Expands full details
   - Shows complete stack trace
   - Displays resolution suggestion

2. **Review Suggested Fix**
   - Read the AI-generated recommendation
   - Assess if fix is appropriate
   - Consider side effects

3. **Click "Retry" Button**
   - Attempts auto-resolution again
   - May succeed if conditions changed
   - Monitor status for outcome

4. **Implement Manual Fix**
   - If auto-resolution isn't suitable
   - Use error details to debug
   - Update code accordingly

### Best Practices

**Maximizing Automation Success:**

1. **Keep Monitoring Active**
   - Don't pause monitoring unless necessary
   - Errors are caught immediately
   - Faster resolution = less impact

2. **Enable Auto-Resolution**
   - Let system handle common errors
   - Reduces manual workload
   - Improves system reliability

3. **Review Logs Regularly**
   - Check for patterns
   - Identify recurring issues
   - Proactive prevention is better

4. **Test After Auto-Fixes**
   - Verify fixes work correctly
   - Check for unintended consequences
   - Validate user experience

5. **Update Error Handling**
   - Learn from resolved errors
   - Improve application code
   - Reduce future error occurrence

### Understanding Error Types

**Network Errors**
- Failed API calls
- Timeout issues
- Connection problems
- **Auto-Fix**: Retry with exponential backoff

**Null Reference Errors**
- Undefined variables
- Missing data properties
- Null pointer exceptions
- **Auto-Fix**: Add null checks and defaults

**Timeout Errors**
- Long-running requests
- Slow database queries
- Resource constraints
- **Auto-Fix**: Increase timeout, add retries

**JSON Parsing Errors**
- Malformed data
- Invalid JSON format
- Encoding issues
- **Auto-Fix**: Add error handling, use fallback data

**Unknown Errors**
- Uncategorized issues
- Complex problems
- **Action**: Manual review required

---

## Predictive Analytics

Use AI-powered forecasting to predict future process behavior and identify potential issues.

### Accessing Predictive Analytics

1. Navigate to **"Predictive Analytics"** from sidebar
2. Select a process from the dropdown
3. System loads three analysis modules:
   - Anomaly Detection
   - Forecasting
   - Scenario Analysis

### Anomaly Detection

**What It Does:**
- Identifies unusual patterns in process execution
- Flags deviations from normal behavior
- Classifies severity (High, Medium, Low)

**How to Use:**

**Step 1: View Detected Anomalies**
- Table shows all detected anomalies
- Sorted by severity (High → Low)
- Each row includes:
  - Timestamp of anomaly
  - Affected metric
  - Anomaly type
  - Severity level
  - AI-generated insight

**Step 2: Understand Anomaly Types**

1. **Statistical Outliers**
   - Values far from mean
   - Z-score method
   - Example: Case taking 10x longer than usual

2. **Pattern Breaks**
   - Deviation from historical patterns
   - Sequence anomalies
   - Example: Steps executed in wrong order

3. **Volume Spikes**
   - Sudden increase in case volume
   - May indicate demand surge or data issues
   - Example: 300% more cases than usual

4. **Performance Drops**
   - Significant slowdown
   - Resource issues or bottlenecks
   - Example: Cycle time doubled

5. **Resource Anomalies**
   - Unusual resource behavior
   - Utilization spikes
   - Example: Resource handling 5x normal load

**Step 3: Investigate Anomalies**

1. Click on anomaly row to expand
2. Read AI-generated insight
3. Review affected cases
4. Determine if action needed

**Step 4: Take Action**

- **High Severity**: Immediate investigation required
- **Medium Severity**: Monitor closely
- **Low Severity**: Note for future reference

### Forecasting

**What It Predicts:**
- Future cycle time trends
- Expected throughput
- Resource utilization
- Capacity planning needs

**Understanding Forecast Algorithms:**

The system uses three algorithms based on data availability:

1. **Holt-Winters Exponential Smoothing** (≥12 data points)
   - Most accurate for time-series data
   - Captures seasonality and trends
   - Recommended for established processes

2. **Linear Regression** (6-11 data points)
   - Simple trend analysis
   - Good for medium-term predictions
   - Less sensitive to seasonality

3. **Moving Average** (<6 data points)
   - Basic averaging method
   - Limited accuracy
   - Used when data is sparse

**How to Use Forecasting:**

**Step 1: View Forecast Charts**

Three charts are provided:

1. **Cycle Time Forecast**
   - Predicts future average cycle time
   - 30, 60, and 90-day projections
   - Confidence intervals shown (light blue shading)

2. **Throughput Forecast**
   - Predicts number of cases per period
   - Helps with capacity planning
   - Shows expected range

3. **Resource Utilization Forecast**
   - Predicts resource demand
   - Identifies future bottlenecks
   - Plan hiring/allocation

**Step 2: Interpret Confidence Intervals**

- **Darker line**: Expected value (most likely)
- **Shaded area**: Confidence interval (80% probability)
- **Wider interval**: Higher uncertainty
- **Narrower interval**: More confident prediction

**Step 3: Use Predictions for Planning**

1. **Capacity Planning**
   - If throughput forecast drops, investigate why
   - If increasing, ensure sufficient resources
   - Plan hiring 2-3 months ahead

2. **Performance Improvement**
   - If cycle time forecast increases, take action now
   - Identify trends before they become problems
   - Set proactive improvement initiatives

3. **Resource Allocation**
   - Use utilization forecasts to plan shifts
   - Adjust staffing for predicted peaks
   - Optimize resource distribution

**Data Quality Indicator:**

- Check the data quality badge
- **Good**: Sufficient data for accurate forecast
- **Limited**: Sparse data, use predictions cautiously
- **Insufficient**: Not enough data, focus on collection

### Scenario Analysis (What-If Analysis)

**What It Does:**
- Simulates different scenarios
- Compares impact of changes
- Helps make data-driven decisions

**Three Scenarios Provided:**

**1. Optimistic Scenario**
- 30% more resources
- 30% faster activity execution
- Best-case outcome
- Use for: Maximum capacity planning

**2. Expected Scenario**
- Current baseline conditions
- No changes applied
- Realistic projection
- Use for: Standard planning

**3. Pessimistic Scenario**
- 30% fewer resources
- 50% slower execution
- Worst-case outcome
- Use for: Risk planning and contingency

**How to Use Scenario Analysis:**

**Step 1: Review Scenario Metrics**

For each scenario, view:
- **Average Cycle Time**: Expected duration
- **Throughput**: Cases completed per period
- **Resource Utilization**: Demand on resources
- **SLA Breach Probability**: Risk of missing targets
- **Bottleneck Activities**: Where delays occur

**Step 2: Compare Scenarios**

Use the comparison table:
- Side-by-side metrics
- Percentage differences
- Impact indicators (arrows up/down)
- Risk assessment

**Step 3: Analyze Risk Assessment**

- **Low Risk**: SLA breach probability < 20%
- **Medium Risk**: 20-40% breach probability
- **High Risk**: >40% breach probability

**Step 4: Make Decisions**

1. **If Pessimistic Scenario Shows High Risk:**
   - Create contingency plans
   - Build resource buffer
   - Implement risk mitigation

2. **If Expected Scenario Meets Targets:**
   - Maintain current operations
   - Monitor for deviations
   - Focus on continuous improvement

3. **If Optimistic Scenario Needed for Targets:**
   - Invest in improvements now
   - Add resources
   - Optimize processes

**Step 5: Run Custom Scenarios**

1. Click "Configure Scenario"
2. Adjust parameters:
   - Number of cases (10-500)
   - Duration multiplier (0.5x - 2.0x)
   - Resource availability
3. Click "Run Simulation"
4. Wait for results (15-30 seconds)
5. Review impact metrics

**Step 6: Save Scenario**

- Click "Save Scenario"
- Give it a descriptive name
- Access from scenario history
- Compare against future actuals

### Best Practices for Predictive Analytics

**1. Regular Review**
- Check predictions weekly
- Compare forecasts to actuals
- Adjust strategies based on trends

**2. Act on High-Severity Anomalies**
- Don't ignore warnings
- Investigate root causes
- Implement fixes promptly

**3. Use Multiple Scenarios**
- Don't rely on one scenario
- Plan for range of outcomes
- Prepare contingencies

**4. Validate Predictions**
- Track forecast accuracy
- Update models with new data
- Refine parameters over time

**5. Combine with Other Analyses**
- Use with performance analytics
- Cross-reference with conformance
- Holistic decision-making

---

## Task Mining

Analyze desktop activity patterns to discover process improvements and automation opportunities.

### Understanding Task Mining

**What It Is:**
- Captures desktop activity in real-time
- Analyzes user behavior patterns
- Identifies repetitive tasks
- Discovers automation opportunities

**Important: Privacy & Consent**
- All monitoring requires user consent
- Users can opt-in or opt-out anytime
- Data is encrypted and secure
- Anonymization available

### Setting Up Task Mining

**Step 1: Install Desktop Capture Agent**

1. Navigate to **Task Mining** page
2. Click **"Download Desktop Agent"**
3. Select your operating system:
   - Windows (64-bit)
   - macOS (Intel/Apple Silicon)
   - Linux (Ubuntu/Debian)
4. Run the installer
5. Follow installation wizard

**Step 2: Configure Agent**

1. Open Desktop Capture Agent
2. Enter your EPI-Q credentials
3. Or use API key from Settings
4. Configure privacy settings:
   - Screen capture frequency
   - Applications to exclude
   - Data anonymization level

**Step 3: Grant Consent**

1. Review data collection policy
2. Understand what's captured:
   - Application names
   - Window titles
   - Timestamps
   - Mouse/keyboard activity metrics
   - **Not captured**: Passwords, keystrokes (unless enabled)
3. Click "I Consent"
4. Start monitoring

**Step 4: Verify Connection**

1. Check Task Mining dashboard
2. Should show "Agent Connected"
3. Green indicator with last sync time
4. If not connected, check firewall settings

### Viewing Task Mining Data

**Activity Timeline:**

1. **Daily Activity View**
   - Horizontal timeline showing all activities
   - Color-coded by application
   - Hover to see details
   - Click to drill down

2. **Application Usage Chart**
   - Pie chart of time spent per application
   - Percentage breakdown
   - Click slices for details

3. **Task Frequency Analysis**
   - List of repetitive tasks
   - Execution count
   - Average duration
   - Automation potential score

### AI-Powered Pattern Detection

**What Patterns Are Detected:**

1. **Copy-Paste Patterns**
   - Data transfer between apps
   - Suggests automation via API integration
   - Shows frequency and data types

2. **Repetitive Clicks**
   - Same sequence of clicks
   - Navigation patterns
   - Candidates for macros

3. **Data Entry Patterns**
   - Form filling sequences
   - Repetitive input
   - Auto-fill opportunities

4. **Application Switching**
   - Frequent context switching
   - Integration opportunities
   - Workflow optimization

**How to Use Pattern Insights:**

1. **Review Pattern Cards**
   - Each pattern shown as a card
   - Includes description
   - Automation potential score
   - Suggested solution

2. **Click for Details**
   - Expands full pattern analysis
   - Shows example instances
   - AI-generated recommendation
   - Implementation guidance

3. **Prioritize Patterns**
   - Sort by frequency (high impact)
   - Consider implementation effort
   - Quick wins first

### Automation Opportunity Engine

**How Opportunities Are Scored:**

Formula considers:
- **Frequency**: How often task is performed
- **Duration**: Time taken per execution
- **Consistency**: Pattern regularity
- **Complexity**: How rule-based the task is
- **ROI**: Potential time savings vs. effort

**Score Ranges:**
- **90-100%**: Automate immediately
- **70-89%**: Strong candidate
- **50-69%**: Evaluate cost-benefit
- **Below 50%**: Manual process likely better

**Using Automation Recommendations:**

1. **Review Top Opportunities**
   - Listed by score
   - Each shows:
     - Task description
     - Current time spent
     - Potential savings
     - Recommended tool/approach

2. **Understand Recommendations**
   - **RPA**: For UI-based automation
   - **API Integration**: For data transfer
   - **Macro/Script**: For simple sequences
   - **Process Redesign**: For complex tasks

3. **Implement Automation**
   - Click "View Details"
   - Follow step-by-step guide
   - Or export for dev team
   - Track implementation status

### Managing Privacy & Consent

**Checking Consent Status:**

1. Navigate to Settings → Privacy
2. View consent status per user
3. See what data is being collected
4. Review retention period

**Revoking Consent:**

1. User can revoke anytime
2. Settings → Privacy → "Revoke Consent"
3. Data collection stops immediately
4. Historical data can be deleted

**Data Deletion:**

1. Settings → Privacy → "Delete My Data"
2. Select date range
3. Confirm deletion
4. Permanent removal within 24 hours

### API Key Management

**Generating API Keys:**

1. Settings → API Keys
2. Click "Generate New Key"
3. Enter description (e.g., "John's Desktop")
4. Set expiration date (optional)
5. Copy key immediately (shown only once)
6. Use in Desktop Agent

**Managing Keys:**

- **View**: See all active keys
- **Revoke**: Immediately disable a key
- **Rename**: Update description
- **Audit**: See usage logs

**Security Best Practices:**

- Use unique key per device
- Set expiration dates
- Revoke unused keys
- Rotate keys periodically
- Never share keys

---

## Digital Twin Simulation

Create a virtual replica of your process and run what-if scenarios.

### What Is Digital Twin?

**Definition:**
- Virtual model of your real process
- Based on historical execution data
- Simulates process behavior
- Tests changes without risk

**Benefits:**
- Risk-free testing
- Impact prediction
- Optimization planning
- Scenario comparison

### Creating a Digital Twin

**Automatic Creation:**

1. Navigate to **Digital Twin** page
2. Select process from dropdown
3. Click **"Create Digital Twin"**
4. System automatically:
   - Analyzes historical data
   - Builds process model
   - Calculates statistics
   - Calibrates simulation

**Manual Refinement:**

1. Review generated model
2. Adjust parameters if needed:
   - Activity durations
   - Resource allocations
   - Transition probabilities
3. Click "Update Model"
4. Validation runs automatically

### Process Modeling Tab

**Understanding the Model Visualization:**

**Visual Elements:**

1. **Nodes (Activities)**
   - **Green**: Start event
   - **Red**: End event
   - **Cyan**: Activities
   - Size = frequency
   - Label = activity name

2. **Edges (Transitions)**
   - Arrows show flow direction
   - Thickness = frequency
   - Animated for common paths
   - Label = transition count

3. **Statistics Panel**
   - Total cases in model
   - Number of activities
   - Average path length
   - Most common path

**How to Use:**

1. **Verify Model Accuracy**
   - Does it match your understanding?
   - Are all activities present?
   - Check transition logic

2. **Identify Key Paths**
   - Look for thick edges
   - These are your main flows
   - Focus optimization here

3. **Spot Issues**
   - Unexpected loops
   - Missing connections
   - Rare paths

### What-If Analysis Tab

**Running Scenarios:**

**Step 1: Configure Scenario**

1. Click "New Scenario" button
2. Set parameters:

   **Case Count Slider (10-500)**
   - Number of instances to simulate
   - Higher = more accurate, slower
   - Recommended: 100-200

   **Duration Multiplier (0.5x - 2.0x)**
   - 0.5x = 50% faster (optimization)
   - 1.0x = Current speed (baseline)
   - 2.0x = 100% slower (degradation)

   **Resource Changes** (optional)
   - Add or remove resources
   - Change availability
   - Adjust skill levels

**Step 2: Run Simulation**

1. Click "Run Simulation"
2. Watch progress bar (15-60 seconds)
3. Discrete-event simulation executes
4. Results appear automatically

**Step 3: Analyze Results**

**Scenario Metrics:**
- **Average Cycle Time**: Mean duration
- **Total Cases Completed**: Throughput
- **Resource Utilization**: Workload %
- **Bottleneck Activities**: Delays
- **Cost**: Estimated expense

**Compare to Baseline:**
- Percentage changes shown
- Green = improvement
- Red = degradation
- Yellow = neutral

**Step 4: Save Scenario**

1. Click "Save Scenario"
2. Enter descriptive name
3. Add notes (optional)
4. Accessible from history

### Impact Simulation Tab

**Comparing Scenarios:**

**Baseline vs. Optimized:**

The system compares:
- **Baseline**: Current state simulation
- **Optimized**: Best-case scenario (30% improvement)

**Metrics Compared:**

1. **Cycle Time Improvement**
   - Percentage reduction
   - Absolute time saved
   - Impact on SLA compliance

2. **Throughput Increase**
   - Additional cases per period
   - Revenue impact
   - Capacity gained

3. **Bottleneck Resolution**
   - Before: List of bottlenecks
   - After: Resolved items
   - Remaining issues

4. **Cost Savings**
   - Labor cost reduction
   - Efficiency gains
   - ROI calculation

**Visual Impact Cards:**

Each card shows:
- **Metric name**
- **Before value**
- **After value**
- **Percentage change**
- **Visual indicator** (arrow up/down)

**How to Use Impact Analysis:**

1. **Identify Biggest Impacts**
   - Sort by percentage improvement
   - Focus on high-value changes
   - Consider implementation difficulty

2. **Build Business Case**
   - Use metrics for justification
   - Show ROI to stakeholders
   - Plan implementation roadmap

3. **Prioritize Changes**
   - Quick wins first
   - High impact next
   - Long-term investments last

### Scenario History

**Managing Saved Scenarios:**

1. **View All Scenarios**
   - Listed chronologically
   - Shows creation date
   - Brief description
   - Key metrics

2. **Compare Scenarios**
   - Select multiple scenarios
   - Click "Compare"
   - Side-by-side view
   - Identify best option

3. **Re-run Scenarios**
   - Click scenario name
   - Loads configuration
   - Can modify and re-run
   - Compare to original

4. **Delete Scenarios**
   - Click trash icon
   - Confirm deletion
   - Permanent removal

### Best Practices

**1. Baseline First**
- Always create baseline scenario
- Validates model accuracy
- Reference for all comparisons

**2. Incremental Changes**
- Test one change at a time
- Understand individual impact
- Combine successful changes

**3. Realistic Parameters**
- Don't assume 90% improvements
- Use achievable multipliers
- Base on industry benchmarks

**4. Multiple Scenarios**
- Test various approaches
- Compare different strategies
- Identify trade-offs

**5. Validate Results**
- Do the numbers make sense?
- Check against actual data
- Adjust model if needed

---

## Real-Time Monitoring

Monitor live process execution and get instant alerts for issues.

### Dashboard Overview

**Real-Time Metrics:**

1. **Active Process Instances**
   - Currently running cases
   - Updates every 30 seconds
   - Click to see details

2. **Health Score**
   - Overall process health (0-100)
   - Color-coded: Green (good), Yellow (warning), Red (critical)
   - Based on multiple factors:
     - SLA compliance
     - Error rate
     - Resource utilization
     - Throughput

3. **Current Throughput**
   - Cases completed in last hour
   - Trend indicator
   - Comparison to average

4. **Alert Count**
   - Number of active alerts
   - Severity breakdown
   - Click to view all

### Live Process Instance Tracking

**Instance List:**

Each row shows:
- **Case ID**: Unique identifier
- **Current Activity**: What's happening now
- **Duration**: Time elapsed
- **Status**: Health indicator
- **Progress**: Visual progress bar

**How to Use:**

1. **Monitor Critical Cases**
   - Filter by high priority
   - Track SLA at-risk cases
   - Proactive intervention

2. **Drill Down**
   - Click case ID
   - See full execution trace
   - View all activities
   - Check timing

3. **Take Action**
   - Escalate if needed
   - Reassign resources
   - Expedite processing

### Alert Management

**Alert Types:**

1. **SLA Breach Alert**
   - Case exceeding target time
   - Shows time over SLA
   - Suggested action: Expedite

2. **Bottleneck Alert**
   - Queue length exceeds threshold
   - Activity identified
   - Suggested action: Add resources

3. **Error Alert**
   - Process execution error
   - Error type and message
   - Suggested action: Investigate

4. **Resource Alert**
   - Utilization >90% or <20%
   - Resource identified
   - Suggested action: Rebalance

**Alert Dashboard:**

1. **View All Alerts**
   - Sorted by severity (High → Low)
   - Filter by type
   - Search by keyword

2. **Alert Details**
   - Click alert to expand
   - Full description
   - Affected cases
   - Recommended actions

3. **Acknowledge Alerts**
   - Mark as "Acknowledged"
   - Add notes
   - Assign to team member
   - Track resolution

4. **Resolve Alerts**
   - Mark as "Resolved"
   - Document actions taken
   - Prevents recurrence

### Configuring Alerts

**Setting Up Alert Rules:**

1. **Navigate to Settings → Alerts**
2. Click **"New Alert Rule"**
3. Configure parameters:

   **Trigger Condition:**
   - Select metric (Cycle Time, Throughput, etc.)
   - Set operator (>, <, =, etc.)
   - Define threshold value
   - Example: "Cycle Time > 24 hours"

   **Severity Level:**
   - High, Medium, or Low
   - Determines notification priority
   - Affects escalation rules

   **Notification Channels:**
   - Email
   - In-app notification
   - Webhook (for integrations)
   - SMS (if configured)

   **Recipients:**
   - Select users to notify
   - Can set different recipients per severity
   - Support for distribution lists

4. **Save Alert Rule**
5. Test with sample data

**Managing Alert Rules:**

- **Enable/Disable**: Toggle rules on/off
- **Edit**: Modify thresholds
- **Delete**: Remove obsolete rules
- **Duplicate**: Copy and modify

### Performance Trends

**Real-Time Charts:**

1. **Cycle Time Trend**
   - Last 24 hours
   - Updates every minute
   - Shows moving average
   - Spot sudden changes

2. **Throughput Chart**
   - Cases per hour
   - Compare to target
   - Identify peaks/valleys

3. **Resource Utilization Heatmap**
   - Visual grid by resource
   - Color intensity = utilization %
   - Quickly spot issues

**Using Trends for Proactive Management:**

1. **Spot Trends Early**
   - Rising cycle time → Investigate
   - Dropping throughput → Add capacity
   - Utilization spike → Rebalance

2. **Compare to Baselines**
   - Deviation from normal
   - Set tolerance bands
   - Alert on anomalies

3. **Plan Interventions**
   - Use trends to predict issues
   - Act before critical
   - Prevent SLA breaches

### Best Practices

**1. Set Meaningful Thresholds**
- Based on historical data
- Allow for normal variance
- Avoid alert fatigue

**2. Prioritize Alerts**
- Not everything is high severity
- Focus on business impact
- Escalate appropriately

**3. Act on Alerts**
- Don't just acknowledge
- Investigate root causes
- Implement fixes

**4. Review Regularly**
- Check monitoring dashboard daily
- Analyze alert patterns
- Refine rules continuously

**5. Automate Responses**
- For common issues
- Reduce manual intervention
- Faster resolution

---

## Advanced Reporting

Generate comprehensive reports for stakeholders and analysis.

### Report Types

**1. Executive Summary Report**
- High-level overview
- Key metrics and KPIs
- Trend analysis
- Recommendations
- **Format**: PDF, PowerPoint
- **Audience**: Executives, management

**2. Detailed Process Report**
- Complete process analysis
- All metrics and charts
- Conformance results
- Performance breakdown
- **Format**: PDF, Excel
- **Audience**: Process analysts, managers

**3. Compliance Report**
- Conformance checking results
- Violation details
- Audit trail
- Remediation actions
- **Format**: PDF
- **Audience**: Compliance, auditors

**4. Resource Utilization Report**
- Resource performance metrics
- Workload distribution
- Efficiency analysis
- Capacity planning
- **Format**: Excel, PDF
- **Audience**: Resource managers, HR

**5. Custom Report**
- User-defined sections
- Selected metrics
- Flexible format
- **Audience**: Various stakeholders

### Generating Reports

**Step-by-Step:**

**Step 1: Select Report Type**
1. Navigate to **Reports** page
2. Click **"Generate New Report"**
3. Choose report type from dropdown
4. Click "Next"

**Step 2: Configure Parameters**

1. **Date Range**
   - Select start and end dates
   - Or use presets (Last Week, Last Month, etc.)
   - Ensure sufficient data

2. **Processes**
   - Select which processes to include
   - Can choose multiple
   - Or "All Processes"

3. **Metrics**
   - Check boxes for included metrics
   - Default selections provided
   - Customize as needed

4. **Format**
   - PDF: Best for sharing, printing
   - Excel: Best for further analysis
   - PowerPoint: Best for presentations

**Step 3: Customize Layout** (optional)

1. **Cover Page**
   - Add company logo
   - Custom title
   - Date and author

2. **Sections**
   - Reorder sections
   - Show/hide specific charts
   - Add custom text

3. **Branding**
   - Color scheme
   - Header/footer
   - Watermark

**Step 4: Generate**

1. Click "Generate Report"
2. Processing time: 30-120 seconds
3. Progress bar shows status
4. Download link appears when ready

**Step 5: Download & Share**

1. Click "Download" button
2. File saved to your device
3. Options to:
   - Email directly from platform
   - Share via link (requires login)
   - Schedule recurring generation

### Scheduled Reports

**Automating Report Generation:**

**Step 1: Create Schedule**

1. Reports → "Scheduled Reports"
2. Click "New Schedule"
3. Select report type
4. Configure parameters (same as manual)

**Step 2: Set Frequency**

Options:
- Daily
- Weekly (choose day)
- Monthly (choose date)
- Quarterly
- Custom (cron expression)

**Step 3: Distribution**

1. **Email Recipients**
   - Add email addresses
   - Internal users auto-complete
   - External emails supported

2. **Email Template**
   - Subject line
   - Body message
   - Attachment options

3. **Delivery Time**
   - Select time of day
   - Consider recipient time zones
   - Avoid weekends if desired

**Step 4: Activate**

1. Review configuration
2. Click "Activate Schedule"
3. First report generated at next scheduled time
4. Monitor from schedule list

**Managing Schedules:**

- **Edit**: Modify parameters
- **Pause**: Temporarily disable
- **Delete**: Permanently remove
- **Test**: Generate immediately

### Export Formats

**PDF Reports:**

**Features:**
- Professional formatting
- Charts embedded as vectors
- Table of contents
- Page numbers
- Headers/footers

**Best For:**
- Executive presentations
- Formal documentation
- Archiving
- Printing

**Customization:**
- Page size (A4, Letter)
- Orientation (Portrait, Landscape)
- Margins
- Font size

**Excel Reports:**

**Features:**
- Multiple sheets (one per section)
- Raw data tables
- Pivot-ready format
- Formulas included
- Charts as objects

**Best For:**
- Further analysis
- Data manipulation
- Custom visualizations
- Integration with other systems

**Sheets Included:**
- Summary (KPIs)
- Process Data
- Resource Data
- Performance Metrics
- Conformance Results

**PowerPoint Reports:**

**Features:**
- One slide per metric
- Charts pre-formatted
- Editable content
- Branded templates
- Speaker notes

**Best For:**
- Stakeholder presentations
- Board meetings
- Client reviews
- Training sessions

**Customization:**
- Template selection
- Color scheme
- Slide order
- Notes inclusion

### Report Templates

**Using Templates:**

**Step 1: Access Templates**
1. Reports → "Templates"
2. View available templates
3. Preview before using

**Step 2: Select Template**
1. Click template name
2. Review included sections
3. Click "Use Template"

**Step 3: Customize**
1. Modify sections if needed
2. Adjust parameters
3. Save as new template (optional)

**Creating Custom Templates:**

**Step 1: Start from Scratch or Copy**
1. Click "New Template"
2. Or duplicate existing template

**Step 2: Define Sections**
1. Add section
2. Select metric/chart
3. Configure display options
4. Set order

**Step 3: Set Defaults**
1. Default date range
2. Default processes
3. Default format
4. Save template

**Step 4: Share Template** (optional)
1. Make available to team
2. Set permissions
3. Version control

### Best Practices

**1. Define Audience**
- Tailor content to reader
- Executives need summary
- Analysts need details

**2. Regular Cadence**
- Weekly for tactical reports
- Monthly for strategic
- Quarterly for board-level

**3. Actionable Insights**
- Don't just show data
- Highlight key findings
- Include recommendations

**4. Consistent Format**
- Use templates
- Maintain branding
- Easy comparison over time

**5. Validate Data**
- Spot-check numbers
- Ensure date ranges correct
- Verify calculations

**6. Distribute Timely**
- Send when stakeholders need it
- Consider decision cycles
- Don't delay unnecessarily

---

## Cost Analysis & ROI Calculator

Analyze process costs and calculate return on investment for improvements.

### Understanding Cost Metrics

**Cost Components:**

1. **Labor Costs**
   - Resource time × hourly rate
   - Calculated per activity
   - Aggregated per case

2. **System Costs**
   - IT infrastructure
   - Software licenses
   - Maintenance

3. **Overhead Costs**
   - Facilities
   - Administration
   - Support functions

4. **Delay Costs**
   - SLA penalties
   - Lost opportunities
   - Customer dissatisfaction

### Setting Up Cost Parameters

**Step 1: Define Resource Costs**

1. Navigate to **Settings → Cost Configuration**
2. Click **"Resource Rates"**
3. For each resource:
   - Enter hourly rate
   - Or annual salary (auto-calculates hourly)
   - Set currency
   - Save

**Step 2: Configure Activity Costs**

1. Settings → Cost Configuration → "Activity Costs"
2. For each activity:
   - System cost (if applicable)
   - Fixed cost per execution
   - Variable costs
   - Save

**Step 3: Set Overhead Rate**

1. Enter overhead percentage
2. Applied to labor costs
3. Typical range: 20-40%
4. Save configuration

### Viewing Cost Analysis

**Cost Analysis Dashboard:**

**1. Total Process Cost**
- Sum of all cost components
- Per case average
- Total for time period
- Trend over time

**2. Cost Breakdown Chart**
- Pie chart by cost type
- Shows largest contributors
- Click to drill down

**3. Cost per Activity**
- Table listing all activities
- Cost per execution
- Total cost (frequency × unit cost)
- Percentage of total

**4. Resource Cost Analysis**
- Cost per resource
- Utilization vs. cost
- Efficiency metrics
- Optimization opportunities

**How to Use:**

1. **Identify High-Cost Activities**
   - Sort by total cost
   - Focus on top 20%
   - These are optimization targets

2. **Analyze Cost Trends**
   - Is cost increasing?
   - Seasonal patterns?
   - Unexpected spikes?

3. **Compare to Value**
   - Cost per case vs. revenue
   - Profit margin analysis
   - Value-add activities

### ROI Calculator

**Calculating ROI for Improvements:**

**Step 1: Access ROI Calculator**
1. Navigate to **Cost Analysis** page
2. Click **"ROI Calculator"** tab
3. Click "New ROI Analysis"

**Step 2: Define Baseline**

System auto-populates:
- Current process cost
- Current cycle time
- Current throughput
- Current error rate

**Step 3: Define Improvement Scenario**

Enter expected improvements:

1. **Cycle Time Reduction**
   - Percentage or absolute reduction
   - Example: 20% faster

2. **Cost Reduction**
   - Labor savings
   - System cost reduction
   - Example: 15% lower cost

3. **Throughput Increase**
   - More cases processed
   - Example: 25% higher volume

4. **Quality Improvement**
   - Error rate reduction
   - Rework elimination
   - Example: 50% fewer errors

**Step 4: Enter Investment Costs**

1. **One-Time Costs**
   - Software purchase
   - Implementation services
   - Training
   - Hardware

2. **Recurring Costs**
   - Annual licenses
   - Maintenance
   - Support

**Step 5: Calculate ROI**

Click "Calculate ROI"

System computes:

1. **Annual Savings**
   - Labor cost savings
   - Efficiency gains
   - Quality improvements
   - Total annual benefit

2. **Payback Period**
   - Time to recover investment
   - Measured in months
   - Shorter is better

3. **ROI Percentage**
   - (Total Benefits - Total Costs) / Total Costs × 100
   - Calculated over 1, 3, and 5 years
   - Higher is better

4. **Net Present Value (NPV)**
   - Present value of future benefits
   - Considers time value of money
   - Positive NPV = good investment

**Step 6: Review Results**

**Results Dashboard:**

1. **Summary Metrics Card**
   - ROI percentage
   - Payback period
   - NPV
   - Break-even date

2. **Savings Breakdown Chart**
   - Visualize savings by category
   - Compare to investment
   - Year-over-year view

3. **Cash Flow Chart**
   - Cumulative cash flow over time
   - Shows when payback occurs
   - Includes ongoing costs

4. **Sensitivity Analysis** (optional)
   - Test different assumptions
   - Best/worst case scenarios
   - Risk assessment

**Step 7: Generate Business Case**

1. Click "Generate Business Case"
2. Creates comprehensive document:
   - Executive summary
   - Financial analysis
   - Risk assessment
   - Implementation plan
   - Approval sign-off
3. Export as PDF
4. Share with stakeholders

### Priority Scoring

**Automated Prioritization:**

For each improvement opportunity:

1. **Impact Score** (0-100)
   - Based on potential savings
   - Higher = greater benefit

2. **Effort Score** (0-100)
   - Implementation difficulty
   - Lower = easier to implement

3. **Priority Score** (0-100)
   - Formula: (Impact × 2 + (100 - Effort)) / 3
   - Balances benefit vs. effort
   - Higher = higher priority

**Using Priority Scores:**

1. **Sort Opportunities**
   - By priority score (high to low)
   - Focus on top items first

2. **Create Roadmap**
   - Quick wins (high priority, low effort)
   - Strategic (high priority, high effort)
   - Fill-in (medium priority)
   - Defer (low priority)

3. **Track Progress**
   - Mark as "In Progress"
   - Update status
   - Measure actual ROI

### Best Practices

**1. Accurate Cost Data**
- Use real hourly rates
- Include all cost components
- Update regularly

**2. Conservative Estimates**
- Don't over-promise benefits
- Use realistic improvement percentages
- Include risk buffer

**3. Consider All Costs**
- Implementation effort
- Training time
- Change management
- Ongoing maintenance

**4. Track Actual Results**
- Compare to projections
- Adjust future estimates
- Learn from experience

**5. Regular Review**
- Quarterly cost analysis
- Annual ROI review
- Update cost parameters

---

## AI Process Assistant

Chat with an AI assistant to get insights about your processes.

### Accessing the AI Assistant

1. Click the **chat icon** in the bottom-right corner
2. Or navigate to **AI Assistant** page
3. Chat interface opens

### Configuring AI Provider

**Multiple LLM Options:**

1. **Replit AI** (Default)
   - Pre-configured
   - No API key needed
   - Fast responses
   - Good for general queries

2. **OpenAI GPT-4**
   - High quality responses
   - Requires API key
   - Good for complex analysis

3. **Mistral AI**
   - Cost-effective
   - European data residency
   - Fast inference

4. **DeepSeek**
   - Specialized in coding
   - Good for technical queries

5. **Groq**
   - Ultra-fast inference
   - Limited context window

6. **Together AI**
   - Multiple model options
   - Flexible pricing

**Configuring Provider:**

**Step 1: Access Settings**
1. Settings → AI Configuration
2. Or click gear icon in chat

**Step 2: Select Provider**
1. Choose from dropdown
2. Each shows:
   - Description
   - Cost per million tokens
   - Latency
   - Context window

**Step 3: Enter API Key** (if required)

1. Click "Add API Key"
2. Enter your API key
   - Get from provider's website
   - See platform documentation
3. Key is encrypted and stored securely
4. Click "Save"

**Step 4: Test Connection**
1. Click "Test"
2. Sends test query
3. Verifies API key works
4. Shows response time

**Step 5: Set as Default** (optional)
1. Toggle "Use as default"
2. Applied to all future chats
3. Can override per conversation

### Using the AI Assistant

**Types of Questions You Can Ask:**

1. **Process Overview**
   - "Summarize the Order to Cash process"
   - "What are the main activities in process X?"
   - "How many cases were processed last month?"

2. **Performance Analysis**
   - "Why is the cycle time increasing?"
   - "Which activities are bottlenecks?"
   - "How can I improve throughput?"

3. **Conformance Issues**
   - "What are the most common violations?"
   - "Why is fitness score low?"
   - "How can I fix conformance issues?"

4. **Automation Opportunities**
   - "Which tasks should I automate first?"
   - "What's the ROI of automating activity X?"
   - "Suggest automation tools for my process"

5. **Predictive Insights**
   - "Will we meet SLA targets next month?"
   - "What's the forecasted cycle time?"
   - "Predict resource needs for next quarter"

6. **Troubleshooting**
   - "Why did case ID 12345 fail?"
   - "Explain the anomaly on January 15th"
   - "How to resolve this error?"

**Best Practices for Questions:**

1. **Be Specific**
   - Include process name
   - Specify time periods
   - Reference specific metrics

2. **Provide Context**
   - Mention what you've already tried
   - Explain your goal
   - Share constraints

3. **Ask Follow-Ups**
   - Drill deeper into responses
   - Request clarification
   - Ask for examples

**Example Conversation:**

```
User: What's slowing down my Order Processing?

AI: Based on analysis of your Order Processing workflow, 
the primary bottleneck is the "Credit Check" activity, 
which has an average wait time of 4.2 hours. This 
accounts for 62% of total cycle time delay.

Recommendations:
1. Automate credit checks for orders under $500
2. Add one additional credit analyst
3. Implement priority queuing for high-value orders

Would you like me to calculate the ROI for these 
improvements?

User: Yes, calculate ROI for option 1

AI: [Performs calculation and presents detailed ROI 
analysis...]
```

### Conversation Features

**1. Context Awareness**
- AI remembers conversation history
- References previous questions
- Builds on prior context
- Reset with "New Conversation"

**2. Data Access**
- AI can query your actual process data
- Real-time analysis
- Accurate metrics
- No hallucinations

**3. Visualizations**
- AI can generate charts
- Inline display in chat
- Clickable to expand
- Export options

**4. Actionable Suggestions**
- Not just insights
- Specific recommendations
- Implementation guidance
- Links to relevant features

**5. Source Citations**
- References data sources
- Links to related analyses
- Verifiable claims
- Transparent reasoning

### Managing Conversations

**Conversation History:**

1. **View Past Chats**
   - All conversations saved
   - Searchable by keyword
   - Organized by date
   - Click to resume

2. **Star Important Chats**
   - Mark as favorite
   - Quick access
   - Don't get archived

3. **Share Conversations**
   - Generate shareable link
   - Recipients can view (read-only)
   - Or export as PDF

4. **Delete Conversations**
   - Remove from history
   - Permanent deletion
   - Data privacy compliance

### Advanced Features

**1. Process Comparison**
```
User: Compare Process A vs Process B in terms of 
efficiency

AI: [Analyzes both processes and presents comparative 
metrics, highlights key differences, and suggests best 
practices to adopt]
```

**2. Root Cause Analysis**
```
User: Why is conformance fitness dropping?

AI: [Investigates recent changes, identifies new 
violation patterns, traces to root cause, suggests 
remediation]
```

**3. Scenario Planning**
```
User: What happens if I add 2 more resources?

AI: [Runs simulation, predicts impact on cycle time, 
throughput, cost, presents trade-offs]
```

**4. Learning from Data**
```
User: What patterns do you see in failed cases?

AI: [Applies ML pattern detection, identifies common 
characteristics, suggests preventive measures]
```

### Privacy & Security

**Data Handling:**
- Conversations encrypted in transit
- No data sent to AI provider without permission
- API keys stored encrypted
- User data never used for AI training
- GDPR compliant

**Access Control:**
- Conversations private to user
- Sharing requires explicit action
- Admins can set usage policies
- Audit logs maintained

### Best Practices

**1. Start Broad, Then Drill Down**
- Begin with overview questions
- Use AI's insights to guide deeper questions
- Build understanding progressively

**2. Verify Critical Insights**
- AI is very accurate but check important findings
- Cross-reference with raw data
- Use AI as assistant, not replacement for judgment

**3. Leverage for Learning**
- Ask "why" and "how"
- Request explanations
- Build process mining expertise

**4. Combine with Platform Features**
- AI suggests, you execute
- Use AI to navigate to relevant pages
- Seamless workflow integration

**5. Provide Feedback**
- Thumbs up/down on responses
- Report inaccuracies
- Suggest improvements
- Helps improve AI over time

---

## Collaboration Features

Work together with your team on process analysis and improvements.

### Process Comments

**Adding Comments:**

**Step 1: Navigate to Process**
1. Go to any process analysis page
2. Scroll to specific section you want to comment on
3. Click "Add Comment" button
   - Or hover over chart/metric and click comment icon

**Step 2: Write Comment**
1. Type your comment in the text box
2. Use formatting if needed:
   - **Bold**: `**text**`
   - *Italic*: `*text*`
   - Links: Paste URL
3. Add context if helpful

**Step 3: @Mention Team Members** (optional)

1. Type `@` to trigger mention
2. Start typing name
3. Select from dropdown
4. User receives notification

**Step 4: Post Comment**
1. Click "Post"
2. Comment appears with timestamp
3. Mentioned users notified
4. Email sent (if enabled)

**Viewing Comments:**

1. **Comment Indicators**
   - Blue dot on charts with comments
   - Number shows comment count
   - Click to expand

2. **Comment Thread**
   - All comments shown chronologically
   - Replies indented
   - Expand/collapse threads

3. **Filter Comments**
   - By author
   - By date
   - Unresolved only
   - My mentions

### Threaded Replies

**Replying to Comments:**

1. **Click "Reply" on existing comment**
2. Write your response
3. Can @mention others in reply
4. Post reply

**How Threads Work:**

- Replies nested under parent comment
- Visual indentation shows hierarchy
- Notifications to original commenter
- Keep discussions organized

**Best Practices:**

- Reply to relevant comment (don't create new top-level)
- Be specific in responses
- Use @mentions to bring in experts
- Mark resolved when issue fixed

### Real-Time Updates

**Live Collaboration:**

**1. Presence Indicators**
- See who else is viewing the page
- Avatar icons show active users
- Hover to see names

**2. Instant Comment Updates**
- New comments appear immediately
- No page refresh needed
- Real-time notifications

**3. Edit History**
- Track who changed what
- View previous versions
- Revert if needed

**4. Concurrent Editing**
- Multiple users can comment simultaneously
- No conflicts
- All changes synced

### Notifications

**Notification Types:**

1. **Mentions**
   - Someone @mentioned you
   - High priority
   - Includes comment context

2. **Replies**
   - Response to your comment
   - Medium priority
   - Links to thread

3. **Updates**
   - Changes to processes you follow
   - Low priority
   - Digest available

**Managing Notifications:**

**Step 1: Notification Center**
1. Click bell icon in header
2. Shows all notifications
3. Unread count badge
4. Mark as read/unread

**Step 2: Configure Preferences**

Settings → Notifications

1. **In-App Notifications**
   - Enable/disable
   - Sound alerts
   - Desktop notifications (browser permission required)

2. **Email Notifications**
   - Immediate
   - Daily digest
   - Weekly summary
   - Disable

3. **Notification Filters**
   - Only mentions
   - All activity
   - Specific processes
   - Custom rules

**Step 3: Manage Subscriptions**

1. **Auto-Subscribe**
   - Processes you create
   - Processes you comment on
   - Can disable in settings

2. **Manual Subscribe**
   - Click "Follow" on any process
   - Receive updates
   - Unfollow anytime

### Resolving Comments

**Marking Comments as Resolved:**

**When to Resolve:**
- Issue has been addressed
- Question has been answered
- Action has been completed
- Discussion is concluded

**How to Resolve:**

1. Click "Resolve" button on comment
2. Optionally add resolution note
3. Comment marked as resolved
4. Moves to "Resolved" section

**Viewing Resolved Comments:**

1. Toggle "Show Resolved"
2. Appears with strikethrough
3. Can unresolve if needed
4. Full history preserved

### Team Collaboration Best Practices

**1. Use @Mentions Wisely**
- Mention specific people who can help
- Don't overuse (notification fatigue)
- Provide context in mention

**2. Organize Discussions**
- Use threaded replies
- Keep related comments together
- Resolve when done

**3. Be Descriptive**
- Explain what you're seeing
- Include relevant metrics
- Link to related analyses

**4. Follow Up**
- Respond to questions
- Update on action items
- Close the loop

**5. Regular Reviews**
- Weekly team review of comments
- Address unresolved items
- Archive old discussions

### Sharing Analysis

**Sharing Process Views:**

**Step 1: Generate Shareable Link**
1. Navigate to analysis page
2. Click "Share" button
3. Select "Copy Link"
4. URL copied to clipboard

**Step 2: Configure Access** (optional)

1. Click "Share Settings"
2. Choose access level:
   - **Anyone with link** (requires login)
   - **Specific users** (enter emails)
   - **Team only** (organization members)
3. Set expiration date (optional)
4. Save settings

**Step 3: Share Link**
1. Paste in email, chat, etc.
2. Recipients click link
3. Must have account to view
4. Same view you're seeing

**Deep Linking:**

Share specific:
- Process + analysis type
- Date range
- Filter settings
- Comment thread

Recipients see exactly what you see.

**Embedding** (Enterprise only):

1. Generate embed code
2. Paste in internal portal
3. Live updates
4. Interactive charts

---

## Custom KPI Builder

Create your own key performance indicators tailored to your business needs.

### Understanding Custom KPIs

**What Are Custom KPIs:**
- User-defined metrics
- Calculated from process data
- Tracked over time
- Alert-capable

**Examples:**
- "% of orders delivered on time"
- "Average cost per acquisition"
- "Customer satisfaction score"
- "First-time resolution rate"

### Creating a Custom KPI

**Step-by-Step:**

**Step 1: Access KPI Builder**
1. Navigate to **Custom KPIs** page
2. Click **"Create New KPI"**
3. KPI builder opens

**Step 2: Define KPI Basics**

1. **KPI Name**
   - Descriptive and clear
   - Example: "On-Time Delivery Rate"

2. **Description**
   - What it measures
   - Why it's important
   - How it's used

3. **Category**
   - Performance
   - Quality
   - Cost
   - Customer
   - Custom

**Step 3: Define Calculation**

**Metric Type:**

1. **Count**
   - Number of cases meeting criteria
   - Example: "Cases completed in < 24 hours"

2. **Percentage**
   - Ratio of two counts × 100
   - Example: "% of cases without errors"

3. **Average**
   - Mean of a numeric attribute
   - Example: "Average customer rating"

4. **Sum**
   - Total of values
   - Example: "Total revenue processed"

5. **Custom Formula**
   - Write your own expression
   - Supports basic math operators
   - Access to data fields

**Filter Criteria:**

1. **Click "Add Filter"**
2. Select field (Activity, Resource, Attribute, etc.)
3. Choose operator (=, !=, >, <, contains, etc.)
4. Enter value
5. Can add multiple filters (AND/OR logic)

**Example: On-Time Delivery Rate**

```
Metric Type: Percentage
Numerator: Count of cases where "Delivery Time" <= "Due Date"
Denominator: Count of all cases
Filters: 
  - Activity = "Order Delivered"
  - Date >= Start of Month
```

**Step 4: Set Target & Thresholds**

1. **Target Value**
   - Desired KPI value
   - Example: 95% for on-time delivery

2. **Warning Threshold**
   - When to show yellow indicator
   - Example: 90%

3. **Critical Threshold**
   - When to show red indicator
   - Example: 85%

**Step 5: Configure Display**

1. **Chart Type**
   - Line (trend over time)
   - Bar (comparison)
   - Gauge (current value vs. target)
   - Number (simple display)

2. **Update Frequency**
   - Real-time
   - Hourly
   - Daily
   - Weekly

3. **Decimal Places**
   - Precision level
   - Example: 2 for percentages

**Step 6: Save KPI**
1. Click "Save"
2. KPI appears in dashboard
3. Calculation starts immediately

### Viewing Custom KPIs

**KPI Dashboard:**

1. **Navigate to Custom KPIs page**
2. All your KPIs displayed as cards
3. Each card shows:
   - KPI name
   - Current value
   - Target value
   - Status indicator (green/yellow/red)
   - Trend arrow (up/down/flat)
   - Mini chart

4. **Click card to drill down**
   - Full-size chart
   - Historical data
   - Contributing factors
   - Related processes

### Alert Configuration

**Setting Up KPI Alerts:**

**Step 1: Edit KPI**
1. Click KPI card
2. Click "Configure Alerts"

**Step 2: Define Alert Trigger**

1. **Condition**
   - KPI value < threshold
   - KPI value > threshold
   - Trend declining
   - Target not met

2. **Duration**
   - Immediate
   - After X consecutive periods
   - Prevents false alarms

**Step 3: Set Recipients**

1. **Who to notify:**
   - Select users
   - Distribution lists
   - Webhook URL

2. **Notification method:**
   - Email
   - In-app
   - SMS (if configured)

**Step 4: Configure Message**

1. **Subject line**
   - Include KPI name
   - Indicate severity

2. **Message template**
   - Use variables: {{kpi_name}}, {{value}}, {{threshold}}
   - Add context
   - Include action items

**Example Alert:**
```
Subject: [ALERT] On-Time Delivery Rate below target

Message:
The On-Time Delivery Rate has fallen to {{value}}%, 
which is below the warning threshold of {{threshold}}%.

Current Status: {{value}}%
Target: {{target}}%
Trend: {{trend}}

Recommended Actions:
1. Review recent delivery exceptions
2. Check resource availability
3. Analyze common delay causes

View Details: {{link}}
```

**Step 5: Test Alert**
1. Click "Send Test Alert"
2. Verify receipt
3. Check formatting
4. Activate alert

### Managing Alerts

**Alert Dashboard:**

1. **View All Active Alerts**
   - Settings → Alerts
   - Shows all KPI alerts
   - Status (active/paused)

2. **Acknowledge Alerts**
   - Mark as "Acknowledged"
   - Add notes on actions taken
   - Stops repeat notifications

3. **Snooze Alerts**
   - Temporarily pause
   - Set snooze duration
   - Auto-reactivates

4. **Resolve Alerts**
   - Mark as "Resolved"
   - Document resolution
   - Alert clears

**Alert History:**

1. **View Past Alerts**
   - All triggered alerts logged
   - Filter by KPI, date, severity
   - Shows resolution status

2. **Analyze Patterns**
   - Frequency of alerts
   - Common triggers
   - Response times

3. **Tune Thresholds**
   - If too many alerts, adjust thresholds
   - If missing issues, tighten thresholds
   - Balance sensitivity vs. noise

### Best Practices

**1. Start with Key Metrics**
- Don't create too many KPIs
- Focus on business-critical metrics
- Quality over quantity

**2. Align with Goals**
- KPIs should support strategic objectives
- Tie to business outcomes
- Make them actionable

**3. Set Realistic Targets**
- Based on historical data
- Achievable but challenging
- Review and adjust quarterly

**4. Regular Review**
- Weekly check of KPI dashboard
- Monthly deep-dive analysis
- Quarterly KPI portfolio review

**5. Act on Alerts**
- Don't just acknowledge
- Investigate root causes
- Implement improvements

**6. Share with Team**
- Make KPIs visible
- Include in meetings
- Celebrate wins

**7. Evolve Over Time**
- Retire obsolete KPIs
- Add new ones as needed
- Refine calculations

---

## Multi-Tenant Administration

EPI-Q is a multi-tenant SaaS platform with enterprise-grade administration capabilities. This section covers organization management, support ticketing, subscription management, and pricing information.

### Understanding Roles & Permissions

**Role Legend:**
- 🔴 **Super Admin**: Platform-wide access across all organizations (SaaS provider administrators)
- 🟡 **Admin**: Organization-level management (company administrators)
- 🟢 **Employee**: Standard user access within their organization

**Data Isolation:**
All data is strictly isolated by organization. Users can only access data belonging to their organization, ensuring complete tenant separation and data security.

---

### Organizations Dashboard (Super Admin Only)

**Purpose:**
The Organizations Dashboard provides platform-wide management of all tenant organizations. This is the central hub for Super Admins to monitor, create, and manage client organizations.

**Access:** 🔴 Super Admin only

**Accessing the Dashboard:**
1. Log in with Super Admin credentials
2. Navigate to **Organizations** in the sidebar (visible only to Super Admins)
3. View the comprehensive organizations management interface

#### Key Features

**1. Platform Statistics**

**Metrics Cards Display:**
- **Total Organizations**: Number of active tenant organizations
- **Active Subscriptions**: Organizations with paid plans
- **Total Users**: Platform-wide user count
- **Monthly Recurring Revenue (MRR)**: Total subscription revenue

**How to Use:**
- Monitor platform growth at a glance
- Track subscription conversion rates
- Identify revenue trends
- Click cards to drill down into details

**2. Organization Management Table**

**Table Columns:**
- **Organization Name**: Company/tenant name
- **Status**: Active, Suspended, Trial
- **Subscription Plan**: Free, Pro, Enterprise
- **Users**: Number of users in the organization
- **Created Date**: When organization was created
- **Actions**: Edit, View Details, Suspend/Activate

**Available Actions:**

**Search & Filter:**
1. Use the search bar to find organizations by name
2. Filter by subscription plan using dropdown
3. Filter by status (Active, Suspended, Trial)
4. Sort by any column header

**Create New Organization:**
1. Click **"Create Organization"** button
2. Fill in organization details:
   - Organization Name (required)
   - Contact Email (required)
   - Phone Number (optional)
   - Industry/Domain (optional)
   - Initial subscription plan
3. Click **"Create"**
4. System automatically provisions organization resources
5. Admin user invitation is sent

**Edit Organization:**
1. Click **"Edit"** icon on any organization row
2. Update organization information
3. Change subscription plan if needed
4. Click **"Save Changes"**
5. Changes apply immediately

**View Organization Details:**
1. Click organization name or **"View"** button
2. See complete organization profile:
   - User list and roles
   - Subscription details and history
   - Usage statistics
   - Support tickets
   - Billing history
3. Perform quick actions from detail view

**Suspend/Activate Organization:**
1. Click **"Suspend"** for active organizations
2. Confirm suspension (users will lose access)
3. Organization data is preserved but inaccessible
4. Click **"Activate"** to restore access
5. Use for non-payment or policy violations

**Delete Organization:**

> ⚠️ **CRITICAL WARNING - IRREVERSIBLE ACTION**
> 
> This action will **PERMANENTLY DELETE** all organization data with **NO RECOVERY** possible. This includes:
> - All user accounts and profiles
> - All process data and event logs
> - All support tickets and conversations
> - All analytics and reports
> - All subscription and billing history
> - All custom configurations
> 
> **This cannot be undone. Data is permanently destroyed.**
> 
> **Use only for**:
> - Demonstration or test accounts
> - Explicit client deletion requests (with written confirmation)
> - Compliance with data deletion regulations (GDPR Right to Erasure)
> 
> **Before deleting**:
> - Export all data for backup
> - Notify organization admin
> - Document reason for deletion
> - Get written approval from authorized personnel

**Steps to Delete:**
1. Click **"Delete"** icon on organization row
2. Read and understand the warning message
3. Type the exact organization name to confirm: `<Organization Name>`
4. Click **"Permanently Delete Organization"**
5. All organization data is immediately and permanently removed
6. Deletion is logged in audit trail

#### Best Practices & Tips

**Organization Management:**
- Regularly review organization status and subscription alignment
- Monitor organizations nearing their user seat limits
- Proactively reach out to trial organizations before expiry
- Document suspension reasons in notes

**Security & Compliance:**
- Audit organization access patterns regularly
- Review user distributions across organizations
- Ensure proper data isolation boundaries
- Maintain organization contact information current

**Revenue Optimization:**
- Track conversion from trial to paid plans
- Identify organizations ready for plan upgrades
- Monitor MRR trends monthly
- Address churned subscriptions quickly

---

### Support Tickets

**Purpose:**
The Support Ticket system enables structured customer support and issue tracking with full conversation threading, file attachments, and SLA management.

**Access:** 🟢 All Roles (organization-scoped)

**How It Works:**
- Users can create support tickets for issues or questions
- Tickets are visible only within the user's organization
- Admins and Super Admins have enhanced management capabilities
- Complete audit trail of all ticket activities

**Accessing Support Tickets:**
1. Navigate to **Support Tickets** in the sidebar
2. View all tickets for your organization
3. Filter, search, and manage tickets

#### Creating a Support Ticket

**Step-by-Step:**

1. **Click "Create Ticket"**
   - Located at top-right of tickets page
   - Opens ticket creation dialog

2. **Fill in Ticket Details**
   - **Subject** (required): Brief description of the issue
   - **Category**: Select from predefined categories
     - Technical Issue
     - Feature Request
     - Billing Question
     - General Inquiry
     - Bug Report
     - Performance Issue
   - **Priority**: Select urgency level
     - 🔴 Critical: System down, blocking issue
     - 🟡 High: Major functionality impaired
     - 🔵 Medium: Non-critical issue
     - ⚪ Low: Question or minor issue
   - **Description**: Detailed explanation of the issue
     - What happened?
     - What were you trying to do?
     - What did you expect to happen?
     - Steps to reproduce (for bugs)

3. **Attach Files (Optional)**
   - Click "Attach Files"
   - Supported formats: images, PDFs, logs, CSV
   - Max file size: 10MB per file
   - Up to 5 files per ticket

4. **Submit Ticket**
   - Click **"Create Ticket"**
   - Ticket number is automatically generated
   - Email notification sent to support team
   - You'll be redirected to ticket view

#### Managing Support Tickets

**Ticket List View:**

**Filter Options:**
1. **By Status**:
   - Open: Active tickets awaiting response
   - In Progress: Being actively worked on
   - Waiting: Awaiting customer response
   - Resolved: Issue fixed, awaiting confirmation
   - Closed: Ticket completed

2. **By Priority**:
   - Filter by Critical, High, Medium, Low
   - Quickly identify urgent issues

3. **By Category**:
   - Filter by ticket type
   - Find similar issues

**Search:**
- Search by ticket number (#TICKET-001)
- Search by subject or description keywords
- Real-time search results

**Ticket Cards Display:**
- **Ticket Number**: Unique identifier
- **Subject**: Issue summary
- **Status Badge**: Color-coded current status
- **Priority Badge**: Urgency indicator
- **Category**: Issue type
- **Created Date**: When ticket was opened
- **Last Updated**: Most recent activity
- **Message Count**: Number of conversation messages

#### Ticket Conversation & Resolution

**Viewing Ticket Details:**
1. Click on any ticket card
2. Opens full ticket view with:
   - Complete ticket information
   - Full conversation thread
   - All attachments
   - Activity history
   - Status and priority controls

**Adding Messages:**
1. Scroll to **"Add Message"** section
2. Type your message or question
3. Attach files if needed
4. Click **"Send Message"**
5. Support team receives notification
6. Conversation thread updates in real-time

**Updating Ticket Status (Admin/Super Admin):**
1. Click **"Update Status"** dropdown
2. Select new status:
   - Open → In Progress (when starting work)
   - In Progress → Waiting (need customer input)
   - Waiting → In Progress (customer responded)
   - In Progress → Resolved (issue fixed)
   - Resolved → Closed (customer confirmed)
3. Add internal note if needed
4. Click **"Update"**
5. Status change is logged in activity history

**Changing Priority (Admin/Super Admin):**
1. Click **"Change Priority"**
2. Select new priority level
3. Provide reason for change
4. Click **"Save"**
5. Escalation notifications sent if priority increased

**Closing Tickets:**
1. **Customer Closes**:
   - Click **"Close Ticket"** button
   - Confirm resolution satisfaction
   - Ticket marked as Closed

2. **Admin Closes**:
   - Update status to Resolved first
   - Wait for customer confirmation (24-48 hours)
   - If no objection, mark as Closed
   - Or customer can explicitly close

#### SLA Management & Alerts

**SLA Targets by Priority:**
- **Critical**: 1 hour first response, 4 hours resolution
- **High**: 4 hours first response, 24 hours resolution
- **Medium**: 8 hours first response, 48 hours resolution
- **Low**: 24 hours first response, 5 days resolution

**SLA Indicators:**
- ✅ Green: Within SLA
- ⚠️ Yellow: Approaching SLA deadline (80% of time elapsed)
- 🚨 Red: SLA breached

**Automated Alerts:**
- Email sent when SLA approaches (80%)
- Urgent notification if SLA is breached
- Escalation to managers for critical SLA violations

#### Best Practices & Tips

**Creating Effective Tickets:**
- Use clear, descriptive subjects
- Provide detailed reproduction steps
- Include screenshots or screen recordings
- Attach relevant error logs
- Select accurate priority (don't inflate)

**Communication:**
- Respond promptly to support team questions
- Provide requested information completely
- Be specific about what's not working
- Update ticket if issue changes

**Ticket Management:**
- Close resolved tickets promptly
- Search for similar tickets before creating new ones
- Follow up if no response within SLA
- Provide feedback on resolution quality

---

### Subscription Management

**Purpose:**
Manage your organization's subscription plan, view usage, track billing history, and upgrade/downgrade plans.

**Access:** 🟡 Admin & 🔴 Super Admin (organization owners)

**Accessing Subscriptions:**
1. Navigate to **Subscription** in the sidebar
2. View your organization's subscription dashboard

#### Subscription Dashboard

**Current Plan Overview:**

**Plan Information Card:**
- **Plan Name**: Free, Pro, or Enterprise
- **Status**: Active, Trial, Cancelled, Expired
- **Billing Cycle**: Monthly or Annual
- **Next Billing Date**: When next charge occurs
- **Amount**: Current subscription cost

**Plan Features:**
- ✅ Process Discovery & Conformance
- ✅ Performance Analytics
- ✅ Real-Time Monitoring
- ✅ Basic Reporting
- ✅ (Pro/Enterprise) Advanced Predictive Analytics
- ✅ (Pro/Enterprise) Digital Twin Simulation
- ✅ (Pro/Enterprise) AI Process Assistant
- ✅ (Pro/Enterprise) Custom Integrations
- ✅ (Enterprise) Dedicated Support
- ✅ (Enterprise) SLA Guarantees

**Usage Tracking:**

**User Seats:**
- **Current Usage**: X / Y users
- **Included Seats**: Number in your plan
- **Additional Seats**: If over limit
- **Cost per Additional Seat**: Pricing displayed
- **Visual Progress Bar**: Shows usage percentage

**Storage Usage:**
- **Current**: GB used for event logs and documents
- **Limit**: Maximum storage in plan
- **Overage Cost**: If applicable
- **Progress Bar**: Visual indicator

**API Calls:**
- **Current Month**: Number of API requests
- **Limit**: Monthly quota
- **Overage Policy**: Displayed if applicable

**Process Count:**
- **Active Processes**: Number of processes being monitored
- **Limit**: Maximum per plan
- **Upgrade Prompt**: If nearing limit

#### Changing Your Subscription

**Upgrading Your Plan:**

1. **Click "Upgrade Plan"**
2. **Compare Plans** (opens pricing comparison)
3. **Select New Plan**:
   - Choose Pro or Enterprise
   - Select billing cycle (Monthly/Annual)
   - Annual saves 20%
4. **Review Changes**:
   - New features unlocked
   - Price difference
   - Prorated charges (if mid-cycle)
5. **Payment Information**:
   - Update payment method if needed
   - Review billing address
6. **Confirm Upgrade**:
   - Click **"Upgrade Now"**
   - Payment processed immediately
   - New features activate instantly
7. **Confirmation**:
   - Receipt emailed
   - Invoice generated
   - Subscription updated

**Downgrading Your Plan:**

⚠️ **Important**: Downgrading may result in feature loss and data retention limits.

1. **Click "Change Plan"**
2. **Select Lower-Tier Plan**
3. **Review Impact**:
   - Features that will be disabled
   - Data retention changes
   - User seat adjustments needed
4. **Confirm Understanding**:
   - Check acknowledgment boxes
   - Understand data implications
5. **Schedule Downgrade**:
   - Takes effect at end of current billing period
   - Keep current features until then
   - No prorated refund
6. **Confirmation Email Sent**

**Cancelling Subscription:**

> ⚠️ **IMPORTANT: SUBSCRIPTION CANCELLATION NOTICE**
> 
> Cancelling your subscription will result in **IMMEDIATE FEATURE RESTRICTIONS** at the end of your current billing period.
> 
> **What You Will Lose**:
> - ❌ Advanced predictive analytics
> - ❌ Digital twin simulation
> - ❌ AI Process Assistant
> - ❌ Unlimited processes (reduced to 5 max)
> - ❌ Unlimited users (reduced to 3 max)
> - ❌ Priority support (downgraded to community support)
> - ❌ Historical data beyond 30 days
> - ❌ Advanced export formats (PDF, PowerPoint)
> 
> **What Happens**:
> - ✅ Access continues until **current period ends**
> - ✅ Data retained for **90 days** after cancellation
> - ✅ Billing stops at period end
> - ✅ Automatic downgrade to **Free Plan**
> - ⚠️ **No refunds issued** (non-refundable policy)
> 
> **Before Cancelling**:
> - Export important reports and analytics
> - Download all invoices for records
> - Remove excess users if over Free plan limit (3 max)
> - Archive processes if over Free plan limit (5 max)
> - Consider downgrading to a lower plan instead

**Steps to Cancel:**
1. **Click "Cancel Subscription"** button
2. **Provide Feedback** (optional but appreciated):
   - Why are you canceling?
   - What could we improve?
3. **Review Cancellation Impact Summary**:
   - Features that will be disabled
   - Data retention timeline
   - Billing stop date
4. **Confirm Cancellation**:
   - Type your organization name to confirm: `<Organization Name>`
   - Click **"Cancel Subscription"**
5. **Confirmation Sent**:
   - Email confirmation with cancellation date
   - Scheduled downgrade to Free Plan
   - Invoice for final billing period (if applicable)

**After Cancellation**:
- Access maintained until: **[Current period end date]**
- Downgrade occurs on: **[Period end date + 1 day]**
- Data deletion scheduled: **[Period end + 90 days]** (unless you reactivate)

#### Billing History

**Viewing Invoices:**
1. Scroll to **"Billing History"** section
2. View table of all past invoices

**Invoice Details:**
- **Invoice Number**: Unique identifier
- **Date**: Invoice issue date
- **Description**: What was billed
- **Amount**: Total charged
- **Status**: Paid, Pending, Failed, Refunded
- **Actions**: Download PDF, View Details

**Downloading Invoices:**
1. Click **"Download PDF"** for any invoice
2. Professional invoice document generated
3. Includes:
   - Company information
   - Invoice details
   - Line items
   - Payment method
   - Tax information (if applicable)
4. Save for accounting records

**Payment Methods:**
1. Click **"Manage Payment Methods"**
2. View current payment method
3. **Add New Method**:
   - Credit/Debit Card
   - ACH/Bank Transfer (Enterprise)
4. **Update Default Payment**
5. **Remove Old Methods**

#### Subscription Alerts & Notifications

**Payment Alerts:**
- 📧 7 days before renewal
- 📧 Payment successful
- 🚨 Payment failed (with retry information)
- 📧 Subscription expiring soon (for trials)

**Usage Alerts:**
- ⚠️ 80% of user seats used
- ⚠️ 90% of storage used
- ⚠️ 80% of API quota used
- 📧 Weekly usage summary (Admins only)

**Plan Changes:**
- ✅ Upgrade confirmed
- ⏰ Downgrade scheduled
- ❌ Cancellation confirmed

#### Best Practices & Tips

**Subscription Management:**
- Review usage monthly to optimize plan selection
- Set usage alerts to avoid overages
- Plan upgrades strategically before hitting limits
- Take advantage of annual billing discounts
- Keep payment information current

**Cost Optimization:**
- Remove inactive users to free seats
- Archive old processes to save storage
- Use API efficiently to stay within quotas
- Consider annual billing for 20% savings
- Right-size plan to actual usage

**Billing:**
- Download invoices monthly for records
- Update billing information before renewals
- Monitor for failed payments
- Review charges for accuracy
- Contact support for billing questions

---

### Pricing Plans

**Purpose:**
View detailed information about available subscription plans, features, and pricing to make informed upgrade decisions.

**Access:** 🟢 All Roles (public information)

**Accessing Pricing:**
1. Navigate to **Pricing** in the sidebar
2. Or click **"View Pricing"** from subscription page
3. Public page (no login required)

#### Available Plans

**Free Plan - $0/month**

**Ideal For:**
- Individual users
- Small teams (up to 3 users)
- Proof of concept
- Learning process mining

**Features Included:**
- ✅ Up to 3 users
- ✅ 5 processes maximum
- ✅ Basic process discovery
- ✅ Conformance checking
- ✅ Performance analytics
- ✅ 1GB storage
- ✅ Community support
- ✅ 1,000 API calls/month
- ❌ Advanced predictive analytics
- ❌ Digital twin simulation
- ❌ AI assistant
- ❌ Custom integrations
- ❌ Priority support

**Limitations:**
- Historical data: 30 days
- Export formats: CSV only
- No custom KPIs
- No real-time monitoring

---

**Pro Plan - $99/user/month** (or $79/user/month annually)

**Ideal For:**
- Growing teams (up to 50 users)
- Departments
- Mid-market companies
- Advanced analytics needs

**Everything in Free, Plus:**
- ✅ Up to 50 users
- ✅ Unlimited processes
- ✅ Advanced predictive analytics
- ✅ Anomaly detection (5 algorithms)
- ✅ Forecasting (30/60/90-day)
- ✅ Digital twin simulation
- ✅ What-if scenario analysis
- ✅ AI Process Assistant
- ✅ Multi-LLM support (OpenAI, Mistral, etc.)
- ✅ Task mining
- ✅ Custom KPIs
- ✅ Real-time monitoring
- ✅ Advanced reporting (PDF, Excel, PowerPoint)
- ✅ Custom integrations
- ✅ 50GB storage
- ✅ Email & chat support
- ✅ 100,000 API calls/month
- ✅ Historical data: 1 year
- ✅ Collaboration features
- ✅ GDPR compliance tools

**Support:**
- Response time: Within 4 hours
- Email and chat support
- Knowledge base access
- Monthly business reviews

**Savings:**
- Annual billing saves $240/user/year (20% discount)

---

**Enterprise Plan - Custom Pricing**

**Ideal For:**
- Large organizations (50+ users)
- Multiple departments
- Fortune 500 companies
- Mission-critical deployments
- Compliance requirements

**Everything in Pro, Plus:**
- ✅ Unlimited users
- ✅ Dedicated support team
- ✅ 99.9% SLA uptime guarantee
- ✅ Custom integrations & API access
- ✅ On-premise deployment option
- ✅ Advanced security features
- ✅ SSO (SAML, OAuth)
- ✅ Custom data retention policies
- ✅ White-label options
- ✅ Dedicated account manager
- ✅ Quarterly business reviews
- ✅ Custom training sessions
- ✅ Priority feature requests
- ✅ Unlimited storage
- ✅ Unlimited API calls
- ✅ Custom SLAs
- ✅ Multi-region deployment
- ✅ Advanced audit logging
- ✅ Custom compliance (HIPAA, SOC 2, etc.)

**Support:**
- 24/7 phone, email, and chat
- Dedicated Slack/Teams channel
- Response time: Within 1 hour
- Named technical account manager
- On-site support available

**Pricing:**
- Contact sales for custom quote
- Volume discounts available
- Flexible payment terms

---

#### Billing Cycles

**Monthly Billing:**
- Billed on the same day each month
- Cancel anytime
- No long-term commitment
- Full flexibility

**Annual Billing:**
- **Save 20%** compared to monthly
- Billed once per year
- Best value for committed teams
- Can upgrade mid-year with prorated charges

**Payment Methods Accepted:**
- Credit cards (Visa, Mastercard, Amex)
- Debit cards
- ACH/Bank transfer (Enterprise only)
- Wire transfer (Enterprise only)
- Purchase orders (Enterprise only)

#### Feature Comparison Table

**Use the Interactive Comparison:**
1. On the pricing page, view the feature comparison table
2. See all features side-by-side
3. Check marks (✅) indicate included features
4. Cross marks (❌) indicate not included
5. Click **"See Full Comparison"** for detailed breakdown

**Key Feature Categories:**
- **Users & Processes**: Seat limits and process counts
- **Core Analytics**: Discovery, conformance, performance
- **Advanced Analytics**: Predictive, forecasting, anomaly detection
- **AI & Automation**: AI assistant, automation opportunities
- **Data & Storage**: Storage limits, data retention
- **Integrations**: API access, custom integrations
- **Support**: Response times, support channels
- **Security & Compliance**: SSO, audit logs, certifications

#### Making a Decision

**Choosing the Right Plan:**

1. **Assess Your Needs**:
   - How many users?
   - How many processes?
   - Required features?
   - Support expectations?

2. **Start with Free**:
   - Try platform risk-free
   - Validate use case
   - Learn the system
   - Upgrade when ready

3. **Upgrade to Pro When**:
   - Need advanced analytics
   - Team grows beyond 3 users
   - Require AI assistance
   - Need better support

4. **Contact for Enterprise When**:
   - 50+ users
   - Mission-critical processes
   - Compliance requirements
   - Custom integration needs
   - Need SLA guarantees

**Upgrade Process:**
1. Click **"Upgrade to Pro"** or **"Contact Sales"** (for Enterprise)
2. Select billing cycle (Monthly/Annual)
3. Enter payment information
4. Confirm and activate
5. Features unlock immediately

**Questions About Pricing?**
- Click **"Chat with Sales"** for live assistance
- Email: sales@epi-q.com
- Phone: 1-800-EPIQ (Enterprise)
- Schedule demo for personalized walkthrough

#### Best Practices & Tips

**Plan Selection:**
- Start small and upgrade as you grow
- Consider annual billing for significant savings
- Evaluate actual usage vs. plan limits
- Factor in future growth (6-12 months)

**Cost Management:**
- Monitor user seat usage
- Remove inactive users
- Archive completed processes
- Optimize API usage

**Timing Upgrades:**
- Upgrade before hitting limits
- Plan for seasonal demand spikes
- Consider fiscal year budgeting cycles
- Take advantage of promotional periods

---

## Settings & Configuration

Customize the platform to suit your needs and preferences.

### User Profile

**Accessing Profile:**
1. Click profile icon (top-right)
2. Select "Profile Settings"

**Profile Information:**

1. **Personal Details**
   - Name
   - Email (cannot change, used for login)
   - Job title
   - Department
   - Save changes

2. **Profile Picture**
   - Click "Upload Photo"
   - Select image (max 5MB)
   - Crop if needed
   - Save

3. **Password Change**
   - Enter current password
   - Enter new password
   - Confirm new password
   - Must meet requirements (8+ chars, uppercase, lowercase, number, special)
   - Click "Update Password"

4. **Preferences**
   - Language (English, Spanish, French, German, etc.)
   - Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
   - Time zone
   - Number format (1,000.00 vs 1.000,00)

### Appearance Settings

**Theme:**

1. **Light Mode**
   - Bright background
   - Dark text
   - Better for bright environments

2. **Dark Mode**
   - Dark background
   - Light text
   - Reduces eye strain

3. **Auto (System)**
   - Follows OS setting
   - Switches automatically

**To Change:**
1. Click theme toggle in header
2. Or Settings → Appearance
3. Select preferred theme
4. Saves automatically

**Display Density:**

1. **Comfortable** (default)
   - More spacing
   - Larger touch targets
   - Recommended for touchscreens

2. **Compact**
   - Less spacing
   - More content visible
   - Better for large displays

### Notification Settings

**Configure in Settings → Notifications**

**Email Notifications:**

1. **Frequency**
   - Immediate (as they happen)
   - Daily digest (one email per day)
   - Weekly summary (one email per week)
   - Disabled (no emails)

2. **Types**
   - @Mentions: When someone mentions you
   - Comments: Replies to your comments
   - Alerts: KPI and process alerts
   - Reports: Scheduled report delivery
   - System: Platform updates
   - Toggle each on/off individually

**In-App Notifications:**

1. **Enable/Disable**
   - Toggle master switch

2. **Notification Sound**
   - Enable/disable
   - Choose sound
   - Volume control

3. **Desktop Notifications**
   - Requires browser permission
   - Shows even when tab not active
   - Click to navigate to item

**Alert Settings:**

Covered in [Alert Configuration](#alert-configuration) section

### Privacy & Data

**Data Export:**

1. **Settings → Privacy → "Export My Data"**
2. Select data to include:
   - Profile information
   - Process data (created by you)
   - Comments
   - Reports
   - Activity logs
3. Click "Request Export"
4. Processing time: 15-60 minutes
5. Email sent with download link
6. Link expires after 7 days
7. Data in JSON format (machine-readable)

**Data Deletion:**

1. **Settings → Privacy → "Delete My Data"**
2. Options:
   - Delete specific data types
   - Delete all data (full deletion)
3. **Warning**: Irreversible action
4. Requires password confirmation
5. Processing within 24 hours
6. Email confirmation when complete

**Account Deletion:**

1. **Settings → Account → "Delete Account"**
2. **Warning**: Permanent action
   - All your data deleted
   - Cannot be recovered
   - Processes you created transferred to admin
3. Enter password
4. Type "DELETE" to confirm
5. Account deleted within 48 hours

### API Access

**Generating API Keys:**

1. **Settings → API Keys**
2. Click "Generate New Key"
3. Enter:
   - Description (e.g., "Desktop Agent", "Python Script")
   - Expiration date (optional but recommended)
   - Permissions (read-only or read-write)
4. Click "Generate"
5. **Important**: Copy key immediately
   - Shown only once
   - Store securely
   - Never share publicly

**Managing API Keys:**

**View Keys:**
- List of all active keys
- Description
- Created date
- Last used date
- Expiration

**Revoke Key:**
- Click "Revoke" button
- Immediate effect
- All requests with this key fail
- Cannot be undone

**Best Practices:**
- Use one key per application
- Set expiration dates
- Rotate keys every 90 days
- Revoke unused keys
- Never commit keys to version control

### Integration Settings

**Available Integrations:**

1. **Email Integration**
   - Connect IMAP account
   - Auto-import process emails
   - Parse workflow steps

2. **Slack Integration**
   - Receive alerts in Slack
   - Share reports
   - Comment from Slack

3. **Microsoft Teams**
   - Similar to Slack
   - Notifications and sharing

4. **Webhook**
   - Custom HTTP endpoints
   - Real-time event streaming
   - For custom integrations

**Setting Up Integration:**

**Example: Slack**

1. **Settings → Integrations → "Slack"**
2. Click "Connect to Slack"
3. Authorize on Slack's website
4. Select channel for notifications
5. Configure event types:
   - Alerts
   - Report completions
   - Comment mentions
6. Save settings
7. Test by sending sample notification

### Organization Settings (Admin Only)

**If you're an admin, additional settings available:**

**User Management:**

1. **Settings → Users**
2. View all users in organization
3. Actions:
   - Invite new users (enter email)
   - Deactivate users
   - Assign roles (Admin, Analyst, Viewer)
   - Reset passwords
   - View activity logs

**Role Permissions:**

- **Admin**: Full access, can manage users
- **Analyst**: Create and edit processes, reports
- **Viewer**: Read-only access

**Billing:**

1. **Settings → Billing**
2. View current plan
3. Usage statistics
4. Upgrade/downgrade plan
5. Payment method
6. Invoices

**Audit Logs:**

1. **Settings → Audit**
2. View all user actions:
   - Logins
   - Data exports
   - Configuration changes
   - Process modifications
3. Filter by user, date, action type
4. Export logs for compliance

### System Preferences

**Default Settings:**

**Date Ranges:**
- Set default for all analyses
- Last 7 days, 30 days, 90 days, or custom
- Applies when loading pages

**Auto-Refresh:**
- Real-time dashboards auto-update
- Set interval (30 sec, 1 min, 5 min)
- Or disable auto-refresh

**Export Defaults:**
- Preferred format (PDF, Excel, PowerPoint)
- Include charts or data only
- Default file naming convention

**Calculation Settings:**

**Business Hours:**
- Define working hours
- Used for cycle time calculations
- Exclude weekends (optional)
- Set time zone

**Currency:**
- Default currency for cost analysis
- Symbol and formatting
- Exchange rates (if multi-currency)

### Troubleshooting

**Common Issues:**

**1. Can't log in**
- Check caps lock
- Reset password (Forgot Password link)
- Clear browser cache
- Try incognito/private mode
- Contact admin if account disabled

**2. Page not loading**
- Check internet connection
- Refresh page (Ctrl+R / Cmd+R)
- Clear cache and cookies
- Try different browser
- Check system status page

**3. Upload failing**
- Check file format (CSV only)
- Ensure file size < 50MB
- Verify CSV structure
- Remove special characters
- Try smaller file first

**4. Missing data**
- Verify date range filter
- Check process selection
- Ensure data was uploaded
- Refresh page
- Contact support if persists

**5. Slow performance**
- Large dataset may take time
- Use filters to reduce scope
- Clear browser cache
- Close other browser tabs
- Check network speed

**Getting Help:**

1. **Help Center**
   - Click "?" icon
   - Search knowledge base
   - Step-by-step guides
   - Video tutorials

2. **Contact Support**
   - Settings → Support
   - Submit ticket
   - Include:
     - Description of issue
     - Steps to reproduce
     - Screenshots
     - Browser and OS
   - Response within 24 hours

3. **Community Forum**
   - Ask questions
   - Share best practices
   - Learn from other users
   - Feature requests

---

## Appendix

### Keyboard Shortcuts

**Navigation:**
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + /`: Open keyboard shortcuts
- `Ctrl/Cmd + B`: Toggle sidebar
- `Esc`: Close dialogs/modals

**Analysis:**
- `Ctrl/Cmd + F`: Open filters
- `Ctrl/Cmd + E`: Export current view
- `Ctrl/Cmd + S`: Share current view
- `R`: Refresh data

**Comments:**
- `C`: Add comment
- `Ctrl/Cmd + Enter`: Post comment
- `@`: Mention user

### Glossary

**Activity**: A step or task in a process

**Case ID**: Unique identifier for a process instance

**Conformance**: How well actual process matches expected model

**Cycle Time**: Total time from process start to end

**Event Log**: Data file containing process execution records

**Fitness**: Measure of conformance (0-100%)

**KPI**: Key Performance Indicator

**Process Instance**: Single execution of a process

**Resource**: Person or system executing activities

**Throughput**: Number of cases completed per time period

**Token-Based Replay**: Method for conformance checking

**Transition**: Flow from one activity to another

### CSV File Format Requirements

**Required Columns:**
- `CaseID`: Unique identifier per process instance
- `Activity`: Name of the activity/task
- `Timestamp`: When activity occurred (ISO 8601 format recommended)

**Optional Columns:**
- `Resource`: Who/what performed the activity
- `Cost`: Expense for this activity execution
- `[CustomAttribute]`: Any additional data fields

**Example:**
```csv
CaseID,Activity,Timestamp,Resource,Cost
C001,Order Received,2024-01-01T09:00:00,System,0
C001,Payment Processed,2024-01-01T09:15:00,John,25
C001,Order Shipped,2024-01-01T10:00:00,Mary,15
C002,Order Received,2024-01-01T09:30:00,System,0
C002,Payment Processed,2024-01-01T10:00:00,John,25
```

**Best Practices:**
- Use consistent date/time format
- Avoid special characters in activity names
- Keep CaseID consistent within each process
- Include Resource for utilization analysis
- Add Cost for financial analysis

### Video Tutorials

Access at: **Help → Video Tutorials**

**Available Tutorials:**
1. Getting Started (5 min)
2. Uploading Event Logs (3 min)
3. Process Discovery Walkthrough (10 min)
4. Understanding Conformance (8 min)
5. Performance Analytics Deep Dive (15 min)
6. Creating Custom KPIs (7 min)
7. Using AI Assistant (6 min)
8. Generating Reports (5 min)
9. Digital Twin Simulation (12 min)
10. Task Mining Setup (10 min)

---

## Support & Feedback

**Need Help?**
- Email: support@epi-xray.com
- Live Chat: Click chat icon (business hours)
- Help Center: help.epi-xray.com
- Community Forum: community.epi-xray.com

**Share Feedback:**
- Settings → Send Feedback
- Feature requests welcome
- Bug reports appreciated
- User experience surveys

**Stay Updated:**
- Follow release notes
- Subscribe to newsletter
- Join user group calls (monthly)
- Attend webinars

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**EPI-Q Portal** - Revolutionizing Process Mining & Automation
