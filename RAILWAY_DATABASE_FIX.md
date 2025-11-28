# 🚨 Railway PostgreSQL Connection Fix Guide

## Issue: Connection timeout errors to PostgreSQL database

The error "Connection terminated due to connection timeout" indicates that either:
1. The DATABASE_URL credentials are incorrect or expired
2. The PostgreSQL service is not running
3. Network connectivity issues

## Step-by-Step Fix:

### 1. Get Current Railway PostgreSQL Credentials

**Option A: Via Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Open your project
3. Click on the **PostgreSQL service** (not your web service)
4. Go to **"Connect"** tab
5. Copy the **"Postgres Connection URL"**

**Option B: Via Railway CLI**
```bash
railway login
railway environment
railway variables --service postgresql
```

### 2. Set the Correct DATABASE_URL

The URL format should be:
```
postgresql://postgres:PASSWORD@HOST:PORT/railway
```

**Example:**
```
DATABASE_URL=postgresql://postgres:NEW_PASSWORD@containers-us-west-xxx.railway.app:xxxx/railway
```

### 3. Update Railway Environment Variables

**Via Dashboard:**
1. Go to your **web service** (not PostgreSQL service)
2. Go to **"Variables"** tab
3. Update or add `DATABASE_URL` with the correct value from step 1
4. Click **"Deploy"**

**Via CLI:**
```bash
railway variables set DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/railway"
```

### 4. Required Environment Variables

Make sure these are also set in your web service:

```bash
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
NODE_ENV=production
SESSION_SECRET=your-32-char-secret
AUTH_SECRET=your-32-char-secret
MASTER_ENCRYPTION_KEY=your-32-char-secret
```

### 5. Generate Secrets (if needed)

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this 3 times for SESSION_SECRET, AUTH_SECRET, and MASTER_ENCRYPTION_KEY.

### 6. Verify Connection

After updating the DATABASE_URL, Railway will automatically redeploy. The deployment script will now test the connection and show detailed connection info.

## Alternative: Create New PostgreSQL Service

If the current PostgreSQL service has issues:

1. **Delete old PostgreSQL service:**
   - Go to PostgreSQL service in Railway
   - Settings → Delete Service

2. **Create new PostgreSQL service:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will create a new database with new credentials

3. **Update your web service with new DATABASE_URL:**
   - Copy the new connection URL
   - Update your web service environment variables

## Testing

After fixing the DATABASE_URL, the deployment logs should show:
```
✅ Database URL found: postgresql://postgres:***@hostname:port/railway
🔍 Testing database connection before migration...
🔧 Connection config: { host: 'hostname', port: 5432, ... }
🔌 Attempting to connect to database...
✅ Database connection successful!
🧪 Testing simple query...
✅ Query test successful: { test: 1 }
✅ Database test completed successfully!
```

## Quick Fix Commands

```bash
# Check current Railway services
railway status

# Get PostgreSQL connection details  
railway connect postgresql

# Set correct DATABASE_URL (replace with your actual URL)
railway variables set DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/railway"

# Check if variables are set
railway variables
```

The enhanced deployment script will now provide detailed diagnostics to help identify exactly what's wrong with the database connection.