// Stellar memo for a payment to an Alfred deposit address.
//
// The address is pooled at the custody provider: the `tag` Alfred returns next
// to it is what attributes the arrival to our customer, so a payment without
// it — or with it under the wrong memo type — lands unattributed. Numeric tags
// are MEMO_ID (a uint64), anything else MEMO_TEXT (28 bytes at most).
//
// Client-safe.

const UINT64_MAX = BigInt('18446744073709551615');

export type DepositMemo = { type: 'id' | 'text'; value: string };

export function depositMemo(tag: string | null | undefined): DepositMemo | null {
  if (!tag) return null;
  if (/^\d{1,20}$/.test(tag) && BigInt(tag) <= UINT64_MAX) return { type: 'id', value: tag };
  if (new TextEncoder().encode(tag).length > 28) {
    throw new Error('Alfred returned a deposit memo too long for a Stellar text memo');
  }
  return { type: 'text', value: tag };
}
