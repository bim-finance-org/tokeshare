import { describe, expect, it } from 'vitest';
import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('reads Error instances and strings', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain')).toBe('plain');
  });

  it('reads the raw JSON-RPC error objects the Stellar SDK throws', () => {
    // Shape observed from soroban-testnet getEvents with a cursor past retention.
    expect(
      errorMessage({ code: -32600, message: 'startLedger must be within the ledger range: 5715257 - 5836216' }),
    ).toBe('[-32600] startLedger must be within the ledger range: 5715257 - 5836216');
  });

  it('does not repeat a code the message already carries', () => {
    expect(errorMessage({ code: -32001, message: '[-32001] request exceeded processing limit threshold' })).toBe(
      '[-32001] request exceeded processing limit threshold',
    );
  });

  it('falls back for empty values and serializes other objects', () => {
    expect(errorMessage(undefined, 'Snapshot failed')).toBe('Snapshot failed');
    expect(errorMessage(new Error(''), 'Submit failed')).toBe('Submit failed');
    expect(errorMessage({ status: 503 })).toBe('{"status":503}');
  });
});
