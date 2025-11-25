# 🔐 Environment Variables Setup for Railway

## Quick Copy-Paste Guide

### **Step 1: Export from Replit**

1. Open Replit Secrets tab
2. Copy the following secrets:

```bash
# Core Application
SESSION_SECRET=<copy-value-here>
MASTER_ENCRYPTION_KEY=<copy-value-here>

# AI Integration (if using OpenAI)
AI_INTEGRATIONS_OPENAI_API_KEY=<copy-value-here>
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

---

### **Step 2: Set in Railway Dashboard**

1. Go to [railway.app](https://railway.app)
2. Click on your EPI-Q service
3. Click **"Variables"** tab
4. Click **"+ New Variable"** for each:

#### **Required Variables:**

| Variable Name | Source | Example Value |
|---------------|--------|---------------|
| `SESSION_SECRET` | Replit Secrets | `your-secret-session-key` |
| `MASTER_ENCRYPTION_KEY` | Replit Secrets | `your-32-char-encryption-key` |
| `DATABASE_URL` | **Auto-set by Railway** | Provided by Railway PostgreSQL |
| `NODE_ENV` | Set manually | `production` |

#### **Optional (AI Features):**

| Variable Name | Value |
|---------------|-------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Your OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | `https://api.openai.com/v1` |

---

### **Step 3: Railway CLI Method** (Alternative)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set variables one by one
railway variables set SESSION_SECRET="your-value"
railway variables set MASTER_ENCRYPTION_KEY="your-value"
railway variables set NODE_ENV="production"

# AI variables (optional)
railway variables set AI_INTEGRATIONS_OPENAI_API_KEY="sk-..."
railway variables set AI_INTEGRATIONS_OPENAI_BASE_URL="https://api.openai.com/v1"

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

- [ ] `SESSION_SECRET` is set
- [ ] `MASTER_ENCRYPTION_KEY` is set
- [ ] `DATABASE_URL` is automatically provided by Railway PostgreSQL
- [ ] `NODE_ENV` is set to `production`
- [ ] (Optional) AI variables are set if using OpenAI features

---

## 🔄 **Migration from Replit**

### **Complete Environment Variable List:**

```bash
# From Replit Secrets tab, copy these:
SESSION_SECRET=
MASTER_ENCRYPTION_KEY=

# Automatically provided by Railway (don't set manually):
DATABASE_URL=  # Set by Railway PostgreSQL service

# AI Integration (if used):
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# System (set manually):
NODE_ENV=production
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
