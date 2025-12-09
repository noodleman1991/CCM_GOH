# 🚨 EMERGENCY: Production Site Down - IMMEDIATE ACTION REQUIRED

**STATUS**: Your production site is completely crashed. All pages return 500 errors.

**CAUSE**: Production database (`ep-lucky-waterfall-abdtu0g5-pooler`) has no tables. When you switched to it, the site lost access to all data.

---

## ⚡ STEP 1: RESTORE SERVICE NOW (5 minutes)

### What You Need to Do:

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your project

2. **Open Environment Variables**
   - Click: Settings → Environment Variables
   - Find: `DATABASE_URL` for **Production** environment

3. **Change the Database URL**

   **Current Value (BROKEN):**
   ```
   postgresql://goh_owner:npg_eT3CGZfqrR7g@ep-lucky-waterfall-abdtu0g5-pooler.eu-west-2.aws.neon.tech/goh?sslmode=require&channel_binding=require
   ```

   **Change To (WORKING):**
   ```
   postgresql://goh_owner:npg_eT3CGZfqrR7g@ep-misty-dawn-abcx8is6-pooler.eu-west-2.aws.neon.tech/goh?sslmode=require&channel_binding=require
   ```

4. **Click "Save"**

5. **Redeploy Production**
   - Go to: Deployments tab
   - Find latest deployment
   - Click "..." menu → "Redeploy"
   - Wait 2-3 minutes

6. **Verify Site is Back**
   - Visit: https://hub.connectingclimateminds.org
   - Should load without errors
   - Try signing up - should work

**Once this is done, your site will be back online.** ✅

---

## 🔧 STEP 2: Fix the Production Database (After Site is Back)

The `ep-lucky-waterfall` database is empty. We need to create the schema:

### Run Migrations Locally:

1. **Edit `.env.local`** temporarily:
   ```bash
   # Change this line:
   DATABASE_URL=postgresql://goh_owner:npg_eT3CGZfqrR7g@ep-lucky-waterfall-abdtu0g5-pooler.eu-west-2.aws.neon.tech/goh?sslmode=require&channel_binding=require
   ```

2. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Revert `.env.local`** back to:
   ```bash
   DATABASE_URL=postgresql://goh_owner:npg_eT3CGZfqrR7g@ep-misty-dawn-abcx8is6-pooler.eu-west-2.aws.neon.tech/goh?sslmode=require&channel_binding=require
   ```

**Result**: `ep-lucky-waterfall` now has all tables (but no users yet).

---

## 🎯 STEP 3: Decide on Data Migration Strategy

You have 3 options:

### Option A: Fresh Start (RECOMMENDED)

**What happens:**
- Keep `ep-lucky-waterfall` as production (now has schema, but empty)
- All new production users start here
- Old production users are in `ep-misty-dawn` (you can migrate them later if needed)
- Dev users stay in `ep-misty-dawn` (development database)

**Pros:**
- Clean separation immediately
- No data migration needed
- Simplest and fastest

**Cons:**
- If you have real production users, they won't be accessible until migrated

**How to do it:**
1. In Vercel, change production DATABASE_URL back to `ep-lucky-waterfall`
2. Redeploy
3. Done - production is now clean

---

### Option B: Manually Migrate Production Users

**What happens:**
- Identify which users in `ep-misty-dawn` are real (not test users like `fatherjohnmisty666`, `amit33`)
- Export only those users
- Import to `ep-lucky-waterfall`

**Pros:**
- Keeps real production users
- Clean separation

**Cons:**
- Takes 1-3 hours
- Manual SQL editing required
- Risk of data corruption if done incorrectly

---

### Option C: Keep Current State (NOT RECOMMENDED)

**What happens:**
- Use `ep-misty-dawn` as production (has all current users)
- Use `ep-lucky-waterfall` as development

**Pros:**
- No migration needed
- All users remain accessible

**Cons:**
- Production will always have test users mixed in
- Defeats the purpose of database separation

---

## 📊 What Went Wrong?

1. **Original Problem**: All environments (production, preview, dev) were using the SAME database (`ep-misty-dawn`) because you had DATABASE_URL set to "All Environments"

2. **Your Fix Attempt**: You changed production to use `ep-lucky-waterfall` to separate it

3. **The Issue**: `ep-lucky-waterfall` is completely empty - no schema, no tables, no data

4. **The Crash**: Every database query failed with "table doesn't exist" error

**The Root Cause**: The `ep-lucky-waterfall` database was never initialized with the schema.

---

## 🔍 Debug Endpoint Available

After you restore service, you can check which database is being used:

**Production**: https://hub.connectingclimateminds.org/api/debug/db-info

This will show you:
- Which database is connected
- How many users exist
- Sample usernames
- Whether it's correct or not

---

## ✅ What's Already Fixed (Previous Commits)

These issues were already fixed and deployed:
- ✅ Community selections now save during onboarding
- ✅ Age group now saves during onboarding
- ✅ Webhook crashes fixed (variable scope bug)
- ✅ Dashboard crashes fixed (variable scope bug)
- ✅ Prisma generated client removed from git

**No code changes are needed** - just database configuration.

---

## 📞 Need Help?

If the site doesn't come back after Step 1, check:
- Vercel deployment logs for errors
- Make sure you changed the PRODUCTION environment only (not Preview/Development)
- Make sure you clicked "Save" after changing the DATABASE_URL
- Make sure the redeploy completed successfully

---

**Do Step 1 NOW to restore service. Steps 2 and 3 can wait.**
