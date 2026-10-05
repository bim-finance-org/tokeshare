import { beforeAll, describe, expect, it } from 'vitest';
import { Account, FeeBumpTransaction, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { getNetworkProfile } from '@/config/stellar';

const profile = getNetworkProfile('testnet');

// The module reads the secret at call time, so it is enough to set it first.
process.env.ALFRED_SESSION_SECRET = 'test-session-secret';

let session: typeof import('./session');

beforeAll(async () => {
  session = await import('./session');
});

const signChallenge = (xdr: string, keypair: Keypair): string => {
  const tx = TransactionBuilder.fromXDR(xdr, profile.networkPassphrase);
  tx.sign(keypair);
  return tx.toXDR();
};

describe('challenge', () => {
  it('builds a transaction that can never be submitted', () => {
    const keypair = Keypair.random();
    const xdr = session.buildChallengeXdr(profile, keypair.publicKey());
    const tx = TransactionBuilder.fromXDR(xdr, profile.networkPassphrase);
    if (tx instanceof FeeBumpTransaction) throw new Error('challenge must be a plain transaction');

    // Sequence 0 is below any real account sequence, so the network rejects it.
    expect(tx.sequence).toBe('0');
    expect(tx.operations).toHaveLength(1);
    expect(tx.operations[0]?.type).toBe('manageData');
  });

  it('accepts a challenge signed by its own address', () => {
    const keypair = Keypair.random();
    const xdr = session.buildChallengeXdr(profile, keypair.publicKey());
    expect(session.verifyChallenge(profile, signChallenge(xdr, keypair), keypair.publicKey())).toBe(
      keypair.publicKey(),
    );
  });

  it('rejects a challenge signed by somebody else', () => {
    const owner = Keypair.random();
    const attacker = Keypair.random();
    const xdr = session.buildChallengeXdr(profile, owner.publicKey());
    expect(session.verifyChallenge(profile, signChallenge(xdr, attacker), owner.publicKey())).toBeNull();
  });

  it('rejects an unsigned challenge', () => {
    const keypair = Keypair.random();
    const xdr = session.buildChallengeXdr(profile, keypair.publicKey());
    expect(session.verifyChallenge(profile, xdr, keypair.publicKey())).toBeNull();
  });

  it('rejects a challenge minted for another address', () => {
    const owner = Keypair.random();
    const other = Keypair.random();
    // A challenge issued for `other`, replayed while claiming to be `owner`.
    const xdr = session.buildChallengeXdr(profile, other.publicKey());
    expect(session.verifyChallenge(profile, signChallenge(xdr, other), owner.publicKey())).toBeNull();
  });

  it('rejects a challenge the server never issued', () => {
    // Right shape, right signature — but an expiry/mac pair minted by the
    // caller rather than by us, which is what the HMAC is there to catch.
    const keypair = Keypair.random();
    const forged = new TransactionBuilder(new Account(keypair.publicKey(), '-1'), {
      fee: '100',
      networkPassphrase: profile.networkPassphrase,
    })
      .addOperation(
        Operation.manageData({
          name: 'tokeshare alfred-auth',
          value: `${Math.floor(Date.now() / 1000) + 3600}.${'0'.repeat(32)}`,
        }),
      )
      .setTimeout(300)
      .build();
    forged.sign(keypair);
    expect(session.verifyChallenge(profile, forged.toXDR(), keypair.publicKey())).toBeNull();
  });
});

describe('session cookie', () => {
  const request = (cookie: string) => new Request('https://tokeshare.test', { headers: { cookie } });

  it('round-trips the proven address', () => {
    const address = Keypair.random().publicKey();
    const { token } = session.issueSession(address);
    expect(session.readSession(request(`${session.SESSION_COOKIE}=${encodeURIComponent(token)}`))).toBe(address);
  });

  it('rejects a token whose address was swapped', () => {
    const address = Keypair.random().publicKey();
    const other = Keypair.random().publicKey();
    const { token } = session.issueSession(address);
    const forged = token.replace(address, other);
    expect(session.readSession(request(`${session.SESSION_COOKIE}=${encodeURIComponent(forged)}`))).toBeNull();
  });

  it('rejects an expired token', () => {
    const address = Keypair.random().publicKey();
    const { token } = session.issueSession(address);
    const [, exp] = token.split('.');
    const expired = token.replace(`.${exp}.`, `.${Number(exp) - 100_000}.`);
    expect(session.readSession(request(`${session.SESSION_COOKIE}=${encodeURIComponent(expired)}`))).toBeNull();
  });

  it('rejects a missing cookie', () => {
    expect(session.readSession(new Request('https://tokeshare.test'))).toBeNull();
    expect(session.readSession(request('other=1'))).toBeNull();
  });
});
