// Soroban / Stellar helpers for the TRES sale. Build-and-return-XDR functions
// are signed by the wallet kit (in StellarContext) and submitted via RPC.

import {
  Account,
  Address,
  Asset,
  BASE_FEE,
  Contract,
  Keypair,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';
import { STROOPS_PER_UNIT, horizonUrl, stellarConfig } from '@/config/stellar';

const { networkPassphrase, rpcUrl, saleContractId, tres } = stellarConfig;

export const getServer = () => new rpc.Server(rpcUrl);

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

// ---- read-only contract views (via simulation) ----------------------------

async function simulateView(method: string): Promise<bigint> {
  const server = getServer();
  const source = new Account(Keypair.random().publicKey(), '0');
  const contract = new Contract(saleContractId);
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call(method))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  if (!sim.result) throw new Error(`no result for ${method}`);
  return scValToNative(sim.result.retval) as bigint;
}

export const readPrice = () => simulateView('price'); // pay stroops per 1 TRES
export const readAvailable = () => simulateView('available'); // TRES base units

// ---- trustline (classic) ---------------------------------------------------

export async function hasTresTrustline(address: string): Promise<boolean> {
  const res = await fetch(`${horizonUrl}/accounts/${address}`);
  if (res.status === 404) return false; // unfunded account has no trustlines
  if (!res.ok) throw new Error('failed to load account');
  const data = await res.json();
  return (data.balances ?? []).some(
    (b: { asset_code?: string; asset_issuer?: string }) =>
      b.asset_code === tres.code && b.asset_issuer === tres.issuer,
  );
}

export async function buildTrustlineXdr(address: string): Promise<string> {
  const server = getServer();
  const account = await server.getAccount(address);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(Operation.changeTrust({ asset: new Asset(tres.code, tres.issuer) }))
    .setTimeout(180)
    .build();
  return tx.toXDR();
}

// ---- buy (Soroban invoke) --------------------------------------------------

export async function buildBuyXdr(buyer: string, tresStroops: bigint): Promise<string> {
  const server = getServer();
  const account = await server.getAccount(buyer);
  const contract = new Contract(saleContractId);
  const op = contract.call(
    'buy',
    new Address(buyer).toScVal(),
    nativeToScVal(tresStroops, { type: 'i128' }),
  );
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(op)
    .setTimeout(180)
    .build();
  // prepareTransaction simulates, then attaches the Soroban footprint, auth and
  // resource fees the network requires.
  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}

// ---- submit a signed XDR and wait for confirmation -------------------------

export async function submitSignedXdr(signedXdr: string): Promise<string> {
  const server = getServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
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

export function explorerTxUrl(hash: string): string {
  const net = networkPassphrase === 'Public Global Stellar Network ; September 2015' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

export { STROOPS_PER_UNIT };
