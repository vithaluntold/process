# 🚂 Railway Deployment Guide for EPI-Q

## 💰 **Cost Savings: $140/month** (Railway vs Replit Reserved VM)

This guide will help you deploy EPI-Q to Railway in **under 10 minutes**.

---

## 📋 **Prerequisites**

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a Git repository
3. **Environment Variables**: Have all your secrets ready (see below)

---

## 🚀 **Quick Start Deployment**

### **Method 1: Via Railway Dashboard (Easiest)**

⚠️ **IMPORTANT:** Set environment variables BEFORE first deploy to avoid boot failures!

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Click **"New Project"**

2. **Deploy from GitHub**
   - Click **"Deploy from GitHub repo"**
   - Authorize Railway to access your repository
   - Select your EPI-Q repository
   - Railway will start building immediately - **pause this by clicking "Cancel Build"**

3. **Add PostgreSQL Database** (⚠️ REQUIRED)
   - In your project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway automatically creates `DATABASE_URL` and all `PG*` environment variables
   - **Important:** The database service and your app service must be in the SAME project
   - Wait for the database to be created before deploying your app

4. **⚠️ CRITICAL: Configure Environment Variables BEFORE Deploy**
   - Click on your service → **"Variables"** tab
   - Add **ALL required** environment variables:
     ```bash
     SESSION_SECRET=<from-replit>
     AUTH_SECRET=<from-replit-or-same-as-session>
     JWT_SECRET=<from-replit-or-same-as-session>
     MASTER_ENCRYPTION_KEY=<from-replit>
     NODE_ENV=production
     ```
   - **Skip NEXT_PUBLIC_APP_URL** for now (will add after deploy)
   - See full list in `RAILWAY_ENV_SETUP.md`

5. **Deploy**
   - Click **"Redeploy"** or **"Deploy"**
   - Railway detects the Dockerfile and builds with 6GB memory
   - Deployment completes in 5-10 minutes

6. **Post-Deployment** (Critical!)
   - See `RAILWAY_POST_DEPLOYMENT.md` for:
     - Setting `NEXT_PUBLIC_APP_URL` (then redeploy)
     - Adding persistent volume for uploads
     - Database migration

---

### **Method 2: Via Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project in your repository
cd /path/to/epi-q
railway init

# Link to new project
railway link

# Add PostgreSQL (REQUIRED - do this first!)
railway add --database postgresql
# Wait for database to be ready before continuing

# ⚠️ CRITICAL: Set ALL required environment variables BEFORE deploying
railway variables set SESSION_SECRET="<from-replit>"
railway variables set AUTH_SECRET="<from-replit-or-same-as-session>"
railway variables set JWT_SECRET="<from-replit-or-same-as-session>"
railway variables set MASTER_ENCRYPTION_KEY="<from-replit>"
railway variables set NODE_ENV="production"

# Skip NEXT_PUBLIC_APP_URL for now (will set after first deploy)

# Optional: Add AI/payment vars if needed
railway variables set AI_INTEGRATIONS_OPENAI_API_KEY="sk-..."
railway variables set PAYMENT_GATEWAY_PROVIDER="razorpay"
railway variables set PAYMENT_GATEWAY_API_KEY="..."
# ... see RAILWAY_ENV_SETUP.md for complete list

# Deploy
railway up

# After deployment, set NEXT_PUBLIC_APP_URL and redeploy
# See RAILWAY_POST_DEPLOYMENT.md for details
```

---

## 🔐 **Required Environment Variables**

⚠️ **CRITICAL:** See **RAILWAY_ENV_SETUP.md** for the COMPLETE list of ALL environment variables.

### **Minimum Required (App won't start without these):**
```bash
SESSION_SECRET=<copy from Replit>
AUTH_SECRET=<copy from Replit or use same as SESSION_SECRET>
JWT_SECRET=<copy from Replit or use same as SESSION_SECRET>
MASTER_ENCRYPTION_KEY=<copy from Replit>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=<set after first deploy - see RAILWAY_POST_DEPLOYMENT.md>
```

### **Database** (Automatically set by Railway)
```bash
DATABASE_URL=<automatically provided by Railway PostgreSQL>
PGDATABASE=<automatically provided>
PGHOST=<automatically provided>
PGPORT=<automatically provided>
PGUSER=<automatically provided>
PGPASSWORD=<automatically provided>
```

### **Optional (If Using These Features):**

**AI Integration:**
```bash
AI_INTEGRATIONS_OPENAI_API_KEY=<your OpenAI key>
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=<your OpenAI key if using separate integration>
```

**Payment Gateway (⚠️ REQUIRED if billing/subscriptions are enabled):**
```bash
PAYMENT_GATEWAY_PROVIDER=razorpay  # or payu or payoneer
PAYMENT_GATEWAY_API_KEY=<your payment gateway key>
PAYMENT_GATEWAY_API_SECRET=<your payment gateway secret>
PAYMENT_GATEWAY_WEBHOOK_SECRET=<your webhook secret>
PAYMENT_GATEWAY_SANDBOX=false  # true for testing
```

**⚠️ NOTE:** If you enable billing/subscription features without setting payment gateway variables, payment routes will return 500 errors.

📖 **For complete environment variable setup guide, see:** `RAILWAY_ENV_SETUP.md`

### **How to Set Variables in Railway Dashboard:**
1. Click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Enter key and value
5. Click **"Add"**

### **How to Export from Replit:**
1. Go to Replit **Secrets** tab
2. Copy each secret value
3. Paste into Railway

---

## 🏗️ **Build Configuration**

Railway uses the **Dockerfile** in your repository with optimized settings:

### **Build Settings (via railway.toml):**
```toml
[build]
builder = "dockerfile"               # Uses your Dockerfile
dockerfilePath = "Dockerfile"

