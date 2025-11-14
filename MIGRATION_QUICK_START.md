# Migration Quick Start Guide
## 🚀 Fast Track to User Migration

### 📦 Files Created

```
scripts/
├── test-email.js              # Test email delivery
├── migrate-to-clerk.js        # Main migration script
└── analyze-users.js           # Data analysis tool

docs/
├── MIGRATION_GUIDE.md         # Complete step-by-step guide
├── MIGRATION_VALIDATION_REPORT.md  # Technical validation
└── MIGRATION_QUICK_START.md   # This file
```

---

## ⚡ Quick Commands

### 1. Test Email (DO THIS FIRST!)

```bash
node scripts/test-email.js
```

✅ Check amit2@pm.me for the welcome email
❌ If it fails, check RESEND_API_KEY and try again

---

### 2. Dry Run (5 Users)

```bash
DRY_RUN=true TEST_LIMIT=5 node scripts/migrate-to-clerk.js
```

This won't create any users, just shows what would happen.

---

### 3. Live Test (5 Users, No Emails)

```bash
TEST_LIMIT=5 SEND_EMAILS=false node scripts/migrate-to-clerk.js
```

✅ Creates 5 real users in Clerk
✅ Syncs to Prisma database
❌ Doesn't send emails yet

**After this, test sign-in with one of the migrated users!**

---

### 4. Full Migration (All 692 Users)

```bash
# ONLY RUN AFTER TESTING!
node scripts/migrate-to-clerk.js
```

⏱️ Takes ~25-30 minutes
📧 Sends 692 emails
💾 Creates 692 Clerk users

---

## 🔧 Environment Variables

Add to `.env` if not already present:

```bash
# Required
CLERK_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
DATABASE_URL=postgresql://...

# Optional
NEXT_PUBLIC_APP_URL=https://connectingclimateminds.org
```

---

## 🎛️ Configuration Options

| Variable | Default | Purpose |
|----------|---------|---------|
| `DRY_RUN=true` | false | Test without creating users |
| `TEST_LIMIT=5` | none | Migrate only N users |
| `SEND_EMAILS=false` | true | Skip sending emails |
| `SKIP_IMAGES=true` | false | Skip image processing |
| `DELAY_MS=1000` | 1500 | Delay between requests (ms) |

**Examples:**

```bash
# Dry run with 10 users
DRY_RUN=true TEST_LIMIT=10 node scripts/migrate-to-clerk.js

# Live migration, no emails
SEND_EMAILS=false node scripts/migrate-to-clerk.js

# Faster migration (risk rate limits)
DELAY_MS=1000 node scripts/migrate-to-clerk.js
```

---

## 📊 What to Expect

### Success Output

```
🚀 Connecting Climate Minds Hub - User Migration

📋 Configuration:
   Mode: 🔴 LIVE MIGRATION
   Test Limit: None (full migration)
   Send Emails: Yes
   ...

[1/692] Migrating: [email protected]
  📋 Supabase ID: dd099383-f84e-4418-80c7-613e683f297d
  ✅ Clerk user created: user_2a1b3c...
  💾 Synced to Prisma database
  ✅ Email sent (re_abc123...)
  ✅ Migration complete!

[2/692] Migrating: [email protected]
  ...
```

### Error Example

```
[42/692] Migrating: [email protected]
  📋 Supabase ID: ...
  ⏳ Rate limit hit, waiting 12000ms...
  ✅ Clerk user created: user_xyz...
  💾 Synced to Prisma database
  ⚠️  Email send failed: Network timeout
  ✅ Migration complete!
```

---

## ✅ Pre-Flight Checklist

**Before running any migration:**

- [ ] `.env` file has all required variables
- [ ] `supabase-users.json` exists in project root
- [ ] `pnpm install` completed successfully
- [ ] Test email sent and received successfully
- [ ] Dry run completed without errors
- [ ] Database backup created
- [ ] Clerk dashboard access confirmed
- [ ] Resend dashboard access confirmed

