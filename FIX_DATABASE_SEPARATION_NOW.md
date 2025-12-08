# 🚨 FIX DATABASE SEPARATION - Step by Step

## THE PROBLEM (Found It!)

Your Vercel DATABASE_URL is set to **"All Environments"** - this means:
- Production uses: `ep-misty-dawn-abcx8is6-pooler`
- Preview uses: `ep-misty-dawn-abcx8is6-pooler`
- Development uses: `ep-misty-dawn-abcx8is6-pooler`

**They're all using the SAME database!** That's why dev users appear in production.

---

## THE DATABASES YOU HAVE

Based on your `.env` files:

**Database 1**: `ep-misty-dawn-abcx8is6-pooler` (currently in Vercel - DEV database)
**Database 2**: `ep-lucky-waterfall-abdtu0g5-pooler` (in local .env - PROD database)

---

## STEP-BY-STEP FIX (5 minutes)

### Step 1: Delete the "All Environments" Variable

```
1. Go to: Vercel Dashboard → Project Settings → Environment Variables
2. Find: DATABASE_URL (shows "All Environments")
3. Click the "..." menu → DELETE
4. Confirm deletion
```

---

### Step 2: Add Production DATABASE_URL

```
1. Still in Environment Variables page
2. Click "Add New"
3. Fill in:

   Name: DATABASE_URL

   Value: postgresql://goh_owner:npg_eT3CGZfqrR7g@ep-lucky-waterfall-abdtu0g5-pooler.eu-west-2.aws.neon.tech/goh?sslmode=require&channel_binding=require

   Environments: ✅ Production ONLY (uncheck Preview and Development)

4. Click "Save"
```

**Critical**: Only check "Production" - DO NOT check "Preview" or "Development"

---

### Step 3: Add Preview/Development DATABASE_URL

```
1. Click "Add New" again
2. Fill in:

   Name: DATABASE_URL

   Value: postgresql://goh_owner:npg_eT3CGZfqrR7g@ep-misty-dawn-abcx8is6-pooler.eu-west-2.aws.neon.tech/goh?sslmode=require&channel_binding=require

   Environments: ✅ Preview + ✅ Development (uncheck Production)

3. Click "Save"
```

**Critical**: Only check "Preview" and "Development" - DO NOT check "Production"

---

### Step 4: Verify Your Configuration

After saving, you should see TWO DATABASE_URL entries:

```
DATABASE_URL
Production
postgresql://...@ep-lucky-waterfall-abdtu0g5-pooler... (MAIN/PROD)

DATABASE_URL
Preview, Development
postgresql://...@ep-misty-dawn-abcx8is6-pooler... (DEV)
```

**If you see this, you're correct!** ✅

---

### Step 5: Redeploy Production

```
1. Go to: Vercel → Deployments
2. Find latest deployment
3. Click "..." → "Redeploy"
4. WAIT for deployment to complete (3-5 minutes)
```

**What happens during deploy**:
- Vercel reads Production DATABASE_URL (ep-lucky-waterfall-abdtu0g5-pooler)
- Runs `prisma generate` with this URL
- Fresh Prisma client connects to PRODUCTION database
- Dev users will disappear!

---

### Step 6: Clear the Build Cache (Important!)

```
1. Go to: Vercel → Settings → Advanced
2. Find: "Clear Build Cache"
3. Click "Clear"
4. Trigger another deployment
```

This ensures old cached Prisma client is gone.

---

### Step 7: Test Database Separation

#### Test A: Check Production Database Connection

```
1. Go to: https://hub.connectingclimateminds.org/en/collaborate
2. Look at users displayed
3. Expected: Should NOT see dev users (fatherjohnmisty666, amit33, etc.)
4. Result: ✅ Only production users visible
```

#### Test B: Check Deployment Logs

```
1. Vercel → Deployments → Latest → View Function Logs
2. Filter for: prisma generate
3. Look for which database URL was used
4. Expected: Should show ep-lucky-waterfall-abdtu0g5-pooler
```

