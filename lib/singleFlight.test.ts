import { describe, it, expect, vi } from 'vitest';
import { singleFlight } from './singleFlight';

describe('singleFlight', () => {
  it('coalesces concurrent calls for the same key into one invocation', async () => {
    const fn = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return 42;
    });

    const [a, b, c] = await Promise.all([
      singleFlight('k', fn),
      singleFlight('k', fn),
      singleFlight('k', fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual([42, 42, 42]);
  });

  it('does not coalesce across different keys', async () => {
    const fn = vi.fn(async () => 1);
    await Promise.all([singleFlight('a', fn), singleFlight('b', fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('frees the key after resolution so a later call re-invokes', async () => {
    const fn = vi.fn(async () => 1);
    await singleFlight('once', fn);
    await singleFlight('once', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('frees the key after a rejection', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok');

    await expect(singleFlight('err', fn)).rejects.toThrow('boom');
    await expect(singleFlight('err', fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
