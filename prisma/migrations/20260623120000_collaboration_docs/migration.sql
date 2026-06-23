-- CreateTable
CREATE TABLE "CollaborationDoc" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollaborationDoc_collaborationId_order_idx" ON "CollaborationDoc"("collaborationId", "order");

-- AddForeignKey
ALTER TABLE "CollaborationDoc" ADD CONSTRAINT "CollaborationDoc_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
