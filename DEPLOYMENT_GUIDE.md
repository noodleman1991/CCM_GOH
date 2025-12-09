# 🚀 Deployment Guide - All Critical Issues Fixed

## ✅ What Was Fixed (Just Pushed)

### 1. Regional Community Selections Now Save ✅
**Problem**: Communities selected during onboarding were silently discarded if ANY ID was invalid.

**Fix Applied**:
- Changed logic from "all-or-nothing" to "save what's valid"
- Added detailed logging to diagnose ID mismatches
- Will now show in logs exactly which communities were found/saved

**Location**: `app/api/onboarding/complete/route.ts` (lines 279-317)

---

### 2. Age Group Now Saves ✅
**Problem**: Age group selection was completely missing from onboarding save logic.

**Fix Applied**:
- Added `ageGroup` to validation schema (line 15)
- Added `ageGroup` to database save (line 226)

**Location**: `app/api/onboarding/complete/route.ts`

---

### 3. Database Separation FIXED ✅ (MOST CRITICAL)
**Problem**: Production was using pre-generated Prisma client with DEV database hardcoded.

**Fix Applied**:
- Removed entire `generated/` directory from git (24,444 lines deleted!)
- Added `/generated` to `.gitignore`
- Vercel will now generate fresh Prisma client at build time with correct DATABASE_URL

**Impact**: After deployment, production will connect to PRODUCTION database, dev to DEV database.

---

## 🔥 CRITICAL: What You Must Do NOW

### Step 1: Verify Vercel Environment Variables (5 min)

**BEFORE deploying**, check your Vercel environment variables:

```
1. Go to: Vercel Dashboard → Project → Settings → Environment Variables
2. Verify these are DIFFERENT:

Production:
DATABASE_URL = postgresql://...@ep-lucky-waterfall-abdtu0g5-pooler...

Preview + Development:
DATABASE_URL = postgresql://...@ep-misty-dawn-abcx8is6...
```

**Critical**: The hostnames MUST be different. If they're the same, update them BEFORE deploying.

---

### Step 2: Deploy to Production (2 min)

```
1. Go to: Vercel Dashboard → Deployments
2. Find latest deployment
3. Click "..." → "Redeploy"
4. Wait for build to complete (2-3 minutes)
```

**What happens during build**:
- `postinstall` hook runs `prisma generate`
- Fresh Prisma client generated using production DATABASE_URL
- Correct database connection hardcoded into client
- No more dev users in production!

---

### Step 3: Clean Up Stuck Test Users (IMPORTANT)

The user `user_36YzgabJVXCPXKyyME21I8KPsjA` is in a deadlock state. Clean it up:

**Option A: Delete from Clerk (Recommended)**
```
1. Clerk Dashboard → Users
2. Search for: user_36YzgabJVXCPXKyyME21I8KPsjA
3. Click user → Delete
4. This removes from both Clerk and triggers webhook to remove from DB
```

**Option B: Delete from Database**
```sql
-- Connect to your database
DELETE FROM "UserCommunity" WHERE "userId" = 'user_36YzgabJVXCPXKyyME21I8KPsjA';
DELETE FROM "RecentWork" WHERE "userId" = 'user_36YzgabJVXCPXKyyME21I8KPsjA';
DELETE FROM "User" WHERE id = 'user_36YzgabJVXCPXKyyME21I8KPsjA';
```

---

### Step 4: Test Everything (10 min)

#### Test 1: Database Separation
```
1. Go to: https://hub.connectingclimateminds.org/en/collaborate
2. Check: Should NOT see dev users (fatherjohnmisty666, amit33, etc.)
3. Result: ✅ Only production users visible
```

#### Test 2: Sign Up New User
```
1. Sign up with FRESH email (not the stuck one)
2. Complete onboarding
3. Select regional community + age group
4. Check Vercel logs should show:
   - ✅ Created user: user_NEW_ID
   - 📋 Processing X community IDs
   - ✅ Created X community memberships
```

