-- Collaboration.createdBy cascaded: deleting the creator's user row deleted
-- every workspace they created, with every other member's threads, files,
-- plans and docs. The creator is now optional and the constraint sets it to
-- NULL on delete; the erasure helper hands ownership (and creator) to the
-- oldest remaining member before the row goes.
ALTER TABLE "Collaboration" DROP CONSTRAINT IF EXISTS "Collaboration_createdById_fkey";
ALTER TABLE "Collaboration" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Collaboration"
  ADD CONSTRAINT "Collaboration_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
