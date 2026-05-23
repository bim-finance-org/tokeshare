import { z } from 'zod';
import { ALLOWED_STATUS } from '@/constants/api';

const RefSchema = z.string().min(1).max(20);
const FullNameSchema = z.string().trim().max(255);
const EmailSchema = z.string().email().max(255);
const WalletAddressSchema = z.string().trim().max(255);
const TxHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const BlockchainSchema = z.string().min(1).max(50);
const FiatSymbolSchema = z.string().min(1).max(10);
const CryptoSymbolSchema = z.string().min(1).max(10);
const StatusSchema = z.enum(ALLOWED_STATUS);
const IbanSchema = z.string().trim().min(4).max(34);

const PositiveDecimalLike = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n) || n <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a positive number' });
    return z.NEVER;
  }
  return n;
});

const NonNegativeDecimalLike = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n) || n < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a non-negative number' });
    return z.NEVER;
  }
  return n;
});

export const BuyTxSchema = z.object({
  ref: RefSchema,
  email: EmailSchema,
  fullName: FullNameSchema.optional().default(''),
  cvu: z.string().trim().max(50).optional().default(''),
  walletAddress: WalletAddressSchema,
  status: StatusSchema.optional(),
  blockchain: BlockchainSchema,
  fiat: FiatSymbolSchema,
  fiatAmount: PositiveDecimalLike,
  crypto: CryptoSymbolSchema,
  cryptoAmount: PositiveDecimalLike,
  fees: NonNegativeDecimalLike.optional(),
  amount: PositiveDecimalLike.optional(),
});

export type BuyTxInput = z.infer<typeof BuyTxSchema>;

const SellBase = z.object({
  ref: RefSchema,
  email: EmailSchema,
  fullName: FullNameSchema,
  status: StatusSchema.optional(),
  blockchain: BlockchainSchema,
  fiat: FiatSymbolSchema,
  fiatAmount: PositiveDecimalLike,
  crypto: CryptoSymbolSchema,
  cryptoAmount: PositiveDecimalLike,
  fees: NonNegativeDecimalLike.optional(),
});

const SellTxDiscriminated = z.discriminatedUnion('paymentMethod', [
  SellBase.extend({
    paymentMethod: z.literal('usdc_transfer'),
    walletAddress: WalletAddressSchema,
    txHash: TxHashSchema,
    iban: z.never().optional(),
  }),
  SellBase.extend({
    paymentMethod: z.literal('bank_transfer'),
    iban: IbanSchema,
    walletAddress: WalletAddressSchema.optional(),
    txHash: z.never().optional(),
  }),
]);

export const SellTxSchema = z.preprocess((value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (!v.paymentMethod) {
      return { ...v, paymentMethod: 'bank_transfer' };
    }
  }
  return value;
}, SellTxDiscriminated);

export type SellTxInput = z.infer<typeof SellTxSchema>;

export const EmailSubscriptionSchema = z.object({
  email: EmailSchema,
});

export type EmailSubscriptionInput = z.infer<typeof EmailSubscriptionSchema>;
