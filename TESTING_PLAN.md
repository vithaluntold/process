# EPI X-Ray - Feature Testing Plan

## Test Environment
- **URL**: Your Replit app URL
- **Test Accounts**: 
  - vithal@finacegroup.com
  - snikesh1998@gmail.com

---

## 1. Authentication System Testing

### 1.1 User Signup
**Workflow:**
1. Go to landing page
2. Click "Sign Up" tab
3. Enter:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: (minimum 12 characters)
4. Click "Sign Up"

**Expected Results:**
✅ Toast message: "Account created! Logging you in..."
✅ Auto-redirect to dashboard after 0.5 seconds
✅ User menu shows "Test User" in top right

**Database Verification:**
```sql
SELECT id, email, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 1;
```

---

### 1.2 User Login
**Workflow:**
1. Log out from dashboard (click user menu → Logout)
2. On landing page, enter credentials
3. Click "Log In"

**Expected Results:**
✅ Toast: "Logged in successfully!"
✅ Redirect to dashboard
✅ Session cookie set (lasts 7 days)

**Error Cases to Test:**
- Wrong password → Alert: "ERROR: Password is incorrect"
- Non-existent email → Alert: "ERROR: No account found with this email"
- Password < 12 chars → Browser validation error

---

### 1.3 Session Persistence
**Workflow:**
1. Login successfully
2. Refresh page (F5)
3. Close tab and reopen

**Expected Results:**
✅ Stay logged in (no redirect to landing)
✅ Dashboard loads immediately
✅ User menu shows correct name

---

### 1.4 Logout
**Workflow:**
1. Click user menu (top right)
2. Click "Logout"

**Expected Results:**
✅ Redirect to landing page
✅ Session cookie deleted
✅ Cannot access /process-discovery or other protected routes

---

## 2. Dashboard Features Testing

### 2.1 KPI Cards (Top Metrics)
**Workflow:**
1. Login and view dashboard
2. Check all 4 KPI cards

**Expected Results:**
✅ Total Processes: Shows count from database
✅ Active Cases: Shows count
✅ Avg Cycle Time: Shows time or "N/A"
✅ Automation Rate: Shows percentage or "0%"

**Database Verification:**
```sql
SELECT COUNT(*) FROM processes;
SELECT COUNT(*) FROM event_logs;
```

---

### 2.2 Import Data (CSV Upload)
**Workflow:**
1. Click "Import Data" button
2. Modal opens with CSV upload
3. Create test CSV file:

```csv
caseId,activity,timestamp,resource
CASE001,Order Received,2025-01-01T10:00:00Z,System
CASE001,Payment Verified,2025-01-01T10:15:00Z,John
CASE001,Order Shipped,2025-01-01T12:00:00Z,Warehouse
CASE002,Order Received,2025-01-01T11:00:00Z,System
CASE002,Payment Verified,2025-01-01T11:20:00Z,Jane
```

4. Upload file
5. Click "Upload CSV"

**Expected Results:**
✅ Success message
✅ Event logs created in database
✅ Can see data in Process Discovery tab

**Database Verification:**
```sql
SELECT * FROM event_logs ORDER BY created_at DESC LIMIT 5;
```

**Error Cases to Test:**
- Upload .txt file → Error: "Only CSV files allowed"
- Missing columns → Error: "Required columns: caseId, activity, timestamp"
- File > 50MB → Error: "File too large"

---

### 2.3 New Analysis (Create Process)
**Workflow:**
1. Click "New Analysis" button
2. Modal opens
3. Enter:
   - Process Name: "Order Fulfillment"
   - Description: "E-commerce order processing"
4. Click "Create Process"

**Expected Results:**
✅ Success message
✅ New process appears in "Process Discovery" tab
✅ Process has ID, name, status = "active"

**Database Verification:**
```sql
SELECT * FROM processes ORDER BY created_at DESC LIMIT 1;
```

---

### 2.4 Process Discovery Tab
**Workflow:**
1. Click "Process Discovery" tab
2. View process list

**Expected Results:**
✅ Shows all processes from database
✅ Each row shows: Name, Status, Created Date
✅ Empty state if no processes: "No processes found"
✅ Loading spinner while fetching

---

### 2.5 Performance Analytics Tab
**Workflow:**
1. Click "Performance Analytics" tab
2. View metrics

**Expected Results:**
✅ Shows performance data
✅ Displays: Cycle Time, Throughput Rate, Process Efficiency
✅ Empty state if no data
✅ Loading spinner while fetching

---