[build.env]
NODE_OPTIONS = "--max-old-space-size=6144"  # 6GB for build
```

### **Build Process:**
- **Build Memory**: 6GB (configured via `NODE_OPTIONS` in railway.toml)
- **Build Time**: ~5-10 minutes
- **Output**: Optimized multi-stage Docker image (~500MB)
- **Method**: Multi-stage Docker build with Node.js 20 Alpine

**Build automatically:**
1. Installs dependencies with pnpm (frozen lockfile)
2. Builds Next.js in production mode (standalone output)
3. Creates optimized production image
4. Runs on port 5000 with health checks

---

## 📊 **Database Migration**

### **Option 1: Copy Production Data from Replit**

1. **Export from Replit Neon Database:**
   ```bash
   # On Replit, run in Shell
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Download backup.sql** from Replit

3. **Import to Railway PostgreSQL:**
   ```bash
   # Get Railway database URL
   railway variables get DATABASE_URL
   
   # Import data
   psql <RAILWAY_DATABASE_URL> < backup.sql
   ```

### **Option 2: Fresh Database Setup**

Railway PostgreSQL is empty by default. Your app will create tables automatically on first run using Drizzle ORM.

---

## ⚙️ **Configuration Details**

### **Railway Service Settings**

| Setting | Value | Description |
|---------|-------|-------------|
| **Port** | 5000 | Application listens on this port |
| **Replicas** | 1 | Single instance (can scale up) |
| **Restart Policy** | On failure | Auto-restart if crashes |
| **Health Check** | `/api/health` | Monitors app health |
| **Build Method** | Dockerfile | Uses your Dockerfile |

### **Resource Allocation**

Railway automatically allocates resources based on usage:

- **Memory**: Scales up to 8GB (more than Replit's 8GB)
- **CPU**: Shared vCPU
- **Storage**: 20GB persistent volume
- **Bandwidth**: Generous limits

---

## 💰 **Pricing Breakdown**

### **Railway Costs (Usage-Based)**

| Component | Estimated Cost |
|-----------|----------------|
| **Web Service** | ~$10-15/month |
| **PostgreSQL Database** | ~$5-10/month |
| **Bandwidth** | Included (generous) |
| **Total** | **~$15-25/month** |

**vs Replit Reserved VM**: $160/month → **Save $135-145/month!**

### **Hobby Plan**: 
- $5/month includes $5 usage credit
- Pay-as-you-go beyond that
- Services auto-sleep when idle (saves money)

---

## 🔍 **Post-Deployment Checklist**

After deployment completes:

### **1. Check Deployment Status**
- Go to Railway dashboard
- Verify service shows **"Active"**
- Check build logs for errors

### **2. Test Your Application**
- Click the generated Railway URL (e.g., `your-app.up.railway.app`)
- Test login functionality
- Verify database connections

### **3. Configure Custom Domain** (Optional)
- Go to service → **"Settings"** → **"Domains"**
- Add your custom domain
- Update DNS records

### **4. Monitor Logs**
- Click on your service
- Go to **"Logs"** tab
- Monitor for errors

---

## 🐛 **Troubleshooting**

### **Build Fails with OOM Error**
Railway provides more memory than Replit. If build still fails:
```bash
# Check build logs in Railway dashboard
# Build uses 6GB via NODE_OPTIONS in Dockerfile
```

### **Database Connection Error**
```bash
# Verify DATABASE_URL is set
railway variables get DATABASE_URL

# Check PostgreSQL service is running
railway status
```

### **App Won't Start**
```bash
# Check logs
railway logs

# Common issues:
# - Missing environment variables
# - Port mismatch (should be 5000)
# - Database not ready
```

---

## 📈 **Scaling**

### **Horizontal Scaling**
```bash
# Increase replicas via dashboard
# Go to Settings → Scale to N replicas
```

### **Vertical Scaling**
Railway auto-scales memory/CPU based on usage. No manual configuration needed.

---

## 🔄 **CI/CD Automatic Deployments**

Railway automatically deploys when you push to your main branch:

1. Make code changes
2. Push to GitHub
3. Railway detects changes
4. Automatically builds and deploys
5. Zero-downtime deployment

---

## 📚 **Additional Resources**

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
- [Environment Variables](https://docs.railway.app/develop/variables)

---

## ✅ **Summary**

**Total Migration Time**: ~10 minutes  
**Cost Savings**: $140/month  
**Downtime**: Zero (keep Replit running until Railway is ready)  
**Difficulty**: Easy (Railway handles everything)

---

## 🆘 **Need Help?**

1. **Railway Community**: [Railway Discord](https://discord.gg/railway)
2. **Documentation**: [docs.railway.app](https://docs.railway.app)
3. **Support**: support@railway.app

---

**Ready to deploy? Follow Method 1 above for the quickest setup!** 🚀
