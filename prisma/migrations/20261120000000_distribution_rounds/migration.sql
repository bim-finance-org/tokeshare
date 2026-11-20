-- AlterTable
ALTER TABLE "DistributionCycle" ADD COLUMN     "roundId" TEXT;

-- CreateTable
CREATE TABLE "DistributionRound" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "total" BIGINT NOT NULL,
    "snapshotLedger" INTEGER NOT NULL,
    "snapshotRoot" TEXT NOT NULL,
    "claimExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "fundedAt" TIMESTAMP(3),
    "fundingTx" TEXT,
    "sdpDisbursementId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionPayout" (
    "roundId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "shares" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sdpPaymentId" TEXT,
    "stellarTx" TEXT,
    "paidAt" TIMESTAMP(3),
    "error" TEXT,
    "reroutedCycleId" INTEGER,

    CONSTRAINT "DistributionPayout_pkey" PRIMARY KEY ("roundId","address")
);

-- CreateIndex
CREATE INDEX "DistributionRound_network_assetSlug_idx" ON "DistributionRound"("network", "assetSlug");

-- CreateIndex
CREATE INDEX "DistributionRound_status_idx" ON "DistributionRound"("status");

-- CreateIndex
CREATE INDEX "DistributionPayout_address_idx" ON "DistributionPayout"("address");

-- CreateIndex
CREATE INDEX "DistributionCycle_roundId_idx" ON "DistributionCycle"("roundId");

-- AddForeignKey
ALTER TABLE "DistributionCycle" ADD CONSTRAINT "DistributionCycle_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "DistributionRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionPayout" ADD CONSTRAINT "DistributionPayout_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "DistributionRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill: every cycle created before rounds existed (tranche 2 step 1, e.g.
-- the mainnet pilot cycle #0) becomes a settled `contract` round of its own,
-- with one payout line per entry. Share counts were never stored for those
-- cycles, hence 0; snapshotRoot reuses the on-chain root of the cycle.
INSERT INTO "DistributionRound" (
  "id", "network", "channel", "assetSlug", "tokenId", "total", "snapshotLedger",
  "snapshotRoot", "claimExpiresAt", "status", "createdAt", "updatedAt"
)
SELECT
  'legacy-' || c."network" || '-' || c."cycleId", c."network", 'contract', c."assetSlug", c."tokenId",
  c."total", c."snapshotLedger", c."root", c."expiresAt", 'settled', c."createdAt", CURRENT_TIMESTAMP
FROM "DistributionCycle" c
WHERE c."roundId" IS NULL;

UPDATE "DistributionCycle"
SET "roundId" = 'legacy-' || "network" || '-' || "cycleId"
WHERE "roundId" IS NULL;

INSERT INTO "DistributionPayout" ("roundId", "address", "shares", "amount", "channel", "status")
SELECT
  'legacy-' || e."network" || '-' || e."cycleId", e."address", 0, e."amount",
  CASE WHEN e."excluded" THEN 'claim' ELSE 'push' END, 'onchain'
FROM "DistributionEntry" e;

-- `claimed` becomes derived from the paid entries (lib/stellar-cycle-accounting.ts).
-- The console and the indexer both incremented it for the same payment, so the
-- pilot cycle #0 read 2 USDC claimed out of 1; recompute every cycle once.
UPDATE "DistributionCycle" c
SET "claimed" = COALESCE((
  SELECT SUM(e."amount") FROM "DistributionEntry" e
  WHERE e."network" = c."network" AND e."cycleId" = c."cycleId" AND e."paidAt" IS NOT NULL
), 0);