**Create database backup:**

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## 🔍 After Migration

### Check Results

```bash
# View successful migrations
cat migration-results-*.json | jq '.[] | select(.success == true)'

# View failed migrations
cat migration-results-*.json | jq '.[] | select(.success == false)'

# Count results
cat migration-results-*.json | jq 'length'
```

### Verify in Clerk

1. Go to https://dashboard.clerk.com
2. Check Users section
3. Should see 692 users (or TEST_LIMIT count)

### Verify in Database

```sql
SELECT COUNT(*) FROM "User";  -- Should be 692
SELECT email, "firstName", "lastName", role FROM "User" LIMIT 10;
```

### Test Sign-In

1. Go to your app: https://connectingclimateminds.org/sign-in
2. Use a migrated user's email and password
3. Should sign in successfully

---

## 🆘 Troubleshooting

### Email doesn't send

```bash
# Check Resend API key
echo $RESEND_API_KEY

# Test email script
node scripts/test-email.js
```

### Rate limit errors

```bash
# Increase delay between requests
DELAY_MS=2000 node scripts/migrate-to-clerk.js

# Or run in smaller batches
TEST_LIMIT=100 node scripts/migrate-to-clerk.js
# Then run again (skips existing users)
```

### Migration stops

```bash
# Just run again! Script handles duplicates
node scripts/migrate-to-clerk.js
```

### Prisma errors

```bash
# Generate Prisma client
pnpm prisma generate

# Check database connection
pnpm prisma db pull
```

---

## 📝 Important Notes

### Data Overview

- **Total users:** 692
- **With images:** 0 (no image processing needed!)
- **Completed onboarding:** 0 (all new signups)
- **With first names:** 678 (98%)

### Migration Safety

✅ **Safe to run multiple times** - Duplicate users are skipped
✅ **Partial failures are OK** - Each user is independent
✅ **Can restart anytime** - Progress is saved
✅ **Errors are logged** - Check `migration-log-*.json`

### What Happens

1. **Clerk user created** with bcrypt password
2. **Prisma record created** with all profile data
3. **Welcome email sent** (if SEND_EMAILS=true)
4. **Result logged** for verification

---

## 📚 Need More Details?

- **Step-by-step guide:** See `MIGRATION_GUIDE.md`
- **Technical validation:** See `MIGRATION_VALIDATION_REPORT.md`
- **Script code:** See `scripts/migrate-to-clerk.js`

---

## 🎯 Recommended Flow

```bash
# 1️⃣ Test email
node scripts/test-email.js
# ✅ Verify received at amit2@pm.me

# 2️⃣ Dry run
DRY_RUN=true TEST_LIMIT=5 node scripts/migrate-to-clerk.js
# ✅ Review output, check for errors

# 3️⃣ Live test (no emails)
TEST_LIMIT=5 SEND_EMAILS=false node scripts/migrate-to-clerk.js
# ✅ Check Clerk dashboard
# ✅ Check database
# ✅ Test sign-in

# 4️⃣ Full migration
node scripts/migrate-to-clerk.js
# ⏱️ Wait 25-30 minutes
# 🎉 Done!
```

---

## ⏱️ Time Estimates

- Email test: 1 minute
- Dry run (5 users): 1 minute
- Live test (5 users): 2 minutes
- Full migration (692 users): 25-30 minutes

**Total testing time:** ~5-10 minutes
**Full migration time:** ~30 minutes

---

## 🎊 Success Criteria

Migration is successful when:

✅ Users created in Clerk: 692 (or acceptable rate >99%)
✅ Users in Prisma database: 692
✅ Users can sign in with old passwords
✅ Emails delivered: >95%
✅ Error rate: <1%

---

**Good luck with your migration!** 🚀

*For questions or issues, review the full MIGRATION_GUIDE.md*
