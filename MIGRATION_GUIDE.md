# User Migration Guide: Supabase → Clerk
## Connecting Climate Minds Hub

This guide covers the complete migration process from Supabase Auth to Clerk for the Connecting Climate Minds Hub.

---

## 📋 Pre-Migration Checklist

### 1. Environment Setup

Ensure all required environment variables are set in `.env`:

```bash
# Required for migration
CLERK_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
DATABASE_URL=postgresql://...

# Application URLs
NEXT_PUBLIC_APP_URL=https://connectingclimateminds.org
# or fallback to:
NEXT_PUBLIC_SITE_URL=https://connectingclimateminds.org
```

### 2. Data Preparation

- [x] `supabase-users.json` file is in project root
- [ ] Backup current Prisma database
- [ ] Verify Clerk dashboard access
- [ ] Verify Resend email sending works

**Backup your database:**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 3. Dependencies

Install all required packages:
```bash
pnpm install
```

Required packages:
- `@clerk/clerk-sdk-node` - Clerk backend SDK
- `resend` - Email service
- `@prisma/client` - Database ORM
- `dotenv` - Environment variables
- `node-fetch` - HTTP requests

---

## 🧪 Testing Phase

### Step 1: Test Email Delivery

**IMPORTANT:** Always test emails first before migrating users!

```bash
# Test email to amit2@pm.me
node scripts/test-email.js
```

**Verify:**
1. Email is received at amit2@pm.me
2. Subject line is correct
3. All links work (especially sign-in link)
4. Formatting looks professional
5. No broken images or styling issues

**If email test fails:**
- Check RESEND_API_KEY is valid
- Verify [email protected] is authorized in Resend
- Check spam folder
- Review Resend dashboard for errors

---

### Step 2: Dry Run Test (5 Users)

Run a **dry run** to test the migration logic without creating actual users:

```bash
DRY_RUN=true TEST_LIMIT=5 node scripts/migrate-to-clerk.js
```

**What this does:**
- ✅ Reads and transforms 5 users from supabase-users.json
- ✅ Validates data transformation
- ✅ Shows what would happen
- ❌ Does NOT create users in Clerk
- ❌ Does NOT send emails
- ❌ Does NOT modify Prisma database

**Expected output:**
```
🚀 Connecting Climate Minds Hub - User Migration

📋 Configuration:
   Mode: 🧪 DRY RUN
   Test Limit: 5
   ...

[1/5] Migrating: [email protected]
  📋 Supabase ID: dd099383-f84e-4418-80c7-613e683f297d
  👤 [DRY RUN] Would create Clerk user: [email protected]
  💾 [DRY RUN] Would sync to Prisma: [email protected]
  📧 [DRY RUN] Would send email to [email protected]
  ✅ Migration complete!
```

**Verify:**
- [ ] All 5 users are processed
- [ ] No errors in data transformation
- [ ] Enum mappings work correctly
- [ ] Console output is clear and informative

---

### Step 3: Live Test (5 Users)

Run a **live migration** with 5 test users:

```bash
TEST_LIMIT=5 SEND_EMAILS=false node scripts/migrate-to-clerk.js
```

**What this does:**
- ✅ Creates 5 real users in Clerk
- ✅ Syncs users to Prisma database
- ✅ Processes profile images
- ❌ Does NOT send emails (we disabled them)

**Verify in Clerk Dashboard:**
1. Go to https://dashboard.clerk.com
2. Navigate to Users section
3. Check that 5 users were created
4. Verify user data:
   - Email addresses are correct
   - First/Last names are populated
   - External ID matches Supabase user_id
   - Metadata contains `supabaseId`

