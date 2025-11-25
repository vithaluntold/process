# 🚂 Railway Deployment Commands Reference

## Quick Deployment (Copy-Paste Ready)

### **Option 1: Dashboard Deployment (Recommended)**
1. Go to [railway.app](https://railway.app) → New Project
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway auto-detects Dockerfile and deploys ✅

---

### **Option 2: CLI Deployment**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to your project
cd /path/to/epi-q

# 4. Initialize Railway project
railway init

# 5. Add PostgreSQL database
railway add --database postgresql

# 6. Set environment variables
railway variables set SESSION_SECRET="<from-replit>"
railway variables set MASTER_ENCRYPTION_KEY="<from-replit>"
railway variables set NODE_ENV="production"

# Optional AI variables
railway variables set AI_INTEGRATIONS_OPENAI_API_KEY="sk-..."
railway variables set AI_INTEGRATIONS_OPENAI_BASE_URL="https://api.openai.com/v1"

# 7. Deploy
railway up

# 8. Open your deployed app
railway open
```

---

## Useful Railway CLI Commands

### **Deployment Management**

```bash
# Deploy current directory
railway up

# Deploy and follow logs
railway up --detach=false

# Open deployed app in browser
railway open

# Check deployment status
railway status
```

---

### **Environment Variables**

```bash
# List all variables
railway variables

# Get specific variable
railway variables get DATABASE_URL

# Set a variable
railway variables set KEY="value"

# Delete a variable
railway variables delete KEY
```

---

### **Database Management**

```bash
# Connect to PostgreSQL
railway connect postgres

# Run psql commands
railway run psql $DATABASE_URL

# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import database
railway run psql $DATABASE_URL < backup.sql
```

---

### **Logs & Debugging**

```bash
# View logs (real-time)
railway logs

# View logs for specific service
railway logs --service web

# Follow build logs
railway logs --build
```

---

### **Linking & Managing Projects**

```bash
# Link existing project
railway link <project-id>

# List all projects
railway list

# Switch between projects
railway environment

# Delete current deployment
railway down
```

---

## Database Migration from Replit

### **Export from Replit**

```bash
# On Replit Shell:
pg_dump $DATABASE_URL > replit_backup.sql

# Download the file from Replit
```

### **Import to Railway**

```bash
# Get Railway DATABASE_URL
railway variables get DATABASE_URL

# Import (method 1 - direct)
railway run psql $DATABASE_URL < replit_backup.sql

# Import (method 2 - with railway CLI)
cat replit_backup.sql | railway run psql $DATABASE_URL
```

---

## Troubleshooting Commands

### **Build Failures**

```bash
# View build logs
railway logs --build

# Force rebuild
railway up --force

# Check build status
railway status
```

### **Runtime Issues**

```bash
# Check if service is running
railway status

# Restart service
railway restart

# View crash logs
railway logs --tail 100
```

### **Database Connection**

```bash
# Test database connection
railway run psql $DATABASE_URL -c "SELECT version();"

# Check database status
railway variables get DATABASE_URL
```

---

## Monitoring & Scaling

### **Resource Monitoring**

```bash
# View usage metrics (via dashboard)
# Go to railway.app → Your Project → Metrics tab

# Monitor costs
# Go to railway.app → Account → Usage
```

### **Scaling** (via Dashboard)

1. Go to your service in Railway dashboard
2. Click **Settings**
3. Adjust **Replicas** (horizontal scaling)
4. Vertical scaling is automatic

---

## GitHub Integration (Auto-Deploy)

Railway automatically deploys on git push:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway detects push and auto-deploys
# Monitor deployment in Railway dashboard
```

---

## Custom Domain Setup

### **Via Dashboard:**
1. Go to Service → **Settings** → **Domains**
2. Click **+ Custom Domain**
3. Enter your domain (e.g., `epi-q.yourdomain.com`)
4. Add DNS records shown by Railway

### **Via CLI:**
```bash
# Add custom domain
railway domain add yourdomain.com

# List domains
railway domain list

# Remove domain
railway domain remove yourdomain.com
```

---

## Health Check & Monitoring

### **Test Health Endpoint**

```bash
# Get your Railway URL
railway open

# Test health check (replace URL)
curl https://your-app.up.railway.app/api/health
```

### **Monitor Logs**

```bash
# Real-time logs
railway logs --follow

# Filter by severity
railway logs | grep ERROR
```

---

## Rollback to Previous Deployment

```bash
# View deployment history (via dashboard)
# Go to Service → Deployments tab

# Rollback via dashboard:
# Click on previous deployment → "Redeploy"
```

---

## Cost Tracking

```bash
# View current usage
railway usage

# Check billing (via dashboard)
# Go to Account → Billing
```

---

## Emergency Commands

### **Stop All Services**

```bash
# Pause deployment
railway down
```

### **Quick Restart**

```bash
# Restart service
railway restart
```

### **Force Fresh Deploy**

```bash
# Clear cache and redeploy
railway up --force
```

---

## One-Line Full Deployment

```bash
npm i -g @railway/cli && railway login && railway init && railway add -d postgresql && railway variables set NODE_ENV=production && railway up
```

---

## Help & Support

```bash
# CLI help
railway --help
railway <command> --help

# Check CLI version
railway --version

# Update CLI
npm update -g @railway/cli
```

---

## 🎯 **Most Common Workflow**

```bash
# 1. Initial setup (one-time)
npm i -g @railway/cli
railway login
railway init
railway add -d postgresql

# 2. Set environment variables (one-time)
railway variables set SESSION_SECRET="..."
railway variables set MASTER_ENCRYPTION_KEY="..."
railway variables set NODE_ENV="production"

# 3. Deploy
railway up

# 4. Monitor
railway logs

# 5. Future deploys (automatic via git push)
git push origin main  # Railway auto-deploys
```

---

**That's it! Your app is now deployed to Railway! 🚀**

**Access your app**: `railway open`  
**View logs**: `railway logs`  
**Check status**: `railway status`
