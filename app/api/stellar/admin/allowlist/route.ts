// Operator console: the RWA token's allowlist.
//
// GET ?slug=           → the asset's venue addresses (pools, custodial routers)
//                        with their current allowlist status.
// GET ?slug=&address=  → { allowed } for one address. Read-only.
// POST { slug, address } → allowlists the address with an operator-signed
//                        allow_user. No transaction when it is already
//                        allowed (txHash is then null).

import { NextResponse } from 'next/server';
import { getStellarAsset, isAssetConfigured, isVenueAddress, type StellarAsset } from '@/config/stellar-assets';
import { requireAuth } from '@/lib/api-utils';
import { errorMessage } from '@/lib/error-message';
import { getLogger } from '@/lib/logger';
import { allowAddress, getVenueAllowlist, isAllowed, isAllowlistableAddress } from '@/lib/stellar-allowlist';
import { parseContractError } from '@/lib/stellar-errors';

const log = getLogger('api:stellar-admin-allowlist');

const INVALID_ADDRESS = 'Invalid address: expected a G… account or a C… contract';

const findAsset = (slug: unknown): StellarAsset | undefined => {
  const asset = typeof slug === 'string' ? getStellarAsset(slug) : undefined;
  return asset && isAssetConfigured(asset) ? asset : undefined;
};

export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const asset = findAsset(params.get('slug'));
  if (!asset) return NextResponse.json({ error: 'Unknown asset' }, { status: 404 });

  const address = params.get('address')?.trim();
  try {
    if (address === undefined) {
      return NextResponse.json({ network: asset.network, venues: await getVenueAllowlist(asset) });
    }
    if (!isAllowlistableAddress(address)) return NextResponse.json({ error: INVALID_ADDRESS }, { status: 400 });
    return NextResponse.json({ allowed: await isAllowed(asset, address) });
  } catch (error) {
    log.error(`allowlist read failed for ${asset.slug}`, error);
    return NextResponse.json({ error: errorMessage(error, 'Allowlist check failed') }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { slug?: unknown; address?: unknown };
  const asset = findAsset(body.slug);
  if (!asset) return NextResponse.json({ error: 'Unknown asset' }, { status: 404 });

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!isAllowlistableAddress(address)) return NextResponse.json({ error: INVALID_ADDRESS }, { status: 400 });

  try {
    const txHash = await allowAddress(asset, address);
    if (txHash) {
      // Logged at `warn` on purpose: production drops `info`, and this line is
      // the server-side record of a manual allowlisting.
      const target = isVenueAddress(asset, address) ? 'venue address' : 'address';
      log.warn(`allowlisted ${target} ${address} on ${asset.symbol} (${asset.network}) — tx ${txHash}`);
    }
    return NextResponse.json({ allowed: true, txHash });
  } catch (error) {
    log.error(`allowlisting ${address} on ${asset.slug} failed`, error);
    const message = parseContractError(error) ?? errorMessage(error, 'Allowlisting failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