**Verify in Prisma Database:**
```bash
# Connect to your database and check
psql $DATABASE_URL

# Check users table
SELECT id, email, "firstName", "lastName", role, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Verify:**
- [ ] 5 users exist in Clerk dashboard
- [ ] Users can sign in with their old passwords
- [ ] Prisma database has 5 new users
- [ ] Enum fields are correctly mapped (role, ageGroup, etc.)
- [ ] Arrays are correctly stored (workTypes, expertiseAreas)

**Test Sign-In:**
1. Go to your app's sign-in page
2. Try signing in with one of the migrated users
3. Use their original email and password
4. Verify successful sign-in

---

### Step 4: Email Test (3 Users)

Now test with emails enabled:

```bash
TEST_LIMIT=3 node scripts/migrate-to-clerk.js
```

**IMPORTANT:** First update the script to send test emails to `amit2@pm.me` instead of real user emails!

**Modify the script temporarily:**
```javascript
// In sendInvitationEmail function, change:
to: user.email,
// To:
to: 'amit2@pm.me', // TEST ONLY
```

**Verify:**
- [ ] 3 emails received at amit2@pm.me
- [ ] Email content is personalized (correct first name)
- [ ] Sign-in link works
- [ ] No errors in migration log

**After approval, revert the email change back to production.**

---

## 🚀 Full Migration

### Pre-Flight Checklist

Before running the full migration:

- [ ] All tests passed successfully
- [ ] Emails tested and approved
- [ ] Database backup created
- [ ] Clerk account has sufficient capacity (692 users)
- [ ] Email sending domain verified in Resend
- [ ] Team is aware of migration timing
- [ ] Support team is ready for user questions

### Recommended Migration Window

**Best practices:**
- Run during low-traffic hours
- Notify users 24-48 hours in advance
- Have support team available
- Monitor Clerk and Resend dashboards during migration

### Execute Full Migration

```bash
# Full migration with all features
node scripts/migrate-to-clerk.js
```

**Monitor during migration:**
1. **Console output** - Watch for errors
2. **Clerk Dashboard** - Check user creation rate
3. **Resend Dashboard** - Monitor email delivery
4. **Error logs** - Check `migration-log-*.json` if errors occur

**Expected duration:**
- 692 users × 1.5s delay = ~17 minutes
- Add time for image processing and emails
- Total: ~25-30 minutes

### Advanced Options

```bash
# Skip image processing (faster)
SKIP_IMAGES=true node scripts/migrate-to-clerk.js

# Don't send emails (send manually later)
SEND_EMAILS=false node scripts/migrate-to-clerk.js

# Faster migration (risk rate limits)
DELAY_MS=1000 node scripts/migrate-to-clerk.js

# Process only specific batch
# First, split supabase-users.json into batches manually
INPUT_FILE=batch-1-users.json node scripts/migrate-to-clerk.js
```

---

## 🔍 Post-Migration Verification

### Step 1: Check Migration Results

Review the migration results file:
```bash
cat migration-results-*.json | jq '.[] | select(.success == false)'
```

**Verify:**
- [ ] All 692 users successfully migrated (or note failures)
- [ ] No critical errors in migration log
- [ ] Email delivery rate is acceptable

### Step 2: Verify Clerk Dashboard

1. **User Count:** Should show 692 users
2. **User Data:** Spot-check 10-20 random users
3. **Metadata:** Verify `supabaseId` is stored correctly

### Step 3: Verify Prisma Database

```sql
-- Count users
SELECT COUNT(*) FROM "User";
-- Should be 692

-- Check data distribution
SELECT role, COUNT(*) FROM "User" GROUP BY role;
SELECT "ageGroup", COUNT(*) FROM "User" GROUP BY "ageGroup";
SELECT "preferredLanguage", COUNT(*) FROM "User" GROUP BY "preferredLanguage";

