# EPI-Q Platform - End-to-End Testing Guide

## Table of Contents
1. [Purpose & Scope](#purpose--scope)
2. [Test Environment & Data Management](#test-environment--data-management)
3. [Test Categories](#test-categories)
   - [Authentication & Session Management](#authentication--session-management)
   - [Multi-Tenancy Isolation](#multi-tenancy-isolation)
   - [Subscription & Payments](#subscription--payments)
   - [Support & Ticketing Workflows](#support--ticketing-workflows)
   - [Analytics & Core Workflows](#analytics--core-workflows-smoke-tests)
   - [API Contract & Integration](#api-contract--integration)
   - [UI/UX Regression](#uiux-regression)
   - [Security & Compliance](#security--compliance)
4. [Test Scenario Format](#test-scenario-format)
5. [Tooling Recommendations](#tooling-recommendations)
6. [Prioritization Model](#prioritization-model)
7. [Security Considerations](#security-considerations)
8. [Reporting & Traceability](#reporting--traceability)

---

## Purpose & Scope

### Testing Goals
This guide provides comprehensive end-to-end testing scenarios for EPI-Q, an enterprise-grade multi-tenant SaaS process mining platform. The testing framework ensures:

- **Multi-Tenancy Integrity**: Complete data isolation between organizations
- **Security & Compliance**: Enterprise-grade security across all user roles
- **Payment Gateway Reliability**: Robust subscription and billing workflows
- **Business Critical Flows**: Core analytics and process mining functionality
- **API Reliability**: RESTful API contract compliance and error handling
- **User Experience**: Consistent, accessible, and performant UI

### Testing Scope

**In Scope:**
- ✅ Authentication and RBAC (Super Admin, Admin, Employee)
- ✅ Multi-tenant data isolation and cross-tenant security
- ✅ Payment gateway integration (Razorpay, PayU, Payoneer)
- ✅ Subscription lifecycle management
- ✅ Support ticket workflows and SLA compliance
- ✅ Process mining core features (discovery, conformance, analytics)
- ✅ API endpoints and integration patterns
- ✅ UI/UX critical user journeys
- ✅ Security vulnerabilities (OWASP Top 10)
- ✅ GDPR compliance features

**Out of Scope:**
- ❌ Performance load testing (covered in separate performance testing guide)
- ❌ Infrastructure monitoring and alerting
- ❌ Third-party service reliability (external LLM APIs)
- ❌ Browser compatibility testing (covered in separate guide)

---

## Test Environment & Data Management

### Test Environments

**Development Environment:**
- URL: `http://localhost:5000`
- Database: PostgreSQL (development instance)
- Payment Gateway: Test/Sandbox mode
- Email: Captured locally (no actual sending)

**Staging Environment:**
- URL: `https://staging.epi-q.com`
- Database: PostgreSQL (staging replica)
- Payment Gateway: Sandbox mode
- Email: Test email addresses only
- Access: Restricted to internal testing team

**Production Environment:**
- URL: `https://app.epi-q.com`
- Testing: Smoke tests only (no destructive actions)
- Payment Gateway: Live mode
- Monitoring: Automated health checks

### Test Data Management

**Tenant Fixtures:**
```javascript
// Test Organizations
const testOrganizations = [
  {
    id: "org_test_001",
    name: "Acme Corporation",
    plan: "pro",
    status: "active",
    users: 10
  },
  {
    id: "org_test_002", 
    name: "Beta Industries",
    plan: "enterprise",
    status: "active",
    users: 50
  },
  {
    id: "org_test_003",
    name: "Gamma LLC",
    plan: "free",
    status: "trial",
    users: 2
  }
];
```

**Seed Users:**
```javascript
// Test Users (one per role per organization)
const seedUsers = [
  // Super Admin (platform-wide)
  { email: "superadmin@epi-q.com", role: "super_admin", org: null },
  
  // Acme Corporation
  { email: "admin@acme.test", role: "admin", org: "org_test_001" },
  { email: "employee@acme.test", role: "employee", org: "org_test_001" },
  
  // Beta Industries
  { email: "admin@beta.test", role: "admin", org: "org_test_002" },
  { email: "employee@beta.test", role: "employee", org: "org_test_002" },
];
```

**Secrets Handling:**
```bash
# .env.test
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/epi_q_test
JWT_SECRET=test_secret_key_for_testing_only_do_not_use_in_production
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=test_secret_XXXXXXXXXX
OPENAI_API_KEY=sk-test-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Data Cleanup:**
```javascript
// Run after each test suite
async function cleanupTestData() {
  await db.transaction(async (trx) => {
    // Delete in correct order to respect foreign keys
    await trx.delete(ticketMessages).where(eq(tickets.organizationId, testOrgId));
    await trx.delete(tickets).where(eq(tickets.organizationId, testOrgId));
    await trx.delete(processes).where(eq(processes.organizationId, testOrgId));
    await trx.delete(users).where(eq(users.organizationId, testOrgId));
    await trx.delete(organizations).where(eq(organizations.id, testOrgId));
  });
}
```

---

## Test Categories

### Authentication & Session Management

#### TC-AUTH-001: User Registration (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify new user can successfully register with valid credentials

**Preconditions:**
- Access to signup page
- Valid email address
- No existing account with test email

**Test Steps:**
1. Navigate to `/auth/signup`
2. Enter email: `testuser@example.com`
3. Enter password: `SecurePass123!`
4. Confirm password: `SecurePass123!`
5. Click "Create Account"

**Expected Results:**
- ✅ Account created successfully
- ✅ User redirected to dashboard
- ✅ JWT token generated and stored in httpOnly cookie
- ✅ User record created in database with hashed password
- ✅ Welcome email sent (in test mode, captured locally)

**Data Sets:**
- Valid credentials: Strong password, valid email format
- Invalid credentials: Weak password, invalid email, mismatched passwords

---

#### TC-AUTH-002: User Login with Valid Credentials (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify existing user can login with correct credentials

**Preconditions:**
- Existing user account created
- User not already logged in

**Test Steps:**
1. Navigate to `/auth/signin`
2. Enter email: `testuser@example.com`
3. Enter password: `SecurePass123!`
4. Click "Log In"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/` (dashboard)
- ✅ JWT token issued (7-day expiry)
- ✅ User session established
- ✅ User profile data loaded

**Data Sets:**
- Valid email, valid password
- Valid email, incorrect password (should fail)
- Non-existent email (should fail)
- SQL injection attempts (should be sanitized)

---

#### TC-AUTH-003: Session Expiration & Renewal (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify JWT token expiry after 7 days and automatic logout

**Preconditions:**
- User logged in with valid session
- Ability to manipulate system time or token expiry

**Test Steps:**
1. Login successfully
2. Mock token expiry by advancing system time by 7 days + 1 hour
3. Attempt to access protected route `/process-discovery`

**Expected Results:**
- ✅ Token validation fails
- ✅ User redirected to `/auth/signin`
- ✅ Error message: "Session expired. Please log in again."
- ✅ httpOnly cookie cleared

---

#### TC-AUTH-004: Role-Based Access Control - Super Admin (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify Super Admin can access platform-wide features

**Preconditions:**
- Super Admin user account exists
- Super Admin logged in

**Test Steps:**
1. Login as `superadmin@epi-q.com`
2. Navigate to `/admin/organizations`
3. Verify page loads successfully
4. Check sidebar navigation includes "Organizations" link
5. Attempt to view all organizations across all tenants

**Expected Results:**
- ✅ Organizations page accessible
- ✅ All organizations visible (cross-tenant access)
- ✅ Create, Edit, Suspend, Delete actions available
- ✅ MRR and platform statistics visible

---

#### TC-AUTH-005: Role-Based Access Control - Admin Restrictions (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify Admin cannot access Super Admin features

**Preconditions:**
- Admin user account exists (not Super Admin)
- Admin logged in

**Test Steps:**
1. Login as `admin@acme.test`
2. Check sidebar navigation (should NOT include "Organizations")
3. Manually navigate to `/admin/organizations` via URL
4. Attempt to access Super Admin API endpoints

**Expected Results:**
- ✅ "Organizations" link not visible in sidebar
- ✅ Direct URL access to `/admin/organizations` redirected to `/` with error
- ✅ HTTP 403 Forbidden for Super Admin API endpoints
- ✅ Error message: "Access denied. Super Admin privileges required."

---

#### TC-AUTH-006: Role-Based Access Control - Employee Restrictions (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify Employee has read-only access to most features

**Preconditions:**
- Employee user account exists
- Employee logged in

**Test Steps:**
1. Login as `employee@acme.test`
2. Navigate to `/subscription`
3. Verify page loads but no edit permissions
4. Attempt to change subscription plan
5. Navigate to `/admin/tickets`
6. Attempt to create ticket (should succeed)
7. Attempt to change ticket status (should fail)

**Expected Results:**
- ✅ Subscription page visible (read-only)
- ✅ "Upgrade Plan" button hidden or disabled
- ✅ Can create support tickets
- ✅ Cannot change ticket status/priority
- ✅ Cannot access organization settings

---

### Multi-Tenancy Isolation

#### TC-TENANT-001: Organization Data Isolation (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify users can only access data from their own organization

**Preconditions:**
- Two organizations exist: Acme (org_test_001) and Beta (org_test_002)
- Processes exist in both organizations
- User from Acme logged in

**Test Steps:**
1. Login as `admin@acme.test` (org_test_001)
2. Navigate to `/process-discovery`
3. Check process selector dropdown
4. Verify only Acme processes are visible
5. Attempt API call: `GET /api/processes?organizationId=org_test_002`
6. Attempt direct URL: `/process-analysis?processId=<beta_process_id>`

**Expected Results:**
- ✅ Only Acme processes visible in UI
- ✅ API call with Beta org ID returns empty array or 403 Forbidden
- ✅ Direct URL access to Beta process ID returns 403 or redirects
- ✅ Database queries include `WHERE organizationId = user.organizationId`
- ✅ No cross-tenant data leakage

**Security Check:**
- Attempt SQL injection: `?organizationId=org_test_002' OR '1'='1`
- Should be sanitized by Drizzle ORM

---

#### TC-TENANT-002: Cross-Tenant User Enumeration Prevention (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify users cannot enumerate users from other organizations

**Preconditions:**
- Multiple organizations with users exist
- Acme admin logged in

**Test Steps:**
1. Login as `admin@acme.test`
2. Attempt API call: `GET /api/users?organizationId=org_test_002`
3. Attempt: `GET /api/users` (should only return Acme users)
4. Attempt ticket assignment with Beta user ID
5. Attempt @mention of Beta user in comments

**Expected Results:**
- ✅ Cannot fetch users from other organizations
- ✅ User search filtered by organizationId
- ✅ Ticket assignment rejects cross-tenant user IDs
- ✅ @mentions only suggest users from same organization
- ✅ HTTP 403 or empty results for cross-tenant queries

---

#### TC-TENANT-003: Subscription Enforcement - User Seat Limits (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify subscription plan limits are enforced for user seats

**Preconditions:**
- Gamma LLC organization on Free plan (max 3 users)
- 3 users already exist in Gamma org
- Admin attempting to add 4th user

**Test Steps:**
1. Login as `admin@gamma.test`
2. Navigate to `/settings/users`
3. Click "Invite User"
4. Enter email: `newuser@gamma.test`
5. Click "Send Invitation"

**Expected Results:**
- ✅ Error message: "User limit reached. Upgrade to Pro plan to add more users."
- ✅ Invitation NOT sent
- ✅ User NOT created in database
- ✅ Upgrade prompt displayed
- ✅ Link to `/pricing` or `/subscription`

**Data Sets:**
- Free plan: 3 users max
- Pro plan: 50 users max
- Enterprise plan: Unlimited users

---

#### TC-TENANT-004: Subscription Enforcement - Process Limits (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify subscription plan limits are enforced for process count

**Preconditions:**
- Free plan organization with 5 processes (max limit)
- Admin attempting to create 6th process

**Test Steps:**
1. Login as admin on Free plan
2. Navigate to `/process-discovery`
3. Click "Upload Event Logs"
4. Select valid CSV file
5. Attempt to create new process

**Expected Results:**
- ✅ Error: "Process limit reached (5/5). Upgrade to Pro for unlimited processes."
- ✅ Upload blocked
- ✅ Process NOT created
- ✅ Upgrade CTA displayed

---

#### TC-TENANT-005: Organization Provisioning & Cleanup (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify new organization is properly provisioned with default resources

**Preconditions:**
- Super Admin logged in
- Valid organization data prepared

**Test Steps:**
1. Login as Super Admin
2. Navigate to `/admin/organizations`
3. Click "Create Organization"
4. Fill in:
   - Name: "Test Org Delta"
   - Email: "admin@delta.test"
   - Plan: "Pro"
5. Click "Create"

**Expected Results:**
- ✅ Organization created with unique ID
- ✅ Default subscription record created
- ✅ Admin user invitation sent
- ✅ Default ticket categories created
- ✅ Organization added to database
- ✅ Success notification displayed
- ✅ Organization appears in organizations table

---

### Subscription & Payments

#### TC-PAY-001: Razorpay Subscription Creation (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify subscription can be created via Razorpay payment gateway

**Preconditions:**
- Razorpay test mode configured
- Organization on Free plan
- Admin user logged in

**Test Steps:**
1. Login as admin
2. Navigate to `/subscription`
3. Click "Upgrade to Pro"
4. Select "Monthly" billing cycle
5. Click "Proceed to Payment"
6. Razorpay checkout modal opens
7. Enter test card: 4111 1111 1111 1111
8. CVV: 123, Expiry: 12/25
9. Click "Pay ₹99"

**Expected Results:**
- ✅ Payment processed successfully
- ✅ Webhook received at `/api/payments/webhook`
- ✅ Signature verified correctly
- ✅ Subscription record updated in database
- ✅ Organization plan changed to "Pro"
- ✅ Payment event logged in payment_events table
- ✅ Invoice generated
- ✅ Confirmation email sent
- ✅ User redirected to `/subscription` with success message

**Data Sets:**
- Test Card (Success): 4111 1111 1111 1111
- Test Card (Failure): 4000 0000 0000 0002

---

#### TC-PAY-002: PayU Subscription Creation (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify subscription creation via PayU payment gateway

**Preconditions:**
- PayU test mode configured
- Organization on Free plan

**Test Steps:**
1. Login as admin
2. Navigate to `/subscription`
3. Click "Upgrade to Pro"
4. Select "Annual" billing cycle (20% discount)
5. Click "Proceed to Payment"
6. PayU payment page loads
7. Enter test credentials
8. Complete payment

**Expected Results:**
- ✅ Payment successful
- ✅ Annual billing saved (₹948 instead of ₹1188)
- ✅ Webhook processed
- ✅ Subscription created with annual cycle
- ✅ Next billing date set to +1 year

---

#### TC-PAY-003: Webhook Signature Verification (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify payment webhook rejects invalid signatures (prevents fraud)

**Preconditions:**
- Webhook endpoint `/api/payments/webhook` active
- Mock webhook payload prepared

**Test Steps:**
1. Send POST request to `/api/payments/webhook`
2. Include valid Razorpay event payload
3. Include INVALID signature header
4. Observe response

**Expected Results:**
- ✅ HTTP 401 Unauthorized
- ✅ Error: "Invalid webhook signature"
- ✅ Event NOT processed
- ✅ Database NOT updated
- ✅ Security log entry created

---

#### TC-PAY-004: Subscription Cancellation Flow (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify user can cancel subscription and downgrade to Free plan

**Preconditions:**
- Organization on Pro plan with active subscription
- Admin logged in

**Test Steps:**
1. Login as admin
2. Navigate to `/subscription`
3. Click "Cancel Subscription"
4. Confirm cancellation dialog
5. Provide cancellation reason: "Cost reduction"
6. Type organization name to confirm
7. Click "Confirm Cancellation"

**Expected Results:**
- ✅ Subscription status changed to "cancelled"
- ✅ Access continues until end of current billing period
- ✅ No refund issued (non-refundable policy)
- ✅ Downgrade scheduled for period end
- ✅ Confirmation email sent
- ✅ cancelledAt timestamp set
- ✅ Payment gateway subscription cancelled

---

#### TC-PAY-005: Payment Failure & Retry Logic (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify system handles payment failures gracefully

**Preconditions:**
- Active subscription with upcoming renewal
- Test payment failure scenario

**Test Steps:**
1. Mock upcoming subscription renewal
2. Configure Razorpay to simulate payment failure
3. Trigger renewal webhook with failure status
4. Observe system behavior

**Expected Results:**
- ✅ Payment failure logged
- ✅ Email sent: "Payment failed - Please update payment method"
- ✅ Retry scheduled (3 attempts over 7 days)
- ✅ Subscription status: "past_due"
- ✅ Access maintained during grace period
- ✅ After 3 failed retries: Subscription suspended

---

#### TC-PAY-006: Invoice Generation & Download (P2)
**Priority:** P2 (Medium)  
**Automation:** No (manual PDF validation)  
**Description:** Verify invoices are generated and downloadable

**Preconditions:**
- Subscription payment successful
- Invoice record created in database

**Test Steps:**
1. Login as admin
2. Navigate to `/subscription`
3. Scroll to "Billing History"
4. Locate latest invoice
5. Click "Download PDF"

**Expected Results:**
- ✅ PDF file downloads
- ✅ Invoice includes:
  - Invoice number
  - Organization name and address
  - Line items (subscription plan)
  - Amount and tax
  - Payment method
  - Payment status
- ✅ Professional formatting
- ✅ Company logo included

---

### Support & Ticketing Workflows

#### TC-TICKET-001: Create Support Ticket (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify user can create a support ticket with all required fields

**Preconditions:**
- User logged in
- Access to tickets page

**Test Steps:**
1. Navigate to `/admin/tickets`
2. Click "Create Ticket"
3. Fill in:
   - Subject: "Cannot upload event logs"
   - Category: "Technical Issue"
   - Priority: "High"
   - Description: "Receiving error 500 when uploading CSV files over 10MB"
4. Attach screenshot of error
5. Click "Create Ticket"

**Expected Results:**
- ✅ Ticket created with auto-generated ticket number
- ✅ Status: "Open"
- ✅ Organization scoped (only visible to same org users)
- ✅ File attachment uploaded successfully
- ✅ Email notification sent to support team
- ✅ Ticket appears in ticket list
- ✅ User redirected to ticket detail view

---

#### TC-TICKET-002: Ticket Conversation Threading (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify ticket messages are properly threaded

**Preconditions:**
- Existing ticket with initial message
- Support agent logged in

**Test Steps:**
1. Login as support agent
2. Navigate to ticket detail page
3. Add message: "Thank you for reporting. Can you share the CSV file?"
4. User responds: "Attached is the CSV file"
5. Support agent responds: "Issue identified. Fix deployed."

**Expected Results:**
- ✅ Messages appear in chronological order
- ✅ Each message shows timestamp and author
- ✅ Email notifications sent for each reply
- ✅ Attachment displayed inline
- ✅ Full conversation history preserved
- ✅ Activity log updated

---

#### TC-TICKET-003: Ticket Status Workflow (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify ticket status transitions follow business rules

**Preconditions:**
- Ticket in "Open" status
- Admin/Super Admin logged in

**Test Steps:**
1. Open ticket detail page
2. Change status to "In Progress"
3. Add internal note: "Investigating the issue"
4. Change status to "Waiting" (awaiting customer response)
5. Customer adds message
6. Change status to "Resolved"
7. Customer confirms resolution
8. Close ticket

**Expected Results:**
- ✅ Each status change logged in activity history
- ✅ Timestamps recorded for each transition
- ✅ Email notifications sent on status changes
- ✅ SLA timer pauses during "Waiting" status
- ✅ Only valid status transitions allowed
- ✅ Internal notes NOT visible to customers

---

#### TC-TICKET-004: SLA Breach Detection & Alerting (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify SLA violations are detected and alerted

**Preconditions:**
- Critical priority ticket created
- SLA target: 1 hour first response

**Test Steps:**
1. Create ticket with "Critical" priority
2. Wait for SLA threshold (80% = 48 minutes)
3. Observe system behavior at 48 minutes
4. Wait until SLA breach (>60 minutes)
5. Observe escalation

**Expected Results:**
- ✅ At 48 minutes: Warning email sent
- ✅ Ticket badge turns yellow
- ✅ At 60 minutes: SLA breach logged
- ✅ Ticket badge turns red
- ✅ Escalation email to manager
- ✅ Dashboard shows SLA breach count

---

#### TC-TICKET-005: Ticket Category Management (P2)
**Priority:** P2 (Medium)  
**Automation:** No  
**Description:** Verify ticket categories can be managed by admins

**Preconditions:**
- Admin logged in
- Custom ticket categories feature enabled

**Test Steps:**
1. Navigate to `/settings/ticket-categories`
2. Click "Add Category"
3. Enter:
   - Name: "Data Privacy Request"
   - Description: "GDPR and data privacy inquiries"
   - SLA Target: 24 hours
4. Save category

**Expected Results:**
- ✅ Category created
- ✅ Available in ticket creation dropdown
- ✅ SLA applied automatically
- ✅ Category appears for all users in organization

---

### Analytics & Core Workflows (Smoke Tests)

#### TC-CORE-001: Process Discovery Upload & Visualization (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify event log upload and process map generation

**Preconditions:**
- User logged in
- Valid CSV event log prepared

**Test Steps:**
1. Navigate to `/process-discovery`
2. Click "Upload Event Logs"
3. Select CSV file with columns: CaseID, Activity, Timestamp, Resource
4. Click "Upload"
5. Wait for processing

**Expected Results:**
- ✅ File uploaded successfully
- ✅ Process created with auto-generated name
- ✅ Process map visualized with ReactFlow
- ✅ Start nodes (green), end nodes (red), activities (cyan) displayed
- ✅ Edge thickness represents frequency
- ✅ Process statistics calculated (total cases, activities, avg path length)
- ✅ Process added to dropdown selector

---

#### TC-CORE-002: Conformance Checking Execution (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify token-based conformance checking runs successfully

**Preconditions:**
- Process with event log exists
- Navigate to Process Analysis → Conformance tab

**Test Steps:**
1. Select process from dropdown
2. View conformance checking results
3. Check fitness score

**Expected Results:**
- ✅ Fitness score calculated (0-100%)
- ✅ Violations identified (if any)
- ✅ Missing tokens highlighted
- ✅ Remaining tokens highlighted
- ✅ Conformance metrics displayed

---

#### TC-CORE-003: Performance Analytics - Bottleneck Detection (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify bottleneck identification algorithm

**Preconditions:**
- Process with sufficient data (>100 cases)
- Performance Analytics tab selected

**Test Steps:**
1. Navigate to `/process-analysis` → Performance tab
2. View bottleneck table
3. Check activity with highest wait time

**Expected Results:**
- ✅ Bottlenecks ranked by wait time
- ✅ Percentage of total delay shown
- ✅ Resource utilization displayed
- ✅ Chart visualization of bottlenecks

---

#### TC-CORE-004: Predictive Analytics - Forecasting (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify time-series forecasting for cycle time

**Preconditions:**
- Process with ≥12 data points (for Holt-Winters)
- Predictive Analytics page loaded

**Test Steps:**
1. Navigate to `/predictive-analytics`
2. Select process
3. View forecasting tab
4. Check 30/60/90-day predictions

**Expected Results:**
- ✅ Forecast generated using Holt-Winters (if ≥12 points) or linear regression
- ✅ Confidence intervals shown
- ✅ Chart displays historical + predicted data
- ✅ Algorithm used displayed (transparency)

---

#### TC-CORE-005: Advanced Reporting - PDF Export (P2)
**Priority:** P2 (Medium)  
**Automation:** No (manual PDF validation)  
**Description:** Verify PDF export includes all analysis sections

**Preconditions:**
- Process analysis completed
- Export to PDF clicked

**Test Steps:**
1. Navigate to `/process-analysis`
2. Click "Share" → "Export to PDF"
3. Wait for PDF generation
4. Download and open PDF

**Expected Results:**
- ✅ PDF includes:
  - Process discovery diagram
  - Conformance metrics
  - Performance analytics charts
  - Bottleneck table
  - Executive summary
- ✅ Professional formatting
- ✅ Company logo and branding

---

### API Contract & Integration

#### TC-API-001: Authentication Required for Protected Endpoints (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify all protected endpoints require valid JWT

**Test Steps:**
1. Send GET request to `/api/processes` without Authorization header
2. Send GET request with invalid JWT token
3. Send GET request with expired JWT token

**Expected Results:**
- ✅ No Authorization header: HTTP 401 Unauthorized
- ✅ Invalid JWT: HTTP 401 Unauthorized
- ✅ Expired JWT: HTTP 401 Unauthorized
- ✅ Error message: "Authentication required"

---

#### TC-API-002: CRUD Operations - Processes (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify full CRUD lifecycle for processes

**Test Steps:**
```javascript
// CREATE
POST /api/processes
Headers: { Authorization: Bearer <JWT> }
Body: { name: "Test Process", eventLogFile: <file> }
// Expected: HTTP 201 Created, returns process object

// READ
GET /api/processes/{processId}
// Expected: HTTP 200 OK, returns process details

// UPDATE
PUT /api/processes/{processId}
Body: { name: "Updated Process Name" }
// Expected: HTTP 200 OK, returns updated process

// DELETE
DELETE /api/processes/{processId}
// Expected: HTTP 204 No Content, process deleted
```

**Expected Results:**
- ✅ All CRUD operations succeed with valid auth
- ✅ Proper HTTP status codes returned
- ✅ Response bodies match API contract
- ✅ Organization scoping enforced

---

#### TC-API-003: Input Validation & Error Handling (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify API rejects invalid input with proper error messages

**Test Steps:**
```javascript
// Missing required field
POST /api/tickets
Body: { subject: "", description: "Test" } // Empty subject
// Expected: HTTP 400 Bad Request, error: "Subject is required"

// Invalid data type
POST /api/processes
Body: { name: 12345 } // Number instead of string
// Expected: HTTP 400 Bad Request, error: "Name must be a string"

// SQL Injection attempt
GET /api/users?email=test@example.com' OR '1'='1
// Expected: HTTP 400 or empty result (sanitized by Drizzle)
```

**Expected Results:**
- ✅ Zod schema validation rejects invalid input
- ✅ Clear error messages returned
- ✅ SQL injection attempts sanitized
- ✅ XSS payloads escaped

---

#### TC-API-004: Rate Limiting (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify API rate limiting prevents abuse

**Preconditions:**
- Rate limit configured (e.g., 100 requests/minute per user)

**Test Steps:**
1. Send 100 valid API requests within 60 seconds
2. Send 101st request
3. Wait 60 seconds
4. Send another request

**Expected Results:**
- ✅ First 100 requests: HTTP 200 OK
- ✅ 101st request: HTTP 429 Too Many Requests
- ✅ Error message: "Rate limit exceeded. Try again in X seconds."
- ✅ Retry-After header included
- ✅ After wait period: Request succeeds again

---

#### TC-API-005: Pagination & Filtering (P2)
**Priority:** P2 (Medium)  
**Automation:** Yes  
**Description:** Verify API supports pagination and filtering

**Test Steps:**
```javascript
// Pagination
GET /api/tickets?page=1&limit=10
// Expected: First 10 tickets, includes pagination metadata

// Filtering
GET /api/tickets?status=open&priority=high
// Expected: Only open tickets with high priority

// Combined
GET /api/tickets?status=open&page=2&limit=5
// Expected: Tickets 6-10 filtered by status
```

**Expected Results:**
- ✅ Pagination metadata: { page, limit, total, totalPages }
- ✅ Filtering applied correctly
- ✅ Results limited to specified count
- ✅ Efficient SQL queries (no SELECT *)

---

### UI/UX Regression

#### TC-UI-001: Critical User Journey - Process Discovery End-to-End (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes (Playwright)  
**Description:** Verify complete user flow from login to process visualization

**Test Steps:**
1. Open browser and navigate to login page
2. Login with valid credentials
3. Click "Process Discovery" in sidebar
4. Click "Upload Event Logs"
5. Select CSV file
6. Wait for process to load
7. Verify process map renders
8. Apply date range filter
9. Export to PDF

**Expected Results:**
- ✅ Entire flow completes without errors
- ✅ UI elements render correctly
- ✅ Loading states displayed
- ✅ Error handling for failed uploads
- ✅ Visual regression: Screenshots match baseline

---

#### TC-UI-002: Responsive Design - Mobile View (P2)
**Priority:** P2 (Medium)  
**Automation:** Yes (Playwright viewport testing)  
**Description:** Verify UI adapts to mobile screen sizes

**Test Steps:**
1. Set viewport to 375x667 (iPhone 8)
2. Navigate through key pages:
   - Dashboard
   - Process Discovery
   - Support Tickets
   - Subscription
3. Verify mobile menu works
4. Test touch interactions

**Expected Results:**
- ✅ Mobile navigation menu opens/closes
- ✅ Tables adapt to card view
- ✅ Charts resize responsively
- ✅ No horizontal scroll
- ✅ Touch targets ≥44x44px

---

#### TC-UI-003: Accessibility - WCAG 2.1 AA Compliance (P1)
**Priority:** P1 (High)  
**Automation:** Yes (axe-core)  
**Description:** Verify critical pages meet WCAG 2.1 AA standards

**Test Steps:**
1. Run axe-core accessibility scan on key pages:
   - Login page
   - Dashboard
   - Process Discovery
   - Ticket creation form
2. Check for common violations:
   - Missing alt text
   - Insufficient color contrast
   - Missing ARIA labels
   - Keyboard navigation issues

**Expected Results:**
- ✅ Zero critical accessibility violations
- ✅ Color contrast ≥4.5:1 for normal text
- ✅ All interactive elements keyboard accessible
- ✅ Proper ARIA labels on forms
- ✅ Screen reader friendly navigation

---

#### TC-UI-004: Dark Mode Theme Toggle (P2)
**Priority:** P2 (Medium)  
**Automation:** Yes  
**Description:** Verify dark mode theme applies correctly

**Test Steps:**
1. Login to application (default light mode)
2. Click theme toggle button
3. Verify dark mode applied
4. Refresh page
5. Verify dark mode persists
6. Toggle back to light mode

**Expected Results:**
- ✅ Theme switches instantly
- ✅ All components adapt to dark theme
- ✅ Preference saved in localStorage
- ✅ Theme persists across page reloads
- ✅ No visual glitches during transition

---

### Security & Compliance

#### TC-SEC-001: RBAC Bypass Attempt - Horizontal Privilege Escalation (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify users cannot access resources of same-level users in different organizations

**Test Steps:**
1. Login as `admin@acme.test` (org_test_001)
2. Identify a process ID from Beta Industries (org_test_002)
3. Attempt to access: `GET /api/processes/<beta_process_id>`
4. Attempt to delete: `DELETE /api/processes/<beta_process_id>`

**Expected Results:**
- ✅ HTTP 403 Forbidden or 404 Not Found
- ✅ Error: "Access denied" or "Resource not found"
- ✅ Process NOT accessible
- ✅ Audit log entry created for attempted access

**OWASP Reference:** CWE-862: Missing Authorization

---

#### TC-SEC-002: RBAC Bypass Attempt - Vertical Privilege Escalation (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify Employee cannot access Admin-only features

**Test Steps:**
1. Login as `employee@acme.test`
2. Attempt: `GET /api/admin/organizations` (should fail)
3. Attempt: `POST /api/subscriptions` (should fail for employees)
4. Attempt: `PUT /api/users/{user_id}/role` (change own role to admin)

**Expected Results:**
- ✅ All requests return HTTP 403 Forbidden
- ✅ Role change attempt rejected
- ✅ Error: "Insufficient permissions"
- ✅ Security alert logged

**OWASP Reference:** CWE-284: Improper Access Control

---

#### TC-SEC-003: SQL Injection Prevention (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify SQL injection attempts are sanitized

**Test Steps:**
```javascript
// Attempt SQL injection in search
GET /api/processes?name=test' OR '1'='1
GET /api/users?email=admin@example.com'; DROP TABLE users;--

// Attempt in ticket creation
POST /api/tickets
Body: { subject: "Test'; DELETE FROM tickets;--" }
```

**Expected Results:**
- ✅ Queries return empty results or HTTP 400
- ✅ No database manipulation occurs
- ✅ Drizzle ORM parameterized queries prevent injection
- ✅ Input sanitized before database operations

**OWASP Reference:** OWASP A03:2021 – Injection

---

#### TC-SEC-004: XSS Prevention (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify cross-site scripting payloads are escaped

**Test Steps:**
```javascript
// Stored XSS attempt
POST /api/tickets
Body: { subject: "<script>alert('XSS')</script>" }

// Reflected XSS attempt
GET /api/processes?name=<img src=x onerror=alert('XSS')>
```

**Expected Results:**
- ✅ Script tags rendered as plain text (escaped)
- ✅ No JavaScript execution in browser
- ✅ React auto-escaping prevents XSS
- ✅ CSP headers block inline scripts

**OWASP Reference:** OWASP A03:2021 – Injection (XSS)

---

#### TC-SEC-005: CSRF Protection (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify state-changing operations require CSRF token

**Test Steps:**
1. Obtain valid session cookie
2. Attempt POST request without CSRF token header:
   ```javascript
   POST /api/subscriptions/cancel
   Headers: { Cookie: <valid_session> }
   // No X-CSRF-Token header
   ```

**Expected Results:**
- ✅ HTTP 403 Forbidden
- ✅ Error: "CSRF token missing or invalid"
- ✅ Operation NOT performed
- ✅ GET requests exempt from CSRF check

---

#### TC-SEC-006: Payment Webhook Signature Forgery (P0)
**Priority:** P0 (Blocker)  
**Automation:** Yes  
**Description:** Verify forged payment webhooks are rejected

**Test Steps:**
1. Craft fake payment success webhook:
   ```json
   {
     "event": "payment.captured",
     "payload": {
       "payment": { "id": "pay_test", "amount": 9900, "status": "captured" }
     }
   }
   ```
2. Send to `/api/payments/webhook` with invalid signature
3. Send with no signature
4. Send with signature from wrong gateway

**Expected Results:**
- ✅ All requests rejected with HTTP 401
- ✅ Subscription NOT upgraded
- ✅ Payment NOT marked as successful
- ✅ Security alert logged
- ✅ Only valid signatures from Razorpay/PayU/Payoneer accepted

---

#### TC-SEC-007: GDPR Data Export (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify users can export their personal data

**Test Steps:**
1. Login as user
2. Navigate to `/settings/privacy`
3. Click "Request Data Export"
4. Confirm request
5. Wait for processing
6. Download ZIP file

**Expected Results:**
- ✅ Export includes:
  - User profile data
  - Created processes
  - Tickets and messages
  - Subscription history
- ✅ Data in JSON format
- ✅ Download link expires after 7 days
- ✅ Email notification sent when ready

---

#### TC-SEC-008: GDPR Right to Deletion (P1)
**Priority:** P1 (High)  
**Automation:** Yes  
**Description:** Verify users can request account deletion

**Test Steps:**
1. Login as user
2. Navigate to `/settings/privacy`
3. Click "Delete My Account"
4. Confirm by typing email address
5. Submit deletion request

**Expected Results:**
- ✅ Account marked for deletion
- ✅ 30-day grace period starts
- ✅ Email confirmation sent
- ✅ After 30 days: Account and data permanently deleted
- ✅ Cascading deletion:
  - User profile
  - Created processes
  - Tickets
  - Comments
  - Subscription data

---

## Test Scenario Format

All test scenarios follow this standardized format:

```markdown
#### TC-[CATEGORY]-[NUMBER]: [Test Title] (P[0-2])
**Priority:** P0 (Blocker) | P1 (High) | P2 (Medium)  
**Automation:** Yes | No  
**Description:** Brief description of what is being tested

**Preconditions:**
- State of system before test
- Required test data
- User roles needed

**Test Steps:**
1. Step-by-step instructions
2. With expected user actions
3. Or API calls with code examples

**Expected Results:**
- ✅ Expected outcome 1
- ✅ Expected outcome 2
- ✅ Validation criteria

**Data Sets:** (if applicable)
- Valid data scenario
- Invalid data scenario
- Edge cases
```

---

## Tooling Recommendations

### Test Automation Framework

**Frontend E2E Testing:**
```bash
# Playwright (Recommended)
npm install -D @playwright/test

# Example test
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5000/auth/signin');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('http://localhost:5000/');
});
```

**API Testing:**
```bash
# Vitest + Supertest
npm install -D vitest supertest

# Example API test
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('POST /api/processes', () => {
  it('creates process with valid auth', async () => {
    const response = await request(app)
      .post('/api/processes')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Process', eventLogFile: file })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Process');
  });
});
```

**API Collections:**
```bash
# Postman + Newman (for CI/CD)
npm install -D newman

# Run Postman collection
newman run postman_collection.json -e environment.json
```

**Load Testing:**
```bash
# k6 for performance testing
brew install k6

# Example load test script
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  let res = http.get('http://localhost:5000/api/processes');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

**Security Testing:**
```bash
# OWASP ZAP for automated security scans
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable \
  zap-baseline.py -t http://localhost:5000 -r report.html

# Alternative: Burp Suite Community Edition
```

**Accessibility Testing:**
```bash
# axe-core with Playwright
npm install -D @axe-core/playwright

import { injectAxe, checkA11y } from '@axe-core/playwright';

test('dashboard has no accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await injectAxe(page);
  await checkA11y(page);
});
```

**Contract Testing:**
```bash
# Pact for consumer-driven contracts
npm install -D @pact-foundation/pact

# Useful for multi-service architectures
```

### CI/CD Integration

This section provides comprehensive guidance for integrating the E2E test suite into your CI/CD pipeline.

---

#### Pipeline Architecture & Strategy

**Test Suite Segmentation:**

```
┌─────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline                        │
├─────────────────────────────────────────────────────────┤
│ Stage 1: Pre-Commit Checks (Local)                      │
│  └─ Linting, Formatting, Unit Tests (<1 min)            │
├─────────────────────────────────────────────────────────┤
│ Stage 2: Pull Request Validation                        │
│  ├─ P0 Security Tests (5 min)                           │
│  ├─ API Contract Tests (5 min)                          │
│  └─ Critical UI Flows (10 min)                          │
├─────────────────────────────────────────────────────────┤
│ Stage 3: Pre-Merge Full Regression                      │
│  ├─ All P0 Tests (10 min)                               │
│  ├─ All P1 Tests (15 min)                               │
│  └─ P2 Smoke Tests (5 min)                              │
├─────────────────────────────────────────────────────────┤
│ Stage 4: Post-Merge Deployment Pipeline                 │
│  ├─ Deploy to Staging                                   │
│  ├─ Staging E2E Tests (20 min)                          │
│  ├─ Load Testing (optional)                             │
│  └─ Security Scan (OWASP ZAP)                           │
├─────────────────────────────────────────────────────────┤
│ Stage 5: Production Deployment                          │
│  ├─ Deploy to Production                                │
│  ├─ Smoke Tests (5 min)                                 │
│  └─ Health Check Monitoring                             │
└─────────────────────────────────────────────────────────┘
```

---

#### Comprehensive GitHub Actions Workflow

**File:** `.github/workflows/e2e-testing.yml`

```yaml
name: E2E Testing Suite

on:
  # Trigger on pull requests
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]
  
  # Trigger on pushes to main/develop
  push:
    branches: [main, develop]
  
  # Manual trigger with environment selection
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      test_suite:
        description: 'Test suite to run'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - p0-only
          - security
          - smoke

# Cancel previous runs if new commit pushed
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # Job 1: Setup and Linting
  setup-and-lint:
    name: Setup and Code Quality
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run linter
        run: pnpm run lint
      
      - name: Check TypeScript types
        run: pnpm run type-check
  
  # Job 2: API Contract Tests
  api-tests:
    name: API Contract Tests
    runs-on: ubuntu-latest
    needs: setup-and-lint
    timeout-minutes: 10
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: epi_q_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
        run: |
          pnpm run db:push --force
      
      - name: Run API tests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
          JWT_SECRET: test_secret_for_ci_only
        run: pnpm run test:api
      
      - name: Upload API test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: api-test-results
          path: test-results/api/
          retention-days: 30
  
  # Job 3: Security Tests (P0)
  security-tests:
    name: Security Tests (P0)
    runs-on: ubuntu-latest
    needs: setup-and-lint
    timeout-minutes: 15
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: epi_q_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
        run: pnpm run db:push --force
      
      - name: Run security tests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
          JWT_SECRET: test_secret_for_ci_only
        run: pnpm run test:security
      
      - name: Upload security test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-test-results
          path: test-results/security/
          retention-days: 90  # Keep security results longer
  
  # Job 4: E2E UI Tests (Matrix Strategy)
  e2e-ui-tests:
    name: E2E UI Tests - ${{ matrix.project }}
    runs-on: ubuntu-latest
    needs: [api-tests, security-tests]
    timeout-minutes: 30
    
    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox]  # Test across browsers
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: epi_q_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.project }}
      
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
        run: pnpm run db:push --force
      
      - name: Start application server
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
          JWT_SECRET: test_secret_for_ci_only
          NODE_ENV: test
        run: |
          pnpm run build
          pnpm run start &
          # Wait for server to be ready
          npx wait-on http://localhost:5000 --timeout 60000
      
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/epi_q_test
        run: npx playwright test --project=${{ matrix.project }}
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.project }}
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-screenshots-${{ matrix.project }}
          path: test-results/
          retention-days: 14
  
  # Job 5: Accessibility Tests
  accessibility-tests:
    name: Accessibility (WCAG 2.1 AA)
    runs-on: ubuntu-latest
    needs: setup-and-lint
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run accessibility tests
        run: pnpm run test:a11y
      
      - name: Upload accessibility report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: accessibility-report/
          retention-days: 30
  
  # Job 6: Test Results Summary
  test-summary:
    name: Test Results Summary
    runs-on: ubuntu-latest
    if: always()
    needs: [api-tests, security-tests, e2e-ui-tests, accessibility-tests]
    
    steps:
      - name: Download all test artifacts
        uses: actions/download-artifact@v4
      
      - name: Generate summary report
        run: |
          echo "# E2E Test Suite Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## Test Execution Summary" >> $GITHUB_STEP_SUMMARY
          echo "- API Tests: ${{ needs.api-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- Security Tests: ${{ needs.security-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- E2E UI Tests: ${{ needs.e2e-ui-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- Accessibility Tests: ${{ needs.accessibility-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          
          if [ "${{ needs.security-tests.result }}" != "success" ]; then
            echo "⚠️ **SECURITY TESTS FAILED** - Review immediately!" >> $GITHUB_STEP_SUMMARY
          fi
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🧪 E2E Test Results
              
              | Test Suite | Status |
              |------------|--------|
              | API Tests | ${{ needs.api-tests.result == 'success' && '✅ Passed' || '❌ Failed' }} |
              | Security Tests | ${{ needs.security-tests.result == 'success' && '✅ Passed' || '❌ Failed' }} |
              | E2E UI Tests | ${{ needs.e2e-ui-tests.result == 'success' && '✅ Passed' || '❌ Failed' }} |
              | Accessibility | ${{ needs.accessibility-tests.result == 'success' && '✅ Passed' || '❌ Failed' }} |
              
              [View detailed test reports →](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})
              `
            })
```

---

#### Gating Strategy & Quality Gates

**Pull Request Gates:**

```yaml
# .github/workflows/pr-gates.yml
name: PR Quality Gates

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  enforce-quality-gates:
    name: Enforce Quality Gates
    runs-on: ubuntu-latest
    steps:
      - name: Check P0 tests passed
        if: needs.security-tests.result != 'success'
        run: |
          echo "❌ P0 Security tests failed - PR cannot be merged"
          exit 1
      
      - name: Check code coverage
        run: |
          coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < 80" | bc -l) )); then
            echo "❌ Code coverage is $coverage% (minimum 80% required)"
            exit 1
          fi
      
      - name: Block merge if flaky tests
        run: |
          flaky_count=$(grep -c "flaky" test-results/* || true)
          if [ "$flaky_count" -gt 5 ]; then
            echo "⚠️ Too many flaky tests ($flaky_count) - investigate before merge"
            exit 1
          fi
```

**Deployment Gates:**

```yaml
# Staging Deployment Gate
- name: Staging smoke test
  run: pnpm run test:smoke --env=staging
  env:
    TEST_URL: https://staging.epi-q.com

# Production Deployment Gate
- name: Production smoke test
  run: pnpm run test:smoke --env=production
  env:
    TEST_URL: https://app.epi-q.com
  # Only run smoke tests, not full suite
```

---

#### Test Artifact Management & Retention

**Artifact Retention Policy:**

| Artifact Type | Retention Period | Reason |
|---------------|------------------|--------|
| Security test results | 90 days | Compliance and audit trail |
| API test results | 30 days | Debugging recent issues |
| E2E screenshots (passed) | 7 days | Quick reference |
| E2E screenshots (failed) | 30 days | Bug investigation |
| Playwright reports | 30 days | Trend analysis |
| Accessibility reports | 30 days | Compliance tracking |
| Coverage reports | 30 days | Quality metrics |

**Automated Cleanup:**

```yaml
# .github/workflows/cleanup-artifacts.yml
name: Cleanup Old Artifacts

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Delete old artifacts
        uses: actions/github-script@v7
        with:
          script: |
            const days = 30;
            const timestamp = new Date();
            timestamp.setDate(timestamp.getDate() - days);
            
            const artifacts = await github.rest.actions.listArtifactsForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              per_page: 100
            });
            
            for (const artifact of artifacts.data.artifacts) {
              if (new Date(artifact.created_at) < timestamp) {
                await github.rest.actions.deleteArtifact({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  artifact_id: artifact.id
                });
              }
            }
```

---

#### Test Reporting & Dashboards

**Slack Integration:**

```yaml
# Add to your main workflow
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚨 E2E Tests Failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*E2E Test Suite Failed*\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref_name }}\n*Commit:* <${{ github.event.head_commit.url }}|${{ github.event.head_commit.message }}>\n*Author:* ${{ github.actor }}"
            }
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "View Test Results"
                },
                "url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              }
            ]
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Test Results Dashboard (HTML):**

```javascript
// scripts/generate-test-dashboard.js
const fs = require('fs');
const { exec } = require('child_process');

async function generateDashboard() {
  const results = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    suites: []
  };
  
  // Parse Playwright JSON report
  const playwrightReport = JSON.parse(fs.readFileSync('playwright-report/results.json'));
  
  // Generate HTML dashboard
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>EPI-Q Test Dashboard</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <h1>Test Execution Dashboard</h1>
        <div class="summary">
          <div class="metric">
            <h2>${results.passed}</h2>
            <p>Passed</p>
          </div>
          <div class="metric">
            <h2>${results.failed}</h2>
            <p>Failed</p>
          </div>
          <div class="metric">
            <h2>${results.totalTests}</h2>
            <p>Total</p>
          </div>
        </div>
        <canvas id="trendsChart"></canvas>
      </body>
    </html>
  `;
  
  fs.writeFileSync('test-dashboard.html', html);
}

generateDashboard();
```

---

#### Continuous Monitoring in Production

**Synthetic Monitoring:**

```yaml
# .github/workflows/production-monitoring.yml
name: Production Synthetic Tests

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

jobs:
  synthetic-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run critical user journeys
        run: npx playwright test --grep "@smoke" --project=chromium
        env:
          TEST_URL: https://app.epi-q.com
          
      - name: Alert on failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.PAGERDUTY_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"event_action":"trigger","payload":{"summary":"Production smoke test failed","severity":"critical"}}'
```

---

#### Summary: CI/CD Best Practices

**Key Principles:**

1. **Fast Feedback:** P0 tests run first (< 10 min)
2. **Parallel Execution:** Run independent test suites in parallel
3. **Quality Gates:** Block merges on P0 test failures
4. **Artifact Management:** Retain security results longer (90 days)
5. **Monitoring:** Continuous synthetic tests in production
6. **Notifications:** Slack/email alerts for failures
7. **Traceability:** Link test results to PRs and commits
8. **Dashboard:** Centralized test results visualization

**Metrics to Track:**

- Test pass rate trend
- Mean time to detect (MTTD) bugs
- Test execution time
- Flaky test rate
- Code coverage percentage
- Security vulnerability count

**Implementation Checklist:**

- [ ] Set up GitHub Actions workflows
- [ ] Configure test database in CI
- [ ] Add Playwright browser installation
- [ ] Implement quality gates
- [ ] Set up artifact retention policies
- [ ] Configure Slack notifications
- [ ] Create test results dashboard
- [ ] Schedule synthetic monitoring
- [ ] Document runbook for test failures
- [ ] Train team on CI/CD processes

---

## Prioritization Model

### Priority Levels

**P0 - Blocker (Critical):**
- Must pass before any release
- Blocks core functionality
- Security vulnerabilities
- Data corruption risks
- Payment processing failures

**Examples:**
- Authentication fails
- Cross-tenant data leakage
- Payment gateway not processing
- Database corruption

**Action:** Fix immediately, block release

---

**P1 - High (Important):**
- Major business impact
- Affects significant user workflows
- Performance degradation
- Important feature broken

**Examples:**
- Process discovery upload fails
- Reporting exports broken
- SLA alerts not firing
- Subscription upgrades delayed

**Action:** Fix in current sprint, may delay release

---

**P2 - Medium (Normal):**
- Minor business impact
- Edge cases
- Nice-to-have features
- Visual/UX improvements

**Examples:**
- PDF formatting issues
- Minor UI alignment
- Non-critical notifications
- Mobile layout improvements

**Action:** Fix in backlog, does not block release

---

### Test Execution Strategy

**Pre-Commit:**
- Unit tests (fast, < 1 minute)
- Linting and formatting

**Pre-Push:**
- API contract tests (< 5 minutes)
- Security static analysis

**Pull Request:**
- Full E2E test suite (< 20 minutes)
- Accessibility checks
- Visual regression tests

**Pre-Release:**
- Full regression suite
- Load testing
- Security penetration testing
- Manual smoke tests

**Post-Release:**
- Automated smoke tests in production
- Monitoring and alerting
- Synthetic user flows

---

## Security Considerations

### Tenant Boundary Fuzzing

**Goal:** Ensure no cross-tenant data leakage under any circumstance

**Test Scenarios:**
1. **Parameter Tampering:**
   - Change `organizationId` in API requests
   - Use other organization's resource IDs
   - Attempt IDOR (Insecure Direct Object Reference)

2. **SQL Injection Variations:**
   ```sql
   -- Union-based injection
   ?name=test' UNION SELECT * FROM users WHERE organizationId='org_test_002'--
   
   -- Boolean-based blind injection
   ?email=test@example.com' AND (SELECT COUNT(*) FROM organizations)>0--
   
   -- Time-based blind injection
   ?search=test'; WAITFOR DELAY '00:00:05'--
   ```

3. **NoSQL Injection (if applicable):**
   ```javascript
   { "email": { "$ne": null } }
   { "organizationId": { "$regex": ".*" } }
   ```

### Rate Limit Evasion Tests

**Test distributed attacks:**
```bash
# Attempt to bypass rate limits using multiple IPs
for i in {1..200}; do
  curl -H "X-Forwarded-For: 192.168.1.$((i%255))" \
       http://localhost:5000/api/processes
done
```

**Expected:** Rate limiting still enforced per user/session

### Payment Webhook Security

**Signature Replay Attack:**
1. Capture valid webhook from Razorpay
2. Replay same webhook multiple times
3. Attempt to credit account multiple times

**Expected:**
- ✅ Idempotency key prevents duplicate processing
- ✅ Event ID logged in payment_events table
- ✅ Duplicate events ignored

**Man-in-the-Middle Attempt:**
- Webhook endpoint must use HTTPS in production
- TLS 1.2+ required
- Certificate validation enforced

### API Key Storage Verification

**Test encrypted storage:**
```javascript
// Verify API keys are encrypted at rest
const apiKey = await db.query.llmProviderKeys.findFirst({
  where: eq(llmProviderKeys.userId, testUserId)
});

// Should NOT be plain text
expect(apiKey.encryptedKey).not.toBe(plainTextKey);
expect(apiKey.encryptedKey).toMatch(/^[a-f0-9]{32}:/); // AES-256-GCM format
```

### Audit Log Tamper Tests

**Verify audit logs are immutable:**
```javascript
// Attempt to modify audit log entry
const auditLog = await db.query.ticketActivityLog.findFirst();
const tamperedData = { ...auditLog, action: 'MODIFIED' };

const result = await db.update(ticketActivityLog)
  .set(tamperedData)
  .where(eq(ticketActivityLog.id, auditLog.id));

// Expected: Operation fails or logged separately
```

---

## Reporting & Traceability

### Test Results Dashboard

**Metrics to Track:**
- Total tests: Passed / Failed / Skipped
- Test coverage: % of code covered
- Flaky tests: Tests that intermittently fail
- Execution time: Total and per test
- Trend analysis: Pass rate over time

**Tools:**
- Playwright HTML Reporter
- Allure Report
- Custom dashboard (Chart.js + DB)

### Linking Tests to User Stories

**Format:**
```markdown
#### TC-AUTH-001: User Registration (P0)
**Related User Story:** US-123 - As a new user, I want to create an account
**Acceptance Criteria:**
- AC1: User can register with email and password ✅
- AC2: Password must meet complexity requirements ✅
- AC3: Email confirmation sent ✅
```

### Incident Triage Playbook

**When a test fails:**

1. **Classify Failure:**
   - Product bug
   - Test environment issue
   - Flaky test (timing, race condition)
   - Test code bug

2. **Severity Assessment:**
   - P0: Production broken, immediate fix
   - P1: Feature broken, fix within 24 hours
   - P2: Minor issue, backlog

3. **Root Cause Analysis:**
   - Reproduce locally
   - Check logs and stack trace
   - Identify code change that introduced bug
   - Document in issue tracker

4. **Communication:**
   - Notify team via Slack/Teams
   - Create JIRA ticket
   - Update test status in dashboard

5. **Remediation:**
   - Fix code bug
   - Update test if false positive
   - Add regression test if new scenario

---

## Appendix

### Sample CSV Event Log for Testing

```csv
CaseID,Activity,Timestamp,Resource,Cost
C001,Order Received,2024-01-01 09:00:00,John,0
C001,Payment Processed,2024-01-01 09:15:00,System,10
C001,Order Shipped,2024-01-01 10:00:00,Mary,5
C001,Order Delivered,2024-01-02 14:00:00,Courier,20
C002,Order Received,2024-01-01 10:00:00,John,0
C002,Payment Failed,2024-01-01 10:05:00,System,0
C002,Order Cancelled,2024-01-01 10:10:00,System,0
C003,Order Received,2024-01-01 11:00:00,Sarah,0
C003,Payment Processed,2024-01-01 11:20:00,System,10
C003,Order Shipped,2024-01-01 15:00:00,Mary,5
C003,Order Delivered,2024-01-03 09:00:00,Courier,20
```

### Test Execution Checklist

**Before Testing:**
- [ ] Test environment configured
- [ ] Test data seeded
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Payment gateways in test mode
- [ ] Email capture configured

**During Testing:**
- [ ] Run P0 tests first
- [ ] Monitor test execution progress
- [ ] Capture screenshots/videos for failures
- [ ] Log detailed error messages

**After Testing:**
- [ ] Review test results
- [ ] Triage failures
- [ ] Update test documentation
- [ ] Clean up test data
- [ ] Generate test report

---

## Conclusion

This end-to-end testing guide provides comprehensive coverage of EPI-Q's critical functionality, ensuring enterprise-grade quality, security, and reliability. By following this guide, QA teams can systematically validate all aspects of the multi-tenant SaaS platform before each release.

**Key Takeaways:**
- ✅ Prioritize P0 security and multi-tenancy tests
- ✅ Automate repetitive tests with Playwright and Vitest
- ✅ Validate payment gateway integrations thoroughly
- ✅ Ensure GDPR compliance features work correctly
- ✅ Monitor test metrics and trends over time

**Next Steps:**
1. Implement automated test suite using recommended tools
2. Integrate tests into CI/CD pipeline
3. Schedule regular security penetration testing
4. Review and update test scenarios quarterly
5. Train QA team on new testing procedures

For questions or support, contact the QA team at qa@epi-q.com.
