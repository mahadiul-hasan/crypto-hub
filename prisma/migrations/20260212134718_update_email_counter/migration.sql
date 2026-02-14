-- DropForeignKey
ALTER TABLE "EmailCounter" DROP CONSTRAINT "EmailCounter_key_fkey";

-- AlterTable
ALTER TABLE "EmailCounter" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "EmailCounter_userId_idx" ON "EmailCounter"("userId");

-- AddForeignKey
ALTER TABLE "EmailCounter" ADD CONSTRAINT "EmailCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