#### Test C: Count Users

Create this debug endpoint to verify which DB is being used:

**File**: `app/api/debug/db-info/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: { username: true, createdAt: true }
    })

    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT current_database() as db_name,
             inet_server_addr() as server_ip
    `

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      userCount,
      sampleUsernames: sampleUsers.map(u => u.username),
      databaseInfo: dbInfo,
      // Show only hostname (not full connection string)
      databaseHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      databaseHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]
    }, { status: 500 })
  }
}
```

**Then visit**:
- Production: `https://hub.connectingclimateminds.org/api/debug/db-info`
- Local dev: `http://localhost:3000/api/debug/db-info`

**Expected**:
- Production shows: `ep-lucky-waterfall-abdtu0g5-pooler`
- Local dev shows: `ep-misty-dawn-abcx8is6-pooler`
- Different user counts
- Different sample usernames

---

## IF IT STILL DOESN'T WORK

### Check 1: Verify Environment Variable Scoping

```
Vercel → Settings → Environment Variables

You should see EXACTLY:

DATABASE_URL
Production
postgresql://...@ep-lucky-waterfall-abdtu0g5-pooler...

DATABASE_URL
Preview, Development
postgresql://...@ep-misty-dawn-abcx8is6-pooler...
```

**If you see "All Environments" anywhere, DELETE IT and redo Steps 2-3.**

---

### Check 2: Verify Build Logs

```
1. Vercel → Deployments → Latest → Building
2. Search for: "prisma generate"
3. Check output shows correct DATABASE_URL
```

**Expected in production build**:
```
Running "prisma generate"
datasource db {
  url = "postgresql://...@ep-lucky-waterfall-abdtu0g5-pooler..."
}
```

---

### Check 3: Check Which Database Has Which Users

**Production Database** (`ep-lucky-waterfall-abdtu0g5-pooler`):
```sql
-- Connect to this database in Neon Console
SELECT username, email, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Expected**: Should NOT have fatherjohnmisty666, amit33, etc.

**Dev Database** (`ep-misty-dawn-abcx8is6-pooler`):
```sql
-- Connect to this database in Neon Console
SELECT username, email, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Expected**: Should HAVE fatherjohnmisty666, amit33, etc.

---

## COMMON MISTAKE TO AVOID

### ❌ WRONG: "All Environments"
```
DATABASE_URL
All Environments     <-- This is WRONG!
postgresql://...
```

### ✅ CORRECT: Separate Scoping
```
DATABASE_URL
Production           <-- Separate for prod
postgresql://...@ep-lucky-waterfall-abdtu0g5...

DATABASE_URL
Preview, Development  <-- Separate for dev
postgresql://...@ep-misty-dawn-abcx8is6...
```

---

## SUMMARY OF WHAT YOU'LL DO

1. ✅ Delete "All Environments" DATABASE_URL
2. ✅ Add Production-only DATABASE_URL (ep-lucky-waterfall-abdtu0g5)
3. ✅ Add Preview/Dev DATABASE_URL (ep-misty-dawn-abcx8is6)
4. ✅ Clear build cache
5. ✅ Redeploy
6. ✅ Test /collaborate page (dev users gone)
7. ✅ Test debug endpoint (shows correct hostname)

**After this, database separation will FINALLY work!**

---

## VERIFICATION CHECKLIST

After completing all steps:

- [ ] Vercel shows 2 separate DATABASE_URL entries (not "All Environments")
- [ ] Production DATABASE_URL shows ep-lucky-waterfall-abdtu0g5-pooler
- [ ] Preview/Dev DATABASE_URL shows ep-misty-dawn-abcx8is6-pooler
- [ ] Redeployed production
- [ ] Cleared build cache
- [ ] /collaborate page shows NO dev users
- [ ] Debug endpoint shows correct hostname
- [ ] Local dev still works
- [ ] New sign-ups work in production

**Do this NOW and it will work!** 🎯
