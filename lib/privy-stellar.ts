// Client-side Stellar signing for Privy embedded wallets.
//
// Privy signs raw hashes for Stellar (ed25519) directly in the browser via
// `useSignRawHash` — no server secret needed. We build the same signed-XDR that
// Wallets Kit produces, so the buy flow is identical regardless of onboarding
// path.
//
// ⚠️ Pending S2 validation: the exact shape of the signRawHash return (hex vs
// base64) and the tx-hash payload must be confirmed against a real testnet
// round-trip before relying on this in production.

import { Transaction, TransactionBuilder } from '@stellar/stellar-sdk';

export type PrivySignRawHash = (input: {
  address: string;
  chainType: 'stellar';
  hash: `0x${string}`;
}) => Promise<{ signature: string }>;

/**
 * Signs an unsigned Stellar transaction XDR with a Privy embedded wallet and
 * returns the signed XDR, ready to submit. Mirrors StellarContext.signTransaction.
 */
export async function signStellarXdrWithPrivy(
  signRawHash: PrivySignRawHash,
  address: string,
  unsignedXdr: string,
  networkPassphrase: string,
): Promise<string> {
  // Our sale/trustline operations are plain transactions (never fee-bump).
  const tx = TransactionBuilder.fromXDR(unsignedXdr, networkPassphrase) as Transaction;

  const hashHex = tx.hash().toString('hex');
  const { signature } = await signRawHash({ address, chainType: 'stellar', hash: `0x${hashHex}` });

  // signRawHash returns the raw ed25519 signature (hex). Convert to base64 for
  // addSignature, which verifies it against the tx hash for `address` before
  // appending the DecoratedSignature (throws on mismatch).
  const sigBase64 = Buffer.from(signature.replace(/^0x/, ''), 'hex').toString('base64');
  tx.addSignature(address, sigBase64);

  return tx.toXDR();
}
