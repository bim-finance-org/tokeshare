// Generates every secret one SDP stack needs (deploy/sdp/.env.example) and
// prints them as .env lines. Nothing is written to disk or sent anywhere.
//
//   npm run sdp:secrets -- testnet            print the secrets
//   npm run sdp:secrets -- testnet --fund     + fund the distribution account via friendbot
//
// Paste the output into the Coolify resource's environment, and keep a copy in
// the team vault: losing DISTRIBUTION_ACCOUNT_ENCRYPTION_PASSPHRASE locks the
// SDP out of its own distribution key.

import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { Keypair } from '@stellar/stellar-sdk';

const network = process.argv[2];
if (network !== 'testnet' && network !== 'mainnet') {
  console.error('usage: npm run sdp:secrets -- <testnet|mainnet> [--fund]');
  process.exit(1);
}
const fund = process.argv.includes('--fund');

const distribution = Keypair.random();
const sep10 = Keypair.random();
const hex = (bytes: number) => randomBytes(bytes).toString('hex');
// The SDP reads the PEM from a single env line with literal \n separators.
const ec256 = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  .privateKey.export({ type: 'pkcs8', format: 'pem' })
  .toString()
  .trim()
  .replace(/\n/g, '\\n');

async function main(): Promise<void> {
  if (fund) {
    if (network !== 'testnet') throw new Error('--fund only works on testnet (friendbot)');
    const res = await fetch(`https://friendbot.stellar.org/?addr=${distribution.publicKey()}`);
    if (!res.ok) throw new Error(`friendbot failed: HTTP ${res.status}`);
    console.error(`# funded ${distribution.publicKey()} with friendbot XLM`);
  }

  const lines = [
    `# --- SDP stack (${network}) — paste into the Coolify resource ---`,
    `SDP_DB_PASSWORD=${hex(24)}`,
    `DISTRIBUTION_PUBLIC_KEY=${distribution.publicKey()}`,
    `DISTRIBUTION_SEED=${distribution.secret()}`,
    `DISTRIBUTION_ACCOUNT_ENCRYPTION_PASSPHRASE=${Keypair.random().secret()}`,
    `CHANNEL_ACCOUNT_ENCRYPTION_PASSPHRASE=${Keypair.random().secret()}`,
    `SEP10_SIGNING_PUBLIC_KEY=${sep10.publicKey()}`,
    `SEP10_SIGNING_PRIVATE_KEY=${sep10.secret()}`,
    `EC256_PRIVATE_KEY="${ec256}"`,
    `SEP24_JWT_SECRET=${hex(32)}`,
    `ADMIN_API_KEY=${hex(32)}`,
    '',
    `# --- tokeshare side (Next app + indexer worker) ---`,
    `SDP_${network.toUpperCase()}_DISTRIBUTION_ADDRESS=${distribution.publicKey()}`,
    `# SDP_${network.toUpperCase()}_BASE_URL / _API_KEY / _DASHBOARD_URL: see docs/stellar/sdp.md`,
  ];
  console.log(lines.join('\n'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
