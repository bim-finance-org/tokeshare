// Shared Stellar/Soroban primitives for the multi-asset RWA layer. Every network-
// dependent call takes a StellarNetworkProfile so testnet and mainnet assets can
// be served side by side (config-driven contracts live in config/stellar-assets.ts;
// the per-asset data layer is lib/stellar-assets.ts).

import { TransactionBuilder, rpc } from '@stellar/stellar-sdk';
import { STROOPS_PER_UNIT, type StellarNetwork, type StellarNetworkProfile } from '@/config/stellar';

export const getServer = (rpcUrl: string) => new rpc.Server(rpcUrl);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- decimal <-> stroops (exact, 7 dp) -------------------------------------

export function unitsToStroops(units: string): bigint {
  const trimmed = (units || '0').trim();
  const [int, fracRaw = ''] = trimmed.split('.');
  const frac = (fracRaw + '0000000').slice(0, 7);
  return BigInt(`${int || '0'}${frac}`);
}

export function stroopsToUnits(stroops: bigint): string {
  const negative = stroops < 0n;
  const abs = (negative ? -stroops : stroops).toString().padStart(8, '0');
  const int = abs.slice(0, -7);
  const frac = abs.slice(-7).replace(/0+$/, '');
  return `${negative ? '-' : ''}${int}${frac ? `.${frac}` : ''}`;
}

// ---- submit a signed XDR and wait for confirmation -------------------------

export async function submitSignedXdr(profile: StellarNetworkProfile, signedXdr: string): Promise<string> {
  const server = getServer(profile.rpcUrl);
  const tx = TransactionBuilder.fromXDR(signedXdr, profile.networkPassphrase);
  const sent = await server.sendTransaction(tx);

  // Distinguish the submission outcomes: a tx that was never queued (ERROR /
  // TRY_AGAIN_LATER) would otherwise poll to a misleading NOT_FOUND.
  if (sent.status === 'ERROR') {
    throw new Error(`Submission rejected: ${JSON.stringify(sent.errorResult ?? sent)}`);
  }
  if (sent.status === 'TRY_AGAIN_LATER') {
    throw new Error('The network is busy right now — please try again in a moment.');
  }

  // Poll for confirmation (~60s; Soroban ledgers close every ~5s).
  let attempts = 0;
  let result = await server.getTransaction(sent.hash);
  while (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 40) {
    await sleep(1500);
    result = await server.getTransaction(sent.hash);
    attempts += 1;
  }

  if (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error(`Transaction ${sent.hash} was not confirmed in time — it may still land. Check Stellar Expert.`);
  }
  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed on-chain (status: ${result.status}).`);
  }
  return sent.hash;
}

export function explorerTxUrl(network: StellarNetwork, hash: string): string {
  const net = network === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

export { STROOPS_PER_UNIT };