-- Check for nulls in critical fields
SELECT COUNT(*) FROM "User" WHERE email IS NULL;
SELECT COUNT(*) FROM "User" WHERE "firstName" IS NULL;
```

### Step 4: Test User Sign-Ins

Test with 5-10 users across different categories:
- [ ] Users with complete profiles
- [ ] Users with minimal profiles
- [ ] Users with different roles
- [ ] Users with special characters in names/emails

### Step 5: Check Email Delivery

In Resend dashboard:
- [ ] Check delivery rate (~692 emails)
- [ ] Review bounce rate (should be <5%)
- [ ] Check spam complaints (should be 0)
- [ ] Review any delivery failures

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Rate Limit Errors (429)

**Symptoms:**
```
⏳ Rate limit hit, waiting 12000ms...
```

**Solutions:**
- Script will auto-retry with exponential backoff
- Increase `RETRY_DELAY_MS` if persistent
- Contact Clerk support for rate limit increase
- Run migration in smaller batches

#### 2. Image Upload Failures

**Symptoms:**
```
⚠️  Image processing failed: HTTP 404
```

**Solutions:**
- Images will be skipped, user still migrated
- Original image URL stored in metadata
- Can retry image upload later manually
- Or use `SKIP_IMAGES=true` to skip all images

#### 3. Email Send Failures

**Symptoms:**
```
❌ Error [Email Send]: Unable to fetch data
```

**Solutions:**
- User is still migrated to Clerk
- Can send welcome emails manually later
- Check Resend API key and domain verification
- Review Resend dashboard for specific errors

#### 4. Prisma Sync Failures

**Symptoms:**
```
⚠️  Prisma sync failed: Unique constraint violation
```

**Solutions:**
- User exists in Clerk but not Prisma (or vice versa)
- Check database constraints
- May need to run sync separately
- Review migration log for details

#### 5. Password Hash Issues

**Symptoms:**
```
❌ User Migration: Password digest format invalid
```

**Solutions:**
- Verify password is bcrypt format: `$2a$10$...`
- Check `passwordHasher: 'bcrypt'` is set
- Some passwords may be in different format
- Contact Clerk support if persistent

### Recovery Procedures

#### If Migration Fails Mid-Way

The script is idempotent and can be safely restarted:

```bash
# Script will skip users that already exist in Clerk
node scripts/migrate-to-clerk.js
```

Users already migrated will be detected and skipped (HTTP 422 error).

#### Rollback Procedure

**If you need to rollback:**

1. **Delete users from Clerk:**
   - Use Clerk dashboard bulk delete
   - Or use Clerk API to delete by external_id (Supabase ID)

2. **Restore Prisma database:**
   ```bash
   psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
   ```

3. **Resend emails manually if needed**

#### Partial Migration

If you need to migrate in batches:

```bash
# Create batch files
jq '.[0:200]' supabase-users.json > batch-1.json
jq '.[200:400]' supabase-users.json > batch-2.json
jq '.[400:692]' supabase-users.json > batch-3.json

