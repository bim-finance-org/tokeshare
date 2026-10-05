// Shared body parsing for the round console routes: asset slug + USDC total.

import { getStellarAsset, isAssetConfigured, type StellarAsset } from '@/config/stellar-assets';
import { unitsToStroops } from '@/lib/stellar';

export type ParsedRoundRequest =
  | { ok: true; asset: StellarAsset; totalStroops: bigint }
  | { ok: false; status: number; error: string };

export function parseRoundRequest(body: { slug?: string; totalUsdc?: string }): ParsedRoundRequest {
  const asset = body.slug ? getStellarAsset(body.slug) : undefined;
  if (!asset || !isAssetConfigured(asset)) return { ok: false, status: 404, error: 'Unknown asset' };
  try {
    const totalStroops = unitsToStroops(String(body.totalUsdc ?? ''));
    if (totalStroops <= 0n) throw new Error();
    return { ok: true, asset, totalStroops };
  } catch {
    return { ok: false, status: 400, error: 'Invalid totalUsdc' };
  }
}
