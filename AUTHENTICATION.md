# Authentication Implementation

## Overview
This application uses NextAuth v4 with JWT sessions for enterprise-grade authentication with comprehensive audit logging.

## Authentication Flow

### Signup
1. User fills out signup form at `/auth/signup`
2. Form submits to `/api/auth/signup`
3. Server validates password (minimum 12 characters)
4. Password is hashed with bcrypt (12 rounds)
5. User record created in database
6. Audit log created with IP address and user-agent
7. User redirected to signin page

### Login
1. User fills out login form at `/auth/signin`
2. Form calls NextAuth `signIn("credentials", {email, password})`
3. NextAuth's authorize callback validates credentials and logs audit event:
   - Extracts IP from x-forwarded-for or x-real-ip headers
   - Extracts user-agent from request headers
   - Logs success/failure with IP/user-agent (no bypass possible)
4. On success, user redirected to dashboard

### Logout
To implement logout with audit logging, use the `signOutWithAudit` function:

```typescript
import { signOutWithAudit } from "@/lib/auth-client";

// In your component:
<button onClick={() => signOutWithAudit()}>
  Log out
</button>
```

This function:
1. Calls `/api/auth/audit/logout` to log the logout event with IP/user-agent
2. Then calls NextAuth's `signOut()` to clear the session
3. Redirects user to `/auth/signin`

## Security Features

### Password Security
- Minimum 12 characters (OWASP recommended)
- Hashed with bcrypt, cost factor 12

### Session Security
- JWT strategy with 30-day expiration
- Secure, HttpOnly cookies
- SameSite=Lax to prevent CSRF

### Audit Logging
All authentication events are logged with:
- User ID
- Action (signup, login.success, login.failed, logout)
- IP address (from x-forwarded-for or x-real-ip headers)
- User agent
- Timestamp
- Metadata (email, failure reason, etc.)

Audit logs are retained for 90 days (GDPR Article 32 compliant).

## API Routes

### `/api/auth/[...nextauth]`
NextAuth handler for session management. The CredentialsProvider's authorize callback handles ALL login audit logging automatically - no separate endpoint needed.

### `/api/auth/signup` (POST)
Creates new user account with audit logging (IP/user-agent captured from request headers)

### `/api/auth/audit/logout` (POST)
Logs logout with IP/user-agent (called by signOutWithAudit helper)

## Data Access Layer

### Server-side session access:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
```

### Protected API routes:
```typescript
import { withAuth, withAdmin } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    // Your protected logic here
    return NextResponse.json({ user });
  });
}
```

### DAL helpers:
```typescript
import { requireAuth, requireAdmin } from "@/lib/dal";

// Throws if not authenticated:
const user = await requireAuth();

// Throws if not admin:
const admin = await requireAdmin();
```

## Audit Log Cleanup

Run the cleanup script to purge old audit logs (90+ days):
```bash
npm run audit:cleanup
```

**Production recommendation:** Schedule this script to run daily via cron or worker process.

## Environment Variables

Required:
- `AUTH_SECRET` - Secret key for JWT signing (generated with `openssl rand -base64 32`)
- `DATABASE_URL` - PostgreSQL connection string

## GDPR Compliance

- Lawful basis: Legitimate interest (service operation)
- Data minimization: Only essential authentication data collected
- Retention: 90 days for audit logs, 30 days for failed login attempts
- User rights: Data access, rectification, erasure supported
- Security: Industry-standard encryption (bcrypt) and secure sessions
