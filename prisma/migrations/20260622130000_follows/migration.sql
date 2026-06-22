-- CreateEnum
CREATE TYPE "FollowTargetType" AS ENUM ('REGION', 'THEME', 'PROJECT');

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_targetType_targetId_idx" ON "Follow"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_userId_targetType_targetId_key" ON "Follow"("userId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
