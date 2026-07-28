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

  if (sent.status === 'ERROR') {
    throw new Error(`submission failed: ${JSON.stringify(sent.errorResult)}`);
  }

  let attempts = 0;
  let result = await server.getTransaction(sent.hash);
  while (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 30) {
    await sleep(1000);
    result = await server.getTransaction(sent.hash);
    attempts += 1;
  }

  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`transaction did not succeed (status: ${result.status})`);
  }
  return sent.hash;
}

export function explorerTxUrl(network: StellarNetwork, hash: string): string {
  const net = network === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

export { STROOPS_PER_UNIT };
