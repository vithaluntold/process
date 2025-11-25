# 🔧 Railway Post-Deployment Steps

## ⚠️ **CRITICAL: Complete These Steps After First Deployment**

After your first Railway deployment succeeds, you MUST complete these steps or features will break:

---

## 🌐 **Step 1: Set NEXT_PUBLIC_APP_URL**

### **Why This Is Required:**
- SAML authentication redirects won't work
- Email invitation links will be broken
- Payment gateway callbacks will fail

### **How to Fix:**

1. **Get your Railway URL:**
   - Go to Railway dashboard
   - Click on your deployment
   - Find your app URL (e.g., `https://your-app-abc123.up.railway.app`)

2. **Set the environment variable:**

   **Via Dashboard:**
   - Go to your service → **Variables** tab
   - Click **+ New Variable**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://your-app-abc123.up.railway.app` (your actual Railway URL)
   - Click **Add**

   **Via CLI:**
   ```bash
   railway variables set NEXT_PUBLIC_APP_URL="https://your-app-abc123.up.railway.app"
   ```

3. **Redeploy to apply:**
   - Railway will automatically redeploy after adding the variable
   - OR click **"Redeploy"** manually

---

## 💾 **Step 2: Set Up Persistent Volume for Uploads**

### **Why This Is Required:**
- File uploads (event logs, documents) are stored in `/app/uploads`
- Without a persistent volume, uploads are **lost on every deploy**

### **How to Fix:**

1. **Create a Volume in Railway:**
   - Go to your service in Railway dashboard
   - Click **"+" → "Volume"**
   - Name: `uploads`
   - Mount path: `/app/uploads`
   - Size: Start with 1GB (can increase later)
   - Click **"Add Volume"**

2. **Verify Volume is Mounted:**
   ```bash
   # Via Railway CLI
   railway run ls -la /app/uploads
   ```

**Alternative:** Use external object storage (S3, Cloudflare R2, etc.) instead of local uploads.

---

## 🗄️ **Step 3: Migrate Database (If Coming from Replit)**

### **Option A: Import Existing Data**

If you have existing data on Replit:

1. **Export from Replit:**
   ```bash
   # On Replit Shell
   pg_dump $DATABASE_URL > replit_backup.sql
   ```

2. **Download the backup file**

3. **Import to Railway:**
   ```bash
   # Get Railway DATABASE_URL
   railway variables get DATABASE_URL
   
   # Import data
   railway run psql $DATABASE_URL < replit_backup.sql
   ```

### **Option B: Fresh Start**

If starting fresh, your app will automatically create tables on first run using Drizzle ORM.

---

## 🔍 **Step 4: Verify Deployment**

### **Test Critical Features:**

1. **Login/Authentication:**
   - Visit `https://your-app.up.railway.app`
   - Try logging in with test credentials
   - ✅ Should work without errors

2. **SAML (if configured):**
   - Test SSO login flow
   - ✅ Redirects should use correct Railway URL

3. **File Uploads:**
   - Upload a test CSV file
   - ✅ File should persist after redeploy

4. **Payments (if configured):**
   - Test payment flow
   - ✅ Webhooks should reach your Railway URL

---

## 📊 **Step 5: Monitor and Optimize**

### **Check Logs:**
```bash
# Real-time logs
railway logs --follow

# Check for errors
railway logs | grep ERROR
```

### **Monitor Resource Usage:**
- Go to Railway dashboard → **Metrics** tab
- Watch memory and CPU usage
- Adjust if needed

### **Cost Tracking:**
```bash
# Check current usage
railway usage
```

---

## 🔒 **Step 6: Security Checklist**

- [ ] All secrets are set (no hardcoded values)
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS is enabled (automatic on Railway)
- [ ] Database uses SSL connection (automatic with Railway PostgreSQL)
- [ ] File uploads are in persistent volume (not ephemeral storage)

---

## 🚨 **Common Issues After Deployment**

### **Issue: "Cannot read NEXT_PUBLIC_APP_URL"**
**Solution:** Set `NEXT_PUBLIC_APP_URL` and redeploy (Step 1 above)

### **Issue: "Uploads disappear after redeploy"**
**Solution:** Add persistent volume for `/app/uploads` (Step 2 above)

### **Issue: "Payment webhooks return 404"**
**Solution:** Verify `NEXT_PUBLIC_APP_URL` is set correctly

### **Issue: "SAML redirects to localhost"**
**Solution:** Set `NEXT_PUBLIC_APP_URL` to your Railway domain

### **Issue: "Database connection fails"**
**Solution:** Verify Railway PostgreSQL service is running and `DATABASE_URL` is set

---

## ✅ **Final Checklist**

After completing all steps:

- [ ] `NEXT_PUBLIC_APP_URL` is set to Railway domain
- [ ] App has been redeployed with new URL
- [ ] Persistent volume is mounted to `/app/uploads`
- [ ] Database is migrated (if coming from Replit)
- [ ] Login/auth works correctly
- [ ] File uploads persist across deploys
- [ ] All critical features tested and working

---

## 🆘 **Need Help?**

- **Railway Logs:** `railway logs`
- **Railway Status:** `railway status`
- **Railway Community:** [Discord](https://discord.gg/railway)
- **Documentation:** [docs.railway.app](https://docs.railway.app)

---

**Congratulations! Your EPI-Q platform is now fully deployed on Railway! 🎉**

**Monthly Cost Savings:** $135-145 compared to Replit Reserved VM 💰
