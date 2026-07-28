// Parameterized Soroban / Stellar data layer for the multi-asset RWA marketplace.
//
// Every function takes the target asset's StellarNetworkProfile + contract id, so
// the same code serves testnet and mainnet assets side by side.
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
import { type StellarNetworkProfile } from '@/config/stellar';
import { getServer } from '@/lib/stellar';

// ---- generic read-only contract call (via simulation) ----------------------

async function simulateCall(
  profile: StellarNetworkProfile,
  contractId: string,
  method: string,
  ...args: xdr.ScVal[]
): Promise<unknown> {
  const server = getServer(profile.rpcUrl);
  const source = new Account(Keypair.random().publicKey(), '0');
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: profile.networkPassphrase })
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
export const readSalePrice = (profile: StellarNetworkProfile, saleId: string) =>
  simulateCall(profile, saleId, 'price') as Promise<bigint>;

/** Shares still available in the sale contract (base units). */
export const readSaleAvailable = (profile: StellarNetworkProfile, saleId: string) =>
  simulateCall(profile, saleId, 'available') as Promise<bigint>;

// ---- RWA token balance (custom SEP-41 Soroban token) -----------------------

/** Balance of `address` in the RWA token contract, in base units. */
export async function readTokenBalance(
  profile: StellarNetworkProfile,
  tokenId: string,
  address: string,
): Promise<bigint> {
  const balance = await simulateCall(profile, tokenId, 'balance', new Address(address).toScVal());
  return balance as bigint;
}

// ---- compliance (allowlist) ------------------------------------------------

/**
 * Whether `address` is allowlisted on the RWA token, i.e. may receive/hold it.
 * Read-only view (`allowed(account) -> bool`); a non-allowlisted buyer's purchase
 * is rejected on-chain (Error #113), so we check this before enabling the buy.
 */
export async function readIsAllowed(
  profile: StellarNetworkProfile,
  tokenId: string,
  address: string,
): Promise<boolean> {
  const allowed = await simulateCall(profile, tokenId, 'allowed', new Address(address).toScVal());
  return Boolean(allowed);
}

// ---- payment-asset + XLM balances (classic, via Horizon) -------------------

export type ClassicBalances = { usdc: string; xlm: string };

export async function getClassicBalances(profile: StellarNetworkProfile, address: string): Promise<ClassicBalances> {
  const res = await fetch(`${profile.horizonUrl}/accounts/${address}`);
  if (res.status === 404) return { usdc: '0', xlm: '0' }; // unfunded account
  if (!res.ok) throw new Error('failed to load account');
  const data = await res.json();
  const balances: Array<{ asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }> =
    data.balances ?? [];
  const usdc =
    balances.find((b) => b.asset_code === profile.pay.code && b.asset_issuer === profile.pay.issuer)?.balance ?? '0';
  const xlm = balances.find((b) => b.asset_type === 'native')?.balance ?? '0';
  return { usdc, xlm };
}

// ---- buy (Soroban invoke on the sale contract) -----------------------------

export async function buildBuyXdr(
  profile: StellarNetworkProfile,
  saleId: string,
  buyer: string,
  shareStroops: bigint,
): Promise<string> {
  const server = getServer(profile.rpcUrl);
  const account = await server.getAccount(buyer);
  const contract = new Contract(saleId);
  const op = contract.call('buy', new Address(buyer).toScVal(), nativeToScVal(shareStroops, { type: 'i128' }));
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: profile.networkPassphrase })
    .addOperation(op)
    .setTimeout(180)
    .build();
  // prepareTransaction simulates, then attaches the Soroban footprint, auth and
  // resource fees the network requires.
  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}
