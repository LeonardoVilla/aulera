-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "answeredAt" DROP NOT NULL,
ALTER COLUMN "answeredAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");
