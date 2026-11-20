import { describe, expect, it } from 'vitest';
import { buildSdpCsv, MAX_SDP_ROWS, sdpPaymentRef, syntheticEmail } from './sdp-csv';

const G1 = 'GDISGKKBAA2S5ISUTNYHSQ5VN7X7O73JKALMBUHRHZE2XFZRF64R3EVL';
const G2 = 'GCBHFIQNNXYC6AVKCFAC3I6EN3E2ZDNBIQ6RUSZDS2IMYVRXAWZH3OYZ';
const C1 = 'CC2MTI3REEQUMDJYOLQHK4D6GPGSTGPZOWH3G75SECSOTOH7L7GGLG5O';
const ROUND = 'cmabc123def456ghi789jkl0m';

describe('buildSdpCsv', () => {
  it('writes the exact SDP headers and one row per holder', () => {
    const csv = buildSdpCsv(ROUND, [
      { address: G1, amount: 274_400_000n },
      { address: C1, amount: 1n },
    ]);
    const [header, row1, row2, trailing] = csv.split('\n');
    expect(header).toBe('id,email,walletAddress,amount,paymentID');
    expect(row1).toBe(`${G1},${G1.toLowerCase()}@holders.tokeshare.co,${G1},27.44,${ROUND}:F64R3EVL`);
    // 1 stroop = the smallest amount the SDP accepts (7 decimals max).
    expect(row2.split(',')[3]).toBe('0.0000001');
    expect(trailing).toBe('');
  });

  it('derives a stable synthetic email from the address (same receiver every month)', () => {
    expect(syntheticEmail(G2)).toBe(syntheticEmail(G2));
    expect(syntheticEmail(G1)).not.toBe(syntheticEmail(G2));
    // Local part fits the 64-char email limit.
    expect(syntheticEmail(G1).split('@')[0]).toHaveLength(56);
  });

  it('keeps the payment ref within the SDP 64-char limit', () => {
    expect(sdpPaymentRef(ROUND, G1).length).toBeLessThanOrEqual(64);
  });

  it('rejects what the SDP would reject', () => {
    expect(() => buildSdpCsv(ROUND, [])).toThrow(/no SDP payout line/);
    expect(() =>
      buildSdpCsv(ROUND, [
        { address: G1, amount: 1n },
        { address: G1, amount: 2n },
      ]),
    ).toThrow(/duplicate/);
    expect(() => buildSdpCsv(ROUND, [{ address: G1, amount: 0n }])).toThrow(/positive/);
    expect(() => buildSdpCsv(ROUND, [{ address: 'not-an-address', amount: 1n }])).toThrow(/strkey/);
  });

  it('caps the number of rows', () => {
    const lines = Array.from({ length: MAX_SDP_ROWS + 1 }, () => ({ address: G1, amount: 1n }));
    expect(() => buildSdpCsv(ROUND, lines)).toThrow(/too many/);
  });
});
