import { describe, expect, it } from 'vitest';
import { depositMemo } from './memo';

// The memo is what attributes a payment to the customer at a pooled custody
// address: the wrong type means funds landing unattributed.
describe('depositMemo', () => {
  it('is absent when Alfred gives no tag', () => {
    expect(depositMemo(null)).toBeNull();
    expect(depositMemo('')).toBeNull();
  });

  it('uses MEMO_ID for numeric tags', () => {
    expect(depositMemo('1234567890')).toEqual({ type: 'id', value: '1234567890' });
    expect(depositMemo('18446744073709551615')).toEqual({ type: 'id', value: '18446744073709551615' });
  });

  it('falls back to MEMO_TEXT past the uint64 range', () => {
    expect(depositMemo('18446744073709551616')).toEqual({ type: 'text', value: '18446744073709551616' });
  });

  it('uses MEMO_TEXT for anything else', () => {
    expect(depositMemo('cus_ab12')).toEqual({ type: 'text', value: 'cus_ab12' });
  });

  it('refuses a tag that does not fit a text memo rather than truncating it', () => {
    expect(() => depositMemo('x'.repeat(29))).toThrow(/too long/);
  });
});
