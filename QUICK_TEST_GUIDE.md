# Quick Test Guide - Start Here! 🚀

## Current Status: ✅ READY FOR TESTING

All authentication and core features are implemented and working. Follow this guide to test the platform.

---

## Quick Start (5 Minutes)

### 1. Login (You Already Have an Account!)
- **Your email**: vithal@finacegroup.com  
- **Your password**: The 15-character password you used
- Click "Log In" button

**What you should see:**
- Success toast message
- Redirect to dashboard in 0.5 seconds
- If wrong password → Alert: "ERROR: Password is incorrect"

---

### 2. Dashboard Overview
Once logged in, you'll see:
- **4 KPI Cards** at top (Total Processes, Active Cases, Avg Cycle Time, Automation Rate)
- **3 Tabs**: Process Discovery, Performance Analytics, Automation Opportunities
- **2 Action Buttons**: Import Data, New Analysis

---

### 3. Create Your First Process (1 minute)
1. Click **"New Analysis"** button
2. Enter:
   - Process Name: `Order Fulfillment`
   - Description: `Test process for e-commerce orders`
3. Click **"Create Process"**
4. Switch to **"Process Discovery"** tab → See your new process!

---

### 4. Upload Sample Data (2 minutes)

#### Step 1: Create Sample CSV
Create a file `sample_orders.csv`:

```csv
caseId,activity,timestamp,resource
CASE001,Order Received,2025-01-01T10:00:00Z,System
CASE001,Payment Verified,2025-01-01T10:15:00Z,John
CASE001,Order Packed,2025-01-01T11:00:00Z,Warehouse
CASE001,Order Shipped,2025-01-01T12:00:00Z,Shipping
CASE002,Order Received,2025-01-01T11:00:00Z,System
CASE002,Payment Verified,2025-01-01T11:20:00Z,Jane
CASE002,Order Packed,2025-01-01T12:10:00Z,Warehouse
CASE002,Order Shipped,2025-01-01T13:30:00Z,Shipping
CASE003,Order Received,2025-01-01T14:00:00Z,System
CASE003,Payment Failed,2025-01-01T14:05:00Z,System
```

#### Step 2: Upload
1. Click **"Import Data"** button
2. Choose your `sample_orders.csv` file
3. Click **"Upload CSV"**
4. Success! Events are now in database

---

### 5. Explore Navigation (1 minute each)

Click each item in the left sidebar:
- **Process Discovery** → See all processes
- **Conformance Checking** → Check process compliance
- **Performance Analytics** → View metrics and KPIs
- **Automation Opportunities** → Find automation potential
- **Predictive Analytics** → AI forecasting
- **Digital Twin** → Virtual process simulation
- **Scenario Analysis** → Compare what-if scenarios
- **Document Upload** → Upload process documents
- **API Integrations** → Connect SAP, Salesforce, etc.

---

## Test Different Scenarios

### Scenario A: Error Handling
1. Try logging in with **wrong password** → Should see alert
2. Upload a **.txt file** instead of CSV → Should reject
3. Upload CSV **without required columns** → Should show error

### Scenario B: Session Management
1. Login successfully
2. Refresh page → Should **stay logged in**
3. Close browser tab, reopen → Should **still be logged in**
4. Logout → Cannot access protected pages anymore

### Scenario C: Data Flow
1. Create process → See it in Process Discovery tab
2. Upload CSV → See events in database
3. Check Performance Analytics → Should show metrics
4. Check Automation Opportunities → Should show analysis

---

## What Each Feature Does

### ✅ Authentication (Custom JWT)
- Signup with email/password (min 12 chars)
- bcrypt password hashing (12 salt rounds)
- JWT tokens with 7-day expiry
- httpOnly cookies for security
- Specific error messages
- Auto-login after signup

