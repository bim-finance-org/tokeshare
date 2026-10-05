-- CreateTable
CREATE TABLE "AlfredCustomer" (
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "endorsementsReady" BOOLEAN NOT NULL DEFAULT false,
    "linkedAccountId" TEXT,
    "linkedAccountLast4" TEXT,
    "linkedAccountStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlfredCustomer_pkey" PRIMARY KEY ("network", "address", "corridor")
);

-- CreateIndex
CREATE INDEX "AlfredCustomer_customerId_idx" ON "AlfredCustomer"("customerId");

-- CreateIndex
CREATE INDEX "AlfredCustomer_linkedAccountId_idx" ON "AlfredCustomer"("linkedAccountId");

-- AlterTable
ALTER TABLE "RampTransaction" ADD COLUMN "payoutCurrency" TEXT;
