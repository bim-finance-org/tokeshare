import { describe, it, expect } from 'vitest';
import { parseError } from './errors';

describe('parseError', () => {
  it('falls back for null/undefined', () => {
    expect(parseError(null)).toBe('An unexpected error occurred.');
    expect(parseError(undefined)).toBe('An unexpected error occurred.');
  });

  it('maps user rejection (by message and by name)', () => {
    expect(parseError(new Error('User rejected the request'))).toBe('Transaction cancelled.');
    expect(parseError({ name: 'UserRejectedRequestError', message: '' })).toBe('Transaction cancelled.');
  });

  it('maps insufficient funds/balance', () => {
    expect(parseError(new Error('insufficient balance for transfer'))).toBe(
      'Insufficient funds to complete this transaction.',
    );
    expect(parseError({ name: 'InsufficientFundsError', message: '' })).toBe(
      'Insufficient funds to complete this transaction.',
    );
  });

  it('maps chain mismatch', () => {
    expect(parseError({ name: 'ChainMismatchError', message: '' })).toBe('Wrong network. Please switch and try again.');
  });

  it('maps network/http errors', () => {
    expect(parseError(new Error('HTTP request failed'))).toBe('Network error. Please try again.');
  });

  it('maps contract reverts with and without a reason', () => {
    expect(parseError({ name: 'ContractFunctionRevertedError', shortMessage: 'ERC20: insufficient allowance' })).toBe(
      'Transaction reverted: ERC20: insufficient allowance',
    );
    expect(parseError({ name: 'ContractFunctionRevertedError', message: '' })).toBe('Transaction reverted.');
  });

  it('maps nonce and gas-price errors', () => {
    expect(parseError(new Error('nonce too low'))).toBe('Transaction nonce error. Please try again.');
    expect(parseError(new Error('replacement transaction underpriced'))).toBe('Gas price too low. Please try again.');
  });

  it('walks the cause chain', () => {
    const wrapped = { message: 'wrapper', cause: new Error('User denied transaction') };
    expect(parseError(wrapped)).toBe('Transaction cancelled.');
  });

  it('returns the shortMessage or first message line otherwise', () => {
    expect(parseError({ shortMessage: 'Something short', message: 'ignored' })).toBe('Something short');
    expect(parseError(new Error('Custom failure\nstack trace line'))).toBe('Custom failure');
  });
});
