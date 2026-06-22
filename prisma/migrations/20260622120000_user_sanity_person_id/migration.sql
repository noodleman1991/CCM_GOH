-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sanityPersonId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_sanityPersonId_key" ON "User"("sanityPersonId");
