-- Additive enum values + one PII column drop.
-- MessagePrivacy: FOLLOWERS / CONTACTS tiers between EVERYONE and NOBODY.
ALTER TYPE "MessagePrivacy" ADD VALUE IF NOT EXISTS 'FOLLOWERS';
ALTER TYPE "MessagePrivacy" ADD VALUE IF NOT EXISTS 'CONTACTS';

-- FollowTargetType: people can be followed (drives the FOLLOWERS tier + profile follow).
ALTER TYPE "FollowTargetType" ADD VALUE IF NOT EXISTS 'USER';

-- Anonymous comments no longer collect an email (GDPR data minimization,
-- collection stopped 2026-08-18). Existing values are purged with the column.
ALTER TABLE "Comment" DROP COLUMN IF EXISTS "authorEmail";
