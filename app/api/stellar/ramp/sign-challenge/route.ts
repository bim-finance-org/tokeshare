// SEP-10 client_domain co-signature. Anchors that whitelist wallets (MoneyGram)
// require the challenge to carry a signature from the app's registered auth
// key on top of the user's — this endpoint adds it, keeping the secret
// server-side.
//
// A challenge is the ONLY thing this will ever sign: sequence 0 (unsubmittable
// on-network by construction) and manageData operations exclusively. Anything
// else is rejected — otherwise this would sign arbitrary transactions with the
// app's key.

import { NextResponse } from 'next/server';
import { FeeBumpTransaction, Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const limit = await rateLimit(request, { key: 'api:stellar-ramp-sign', limit: 30, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const secret = process.env.STELLAR_RAMP_AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: 'Ramp authentication is not configured' }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { network?: string; xdr?: string };
  const network = body.network as StellarNetwork;
  if ((network !== 'mainnet' && network !== 'testnet') || !body.xdr) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const profile = getNetworkProfile(network);

  try {
    const parsed = TransactionBuilder.fromXDR(body.xdr, profile.networkPassphrase);
    if (parsed instanceof FeeBumpTransaction) {
      return NextResponse.json({ error: 'Not a challenge' }, { status: 400 });
    }
    if (parsed.sequence !== '0' || parsed.operations.some((op) => op.type !== 'manageData')) {
      return NextResponse.json({ error: 'Not a challenge' }, { status: 400 });
    }
    parsed.sign(Keypair.fromSecret(secret));
    return NextResponse.json({ xdr: parsed.toXDR() });
  } catch {
    return NextResponse.json({ error: 'Malformed transaction' }, { status: 400 });
  }
}
