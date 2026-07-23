ALTER TABLE "Product" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Recipe" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "videoUrl" TEXT;
CREATE TABLE "Faq" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "deletedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Faq_status_sortOrder_idx" ON "Faq"("status", "sortOrder");
CREATE INDEX "Faq_deletedAt_idx" ON "Faq"("deletedAt");
