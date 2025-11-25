# 🔐 Environment Variables Setup for Railway

## ⚠️ **IMPORTANT: Complete Environment Variables Required**

This guide lists **ALL** environment variables used by EPI-Q. Missing variables will cause features to break.

## Quick Copy-Paste Guide

### **Step 1: Export from Replit**

1. Open Replit Secrets tab
2. Copy the following secrets:

```bash
# Core Application
SESSION_SECRET=<copy-value-here>
AUTH_SECRET=<copy-value-here>
JWT_SECRET=<copy-value-here>
MASTER_ENCRYPTION_KEY=<copy-value-here>

# AI Integration (if using OpenAI)
AI_INTEGRATIONS_OPENAI_API_KEY=<copy-value-here>
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=<copy-value-here>

# Payment Gateway (if configured)
PAYMENT_GATEWAY_PROVIDER=<razorpay|payu|payoneer>
PAYMENT_GATEWAY_API_KEY=<copy-value-here>
PAYMENT_GATEWAY_API_SECRET=<copy-value-here>
PAYMENT_GATEWAY_WEBHOOK_SECRET=<copy-value-here>
```

---

### **Step 2: Set in Railway Dashboard**

1. Go to [railway.app](https://railway.app)
2. Click on your EPI-Q service
3. Click **"Variables"** tab
4. Click **"+ New Variable"** for each:

#### **Required Variables (App won't start without these):**

| Variable Name | Source | Example Value |
|---------------|--------|---------------|
| `SESSION_SECRET` | Replit Secrets | `your-secret-session-key` |
| `AUTH_SECRET` | Replit Secrets (or same as SESSION_SECRET) | `your-auth-secret-key` |
| `JWT_SECRET` | Replit Secrets (or same as SESSION_SECRET) | `your-jwt-secret-key` |
| `MASTER_ENCRYPTION_KEY` | Replit Secrets | `your-32-char-encryption-key` |
| `DATABASE_URL` | **Auto-set by Railway** | Provided by Railway PostgreSQL |
| `NODE_ENV` | Set manually | `production` |

**Note:** If `AUTH_SECRET` and `JWT_SECRET` are not in Replit, use the same value as `SESSION_SECRET`.

#### **Database Variables (Auto-set by Railway PostgreSQL):**

| Variable Name | Source | Note |
|---------------|--------|------|
| `DATABASE_URL` | Railway PostgreSQL | Automatically provided |
| `PGDATABASE` | Railway PostgreSQL | Automatically provided |
| `PGHOST` | Railway PostgreSQL | Automatically provided |
| `PGPORT` | Railway PostgreSQL | Automatically provided |
| `PGUSER` | Railway PostgreSQL | Automatically provided |
| `PGPASSWORD` | Railway PostgreSQL | Automatically provided |

**Note:** Railway automatically sets all PG* variables when you add PostgreSQL service.

#### **Application URL (Required):**

| Variable Name | Source | Value |
|---------------|--------|-------|
| `NEXT_PUBLIC_APP_URL` | Set manually | Your Railway app URL (e.g., `https://your-app.up.railway.app`) |

**Note:** Set this AFTER deployment when Railway provides your URL. Used for SAML redirects and email links.

#### **AI Integration (Optional - if using AI features):**

| Variable Name | Source | Value |
|---------------|--------|-------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit Secrets | Your OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit Secrets or set manually | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | Replit Secrets (if using) | Your OpenAI API key |

#### **Payment Gateway (Required if payments enabled):**

| Variable Name | Source | Value |
|---------------|--------|-------|
| `PAYMENT_GATEWAY_PROVIDER` | Set manually | `razorpay` or `payu` or `payoneer` |
| `PAYMENT_GATEWAY_API_KEY` | Replit Secrets | Your payment gateway API key |
| `PAYMENT_GATEWAY_API_SECRET` | Replit Secrets | Your payment gateway secret |
| `PAYMENT_GATEWAY_WEBHOOK_SECRET` | Replit Secrets | Your payment gateway webhook secret |
| `PAYMENT_GATEWAY_SANDBOX` | Set manually (optional) | `true` for testing, `false` for production |

**Note:** If you're not using payments yet, you can skip these variables.

---

### **Step 3: Railway CLI Method** (Alternative)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set REQUIRED core variables
railway variables set SESSION_SECRET="<from-replit>"
railway variables set AUTH_SECRET="<from-replit-or-same-as-session>"
railway variables set JWT_SECRET="<from-replit-or-same-as-session>"
railway variables set MASTER_ENCRYPTION_KEY="<from-replit>"
railway variables set NODE_ENV="production"

# Set after deployment (update with your Railway URL)
# DO THIS AFTER FIRST DEPLOY, then redeploy
railway variables set NEXT_PUBLIC_APP_URL="https://your-app.up.railway.app"

# Optional: AI variables (if using)
railway variables set AI_INTEGRATIONS_OPENAI_API_KEY="sk-..."
railway variables set AI_INTEGRATIONS_OPENAI_BASE_URL="https://api.openai.com/v1"
railway variables set OPENAI_API_KEY="sk-..."  # if using

# Optional: Payment gateway (if using)
railway variables set PAYMENT_GATEWAY_PROVIDER="razorpay"  # or payu or payoneer
railway variables set PAYMENT_GATEWAY_API_KEY="<your-key>"
railway variables set PAYMENT_GATEWAY_API_SECRET="<your-secret>"
railway variables set PAYMENT_GATEWAY_WEBHOOK_SECRET="<your-webhook-secret>"
railway variables set PAYMENT_GATEWAY_SANDBOX="false"  # true for testing

# Verify all variables are set
railway variables
```

---

### **Step 4: Database URL (Automatic)**

Railway automatically provides `DATABASE_URL` when you add PostgreSQL:

```bash
# Railway format (automatically set):
DATABASE_URL=postgresql://user:password@host:port/database

# No action needed - Railway handles this
```

---

## ✅ **Verification Checklist**

After setting variables:

### **Minimum Required (App won't start without these):**
- [ ] `SESSION_SECRET` is set
- [ ] `AUTH_SECRET` is set (can be same as SESSION_SECRET)
- [ ] `JWT_SECRET` is set (can be same as SESSION_SECRET)
- [ ] `MASTER_ENCRYPTION_KEY` is set
- [ ] `DATABASE_URL` is automatically provided by Railway PostgreSQL
- [ ] `NODE_ENV` is set to `production`
- [ ] `NEXT_PUBLIC_APP_URL` is set (⚠️ add after first deployment, then redeploy)

### **Optional (Enable features if needed):**
- [ ] AI variables (`AI_INTEGRATIONS_OPENAI_API_KEY`, `OPENAI_API_KEY`) if using AI features
- [ ] Payment gateway (`PAYMENT_GATEWAY_*` variables) if using payments
- [ ] `TRUSTED_PROXIES` if behind load balancer/proxy

---

## 🔄 **Migration from Replit**

### **Complete Environment Variable List:**

```bash
# ========================================
# REQUIRED - Copy from Replit Secrets
# ========================================
SESSION_SECRET=
AUTH_SECRET=  # Can be same as SESSION_SECRET
JWT_SECRET=  # Can be same as SESSION_SECRET
MASTER_ENCRYPTION_KEY=

# ========================================
# DATABASE - Automatically set by Railway
# (DO NOT copy from Replit)
# ========================================
DATABASE_URL=  # Railway PostgreSQL auto-provides
PGDATABASE=    # Railway PostgreSQL auto-provides
PGHOST=        # Railway PostgreSQL auto-provides
PGPORT=        # Railway PostgreSQL auto-provides
PGUSER=        # Railway PostgreSQL auto-provides
PGPASSWORD=    # Railway PostgreSQL auto-provides

# ========================================
# AI INTEGRATION - Optional (if using)
# ========================================
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# ========================================
# APPLICATION URL - Set after deployment
# ========================================
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app  # Update with your Railway URL

# ========================================
# SYSTEM - Set manually
# ========================================
NODE_ENV=production

# ========================================
# PAYMENT GATEWAY - Optional (if using)
# ========================================
PAYMENT_GATEWAY_PROVIDER=razorpay  # or payu or payoneer
PAYMENT_GATEWAY_API_KEY=
PAYMENT_GATEWAY_API_SECRET=
PAYMENT_GATEWAY_WEBHOOK_SECRET=
PAYMENT_GATEWAY_SANDBOX=false  # true for testing

# ========================================
# ADDITIONAL AI - Optional (if using)
# ========================================
OPENAI_API_KEY=

# ========================================
# REPLIT-SPECIFIC - DO NOT COPY to Railway
# ========================================
# REPLIT_DOMAINS (Replit-only, ignore)
# REPLIT_DEV_DOMAIN (Replit-only, ignore)
# REPL_ID (Replit-only, ignore)
```

---

## 🚨 **Important Notes**

1. **DATABASE_URL**: DO NOT copy from Replit - Railway provides its own
2. **Secrets**: Use Railway's encrypted variables (secure by default)
3. **Production**: Always set `NODE_ENV=production`
4. **Port**: Railway automatically sets - don't override

---

## 📝 **Quick Copy Template**

Copy this to a text editor, fill in values, then paste into Railway:

```
SESSION_SECRET=
MASTER_ENCRYPTION_KEY=
NODE_ENV=production
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

---

**Next Step**: Once variables are set, Railway will automatically rebuild and deploy! 🚀
