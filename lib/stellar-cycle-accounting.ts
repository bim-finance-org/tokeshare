// `DistributionCycle.claimed` is DERIVED: the sum of the cycle's entries that
// are paid. It used to be incremented by two writers — the console after its
// own distribute_for, and the indexer on each Paid event — so the pilot cycle
// #0 showed 2 USDC claimed out of 1. Recomputing from the entries makes every
// writer idempotent: replays, retries and both writers agree on one number.

import { prisma } from '@/lib/prisma';

/** Recomputes `claimed` for one cycle from its paid entries, in one statement. */
export async function syncCycleClaimed(network: string, cycleId: number): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "DistributionCycle" c
    SET "claimed" = COALESCE((
      SELECT SUM(e."amount") FROM "DistributionEntry" e
      WHERE e."network" = c."network" AND e."cycleId" = c."cycleId" AND e."paidAt" IS NOT NULL
    ), 0)
    WHERE c."network" = ${network} AND c."cycleId" = ${cycleId}`;
}
