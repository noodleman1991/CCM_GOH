# 🔒 URGENT: Security & Environment Configuration

## Critical Steps After Production Fixes

The code fixes have been deployed to GitHub. Now complete these **CRITICAL** manual steps:

---

## Step 1: Rotate Exposed Clerk Keys (IMMEDIATE - 10 min)

### Why This Matters
Your Clerk API keys were exposed in git history (commit 27e53c86b). Even though the commit was removed, the keys may have been scanned by bots.

### 1.1 Rotate Live Secret Key (Production)

```
1. Go to: https://dashboard.clerk.com
2. Select your application: "Connecting Climate Minds"
3. Go to: API Keys
4. Under "Live Keys" section:
   - Click "Rotate" next to Secret Key
   - Copy the NEW sk_live_... key immediately
5. Save the new key
```

### 1.2 Update Vercel Production Environment Variables

```
1. Go to: Vercel Dashboard
2. Select project: connecting-climate-minds
3. Go to: Settings → Environment Variables
4. Update these variables for PRODUCTION ONLY:
   - CLERK_SECRET_KEY = <paste new sk_live_... key>
   - Click "Save"
```

### 1.3 Rotate Test Secret Key (Development)

```
1. Back in Clerk Dashboard → API Keys
2. Under "Test Keys" section:
   - Click "Rotate" next to Secret Key
   - Copy the NEW sk_test_... key immediately
3. Save the new key
```

### 1.4 Update Local Development Keys

Edit `.env.local`:
```bash
CLERK_SECRET_KEY=<paste new sk_test_... key>
```

### 1.5 Rotate Webhook Signing Secret

```
1. Clerk Dashboard → Webhooks
2. Find your production webhook endpoint
3. Click to edit
4. Click "Rotate Signing Secret"
5. Copy the new secret
6. Go to Vercel → Settings → Environment Variables
7. Update CLERK_WEBHOOK_SECRET for PRODUCTION
```

### 1.6 Redeploy Production

```
1. Vercel Dashboard → Deployments
2. Find latest deployment
3. Click "..." → "Redeploy"
4. Wait for deployment to complete
```

✅ **Verification:** Try signing up a new user - should work without errors.

---

## Step 2: Verify Database Separation (5 min)

### Why This Matters
Production logs show dev users (fatherjohnmisty666, amit33) are visible in production `/collaborate`, meaning environments are sharing the same database.

### 2.1 Check Current Database URLs

```
1. Go to: Vercel Dashboard → Settings → Environment Variables
2. Find DATABASE_URL variable
3. Check what value is set for:
   - Production
   - Preview
   - Development
```

### 2.2 Expected Configuration

**Production should point to MAIN branch:**
```
DATABASE_URL=postgresql://goh_owner:<PASSWORD>@ep-misty-dawn-xxx.eu-west-2.aws.neon.tech/goh
```

**Development/Preview should point to DEVELOPMENT branch:**
```
DATABASE_URL=postgresql://goh_owner:<PASSWORD>@ep-different-id-xxx.eu-west-2.aws.neon.tech/goh
```

The hostnames should be **DIFFERENT** between production and development.

### 2.3 If They're The Same (Fix This):

```
1. Go to: https://console.neon.tech
2. Select your project
3. Go to: Branches tab
4. You should see TWO branches:
   - main (for production)
   - development (for dev/preview)

5. If you only see ONE branch:
   - Click "Create Branch"
   - Name: "development"
   - Branch from: "main"
   - Click "Create"

6. Copy the connection string for DEVELOPMENT branch

7. Update Vercel Environment Variables:
   - Production: Use MAIN branch DATABASE_URL
   - Preview: Use DEVELOPMENT branch DATABASE_URL
   - Development: Use DEVELOPMENT branch DATABASE_URL

8. Also update local .env.local with DEVELOPMENT branch URL
```

### 2.4 Redeploy After Database Changes

```
Vercel → Deployments → Redeploy latest
```

✅ **Verification:**
1. Go to production `/en/collaborate`
2. Dev test users (fatherjohnmisty666, amit33, etc.) should **NOT** appear
3. Only production users should be visible

---

## Step 3: Test Everything (5 min)

### 3.1 Test Sign Up Flow

```
1. Open production site: https://hub.connectingclimateminds.org
2. Sign up with a NEW test email
3. Complete onboarding
4. Should redirect to dashboard successfully
```

### 3.2 Check Production Logs

```
1. Vercel → Project → Logs
2. Filter for: /api/webhooks/clerk
3. Should see: ✅ Created user: user_xxx
4. Should NOT see: ❌ profileImage is not defined
5. Should NOT see: Unique constraint failed on email (repeated)
```

### 3.3 Verify Database Separation

```
1. Sign up a test user in DEVELOPMENT (localhost:3000)
2. Check production /collaborate page
3. Dev test user should NOT appear in production
4. Confirms databases are separated
```

---

## What Was Fixed in Code (Already Deployed)

✅ **Webhook crash fixed** - `profileImage` variable scope corrected
✅ **Email conflict handling improved** - Dashboard finds users by email on P2002
✅ **Environment validation** - Prevents cross-environment webhooks (if enabled)

---

## Summary Checklist

- [ ] Rotated Clerk live secret key (sk_live_...)
- [ ] Rotated Clerk test secret key (sk_test_...)
- [ ] Updated Vercel production CLERK_SECRET_KEY
- [ ] Updated local .env.local CLERK_SECRET_KEY
- [ ] Rotated webhook signing secret
- [ ] Updated Vercel CLERK_WEBHOOK_SECRET
- [ ] Verified DATABASE_URL is different for prod vs dev
- [ ] If same, created dev branch and updated Vercel vars
- [ ] Redeployed production
- [ ] Tested sign up flow - works without errors
- [ ] Verified dev users don't appear in production

---

## If You Need Help

**Webhook still crashing?**
- Check Vercel logs for exact error
- Verify new Clerk keys are active
- Webhook signing secret matches Clerk dashboard

**Database still shared?**
- Double-check Vercel DATABASE_URL values
- Ensure hostnames are different (ep-different-ids)
- Clear browser cache and test again

**Questions?**
- Post logs from Vercel
- Share DATABASE_URL format (hide password)
- Include error messages from browser console
