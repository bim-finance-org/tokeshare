// Server-side operator tooling for the RWA token's allowlist.
//
// The token rejects any transfer whose sender or recipient is not allowlisted
// (Error #113). Investors are allowlisted by the sale contract on their first
// purchase; everything else is allowlisted by hand from the operator console:
// the liquidity pools and custodial routers of the secondary-market venues
// (config/stellar-assets.ts), and investors who never bought on the sale.
//
// `allow_user(user, operator)` is gated on a role held by the operator account,
// whose key (STELLAR_DISTRIBUTOR_ADMIN_SECRET) never leaves the server.
//
// Never import from client components.

import { Address, StrKey } from '@stellar/stellar-sdk';
import { getNetworkProfile } from '@/config/stellar';
import { getVenueSlots, type StellarAsset, type StellarVenueSlot } from '@/config/stellar-assets';
import { adminKeypair, invokeAsAdmin } from '@/lib/stellar-admin';
import { readIsAllowed } from '@/lib/stellar-assets';

/** A G… account or a C… contract. Muxed (M…) addresses cannot be allowlisted. */
export const isAllowlistableAddress = (address: unknown): address is string =>
  typeof address === 'string' && (StrKey.isValidEd25519PublicKey(address) || StrKey.isValidContract(address));

function assertTarget(asset: StellarAsset, address: string): void {
  if (!asset.tokenId) throw new Error(`${asset.slug} has no token contract`);
  if (!isAllowlistableAddress(address)) {
    throw new Error('Invalid address: expected a G… account or a C… contract');
  }
}

/** Whether `address` is on the asset token's allowlist. Read-only (simulation). */
export async function isAllowed(asset: StellarAsset, address: string): Promise<boolean> {
  assertTarget(asset, address);
  return readIsAllowed(getNetworkProfile(asset.network), asset.tokenId, address);
}

/**
 * Allowlists `address` on the asset's token, signed by the operator account.
 * Returns the transaction hash, or null when the address was already allowed
 * (nothing is submitted).
 */
export async function allowAddress(asset: StellarAsset, address: string): Promise<string | null> {
  if (await isAllowed(asset, address)) return null;
  const operator = adminKeypair().publicKey();
  return invokeAsAdmin(asset, asset.tokenId, 'allow_user', [
    new Address(address).toScVal(),
    new Address(operator).toScVal(),
  ]);
}

export interface VenueAllowlistEntry extends StellarVenueSlot {
  /** null while the venue's pool has not been created (no address to check). */
  allowed: boolean | null;
}

/**
 * Allowlist status of every address the asset's venues occupy, so the
 * operator sees which pool or router still has to be allowed before trading.
 */
export async function getVenueAllowlist(asset: StellarAsset): Promise<VenueAllowlistEntry[]> {
  const slots = getVenueSlots(asset);
  const malformed = slots.find((slot) => slot.address && !StrKey.isValidContract(slot.address));
  if (malformed) {
    throw new Error(`${malformed.label}: "${malformed.address}" is not a contract address — fix the venues registry`);
  }
  return Promise.all(
    slots.map(async (slot) => ({
      ...slot,
      allowed: slot.address ? await isAllowed(asset, slot.address) : null,
    })),
  );
}
