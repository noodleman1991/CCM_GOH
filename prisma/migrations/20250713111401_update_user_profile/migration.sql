/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('UNDER_18', 'ABOVE_18');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('RESEARCH', 'POLICY', 'LIVED_EXPERIENCE_EXPERT', 'NGO', 'COMMUNITY_ORGANIZATION', 'EDUCATION_TEACHING');

-- CreateEnum
CREATE TYPE "ExpertiseArea" AS ENUM ('CLIMATE_CHANGE', 'MENTAL_HEALTH', 'HEALTH');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "ageGroup" "AgeGroup",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "expertiseAreas" "ExpertiseArea"[],
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "linkedinProfile" TEXT,
ADD COLUMN     "organization" TEXT,
ADD COLUMN     "personalWebsite" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "twitterHandle" TEXT,
ADD COLUMN     "workBio" TEXT,
ADD COLUMN     "workTypes" "WorkType"[];

-- CreateTable
CREATE TABLE "RecentWork" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecentWork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "RecentWork" ADD CONSTRAINT "RecentWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
