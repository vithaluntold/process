# Tenant Isolation Migration Tracker

**Status**: 🟡 IN PROGRESS  
**Started**: November 15, 2025  
**Target Completion**: Phase 1 by November 18, 2025  

## Overview

This document tracks the migration of all API endpoints from the legacy insecure pattern (userId-only filtering) to the new tenant-safe pattern (organizationId + userId filtering) to prevent cross-organization data leakage.

### Migration Pattern

**BEFORE (INSECURE)**:
```typescript
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const data = await storage.getProcessesByUser(user.id);  // ⚠️ Only filters by userId
  return NextResponse.json(data);
}
```

**AFTER (SECURE)**:
```typescript
export const GET = createTenantSafeHandler(async (request, context) => {
  // context contains: organizationId, userId, userEmail, role
  const data = await getProcessesByTenant();  // ✅ Automatically filters by organizationId
  return NextResponse.json(data);
});
```

## Migration Progress

### ✅ Phase 1: Core Infrastructure (COMPLETED)
- [x] Create tenant context system (`lib/tenant-context.ts`)
- [x] Create tenant-safe storage layer (`server/tenant-storage.ts`)
- [x] Create API wrapper functions (`lib/with-tenant-context.ts`)
- [x] Create API factory pattern (`lib/tenant-api-factory.ts`)
- [x] Update documentation (`replit.md`)

### 🟡 Phase 2: API Endpoint Migration (IN PROGRESS)

#### ✅ MIGRATED (Secure)
- [x] `/api/processes` (GET, POST) - v2 Factory Pattern
- [x] `/api/processes/[id]` (GET, PATCH, DELETE) - v2 Factory Pattern
- [x] `/api/processes/[id]/analyze` (POST) - v2 Factory Pattern ✅ **Fixed automation opportunities error**
- [x] `/api/upload` (POST) - v2 Factory Pattern ✅ **Fixed CSV upload not showing processes**
- [x] `/api/v1/processes` (GET, POST) - Reference implementation

#### 🔴 HIGH PRIORITY (Data Access - Must Migrate Immediately)
These endpoints handle sensitive data and MUST be migrated to prevent cross-tenant data leakage:

- [ ] `/api/event-logs` (GET, POST)
- [ ] `/api/event-logs/[id]` (GET, PATCH, DELETE)
- [ ] `/api/documents` (GET, POST)
- [ ] `/api/documents/[id]` (GET, DELETE)
- [ ] `/api/documents/[id]/download` (GET)
- [ ] `/api/simulations` (GET, POST)
- [ ] `/api/simulations/[id]` (GET, PATCH, DELETE)
- [ ] `/api/dashboard/stats` (GET)
- [ ] `/api/dashboard/export` (GET)

#### 🟠 MEDIUM PRIORITY (Analysis Endpoints)
These endpoints process data and should be migrated soon:

- [ ] `/api/processes/[id]/analyze` (POST)
- [ ] `/api/processes/[id]/discover` (POST)
- [ ] `/api/processes/[id]/detect-anomalies` (POST)
- [ ] `/api/processes/[id]/check-conformance` (POST)
- [ ] `/api/processes/[id]/forecast` (POST)
- [ ] `/api/processes/[id]/scenario-analysis` (POST)
- [ ] `/api/analytics/performance` (POST)
- [ ] `/api/analytics/automation` (POST)
- [ ] `/api/analytics/analyze` (POST)
- [ ] `/api/conformance/deviations` (POST)

#### 🟢 LOW PRIORITY (Auth & Public Endpoints)
These endpoints are either public or handle authentication:

- [x] `/api/auth/*` (No migration needed - handles authentication)
- [ ] `/api/upload` (Needs review for file ownership)
- [ ] `/api/gdpr/export` (GET)
- [ ] `/api/gdpr/delete-account` (POST)

### 📊 Progress Stats
- **Total Endpoints**: 78
- **Migrated**: 5 (6%)
- **High Priority Remaining**: 8
- **Medium Priority Remaining**: 9
- **Low Priority**: 4
- **No Migration Needed**: ~52 (auth, webhooks, etc.)

### 🐛 Bugs Fixed During Migration
- ✅ **Automation Opportunities Error** - Fixed by migrating `/api/processes/[id]/analyze` to tenant-safe pattern
- ✅ **CSV Upload Not Showing Processes** - Fixed by migrating `/api/upload` to tenant-safe pattern (processes were created without organizationId)

## Required Tenant-Safe Storage Functions

### ✅ Implemented
- `getProcessesByTenant()`
- `getProcessCountByTenant()`
- `createProcessForTenant()`
- `getProcessByIdWithTenantCheck()`
- `updateProcessWithTenantCheck()`
- `deleteProcessWithTenantCheck()`

### 🔴 Missing (Need to Add)
- `getEventLogsByTenant()`
- `createEventLogForTenant()`
- `getDocumentsByTenant()`
- `createDocumentForTenant()`
- `getDocumentByIdWithTenantCheck()`
- `deleteDocumentWithTenantCheck()`
- `getSimulationsByTenant()`
- `createSimulationForTenant()`
- `getSimulationByIdWithTenantCheck()`
- `updateSimulationWithTenantCheck()`
- `deleteSimulationWithTenantCheck()`
- `getDashboardStatsByTenant()`

## Security Risks by Priority

### 🚨 CRITICAL (Immediate Data Leakage Risk)
1. **Event Logs** - Contains all process execution data
2. **Documents** - User-uploaded files could leak across organizations
3. **Simulations** - Business-critical scenario data

### ⚠️ HIGH (Potential Information Disclosure)
4. **Dashboard Stats** - Could reveal competitor metrics
5. **Analysis Results** - Could expose process insights

### ℹ️ MEDIUM (Lower Risk)
6. **Upload** - File upload ownership needs validation
7. **GDPR Endpoints** - Should already be user-scoped

## Testing Checklist

After each endpoint migration:
- [ ] Verify organizationId is automatically enforced
- [ ] Test with multiple organizations to confirm isolation
- [ ] Check that foreign organization IDs are rejected
- [ ] Verify cache keys include userId + role + organizationId
- [ ] Test role changes don't leak privileged data

## Next Actions

1. **Add missing tenant-safe storage functions** for event logs, documents, simulations
2. **Migrate high-priority endpoints** (event-logs, documents, simulations)
3. **Add integration tests** to verify tenant isolation
4. **Create pre-commit hook** to prevent new insecure endpoints

## References

- **Tenant Context**: `lib/tenant-context.ts`
- **API Factory**: `lib/tenant-api-factory.ts`
- **Storage Layer**: `server/tenant-storage.ts`
- **Migration Example**: `app/api/processes/route.ts`
