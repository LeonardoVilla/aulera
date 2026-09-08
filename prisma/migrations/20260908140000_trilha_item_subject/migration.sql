-- AddForeignKey
ALTER TABLE "TrilhaItem" ADD CONSTRAINT "TrilhaItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
