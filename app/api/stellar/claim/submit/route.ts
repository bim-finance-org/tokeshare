// Claim, step 2: sponsor the fees of a holder-signed transaction and submit
// it. The holder signed the inner transaction (their signature stays theirs);
// the platform wraps it in a fee-bump so a Privy investor with zero XLM can
// still collect.
//
// The endpoint relays exactly two transaction shapes and nothing else —
// otherwise it would be an open relay for arbitrary sponsored transactions:
//   1. a single `claim` invocation on OUR distributor contract;
//   2. a single changeTrust for the network's USDC (the prerequisite).
// A claim that would fail on-chain costs the sponsor pennies at worst and is
// throttled by the rate limit.

import { NextResponse } from 'next/server';
import {
  Address,
  FeeBumpTransaction,
  Keypair,
  Transaction,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';
import { getLogger } from '@/lib/logger';
import { submitSignedXdr } from '@/lib/stellar';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-claim-submit');

function isAllowedInnerTx(inner: Transaction, profile: ReturnType<typeof getNetworkProfile>): boolean {
  if (inner.operations.length !== 1) return false;
  const op = inner.operations[0];

  if (op.type === 'invokeHostFunction') {
    const func = op.func;
    if (func.switch() !== xdr.HostFunctionType.hostFunctionTypeInvokeContract()) return false;
    const invocation = func.invokeContract();
    const target = Address.fromScAddress(invocation.contractAddress()).toString();
    const method = invocation.functionName().toString();
    return target === profile.distributorId && method === 'claim';
  }

  if (op.type === 'changeTrust') {
    const line = op.line;
    return 'code' in line && line.code === profile.pay.code && line.issuer === profile.pay.issuer;
  }

  return false;
}

export async function POST(request: Request) {
  // Deliberately tight: every accepted call can cost the sponsor a fee.
  const limit = await rateLimit(request, { key: 'api:stellar-claim-submit', limit: 10, windowSec: 3600 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const body = (await request.json().catch(() => ({}))) as { network?: string; signedXdr?: string };
  const network = body.network as StellarNetwork;
  if ((network !== 'mainnet' && network !== 'testnet') || !body.signedXdr) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const profile = getNetworkProfile(network);

  let inner: Transaction;
  try {
    const parsed = TransactionBuilder.fromXDR(body.signedXdr, profile.networkPassphrase);
    if (parsed instanceof FeeBumpTransaction) {
      return NextResponse.json({ error: 'Already fee-bumped' }, { status: 400 });
    }
    inner = parsed;
  } catch {
    return NextResponse.json({ error: 'Malformed transaction' }, { status: 400 });
  }
  if (!isAllowedInnerTx(inner, profile)) {
    return NextResponse.json({ error: 'Transaction not eligible for sponsorship' }, { status: 400 });
  }

  try {
    const sponsorSecret = process.env.STELLAR_FEE_SPONSOR_SECRET;
    let outgoing = body.signedXdr;
    if (sponsorSecret) {
      const sponsor = Keypair.fromSecret(sponsorSecret);
      // Total outer fee = baseFee × (inner ops + 1); matching the inner fee
      // per op doubles it — ample headroom, and only consumed resources are
      // actually charged.
      const bump = TransactionBuilder.buildFeeBumpTransaction(
        sponsor,
        inner.fee,
        inner,
        profile.networkPassphrase,
      );
      bump.sign(sponsor);
      outgoing = bump.toXDR();
    }
    // Without a sponsor configured the holder's own fee applies — the claim
    // still works for wallets that hold XLM.
    const hash = await submitSignedXdr(profile, outgoing);
    return NextResponse.json({ hash });
  } catch (error) {
    log.error('sponsored submit failed', error);
    const message = error instanceof Error ? error.message : 'Submit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
