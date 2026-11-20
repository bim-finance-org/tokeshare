// Pure status logic for distribution rounds: how one payout line and one round
// read, given the payout rows and the distributor entries of the round's
// cycles. Derived on read, never stored per line, so it cannot drift.
//
// No I/O — unit-tested in stellar-round-state.test.ts.

import type { SdpPaymentStatus } from '@/lib/sdp';

export type RoundStatus = 'planned' | 'submitted' | 'settled' | 'attention';

/** What a holder sees for one line. */
export type LineState = 'paid' | 'pending' | 'claimable' | 'failed';

export interface PayoutLike {
  address: string;
  channel: string; // sdp | push | claim
  status: string;
  amount: bigint;
  stellarTx: string | null;
}

export interface EntryLike {
  address: string;
  excluded: boolean;
  paidAt: Date | null;
}

const SDP_IN_FLIGHT = new Set(['draft', 'ready', 'pending', 'paused']);

/** SDP payment status → our payout status (lowercase). */
export const fromSdpStatus = (status: SdpPaymentStatus): string => status.toLowerCase();

/**
 * One line's state. SDP lines follow the SDP payment; push/claim lines — and
 * SDP lines re-routed to the claim path — follow their distributor entry.
 */
export function lineState(payout: PayoutLike, entry: EntryLike | undefined): LineState {
  if (payout.channel === 'sdp' && payout.status !== 'rerouted') {
    if (payout.status === 'success') return 'paid';
    if (payout.status === 'failed' || payout.status === 'canceled') return 'failed';
    return 'pending';
  }
  if (!entry) return 'pending';
  if (entry.paidAt) return 'paid';
  return entry.excluded ? 'claimable' : 'pending';
}

/**
 * A re-routed SDP line that the SDP later paid anyway (someone retried it from
 * the SDP dashboard): the holder got the money twice. Never automated away —
 * surfaced to the operator.
 */
export const isDoublePaid = (payout: PayoutLike): boolean =>
  payout.channel === 'sdp' && payout.status === 'rerouted' && payout.stellarTx !== null;

/**
 * Round status once execution is done (`planned` is the execution state
 * machine's own, never recomputed here):
 * - attention: an SDP line failed (needs a re-route) or was double-paid;
 * - submitted: something is still in flight (SDP payment or push entry);
 * - settled: everyone is paid, or left with a claimable line.
 */
export function computeRoundStatus(payouts: PayoutLike[], entries: EntryLike[]): Exclude<RoundStatus, 'planned'> {
  const entryByAddress = new Map(entries.map((e) => [e.address, e]));
  let inFlight = false;
  for (const payout of payouts) {
    if (isDoublePaid(payout)) return 'attention';
    if (payout.channel === 'sdp' && (payout.status === 'failed' || payout.status === 'canceled')) return 'attention';
    if (payout.channel === 'sdp' && SDP_IN_FLIGHT.has(payout.status)) inFlight = true;
    if (lineState(payout, entryByAddress.get(payout.address)) === 'pending') inFlight = true;
  }
  return inFlight ? 'submitted' : 'settled';
}

export interface RoundCounts {
  holders: number;
  paid: number;
  pending: number;
  claimable: number;
  failed: number;
  /** Stroops actually delivered (SDP success + paid entries). */
  paidAmount: bigint;
}

export function countRound(payouts: PayoutLike[], entries: EntryLike[]): RoundCounts {
  const entryByAddress = new Map(entries.map((e) => [e.address, e]));
  const counts: RoundCounts = { holders: payouts.length, paid: 0, pending: 0, claimable: 0, failed: 0, paidAmount: 0n };
  for (const payout of payouts) {
    const state = lineState(payout, entryByAddress.get(payout.address));
    counts[state] += 1;
    if (state === 'paid') counts.paidAmount += payout.amount;
  }
  return counts;
}
