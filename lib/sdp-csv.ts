// Disbursement instructions for the Stellar Disbursement Platform (SDP), in
// its "known wallet address" mode (registration contact type
// EMAIL_AND_WALLET_ADDRESS): receivers are registered straight from the CSV,
// no invitation is sent, payments leave as soon as the disbursement starts.
//
// The SDP still requires an email per line, unique per receiver, and refuses
// to bind one wallet address to two emails. We never send holders' real
// emails: the email is DERIVED from the address, so the (email, address) pair
// is stable from one month to the next and the SDP reuses the same receiver.
// The messenger runs in DRY_RUN — nothing is ever mailed to that domain.
//
// Pure module (no I/O) — unit-tested in sdp-csv.test.ts.

import { stroopsToUnits } from '@/lib/stellar';

export const SYNTHETIC_EMAIL_DOMAIN = 'holders.tokeshare.co';

/** Exact SDP CSV headers (case-sensitive) for the EMAIL_AND_WALLET_ADDRESS mode. */
export const SDP_CSV_HEADERS = ['id', 'email', 'walletAddress', 'amount', 'paymentID'] as const;

/** SDP caps both the receiver external id and the external payment id at 64 chars. */
const MAX_ID_LENGTH = 64;
/** SDP refuses more than this many instructions in one disbursement. */
export const MAX_SDP_ROWS = 10_000;

export interface SdpPayoutLine {
  /** G... or C... strkey. */
  address: string;
  /** USDC stroops (7 decimals). */
  amount: bigint;
}

export const syntheticEmail = (address: string): string => `${address.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;

/**
 * External payment id: lets an operator tie an SDP payment back to its round
 * from the SDP dashboard. Reconciliation itself goes by wallet address, which
 * is unique within a disbursement.
 */
export const sdpPaymentRef = (roundId: string, address: string): string =>
  `${roundId}:${address.slice(-8)}`.slice(0, MAX_ID_LENGTH);

const STRKEY = /^[GC][A-Z2-7]{55}$/;

/** Builds the instructions file. Throws on anything the SDP would reject. */
export function buildSdpCsv(roundId: string, lines: SdpPayoutLine[]): string {
  if (lines.length === 0) throw new Error('no SDP payout line');
  if (lines.length > MAX_SDP_ROWS) throw new Error(`too many SDP lines (${lines.length} > ${MAX_SDP_ROWS})`);

  const seen = new Set<string>();
  const rows = lines.map(({ address, amount }) => {
    if (!STRKEY.test(address)) throw new Error(`not a G.../C... strkey: ${address}`);
    if (seen.has(address)) throw new Error(`duplicate address: ${address}`);
    seen.add(address);
    if (amount <= 0n) throw new Error(`amount must be positive for ${address}`);
    // Every field is [A-Za-z0-9.:@-] by construction — no CSV quoting needed.
    return [address, syntheticEmail(address), address, stroopsToUnits(amount), sdpPaymentRef(roundId, address)].join(
      ',',
    );
  });

  return `${SDP_CSV_HEADERS.join(',')}\n${rows.join('\n')}\n`;
}
