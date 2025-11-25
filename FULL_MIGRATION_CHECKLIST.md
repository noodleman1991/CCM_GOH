# Full Migration Pre-Flight Checklist

## ⚠️ CRITICAL: Complete Before Running Migration

### 1. Environment Variables
```bash
# Verify all required env vars are set
echo "CLERK_SECRET_KEY: ${CLERK_SECRET_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "RESEND_API_KEY: ${RESEND_API_KEY:0:10}..."
echo "NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
```

**Expected output:**
```
CLERK_SECRET_KEY: sk_test_G3...
DATABASE_URL: postgresql://goh...
RESEND_API_KEY: re_AoPNdRK...
NEXT_PUBLIC_APP_URL: https://connectingclimateminds.org
```

---

### 2. Database Backup (MANDATORY!)

```bash
# Create backup with timestamp
pg_dump $DATABASE_URL > backup-full-migration-$(date +%Y%m%d-%H%M%S).sql

# Verify backup was created
ls -lh backup-full-migration-*.sql
```

**Expected:** File size > 0 bytes

---

### 3. Clerk Dashboard Access

1. Go to: https://dashboard.clerk.com
2. Navigate to: Users section
3. Note current user count: _____ (should be 0 or small)
4. Keep dashboard open to monitor

---

### 4. Database Access

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

**Expected:** Current user count (should be 0 or small)

---

### 5. Script Verification

```bash
# Verify migration script exists and is updated
ls -lh scripts/migrate-to-clerk.js
head -20 scripts/migrate-to-clerk.js | grep -E "(createClerkClient|PrismaClient|Resend)"
```

**Expected:** Should see imports for @clerk/backend, Prisma, and Resend

---

### 6. Dependencies Installed

```bash
# Verify packages are installed
pnpm list @clerk/backend resend @prisma/client 2>/dev/null | grep -E "(@clerk/backend|resend|@prisma/client)"
```

**Expected:**
```
@clerk/backend 2.22.0
resend 4.8.0
@prisma/client 6.16.0
```

---

### 7. Test Connection (Optional but Recommended)

```bash
# Test with 1 user first
TEST_LIMIT=1 SEND_EMAILS=false node scripts/migrate-to-clerk.js
```

**Expected:** 1 user successfully created in Clerk and Prisma

**Verify in Clerk:** Should see 1 new user
**Verify in DB:** `SELECT COUNT(*) FROM "User"` should increase by 1

If test succeeds, **delete the test user** from Clerk dashboard before full migration.

---

## 🚀 Full Migration Command

Once ALL checks above pass:

```bash
# Full migration - 692 users, NO emails
SEND_EMAILS=false node scripts/migrate-to-clerk.js
```

---

## 📊 Expected Results

```
🚀 Connecting Climate Minds Hub - User Migration

📋 Configuration:
   Mode: 🔴 LIVE MIGRATION
   Test Limit: None (full migration)
   Send Emails: No
   Process Images: Yes
   Delay between requests: 1500ms

👥 Found 692 users to migrate

[1/692] Migrating: pamela.velasquez@udea.edu.co
  📋 Supabase ID: dd099383-f84e-4418-80c7-613e683f297d
  ✅ Clerk user created: user_2a1b3c4d5e6f7g8h
  💾 Synced to Prisma database
  ✅ Migration complete!

[2/692] Migrating: otunidris@gmail.com
  ...

============================================================
📊 MIGRATION SUMMARY
============================================================
Total users:          692
✅ Successful:        692 (or close to it)
❌ Failed:            0 (or very few)
⏭️  Skipped:           0
📧 Emails sent:       0
⏱️  Duration:          ~25-30 minutes
============================================================
```

---

## 🔍 During Migration - Monitor These

### 1. Clerk Dashboard
- Watch user count increase: 0 → 692
- Refresh periodically
- Look for any error indicators

