// Proof that the caller controls the Stellar address it claims.
//
// The Alfred routes handle personal data — an email, a KYC status, a bank
// account — so they cannot be plain address-keyed public endpoints like the
// SEP-24 mirror: anyone could then read another holder's onboarding state just
// by knowing their address. The wallet proves ownership the way SEP-10 does,
// by signing a challenge transaction built with sequence 0. Such a transaction
// can never be submitted (a real account's sequence starts far above zero and
// only ever increases), so signing it moves nothing.
//
// Both the challenge and the resulting session are stateless: each carries its
// own expiry and an HMAC over it, so no nonce table is needed.

import { Account, FeeBumpTransaction, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { createHmac, timingSafeEqual } from 'crypto';
import type { StellarNetworkProfile } from '@/config/stellar';

export const SESSION_COOKIE = 'ts_alfred_session';
const CHALLENGE_KEY = 'tokeshare alfred-auth';
const CHALLENGE_TTL_SECONDS = 300;
const SESSION_TTL_SECONDS = 3600;

function secret(): string {
  const value = process.env.ALFRED_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error('ALFRED_SESSION_SECRET (or NEXTAUTH_SECRET) is not set');
  return value;
}

const mac = (payload: string): string => createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 32);

const macMatches = (payload: string, expected: string): boolean => {
  const actual = Buffer.from(mac(payload), 'utf8');
  const given = Buffer.from(expected, 'utf8');
  return actual.length === given.length && timingSafeEqual(actual, given);
};

const now = (): number => Math.floor(Date.now() / 1000);

// ---- challenge -------------------------------------------------------------

/** manageData value: `<expiry>.<mac>`, ≤ 64 bytes as the protocol requires. */
const challengeValue = (address: string, exp: number): string => `${exp}.${mac(`${address}.${exp}`)}`;

/** Unsigned challenge for `address`, to be signed by the connected wallet. */
export function buildChallengeXdr(profile: StellarNetworkProfile, address: string): string {
  const exp = now() + CHALLENGE_TTL_SECONDS;
  // Sequence '-1' on the builder yields a transaction with sequence 0.
  const source = new Account(address, '-1');
  return new TransactionBuilder(source, { fee: '100', networkPassphrase: profile.networkPassphrase })
    .addOperation(Operation.manageData({ name: CHALLENGE_KEY, value: challengeValue(address, exp) }))
    .setTimeout(CHALLENGE_TTL_SECONDS)
    .build()
    .toXDR();
}

/**
 * Validates a signed challenge and returns the proven address, or null.
 * Every property is re-derived here — nothing the client sends is trusted.
 */
export function verifyChallenge(profile: StellarNetworkProfile, signedXdr: string, address: string): string | null {
  let tx;
  try {
    tx = TransactionBuilder.fromXDR(signedXdr, profile.networkPassphrase);
  } catch {
    return null;
  }
  if (tx instanceof FeeBumpTransaction) return null;
  if (tx.source !== address || tx.sequence !== '0') return null;
  if (tx.operations.length !== 1) return null;

  const op = tx.operations[0];
  if (!op || op.type !== 'manageData' || op.name !== CHALLENGE_KEY || !op.value) return null;

  const value = op.value.toString('utf8');
  const [rawExp, digest] = value.split('.');
  const exp = Number(rawExp);
  if (!Number.isFinite(exp) || !digest || exp < now()) return null;
  if (!macMatches(`${address}.${exp}`, digest)) return null;

  try {
    const keypair = Keypair.fromPublicKey(address);
    const hash = tx.hash();
    if (!tx.signatures.some((sig) => keypair.verify(hash, sig.signature()))) return null;
  } catch {
    return null;
  }
  return address;
}

// ---- session ---------------------------------------------------------------

export interface IssuedSession {
  token: string;
  maxAge: number;
}

export function issueSession(address: string): IssuedSession {
  const exp = now() + SESSION_TTL_SECONDS;
  return { token: `${address}.${exp}.${mac(`${address}.${exp}`)}`, maxAge: SESSION_TTL_SECONDS };
}

/** Address proven by the session cookie, or null when absent/expired/forged. */
export function readSession(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;

  const [address, rawExp, digest] = decodeURIComponent(match[1]).split('.');
  const exp = Number(rawExp);
  if (!address || !Number.isFinite(exp) || !digest || exp < now()) return null;
  if (!macMatches(`${address}.${exp}`, digest)) return null;
  return address;
}

export const sessionCookie = (token: string, maxAge: number): string =>
  [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
