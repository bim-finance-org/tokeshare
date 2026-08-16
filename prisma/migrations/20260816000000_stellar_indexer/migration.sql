-- Stellar tranche 2: indexer + distribution tables (on-chain derived state).

-- CreateTable
CREATE TABLE "StellarIndexCursor" (
    "network" TEXT NOT NULL,
    "lastLedger" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StellarIndexCursor_pkey" PRIMARY KEY ("network")
);

-- CreateTable
CREATE TABLE "StellarEvent" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "ledgerClosedAt" TIMESTAMP(3) NOT NULL,
    "contractId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "topics" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StellarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StellarHolder" (
    "assetSlug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "balance" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StellarHolder_pkey" PRIMARY KEY ("assetSlug","address")
);

-- CreateTable
CREATE TABLE "StellarTrade" (
    "eventId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "shares" BIGINT NOT NULL,
    "usdc" BIGINT,
    "txHash" TEXT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StellarTrade_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "DistributionCycle" (
    "network" TEXT NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "total" BIGINT NOT NULL,
    "claimed" BIGINT NOT NULL DEFAULT 0,
    "root" TEXT NOT NULL,
    "snapshotLedger" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sweptAt" TIMESTAMP(3),
    "createdTx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionCycle_pkey" PRIMARY KEY ("network","cycleId")
);

-- CreateTable
CREATE TABLE "DistributionEntry" (
    "network" TEXT NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "proof" JSONB NOT NULL,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paidTx" TEXT,
    "pushed" BOOLEAN,

    CONSTRAINT "DistributionEntry_pkey" PRIMARY KEY ("network","cycleId","address")
);

-- CreateIndex
CREATE INDEX "StellarEvent_network_processed_idx" ON "StellarEvent"("network", "processed");

-- CreateIndex
CREATE INDEX "StellarEvent_txHash_idx" ON "StellarEvent"("txHash");

-- CreateIndex
CREATE INDEX "StellarEvent_network_contractId_ledger_idx" ON "StellarEvent"("network", "contractId", "ledger");

-- CreateIndex
CREATE INDEX "StellarTrade_assetSlug_at_idx" ON "StellarTrade"("assetSlug", "at");

-- CreateIndex
CREATE INDEX "StellarTrade_address_idx" ON "StellarTrade"("address");

-- CreateIndex
CREATE INDEX "DistributionCycle_assetSlug_idx" ON "DistributionCycle"("assetSlug");

-- CreateIndex
CREATE INDEX "DistributionEntry_address_idx" ON "DistributionEntry"("address");

-- AddForeignKey
ALTER TABLE "DistributionEntry" ADD CONSTRAINT "DistributionEntry_network_cycleId_fkey" FOREIGN KEY ("network", "cycleId") REFERENCES "DistributionCycle"("network", "cycleId") ON DELETE RESTRICT ON UPDATE CASCADE;