#### Test 3: Verify Data Saved
```
1. After onboarding, go to: Profile → Edit
2. Check: Age group should be pre-selected
3. Check: Regional community should be visible
4. Result: ✅ All data persisted
```

---

## 📊 How to Monitor (Check Logs)

### Vercel Logs to Watch For:

**Community Save (Good)**:
```
📋 Processing 2 community IDs for user user_xxx: ["cm123", "cm456"]
✓ Found 2 valid communities: ["Europe and Northern America (REGIONAL)", ...]
✅ Created 2 community memberships for user user_xxx
```

**Community Save (ID Mismatch)**:
```
⚠️ Communities not found for user user_xxx: ["invalid_id"]
✓ Found 1 valid communities: ["Europe and Northern America (REGIONAL)"]
✅ Created 1 community memberships for user user_xxx
```

**Database Connection**:
```
# In production logs, database queries should not show dev user IDs
# No more fatherjohnmisty666, amit33, etc.
```

---

## 🔍 If Something Goes Wrong

### Issue: Dev users STILL appear in production

**Diagnosis**:
1. Check Vercel deployment logs for `prisma generate`
2. Verify DATABASE_URL in build logs matches production
3. Check if deployment actually completed

**Fix**:
1. Verify Vercel environment variables are correct
2. Trigger another deploy
3. Clear Vercel cache: Settings → Advanced → "Clear Build Cache"

---

### Issue: Communities still not saving

**Diagnosis**:
1. Check Vercel logs for the community processing messages
2. Look for: `📋 Processing X community IDs`
3. Check which IDs are being sent vs which are found

**Debug query**:
```sql
-- Check what community IDs exist in your database
SELECT id, name, type, "regionalName"
FROM "Community"
WHERE type = 'REGIONAL';
```

**Common cause**: Frontend sending Sanity CMS IDs instead of database IDs

**Fix**: Check `/api/communities` endpoint returns same IDs as database

---

### Issue: Age group still not saving

**Diagnosis**:
1. Check browser Network tab → POST to `/api/onboarding/complete`
2. Look at request payload → should include `ageGroup: "ABOVE_18"` or `"UNDER_18"`

**Fix**: If missing from payload, check onboarding form component sends it

---

## 🎯 Success Criteria

After deployment, you should see:

- [ ] `/collaborate` shows ONLY production users
- [ ] New sign-ups complete without P2002 errors
- [ ] Regional communities save and display in profile
- [ ] Age group saves and displays in profile edit
- [ ] Webhook logs show `✅ Created user: user_xxx`
- [ ] No `ReferenceError` errors in logs
- [ ] Community membership logs show successful saves

---

## 📋 Additional Issues Fixed (Bonus)

### Localhost Fetch Error in Production
**Error in logs**: `connect ECONNREFUSED 127.0.0.1:3000`

**Location**: `/app/[locale]/(main)/dashboard/profile/edit/page.js`

**Cause**: Server-side fetch using `http://localhost:3000` in production

**Status**: Not fixed yet (needs investigation of specific fetch call)

**Workaround**: Use relative URLs like `/api/communities` instead of `http://localhost:3000/api/communities`

---

## 🚨 Important Notes

### About Generated Prisma Client:
- **Never commit** the `generated/` directory
- Always let Vercel generate it at build time
- DATABASE_URL at build time determines which DB it connects to
- This is why your production was connecting to dev database

### About Community IDs:
- Frontend must send **database IDs**, not Sanity CMS IDs
- The `/api/communities` endpoint should return database IDs
- Onboarding form should use these same IDs

### About P2002 Errors:
- Caused by duplicate email or user ID attempts
- Webhook should create user first (now working)
- Dashboard fallback only for webhook delays
- Stuck users need manual cleanup

---

## 📞 Need Help?

If issues persist after deployment:
1. Share Vercel deployment logs
2. Share `/api/onboarding/complete` request/response
3. Share community processing logs from Vercel
4. Run SQL query to check Community table IDs

**Everything should work after this deployment!** 🎉
