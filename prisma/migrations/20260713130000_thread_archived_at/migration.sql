-- Archive flag for workspace threads (soft delete; comments retained).
ALTER TABLE "CollaborationThread" ADD COLUMN "archivedAt" TIMESTAMP(3);