### ✅ Dashboard
- Real-time KPI cards from database
- Process Discovery tab (lists all processes)
- Performance Analytics tab (shows metrics)
- Automation Opportunities tab (shows automation potential)
- Import Data button (CSV upload)
- New Analysis button (create process)

### ✅ File Upload
- CSV parsing with validation
- Required columns: caseId, activity, timestamp
- Optional: resource, metadata
- 50MB file size limit
- UUID-based filename sanitization
- SQL injection prevention

### ✅ Process Mining
- Process discovery algorithms
- Performance metrics calculation
- Automation opportunity analysis
- Activity frequency tracking
- Transition analysis

### ✅ APIs
- `/api/auth/signup` - User registration
- `/api/auth/login` - User authentication
- `/api/auth/logout` - Session destruction
- `/api/auth/user` - Current user info
- `/api/processes` - CRUD operations
- `/api/event-logs` - Event management
- `/api/analytics/performance` - Performance metrics
- `/api/analytics/automation` - Automation analysis
- `/api/upload` - CSV file upload

---

## Database Tables (All Created)

✅ **users** - User accounts (email, password_hash, first_name, last_name)
✅ **processes** - Process definitions
✅ **event_logs** - Process events (caseId, activity, timestamp)
✅ **process_models** - Discovered process models
✅ **activities** - Activity definitions
✅ **performance_metrics** - Performance data
✅ **deviations** - Conformance checking results
✅ **automation_opportunities** - Automation analysis
✅ **documents** - Uploaded documents
✅ **integrations** - API connections

---

## Known Working Features

✅ User signup/login/logout
✅ Session persistence (7 days)
✅ Dashboard with real data
✅ Process creation
✅ CSV upload and parsing
✅ All navigation pages load
✅ Protected routes (redirect if not logged in)
✅ Error handling and validation
✅ Toast notifications
✅ Loading states
✅ Empty states
✅ Mobile responsive design
✅ Security (bcrypt, JWT, httpOnly cookies, SQL injection prevention)

---

## Next Steps After Testing

Once you verify everything works:

### Phase 1: Enhanced Process Mining
- Advanced discovery algorithms (Alpha Miner, Heuristic Miner)
- BPMN diagram generation
- Real-time process monitoring
- Bottleneck detection

### Phase 2: Advanced Analytics
- Machine learning predictions
- Anomaly detection
- Resource utilization analysis
- Cost analysis

### Phase 3: Integrations
- SAP connector
- Salesforce connector
- ServiceNow connector
- Custom API webhooks

### Phase 4: Visualizations
- Interactive process maps
- Performance dashboards
- Trend analysis charts
- Heatmaps

### Phase 5: Automation
- RPA integration
- Task automation recommendations
- Workflow optimization
- Auto-remediation

---

## Need Help?

### Check Logs
```bash
# View recent workflow logs
cat /tmp/logs/dev_*.log | tail -n 50

# Check database
psql $DATABASE_URL -c "SELECT * FROM users;"
psql $DATABASE_URL -c "SELECT * FROM processes;"
psql $DATABASE_URL -c "SELECT * FROM event_logs;"
```

### Common Issues

**Issue: Can't login**
- Check password is at least 12 characters
- Verify email exists in database
- Check browser console for errors

**Issue: Dashboard shows zeros**
- Expected if no data uploaded yet
- Create a process first
- Upload CSV to see data

**Issue: CSV upload fails**
- Check file has required columns: caseId, activity, timestamp
- File must be .csv format
- Max file size: 50MB

---

## Summary

✅ **Authentication**: Fully working (signup, login, logout, session)
✅ **Dashboard**: Connected to real database, shows live data
✅ **File Upload**: CSV parsing and validation working
✅ **Navigation**: All 9 pages accessible and loading
✅ **APIs**: All endpoints functional
✅ **Security**: bcrypt, JWT, httpOnly cookies, SQL prevention
✅ **Database**: 10 tables created and connected

**Status**: Ready for comprehensive testing and next phase implementation!
