import { describe, expect, it } from 'vitest';
import { readEventId } from './webhook';

// The delivery body is only trusted for its event id, which is then fetched
// back from Alfred — so the id is all that must survive parsing, and it ends
// up in a URL path, so its shape is bounded.
describe('readEventId', () => {
  it('reads the id of a v1 envelope', () => {
    expect(readEventId(JSON.stringify({ id: 'evt_123', type: 'deposit.credited', data: { object: {} } }))).toBe(
      'evt_123',
    );
  });

  it('rejects bodies that are not JSON', () => {
    expect(readEventId('not json')).toBeNull();
  });

  it('rejects envelopes without a string id', () => {
    expect(readEventId(JSON.stringify({ type: 'x' }))).toBeNull();
    expect(readEventId(JSON.stringify({ id: 42 }))).toBeNull();
    expect(readEventId('null')).toBeNull();
  });

  it('rejects ids that could escape the URL path', () => {
    expect(readEventId(JSON.stringify({ id: '../customers' }))).toBeNull();
    expect(readEventId(JSON.stringify({ id: 'evt_1?x=1' }))).toBeNull();
    expect(readEventId(JSON.stringify({ id: 'e'.repeat(129) }))).toBeNull();
  });
});
