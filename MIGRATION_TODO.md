# API Client Migration TODO

## Status: IN PROGRESS

This document tracks the migration of all frontend components from raw `fetch()` calls to the centralized `apiClient` for CSRF protection.

## ✅ Completed (3/48)

1. `components/process-discovery.tsx` - POST request for process discovery
2. `components/upload-modal.tsx` - FormData file upload  
3. `components/command-palette.tsx` - Logout action

## 🔄 In Progress - High Priority

These are critical user flows that should be migrated first:

### Authentication & User Management
- [ ] `app/auth/signin/page.tsx` - Login (NO CSRF - already excluded)
- [ ] `app/auth/signup/page.tsx` - Registration  
- [ ] `app/auth/accept-invite/page.tsx` - Accept invitation (NO CSRF - already excluded)
- [ ] `app/settings/page.tsx` - User settings updates

### File Uploads (FormData handling)
- [ ] `components/document-upload-page.tsx` - Document uploads (3 endpoints)
- [ ] `components/email-workflow-parser.tsx` - Email parsing upload

### Admin Operations  
- [ ] `app/(dashboard)/admin/organizations/page.tsx` - Create orgs
- [ ] `app/(dashboard)/admin/teams/page.tsx` - Team CRUD (POST/PUT/DELETE)
- [ ] `app/(dashboard)/admin/invitations/page.tsx` - Create/delete invites (2 endpoints)
- [ ] `app/(dashboard)/admin/tickets/page.tsx` - Create tickets

## 📋 Remaining Components (35+)

### Process Analysis
- [ ] `app/conformance-checking/page.tsx` - 2 POST endpoints
- [ ] `app/predictive-analytics/page.tsx` - 3 POST endpoints  
- [ ] `app/cost-analysis/page.tsx` - 1 POST endpoint
- [ ] `components/performance-analytics.tsx` - 1 POST endpoint
- [ ] `components/process-analysis-dashboard.tsx` - 5 POST endpoints

### Digital Twin & Simulation
- [ ] `app/what-if-scenarios/page.tsx` - 1 POST endpoint
- [ ] `components/digital-twin-comprehensive.tsx` - 2 POST endpoints

### Task Mining
- [ ] `app/task-mining/page.tsx` - 1 PATCH endpoint

### Reporting
- [ ] `app/reports/page.tsx` - 2 endpoints (POST + DELETE)
- [ ] `app/custom-kpis/page.tsx` - 2 endpoints (POST + DELETE)

### AI & LLM
- [ ] `app/ai-assistant/page.tsx` - 1 POST endpoint
- [ ] `components/llm-providers-section.tsx` - 4 endpoints (3 POST + 1 DELETE)

### API Management
- [ ] `components/api-key-manager.tsx` - 2 endpoints (POST + DELETE)

### Collaboration
- [ ] `components/process-comments.tsx` - 2 endpoints (POST + DELETE)
- [ ] `components/collaboration-panel.tsx` - 2 endpoints (POST + DELETE)

### Subscription & Billing
- [ ] `app/(dashboard)/subscription/page.tsx` - 1 POST endpoint
- [ ] `app/(dashboard)/pricing/page.tsx` - 1 POST endpoint

### Demo/Other
- [ ] `app/demo/berkadia/page.tsx` - 1 POST endpoint

## Migration Pattern

### Standard POST/PUT/PATCH/DELETE

**Before:**
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**After:**
```typescript
const response = await apiClient.post('/api/endpoint', data);
```

### FormData Uploads

**Before:**
```typescript
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

**After:**
```typescript
const formData = new FormData();
formData.append('file', file);
const response = await apiClient.upload('/api/upload', formData);
```

### DELETE Requests

**Before:**
```typescript
const response = await fetch(`/api/items/${id}`, {
  method: 'DELETE'
});
```

**After:**
```typescript
const response = await apiClient.delete(`/api/items/${id}`);
```

### PUT/PATCH Requests

**Before:**
```typescript
const response = await fetch('/api/items/123', {
  method: 'PUT',
  body: JSON.stringify(data)
});
```

**After:**
```typescript
const response = await apiClient.put('/api/items/123', data);
```

## Testing Checklist

After migration, verify:
- [ ] Process discovery works
- [ ] File uploads work (FormData)
- [ ] Admin operations work
- [ ] Logout clears CSRF token
- [ ] All POST/PUT/PATCH/DELETE requests include CSRF header
- [ ] 403 CSRF errors trigger token refresh

## Notes

- Login and accept-invite endpoints already exclude CSRF (pre-auth)
- API client automatically handles FormData Content-Type
- CSRF tokens are cached and auto-refreshed on 403 errors
- Logout clears cached tokens automatically