### 2. Console Output
- Watch for: ✅ symbols (success)
- Watch for: ❌ symbols (errors)
- Note any rate limit messages: `⏳ Rate limit hit...`

### 3. Database (Optional)
```bash
# In another terminal, watch user count grow
watch -n 5 'psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"'
```

---

## ⚠️ If Something Goes Wrong

### Rate Limit Errors
```
⏳ Rate limit hit, waiting 12000ms...
```
**Action:** Normal! Script will auto-retry. Be patient.

### Database Errors
```
❌ Prisma sync failed: ...
```
**Action:**
1. Check database connection
2. User is still created in Clerk
3. Can manually sync later

### Clerk API Errors
```
❌ User Migration: ... 422 already exists
```
**Action:** Normal if user already exists. Script will skip.

### Script Crashes
**Action:** Just run again! Script is idempotent (safe to restart).

---

## ✅ After Migration - Verify

### 1. Check Clerk Dashboard
```
Expected: 692 users
Verify: User list shows all migrated users
```

### 2. Check Database
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
# Expected: 692

psql $DATABASE_URL -c "SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"
# Should show distribution of roles
```

### 3. Test Sign-In (CRITICAL!)
1. Pick 3-5 random users from the migration results
2. Try signing in at: https://connectingclimateminds.org/sign-in
3. Use their email and **original Supabase password**
4. Should work immediately!

**Test users:**
- pamela.velasquez@udea.edu.co
- otunidris@gmail.com
- mmaxwelldoyle@delawareestuary.org

### 4. Review Migration Log
```bash
# Check for errors
cat migration-log-*.json | jq '.errors[] | {email: .email, error: .error}'

# Check statistics
cat migration-log-*.json | jq '.summary'
```

---

## 📧 After Verification - Send Welcome Emails

**IMPORTANT:** Only after confirming all users can sign in successfully!

### Option 1: Send All Emails Now
```bash
# This will send 692 welcome emails
SEND_EMAILS=true node scripts/migrate-to-clerk.js
```
**Note:** Script will skip users already migrated, only send emails

### Option 2: Send Test Batch First
```bash
# Send to first 10 users only
TEST_LIMIT=10 SEND_EMAILS=true node scripts/migrate-to-clerk.js
```

### Option 3: Skip Emails (Send Later or Not at All)
```bash
# Users can still sign in, just won't get welcome email
# You decide when/if to notify them
```

---

## 🚨 Rollback (If Needed)

### Delete All Migrated Users from Clerk
1. Go to Clerk Dashboard → Users
2. Bulk select all users
3. Delete (or use Clerk API)

### Restore Database
```bash
# Restore from backup
psql $DATABASE_URL < backup-full-migration-YYYYMMDD-HHMMSS.sql
```

---

## 📊 Migration Statistics

**Total users to migrate:** 692
**Users without onboarding:** 692 (all of them)
**Users with images:** 0
**Expected duration:** 25-30 minutes
**Expected success rate:** >99% (685-692 users)

---

## ✨ Success Criteria

Migration is successful when:

- ✅ 685+ users created in Clerk (>99% success rate)
- ✅ 685+ records in Prisma database
- ✅ Test users can sign in with old passwords
- ✅ User data correctly mapped (names, emails, roles)
- ✅ Metadata stored in Clerk (supabaseId, etc.)
- ✅ No critical errors in migration log

---

## 🎯 Final Checklist Before Running

- [ ] Database backup created and verified
- [ ] Environment variables checked
- [ ] Clerk dashboard open and ready
- [ ] Database connection tested
- [ ] Script dependencies installed
- [ ] Test migration with 1 user successful
- [ ] Test user deleted from Clerk
- [ ] Ready to commit ~30 minutes
- [ ] Support team notified (if applicable)
- [ ] Monitoring tools ready

---

## 🚀 Ready? Run This:

```bash
SEND_EMAILS=false node scripts/migrate-to-clerk.js
```

**Monitor closely for the next 25-30 minutes!**

Good luck! 🎉