# Migrate each batch
INPUT_FILE=batch-1.json node scripts/migrate-to-clerk.js
# Wait and monitor...
INPUT_FILE=batch-2.json node scripts/migrate-to-clerk.js
# Wait and monitor...
INPUT_FILE=batch-3.json node scripts/migrate-to-clerk.js
```

---

## 📊 Migration Data Analysis

### Data Overview (from analysis)

```
Total users: 692
Users with profile images: 0
Users who completed onboarding: 0
Users with work types: 0
Users with expertise: 0
Users with first name: 678
Users with country: 0
```

**Insights:**
- Most users have basic registration data only
- 678/692 have first names (98%)
- Very few completed profiles
- No profile images to migrate
- Simpler migration (less image processing)

### Expected Mapping

**Role distribution:**
- Most users: `community_member` (authenticated)
- Admin users: Check `is_super_admin` flag
- Special roles: Based on `auth_role` field

**Language distribution:**
- Default: `EN` (English)
- Others: Based on `lang` field

**Age groups:**
- Will be sparse (most users didn't provide)
- Map from `age_range` field

---

## 📝 Field Mapping Reference

### Supabase → Clerk

| Supabase Field | Clerk Field | Notes |
|----------------|-------------|-------|
| `user_id` | `externalId` | Stored as reference |
| `email` | `emailAddress` | Primary identifier |
| `encrypted_password` | `passwordDigest` | bcrypt hash |
| `first_name` | `firstName` | From metadata or top-level |
| `last_name` | `lastName` | From metadata or top-level |
| `username` | `username` | Optional |
| `email_confirmed_at` | N/A | Stored in Prisma |
| `avatar_url` | Profile Image | Via `updateUserProfileImage` |

### Supabase → Prisma

| Supabase Field | Prisma Field | Type | Notes |
|----------------|--------------|------|-------|
| `user_id` | N/A | - | Stored in Clerk metadata |
| Clerk `id` | `id` | String | Primary key |
| `email` | `email` | String | Unique |
| `first_name` | `firstName` | String | |
| `last_name` | `lastName` | String | |
| `username` | `username` | String | Unique |
| `avatar_url` | `image` | String | URL |
| `age_range` | `ageGroup` | AgeGroup | Enum: UNDER_18, ABOVE_18 |
| `city_town` | `city` | String | |
| `country` | `country` | String | |
| `types_of_work` | `workTypes` | WorkType[] | Array enum |
| `expertise` | `expertiseAreas` | ExpertiseArea[] | Array enum |
| `organization` | `organization` | String | |
| `position` | `position` | String | |
| `work_bio` | `workBio` | String | |
| `linkedin` | `linkedinProfile` | String | |
| `website` | `personalWebsite` | String | |
| `phone` | `phoneNumber` | String | |
| `phone_confirmed_at` | `phoneVerified` | DateTime | |
| `has_onboarded` | `onboardingCompleted` | Boolean | |
| `lang` | `preferredLanguage` | Language | Enum: EN, ES, FR, AR |
| `public_email` | `showEmail` | Boolean | |
| `email_confirmed_at` | `emailVerified` | DateTime | |
| `auth_created_at` | `createdAt` | DateTime | |
| `auth_role` | `role` | Role | Enum: admin, etc. |

---

## 🎯 Success Criteria

Migration is considered successful when:

- [ ] All 692 users created in Clerk (or acceptable failure rate <1%)
- [ ] All users can sign in with original passwords
- [ ] Prisma database in sync with Clerk
- [ ] Email delivery rate >95%
- [ ] No critical errors in migration log
- [ ] Spot checks show correct data mapping
- [ ] User-facing functionality works (profiles, onboarding, etc.)

---

## 📞 Support

### Internal Team

- Migration script issues: Review error logs
- Clerk issues: Check Clerk dashboard or contact support
- Email issues: Check Resend dashboard
- Database issues: Review Prisma logs

### User Support

Prepare support team with:
- Migration announcement message
- FAQ about login issues
- Password reset process
- Contact information

**Common user questions:**
- "My password doesn't work" → Try password reset
- "I didn't receive an email" → Check spam, verify email address
- "My profile is missing data" → Most users had incomplete profiles

---

## 🔒 Security Notes

- ✅ Password hashes are bcrypt (secure)
- ✅ Passwords are never stored in plain text
- ✅ Clerk handles password security going forward
- ✅ Sensitive metadata in `privateMetadata`
- ✅ Audit logs in Clerk dashboard
- ⚠️  Delete `supabase-users.json` after migration
- ⚠️  Secure migration logs (contain user data)

---

## ✅ Final Checklist

After successful migration:

- [ ] Verify all users can sign in
- [ ] Update application to use Clerk exclusively
- [ ] Disable Supabase Auth
- [ ] Update sign-in/sign-up flows
- [ ] Test protected routes
- [ ] Verify webhooks are working
- [ ] Monitor error rates for 48 hours
- [ ] Send announcement to users
- [ ] Archive migration logs securely
- [ ] Delete `supabase-users.json` file
- [ ] Update documentation
- [ ] Celebrate! 🎉

---

## Questions?

For migration-specific questions:
- Review this guide
- Check error logs
- Review Clerk documentation: https://clerk.com/docs

For Clerk support:
- https://clerk.com/support

For Resend support:
- https://resend.com/docs
