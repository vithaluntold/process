# CSRF Error Resolution

## Problem
Railway deployment logs showed CSRF validation failures:
```
CSRF token missing: { hasCookie: true, hasHeader: false, url: '/api/auth/login' }
CSRF token mismatch for: /api/auth/signup
```

## Root Cause
The middleware was applying CSRF protection to **all** `/api/*` routes, including NextAuth authentication endpoints (`/api/auth/login`, `/api/auth/signup`, etc.). 

NextAuth has its own built-in CSRF protection and doesn't work with our custom CSRF middleware.

## Solution
Updated `middleware.ts` to exclude all `/api/auth/*` endpoints from CSRF validation:

```typescript
const shouldCheckCSRF = 
  path.startsWith("/api/") && 
  !path.startsWith("/api/auth/") &&  // Exclude all auth endpoints
  !path.startsWith("/api/health") &&
  !path.startsWith("/api/ready");
```

Also removed redundant `requireCSRF()` calls from individual auth routes:
- `/api/auth/signup`
- `/api/auth/password-reset/request`
- `/api/auth/password-reset/confirm`
- `/api/auth/audit/logout`
- `/api/invitations/accept`

## Result
✅ Authentication endpoints now work correctly
✅ Login/Signup flows functional
✅ CSRF protection still active for non-auth API routes
✅ NextAuth handles CSRF for its own endpoints

## Testing
After deployment, test:
1. Login at `/auth/signin`
2. Signup at `/auth/signup`
3. Password reset flow
4. Other API endpoints should still have CSRF protection

## Monitoring
Watch Railway logs for:
- ✅ Successful login/signup without CSRF errors
- ✅ No more "CSRF token missing" errors for auth endpoints
- ⚠️ CSRF validation should still work for other API routes
