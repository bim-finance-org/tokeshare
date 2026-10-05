import { z } from 'zod';
import { ALFRED_CORRIDORS } from '@/config/alfred';

const CorridorKeySchema = z.enum(ALFRED_CORRIDORS.map((c) => c.key) as [string, ...string[]]);

/** Decimal amount as a string — never a float, which would round stroops away. */
const AmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,7})?$/, 'Amount must be a decimal with at most 7 decimals')
  .refine((value) => Number(value) > 0, 'Amount must be positive');

export const StellarAddressSchema = z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address');

export const AlfredSessionSchema = z.object({
  address: StellarAddressSchema,
  xdr: z.string().min(1).max(20_000),
});

export const AlfredOnboardingSchema = z.object({
  corridor: CorridorKeySchema,
  email: z.string().email().max(255),
});

export const AlfredBankAccountSchema = z.object({
  corridor: CorridorKeySchema,
  identifier: z.string().regex(/^\d{6,34}$/, 'Invalid account number'),
  holderName: z.string().min(2).max(120),
  /** Tax id, required by corridors such as PIX. */
  holderTaxId: z.string().min(5).max(32).optional(),
});

/** Records the on-chain USDC payment to the customer's Alfred deposit address. */
export const AlfredDepositSchema = z.object({
  corridor: CorridorKeySchema,
  hash: z.string().regex(/^[0-9a-f]{64}$/, 'Invalid transaction hash'),
  amount: AmountSchema,
});

/** Sandbox deposit simulator; also the shape of a quote request. */
export const AlfredAmountSchema = z.object({
  corridor: CorridorKeySchema,
  amount: AmountSchema,
});

export const AlfredWithdrawSchema = z.object({
  corridor: CorridorKeySchema,
  quoteId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, 'Invalid quote id'),
});
