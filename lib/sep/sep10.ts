// SEP-10: prove control of a Stellar address to an anchor and receive a JWT.
//
// The anchor returns a "challenge" transaction that the wallet signs. The
// challenge MUST be validated before it reaches the wallet — an unvalidated
// challenge could be a disguised real transaction draining the account. The
// checks below are the ones the spec mandates for clients: sequence 0, source
// is the anchor's SIGNING_KEY, a manage_data first op owned by the user, valid
// time bounds, and a genuine anchor signature.

import { FeeBumpTransaction, Keypair, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';

export interface Sep10Options {
  webAuthEndpoint: string;
  /** SIGNING_KEY from the anchor's stellar.toml. */
  serverSigningKey: string;
  homeDomain: string;
  /** The user's account (G...) being authenticated. */
  account: string;
  networkPassphrase: string;
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
  /**
   * Domain serving OUR stellar.toml (anchors like MoneyGram whitelist wallets
   * by it). When set, the anchor adds a `client_domain` op that must also be
   * signed by our app key — `coSignChallenge` provides that signature
   * (server-side; the secret never reaches the browser).
   */
  clientDomain?: string;
  coSignChallenge?: (xdr: string) => Promise<string>;
}

function assertValidChallenge(tx: Transaction, opts: Sep10Options): void {
  if (tx.sequence !== '0') throw new Error('Invalid challenge: sequence must be 0');
  if (tx.source !== opts.serverSigningKey) throw new Error('Invalid challenge: unexpected source account');
  // Every operation must be manageData — anything else could be a disguised
  // real transaction (payment, changeTrust…) smuggled in for signature.
  if (tx.operations.some((op) => op.type !== 'manageData')) {
    throw new Error('Invalid challenge: only manageData operations are allowed');
  }

  const first = tx.operations[0];
  if (!first || first.type !== 'manageData') throw new Error('Invalid challenge: first operation must be manageData');
  if (first.source !== opts.account) throw new Error('Invalid challenge: operation is not for this account');
  if (!first.name.endsWith(' auth')) throw new Error('Invalid challenge: unexpected manageData key');

  const timeBounds = tx.timeBounds;
  if (!timeBounds) throw new Error('Invalid challenge: missing time bounds');
  const now = Math.floor(Date.now() / 1000);
  if (now < Number(timeBounds.minTime) - 60 || (Number(timeBounds.maxTime) !== 0 && now > Number(timeBounds.maxTime))) {
    throw new Error('Invalid challenge: expired time bounds');
  }

  const serverKeypair = Keypair.fromPublicKey(opts.serverSigningKey);
  const hash = tx.hash();
  const signedByServer = tx.signatures.some((sig) => {
    try {
      return serverKeypair.verify(hash, sig.signature());
    } catch {
      return false;
    }
  });
  if (!signedByServer) throw new Error('Invalid challenge: not signed by the anchor');
}

/** Runs the full SEP-10 handshake and returns the anchor's session JWT. */
export async function authenticateSep10(opts: Sep10Options): Promise<string> {
  const url = new URL(opts.webAuthEndpoint);
  url.searchParams.set('account', opts.account);
  url.searchParams.set('home_domain', opts.homeDomain);
  if (opts.clientDomain) url.searchParams.set('client_domain', opts.clientDomain);

  const challengeRes = await fetch(url.toString());
  const challengeBody = (await challengeRes.json().catch(() => ({}))) as {
    transaction?: string;
    network_passphrase?: string;
    error?: string;
  };
  if (!challengeRes.ok || !challengeBody.transaction) {
    throw new Error(challengeBody.error || `Anchor authentication failed (${challengeRes.status})`);
  }
  if (challengeBody.network_passphrase && challengeBody.network_passphrase !== opts.networkPassphrase) {
    throw new Error('Invalid challenge: wrong network');
  }

  const parsed = TransactionBuilder.fromXDR(challengeBody.transaction, opts.networkPassphrase);
  if (parsed instanceof FeeBumpTransaction) throw new Error('Invalid challenge: fee-bump not allowed');
  assertValidChallenge(parsed, opts);

  let signedXdr = await opts.signTransaction(challengeBody.transaction, opts.networkPassphrase);
  if (opts.clientDomain && opts.coSignChallenge) {
    signedXdr = await opts.coSignChallenge(signedXdr);
  }

  const tokenRes = await fetch(opts.webAuthEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedXdr }),
  });
  const tokenBody = (await tokenRes.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!tokenRes.ok || !tokenBody.token) {
    throw new Error(tokenBody.error || `Anchor rejected the signed challenge (${tokenRes.status})`);
  }
  return tokenBody.token;
}

/** Expiry (unix seconds) read from a JWT payload, or 0 when unreadable. */
export function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return payload.exp ?? 0;
  } catch {
    return 0;
  }
}
