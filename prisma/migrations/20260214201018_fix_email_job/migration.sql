/*
  Warnings:

  - Made the column `userId` on table `EmailJob` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "EmailJob" DROP CONSTRAINT "EmailJob_userId_fkey";

-- AlterTable
ALTER TABLE "EmailJob" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
