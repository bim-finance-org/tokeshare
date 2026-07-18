import { describe, it, expect } from 'vitest';
import { computeGoldLikeWithdrawAmount } from './goldLikeWithdrawAmount';

const ONCE = 31.1034768; // grams per troy ounce

describe('computeGoldLikeWithdrawAmount', () => {
  it('converts one troy ounce worth of grams to 1 (no fee)', () => {
    expect(computeGoldLikeWithdrawAmount(String(ONCE), 0)).toBeCloseTo(1, 10);
  });

  it('is linear in the amount', () => {
    expect(computeGoldLikeWithdrawAmount(String(ONCE * 2), 0)).toBeCloseTo(2, 10);
  });

  it('returns 0 for a 0 amount', () => {
    expect(computeGoldLikeWithdrawAmount('0', 0.003)).toBe(0);
  });

  it('applies the withdraw fee multiplicatively', () => {
    const gross = computeGoldLikeWithdrawAmount('100', 0);
    const net = computeGoldLikeWithdrawAmount('100', 0.003);
    expect(net).toBeCloseTo(gross * (1 - 0.003), 12);
  });

  it('matches the expected value for a fixed input (regression guard)', () => {
    // 100 / 31.1034768 * (1 - 0.003)
    expect(computeGoldLikeWithdrawAmount('100', 0.003)).toBeCloseTo(3.2054294, 6);
  });

  it('handles a large amount without the old 1e9 overflow', () => {
    const amount = '1000000000'; // 1e9 grams
    expect(computeGoldLikeWithdrawAmount(amount, 0)).toBeCloseTo(1e9 / ONCE, 2);
  });
});
