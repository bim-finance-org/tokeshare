// Parameterized Soroban / Stellar data layer for the multi-asset RWA marketplace.
//
// Unlike lib/stellar.ts (which is bound to the single legacy TRES POC), every
// function here takes the target contract id, so the same code serves any number
// of assets from config/stellar-assets.ts.
//
// The RWA token is a custom SEP-41 Soroban token: its balance is read from the
// token contract via simulation (readTokenBalance), NOT from Horizon. The payment
// asset (USDC) and XLM remain classic assets read via Horizon.

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from '@stellar/stellar-sdk';
import { horizonUrl, stellarConfig } from '@/config/stellar';
import { getServer } from '@/lib/stellar';

const { networkPassphrase } = stellarConfig;

// ---- generic read-only contract call (via simulation) ----------------------

async function simulateCall(contractId: string, method: string, ...args: xdr.ScVal[]): Promise<unknown> {
  const server = getServer();
  const source = new Account(Keypair.random().publicKey(), '0');
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  if (!sim.result) throw new Error(`no result for ${method}`);
  return scValToNative(sim.result.retval);
}

// ---- sale contract views ---------------------------------------------------

/** Fixed price: payment-asset stroops per one whole share. */
export const readSalePrice = (saleId: string) => simulateCall(saleId, 'price') as Promise<bigint>;

/** Shares still available in the sale contract (base units). */
export const readSaleAvailable = (saleId: string) => simulateCall(saleId, 'available') as Promise<bigint>;

// ---- RWA token balance (custom SEP-41 Soroban token) -----------------------

/** Balance of `address` in the RWA token contract, in base units. */
export async function readTokenBalance(tokenId: string, address: string): Promise<bigint> {
  const balance = await simulateCall(tokenId, 'balance', new Address(address).toScVal());
  return balance as bigint;
}

// ---- payment-asset + XLM balances (classic, via Horizon) -------------------

export type ClassicBalances = { usdc: string; xlm: string };

export async function getClassicBalances(address: string): Promise<ClassicBalances> {
  const res = await fetch(`${horizonUrl}/accounts/${address}`);
  if (res.status === 404) return { usdc: '0', xlm: '0' }; // unfunded account
  if (!res.ok) throw new Error('failed to load account');
  const data = await res.json();
  const balances: Array<{ asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }> =
    data.balances ?? [];
  const usdc =
    balances.find((b) => b.asset_code === stellarConfig.pay.code && b.asset_issuer === stellarConfig.pay.issuer)
      ?.balance ?? '0';
  const xlm = balances.find((b) => b.asset_type === 'native')?.balance ?? '0';
  return { usdc, xlm };
}

// ---- buy (Soroban invoke on the sale contract) -----------------------------

export async function buildBuyXdr(saleId: string, buyer: string, shareStroops: bigint): Promise<string> {
  const server = getServer();
  const account = await server.getAccount(buyer);
  const contract = new Contract(saleId);
  const op = contract.call('buy', new Address(buyer).toScVal(), nativeToScVal(shareStroops, { type: 'i128' }));
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(op)
    .setTimeout(180)
    .build();
  // prepareTransaction simulates, then attaches the Soroban footprint, auth and
  // resource fees the network requires.
  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}
