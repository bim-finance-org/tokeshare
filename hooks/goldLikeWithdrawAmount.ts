import { ONCE_DIVISION } from '@/constants/constants';

/**
 * Gold-like tokens (TGG gold, TSG silver) are denominated per gram, while their
 * underlying (PAXG / XAGM) trades per troy ounce. Convert a token amount (grams)
 * into the underlying amount (troy ounces), net of the withdraw fee.
 *
 * Divides directly by the troy-ounce constant: the old `× 1e9 / (const × 1e9)`
 * detour cancelled out and only cost precision (a > 2^53 intermediate for large
 * amounts). Shared by TGG and TSG, which had identical copies.
 */
export function computeGoldLikeWithdrawAmount(amount: string, withdrawFee: number): number {
  const conversion = parseFloat(amount) / ONCE_DIVISION;
  return conversion - conversion * withdrawFee;
}
