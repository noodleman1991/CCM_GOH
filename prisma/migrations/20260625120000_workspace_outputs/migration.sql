-- Workspace outputs: link a workspace to the Sanity drafts it produces.
CREATE TABLE "WorkspaceOutput" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "sanityId" TEXT NOT NULL,
    "sanityType" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceOutput_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkspaceOutput_collaborationId_sanityId_key" ON "WorkspaceOutput"("collaborationId", "sanityId");
CREATE INDEX "WorkspaceOutput_collaborationId_idx" ON "WorkspaceOutput"("collaborationId");
ALTER TABLE "WorkspaceOutput" ADD CONSTRAINT "WorkspaceOutput_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
