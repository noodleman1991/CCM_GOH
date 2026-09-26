-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CollaborationVisibility" AS ENUM ('PUBLIC', 'MEMBERS');

-- CreateEnum
CREATE TYPE "CollaborationRole" AS ENUM ('OWNER', 'EDITOR', 'COMMENTER', 'VIEWER');

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CollaborationStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "CollaborationVisibility" NOT NULL DEFAULT 'MEMBERS',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationMember" (
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaborationRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationMember_pkey" PRIMARY KEY ("collaborationId","userId")
);

-- CreateTable
CREATE TABLE "CollaborationThread" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationFile" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationFileAnnotations" (
    "fileId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationFileAnnotations_pkey" PRIMARY KEY ("fileId")
);

-- CreateTable
CREATE TABLE "CollaborationMedia" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collaboration_status_visibility_updatedAt_idx" ON "Collaboration"("status", "visibility", "updatedAt");

-- CreateIndex
CREATE INDEX "Collaboration_createdById_idx" ON "Collaboration"("createdById");

-- CreateIndex
CREATE INDEX "CollaborationMember_userId_idx" ON "CollaborationMember"("userId");

-- CreateIndex
CREATE INDEX "CollaborationThread_collaborationId_updatedAt_idx" ON "CollaborationThread"("collaborationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationFile_r2Key_key" ON "CollaborationFile"("r2Key");

-- CreateIndex
CREATE INDEX "CollaborationFile_collaborationId_createdAt_idx" ON "CollaborationFile"("collaborationId", "createdAt");

-- CreateIndex
CREATE INDEX "CollaborationFile_uploadedById_idx" ON "CollaborationFile"("uploadedById");

-- CreateIndex
CREATE INDEX "CollaborationMedia_collaborationId_createdAt_idx" ON "CollaborationMedia"("collaborationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMember" ADD CONSTRAINT "CollaborationMember_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMember" ADD CONSTRAINT "CollaborationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationThread" ADD CONSTRAINT "CollaborationThread_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationFile" ADD CONSTRAINT "CollaborationFile_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationFile" ADD CONSTRAINT "CollaborationFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationFileAnnotations" ADD CONSTRAINT "CollaborationFileAnnotations_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CollaborationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationFileAnnotations" ADD CONSTRAINT "CollaborationFileAnnotations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMedia" ADD CONSTRAINT "CollaborationMedia_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
