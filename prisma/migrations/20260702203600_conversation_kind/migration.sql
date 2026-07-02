-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('DIRECT', 'PROJECT', 'COMMUNITY');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "kind" "ConversationKind" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN "collaborationId" TEXT,
ADD COLUMN "communityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_kind_collaborationId_key" ON "Conversation"("kind", "collaborationId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