### 2.6 Automation Opportunities Tab
**Workflow:**
1. Click "Automation Opportunities" tab
2. View opportunities

**Expected Results:**
✅ Shows automation statistics
✅ Displays: Total Opportunities, High Priority, Estimated Savings
✅ Empty state if no data
✅ Loading spinner while fetching

---

## 3. Navigation Pages Testing

### 3.1 Process Discovery Page
**Workflow:**
1. Click "Process Discovery" in sidebar
2. URL: /process-discovery

**Expected Results:**
✅ Page loads with process list
✅ Fetches from `/api/processes`
✅ Shows process cards or table
✅ Loading state while fetching
✅ Empty state if no processes

---

### 3.2 Conformance Checking Page
**Workflow:**
1. Click "Conformance Checking" in sidebar
2. URL: /conformance-checking

**Expected Results:**
✅ Page loads successfully
✅ Shows conformance data
✅ Fetches from backend API
✅ Loading and empty states work

---

### 3.3 Performance Analytics Page
**Workflow:**
1. Click "Performance Analytics" in sidebar
2. URL: /performance-analytics

**Expected Results:**
✅ Page loads with metrics
✅ Shows charts/graphs
✅ Fetches real data
✅ Loading and empty states work

---

### 3.4 Automation Opportunities Page
**Workflow:**
1. Click "Automation Opportunities" in sidebar
2. URL: /automation-opportunities

**Expected Results:**
✅ Page loads successfully
✅ Shows opportunity list
✅ Fetches from `/api/analytics/automation`
✅ Loading and empty states work

---

### 3.5 Predictive Analytics Page
**Workflow:**
1. Click "Predictive Analytics" in sidebar
2. URL: /predictive-analytics

**Expected Results:**
✅ Page loads successfully
✅ Shows predictions
✅ Fetches real data
✅ Loading and empty states work

---

### 3.6 Digital Twin Page
**Workflow:**
1. Click "Digital Twin" in sidebar
2. URL: /digital-twin

**Expected Results:**
✅ Page loads successfully
✅ Shows simulation interface
✅ Loading and empty states work

---

### 3.7 Scenario Analysis Page
**Workflow:**
1. Click "Scenario Analysis" in sidebar
2. URL: /scenario-analysis

**Expected Results:**
✅ Page loads successfully
✅ Shows scenario comparison
✅ Loading and empty states work

---

### 3.8 Document Upload Page
**Workflow:**
1. Click "Document Upload" in sidebar
2. URL: /document-upload

**Expected Results:**
✅ Page loads successfully
✅ Shows file upload interface
✅ Can upload documents
✅ Loading and empty states work

---

### 3.9 API Integrations Page
**Workflow:**
1. Click "API Integrations" in sidebar
2. URL: /api-integrations

**Expected Results:**
✅ Page loads successfully
✅ Shows integration options (SAP, Salesforce, ServiceNow)
✅ Loading and empty states work

---

## 4. API Endpoints Testing

### 4.1 Authentication APIs
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","password":"TestPassword123","firstName":"API","lastName":"Test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","password":"TestPassword123"}' \
  -c cookies.txt

# Get User (with cookie)
curl http://localhost:5000/api/auth/user \
  -b cookies.txt

# Logout
curl http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

**Expected Results:**
✅ Signup: 201 Created
✅ Login: 200 OK with Set-Cookie header
✅ Get User: 200 OK with user data
✅ Logout: 200 OK

---

### 4.2 Processes APIs
```bash
# Get all processes
curl http://localhost:5000/api/processes

# Create process
curl -X POST http://localhost:5000/api/processes \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Process","description":"API Test"}'

# Get single process
curl http://localhost:5000/api/processes/1

# Update process
curl -X PATCH http://localhost:5000/api/processes/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'

# Delete process
curl -X DELETE http://localhost:5000/api/processes/1
```

**Expected Results:**
✅ GET: 200 OK with array
✅ POST: 201 Created
✅ GET by ID: 200 OK with object
✅ PATCH: 200 OK
✅ DELETE: 200 OK

---

### 4.3 Analytics APIs
```bash
# Performance analytics
curl http://localhost:5000/api/analytics/performance?processId=1

# Automation opportunities
curl http://localhost:5000/api/analytics/automation?processId=1
```

**Expected Results:**
✅ Performance: 200 OK with metrics
✅ Automation: 200 OK with opportunities

---

## 5. Security Testing

