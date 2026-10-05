import { describe, expect, it } from 'vitest';
import {
  computeRoundStatus,
  countRound,
  isDoublePaid,
  lineState,
  type EntryLike,
  type PayoutLike,
} from './stellar-round-state';

const payout = (address: string, channel: string, status: string, extra: Partial<PayoutLike> = {}): PayoutLike => ({
  address,
  channel,
  status,
  amount: 10n,
  stellarTx: null,
  ...extra,
});
const entry = (address: string, excluded: boolean, paid: boolean): EntryLike => ({
  address,
  excluded,
  paidAt: paid ? new Date() : null,
});

describe('lineState', () => {
  it('follows the SDP payment for SDP lines', () => {
    expect(lineState(payout('A', 'sdp', 'success'), undefined)).toBe('paid');
    expect(lineState(payout('A', 'sdp', 'pending'), undefined)).toBe('pending');
    expect(lineState(payout('A', 'sdp', 'ready'), undefined)).toBe('pending');
    expect(lineState(payout('A', 'sdp', 'failed'), undefined)).toBe('failed');
    expect(lineState(payout('A', 'sdp', 'canceled'), undefined)).toBe('failed');
  });

  it('follows the distributor entry for claim/push lines and re-routed SDP lines', () => {
    expect(lineState(payout('A', 'claim', 'onchain'), entry('A', true, false))).toBe('claimable');
    expect(lineState(payout('A', 'claim', 'onchain'), entry('A', true, true))).toBe('paid');
    expect(lineState(payout('A', 'push', 'onchain'), entry('A', false, false))).toBe('pending');
    expect(lineState(payout('A', 'sdp', 'rerouted'), entry('A', true, false))).toBe('claimable');
    expect(lineState(payout('A', 'sdp', 'rerouted'), entry('A', true, true))).toBe('paid');
    // Plan not persisted yet (crash window): never shown as paid.
    expect(lineState(payout('A', 'claim', 'onchain'), undefined)).toBe('pending');
  });
});

describe('computeRoundStatus', () => {
  it('is settled when every line is paid or claimable', () => {
    const payouts = [payout('A', 'sdp', 'success'), payout('B', 'claim', 'onchain')];
    expect(computeRoundStatus(payouts, [entry('B', true, false)])).toBe('settled');
  });

  it('stays submitted while an SDP payment or a push entry is in flight', () => {
    expect(computeRoundStatus([payout('A', 'sdp', 'pending')], [])).toBe('submitted');
    expect(computeRoundStatus([payout('A', 'push', 'onchain')], [entry('A', false, false)])).toBe('submitted');
  });

  it('needs attention on a failed SDP payment, until it is re-routed', () => {
    expect(computeRoundStatus([payout('A', 'sdp', 'failed')], [])).toBe('attention');
    expect(computeRoundStatus([payout('A', 'sdp', 'rerouted')], [entry('A', true, false)])).toBe('settled');
  });

  it('flags a re-routed line the SDP paid anyway (double payment)', () => {
    const doubled = payout('A', 'sdp', 'rerouted', { stellarTx: 'abc' });
    expect(isDoublePaid(doubled)).toBe(true);
    expect(computeRoundStatus([doubled], [entry('A', true, true)])).toBe('attention');
  });
});

describe('countRound', () => {
  it('counts states and delivered amount across channels', () => {
    const counts = countRound(
      [
        payout('A', 'sdp', 'success', { amount: 5n }),
        payout('B', 'sdp', 'failed'),
        payout('C', 'claim', 'onchain', { amount: 7n }),
        payout('D', 'claim', 'onchain'),
      ],
      [entry('C', true, true), entry('D', true, false)],
    );
    expect(counts).toEqual({ holders: 4, paid: 2, pending: 0, claimable: 1, failed: 1, paidAmount: 12n });
  });
});
