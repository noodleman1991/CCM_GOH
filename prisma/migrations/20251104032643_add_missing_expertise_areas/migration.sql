-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ExpertiseArea" ADD VALUE 'EDUCATION';
ALTER TYPE "public"."ExpertiseArea" ADD VALUE 'SOCIAL_JUSTICE';

-- DropIndex
DROP INDEX "public"."idx_user_bio_trgm";

-- DropIndex
DROP INDEX "public"."idx_user_firstname_trgm";

-- DropIndex
DROP INDEX "public"."idx_user_lastname_trgm";

-- DropIndex
DROP INDEX "public"."idx_user_organization_trgm";

-- DropIndex
DROP INDEX "public"."idx_user_position_trgm";

-- DropIndex
DROP INDEX "public"."idx_user_username_trgm";
