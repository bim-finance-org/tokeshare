-- CreateTable
CREATE TABLE "RampTransaction" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "anchorTxId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "amountIn" TEXT,
    "amountOut" TEXT,
    "amountFee" TEXT,
    "status" TEXT NOT NULL,
    "moreInfoUrl" TEXT,
    "externalRef" TEXT,
    "stellarTxHash" TEXT,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RampTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RampTransaction_network_provider_anchorTxId_key" ON "RampTransaction"("network", "provider", "anchorTxId");

-- CreateIndex
CREATE INDEX "RampTransaction_address_idx" ON "RampTransaction"("address");
