// Shapes exchanged with Alfred's v1 API (contract 1.1.1, sandbox-confirmed by
// Alfred on 2026-09-28). Only the fields this integration reads are declared.
//
// Client-safe: the dashboard panel imports the status sets below.

/** Customer lifecycle. Only ACTIVE can move money. */
export type AlfredCustomerStatus =
  | 'NOT_STARTED'
  | 'INCOMPLETE'
  | 'AWAITING_UBO'
  | 'AWAITING_QUESTIONNAIRE'
  | 'UNDER_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REJECTED'
  | 'OFFBOARDED';

export type AlfredEndorsementStatus = 'INCOMPLETE' | 'APPROVED' | 'PAUSED' | 'REVOKED';

export type AlfredRelationshipStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

/** `transaction_status` — the one of the four state machines shown to a user. */
export type AlfredTransactionStatus =
  | 'CREATED'
  | 'PENDING_VALIDATION'
  | 'PENDING_FUNDS'
  | 'PENDING_COMPLIANCE'
  | 'PENDING_RFI'
  | 'APPROVED_FOR_EXECUTION'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED'
  | 'BLOCKED';

/** Statuses Alfred will never move a transaction away from. */
export const TERMINAL_ALFRED_STATUSES: ReadonlySet<string> = new Set(['COMPLETE', 'FAILED', 'CANCELLED', 'BLOCKED']);

/** Our own status for a USDC payment sent on-chain but not yet credited by Alfred. */
export const ALFRED_SENT = 'SENT';

/** Our own status for that payment once Alfred has credited it to the balance. */
export const ALFRED_CREDITED = 'CREDITED';

export interface AlfredMoney {
  value: string;
  currency: string;
}

export interface AlfredFee {
  type: 'provider' | 'network' | 'alfred' | 'conversion' | 'payout';
  amount: string;
  currency: string;
}

export interface AlfredCustomer {
  id: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  status: AlfredCustomerStatus;
  email?: string;
}

/** The subset of `PUT /v1/customers/{id}` an individual off-ramp user needs. */
export interface AlfredCustomerProfile {
  customerType: 'CUSTOMER';
  customerArchetypes: string[];
  useCases: string[];
  residencyCountry: string;
  email?: string;
  actsOnOwnBehalf: boolean;
  ownFundsVsClientFunds: 'OWN_FUNDS';
}

export interface AlfredOnboardingLink {
  sessionId: string;
  url: string;
  expiresAt: string;
}

export interface AlfredEndorsement {
  endorsement: string;
  endorsement_status: AlfredEndorsementStatus;
  provider_endorsements?: { provider: string; name: string; status: 'pending' | 'approved' | 'revoked' }[];
  reason_code?: string | null;
  next_action?: 'none' | 'provide_information';
}

export interface AlfredDepositAddress {
  id: string;
  chain: string;
  asset?: string;
  address: string;
  /** Memo on chains that use one — Stellar does. Must ride along with the payment. */
  tag?: string | null;
  status: 'active' | 'suspended';
}

export interface AlfredBalance {
  scope: { type: 'stablecoin_balance' | 'corporate_account' | 'local_stablecoin'; id?: string | null };
  asset: string;
  chain?: string | null;
  available: string;
  pending: string;
  held: string;
  blocked: string;
  total: string;
}

/** The four independent state machines carried by every money object. */
export interface AlfredTransactionEnvelope {
  transaction_id: string;
  transaction_status: AlfredTransactionStatus;
  compliance_status: string;
  settlement_status: string;
  reconciliation_summary: string;
  payment_flow_id?: string | null;
  resource_version?: number;
}

export interface AlfredDeposit extends AlfredTransactionEnvelope {
  id: string;
  customerId: string;
  type: 'fiat' | 'crypto';
  reference?: string | null;
  amount?: AlfredMoney;
  converted?: { chain_tx_hash?: string | null } | null;
}

export interface CreateLinkedAccountRequest {
  destinationType: 'BANK_ACCOUNT';
  country: string;
  currency: string;
  holderName: string;
  holderTaxId?: string;
  bankAccount: { identifierType: string; identifier: string };
}

export interface AlfredLinkedAccount {
  id: string;
  customerId: string;
  supportedRails: string[];
  identifierMasked?: string | null;
  relationship?: { relationship_type?: string; relationship_status?: AlfredRelationshipStatus };
}

export interface CreateQuoteRequest {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  chain: string;
  rail: string;
}

export interface AlfredQuote {
  id: string;
  customerId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  fees: AlfredFee[];
  expiresAt: string;
}

export interface CreateFiatPayoutRequest {
  linkedAccountId: string;
  quoteId: string;
  amount: AlfredMoney;
  reference?: string;
  payment_flow_id?: string;
}

export interface AlfredFiatPayout extends AlfredTransactionEnvelope {
  id: string;
  customerId: string;
  linkedAccountId: string;
  amount?: AlfredMoney;
  funding?: { asset?: string; amount?: string };
}

/** Webhook envelope, identical to what `GET /v1/events/{id}` returns. */
export interface AlfredEvent {
  id: string;
  type: string;
  created: string;
  resource_version: number;
  data: { object: Record<string, unknown> };
}