### 5.1 Password Security
**Test Cases:**
- Password hashing uses bcryptjs (12 rounds)
- Passwords never stored in plaintext
- JWT tokens expire after 7 days
- Cookies are httpOnly (cannot access via JavaScript)
- Cookies use sameSite: 'lax'

**Database Verification:**
```sql
SELECT password_hash FROM users LIMIT 1;
```
✅ Should start with "$2b$12$" (bcrypt with 12 rounds)

---

### 5.2 Protected Routes
**Test Cases:**
1. Logout
2. Try to access /process-discovery directly
3. Try to access /dashboard directly

**Expected Results:**
✅ Redirect to landing page
✅ Cannot access without authentication

---

### 5.3 SQL Injection Prevention
**Test Cases:**
- Try login with: `admin'--`
- Try process name: `'; DROP TABLE users--`

**Expected Results:**
✅ No SQL injection (using Drizzle ORM with parameterized queries)
✅ Invalid credentials error

---

### 5.4 File Upload Security
**Test Cases:**
- Upload .exe file → Rejected
- Upload file named `../../etc/passwd.csv` → Sanitized with UUID
- Upload 100MB file → Rejected (max 50MB)

**Expected Results:**
✅ Only CSV files allowed
✅ Filenames sanitized (UUID-based)
✅ Size limits enforced

---

## 6. Database Schema Validation

### 6.1 Check All Tables
```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count records in each table
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM processes;
SELECT COUNT(*) FROM event_logs;
SELECT COUNT(*) FROM process_models;
SELECT COUNT(*) FROM activities;
SELECT COUNT(*) FROM performance_metrics;
SELECT COUNT(*) FROM deviations;
SELECT COUNT(*) FROM automation_opportunities;
SELECT COUNT(*) FROM documents;
SELECT COUNT(*) FROM integrations;
```

**Expected Tables:**
✅ users
✅ processes
✅ event_logs
✅ process_models
✅ activities
✅ performance_metrics
✅ deviations
✅ automation_opportunities
✅ documents
✅ integrations

---

### 6.2 Check User Schema
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

**Expected Columns:**
✅ id (serial, primary key)
✅ email (varchar, unique, not null)
✅ password_hash (varchar, not null)
✅ first_name (varchar)
✅ last_name (varchar)
✅ created_at (timestamp)
✅ updated_at (timestamp)

---

## 7. Performance Testing

### 7.1 Page Load Times
**Test Cases:**
- Dashboard load: < 3 seconds
- Process Discovery page: < 3 seconds
- API response times: < 500ms

**How to Test:**
1. Open DevTools → Network tab
2. Refresh page
3. Check "DOMContentLoaded" time

---

### 7.2 Large Dataset Handling
**Test Cases:**
1. Upload CSV with 1000+ rows
2. View process list with 50+ processes
3. Dashboard with lots of data

**Expected Results:**
✅ No crashes
✅ Pagination or virtualization if needed
✅ Loading spinners while processing

---

## 8. Browser Compatibility

### 8.1 Test Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### 8.2 Mobile Responsiveness
**Test Cases:**
1. Open on mobile device or DevTools mobile view
2. Check all pages responsive
3. Forms work on mobile

---

## Summary Checklist

### Critical Features (Must Pass)
- [ ] User signup works
- [ ] User login works
- [ ] Session persistence works
- [ ] Logout works
- [ ] Dashboard loads with real data
- [ ] CSV upload works
- [ ] Process creation works
- [ ] All navigation pages load
- [ ] APIs return correct data
- [ ] Passwords securely hashed (bcrypt 12 rounds)
- [ ] JWT tokens work with 7-day expiry
- [ ] Protected routes require authentication

### Nice-to-Have (Should Pass)
- [ ] Loading states work
- [ ] Empty states work
- [ ] Error messages clear and specific
- [ ] Toast notifications appear
- [ ] Mobile responsive
- [ ] Fast page loads (< 3s)

---

## Known Issues & Limitations

1. **NextAuth Warning**: `[next-auth][warn][NEXTAUTH_URL]` - This is a warning, not an error. System works fine.
2. **Empty Dashboard**: Dashboard will show zeros if no data uploaded yet (expected behavior).
3. **CSV Format**: Must include required columns: `caseId`, `activity`, `timestamp`.

---

## Next Steps After Testing

Once all critical features pass:
1. ✅ Mark authentication as production-ready
2. ✅ Move to next feature implementation:
   - Enhanced process mining algorithms
   - Real-time analytics
   - Advanced visualizations
   - AI-powered predictions
   - More integrations (SAP, Salesforce, etc.)
