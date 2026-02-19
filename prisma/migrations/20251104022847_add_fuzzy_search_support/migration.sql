/*
  Warnings:

  - You are about to drop the column `twitterHandle` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('EN', 'ES', 'FR', 'AR');

-- CreateEnum
CREATE TYPE "public"."ProfileVisibility" AS ENUM ('PUBLIC', 'MEMBERS', 'PRIVATE');

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "twitterHandle",
ADD COLUMN     "isSearchable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otherSocialLinks" JSONB,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "phoneVerified" TIMESTAMP(3),
ADD COLUMN     "preferredLanguage" "public"."Language" NOT NULL DEFAULT 'EN',
ADD COLUMN     "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileVisibility" "public"."ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showLocation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPhoneNumber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showSocialLinks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showWorkDetails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "welcomeMessageSeen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."download_events" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fileLanguage" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "referer" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_metadata" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "download_events_userId_idx" ON "public"."download_events"("userId");

-- CreateIndex
CREATE INDEX "download_events_timestamp_idx" ON "public"."download_events"("timestamp");

-- CreateIndex
CREATE INDEX "download_events_reportId_idx" ON "public"."download_events"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_metadata_sanityId_key" ON "public"."report_metadata"("sanityId");

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on User fields for trigram similarity search
CREATE INDEX IF NOT EXISTS idx_user_firstname_trgm ON "public"."User" USING gin ("firstName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_lastname_trgm ON "public"."User" USING gin ("lastName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_username_trgm ON "public"."User" USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_bio_trgm ON "public"."User" USING gin (bio gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_organization_trgm ON "public"."User" USING gin (organization gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_position_trgm ON "public"."User" USING gin (position gin_trgm_ops);
