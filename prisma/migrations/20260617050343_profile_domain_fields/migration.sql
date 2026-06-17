-- AlterTable
ALTER TABLE "RecentWork" ADD COLUMN     "collaborators" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collaborationInterests" TEXT,
ADD COLUMN     "focusTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "livedExperienceStatement" TEXT,
ADD COLUMN     "lookingFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "openToCollaboration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orcidId" TEXT,
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "showLivedExperience" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProfilePromptAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePromptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfilePromptAnswer_userId_idx" ON "ProfilePromptAnswer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePromptAnswer_userId_promptId_key" ON "ProfilePromptAnswer"("userId", "promptId");

-- CreateIndex
CREATE INDEX "Content_communityId_idx" ON "Content"("communityId");

-- CreateIndex
CREATE INDEX "Content_authorId_idx" ON "Content"("authorId");

-- CreateIndex
CREATE INDEX "RecentWork_userId_idx" ON "RecentWork"("userId");

-- CreateIndex
CREATE INDEX "User_isSearchable_idx" ON "User"("isSearchable");

-- CreateIndex
CREATE INDEX "User_profileVisibility_idx" ON "User"("profileVisibility");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "User_profileCompleteness_idx" ON "User"("profileCompleteness");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE INDEX "UserCommunity_communityId_idx" ON "UserCommunity"("communityId");

-- AddForeignKey
ALTER TABLE "ProfilePromptAnswer" ADD CONSTRAINT "ProfilePromptAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
