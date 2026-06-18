/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `download_events` table. All the data in the column will be lost.
  - You are about to drop the column `referer` on the `download_events` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `download_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "download_events" DROP COLUMN "ipAddress",
DROP COLUMN "referer",
DROP COLUMN "userAgent";
