-- Comments on events + weekly digest preferences.
ALTER TYPE "CommentTargetType" ADD VALUE IF NOT EXISTS 'event';

ALTER TABLE "NotificationPreference" ADD COLUMN "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN "digestSentAt" TIMESTAMP(3);
