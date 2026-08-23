// Manual holder seeding — the WS-0 bootstrap.
//
// The RPC keeps ~24h of events and the tokens were deployed long before the
// indexer started, so the historical holder set cannot be recovered from
// chain queries. This script registers known addresses by hand; their
// balances are read from the token contract (authoritative), so seeding can
// only miss holders, never mis-credit them.
//
//   npm run indexer:seed -- <slug> <address> [address...]
//
// Sources for addresses: known buyers, Stellar Expert's token activity page.

import { getNetworkProfile } from '@/config/stellar';
import { getStellarAsset } from '@/config/stellar-assets';
import { readTokenBalance } from '@/lib/stellar-assets';
import { stroopsToUnits } from '@/lib/stellar';
import { prisma } from '@/lib/prisma';

async function main(): Promise<void> {
  const [slug, ...addresses] = process.argv.slice(2);
  const asset = slug ? getStellarAsset(slug) : undefined;
  if (!asset || addresses.length === 0) {
    console.error('usage: npm run indexer:seed -- <slug> <address> [address...]');
    process.exit(1);
  }
  if (!asset.tokenId) {
    console.error(`${slug}: no token contract configured`);
    process.exit(1);
  }

  const profile = getNetworkProfile(asset.network);
  for (const address of addresses) {
    if (!/^[GC][A-Z2-7]{55}$/.test(address)) {
      console.error(`skipping (not a strkey): ${address}`);
      continue;
    }
    const balance = await readTokenBalance(profile, asset.tokenId, address);
    await prisma.stellarHolder.upsert({
      where: { assetSlug_address: { assetSlug: asset.slug, address } },
      update: { balance },
      create: { assetSlug: asset.slug, address, balance },
    });
    console.log(`${address}  ${stroopsToUnits(balance)} ${asset.symbol}`);
  }
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
