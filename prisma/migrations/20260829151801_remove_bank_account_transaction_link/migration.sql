/*
  Warnings:

  - You are about to drop the column `accountStatementId` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "normalizedMerchant" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "categoryId" TEXT,
    "subCategoryId" TEXT,
    "installmentCurrent" INTEGER,
    "installmentTotal" INTEGER,
    "statementId" TEXT,
    "fingerprint" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "categoryId", "createdAt", "date", "description", "fingerprint", "id", "installmentCurrent", "installmentTotal", "normalizedMerchant", "notes", "source", "statementId", "subCategoryId", "type", "updatedAt") SELECT "amount", "categoryId", "createdAt", "date", "description", "fingerprint", "id", "installmentCurrent", "installmentTotal", "normalizedMerchant", "notes", "source", "statementId", "subCategoryId", "type", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_normalizedMerchant_idx" ON "Transaction"("normalizedMerchant");
CREATE INDEX "Transaction_statementId_idx" ON "Transaction"("statementId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
