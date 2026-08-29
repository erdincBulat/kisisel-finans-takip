-- CreateTable
CREATE TABLE "AccountOutflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "accountStatementId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountOutflow_accountStatementId_fkey" FOREIGN KEY ("accountStatementId") REFERENCES "AccountStatement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AccountOutflow_date_idx" ON "AccountOutflow"("date");
