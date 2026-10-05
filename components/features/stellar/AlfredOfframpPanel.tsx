'use client';

// Alfred cash-out panel: USDC on Stellar → local bank account (SPEI, PIX…).
//
// A checklist the user walks once — prove the wallet, give an email, verify
// identity on Alfred's own page, register a payout account — then two money
// steps, as Alfred models them: fund the Alfred balance from the wallet, and
// once the USDC is available, quote and pay it out to the bank. Identity
// documents are never handled here: verification opens Alfred's hosted page.

import React, { useState } from 'react';
import { ArrowUpFromLine, BadgeCheck, Building2, Loader2, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ALFRED_ENABLED, ALFRED_SANDBOX, enabledCorridors, type AlfredCorridor } from '@/config/alfred';
import { useStellarAccount } from '@/context/StellarContext';
import {
  useAlfredBalance,
  useAlfredKycUrl,
  useAlfredOnboarding,
  useAlfredQuote,
  useAlfredWithdraw,
  useFundAlfred,
  useRegisterBankAccount,
  useSimulateAlfredDeposit,
  useStartAlfredOnboarding,
  useWalletProof,
  type AlfredQuote,
} from '@/hooks/useAlfredOfframp';
import { useRampHistory } from '@/hooks/useRamp';
import { ALFRED_CREDITED, ALFRED_SENT, TERMINAL_ALFRED_STATUSES } from '@/lib/alfred/types';
import { notify } from '@/lib/notify';

const STATUS_LABELS: Record<string, string> = {
  [ALFRED_SENT]: 'USDC sent to Alfred',
  [ALFRED_CREDITED]: 'USDC credited',
  CREATED: 'Payout created',
  PENDING_VALIDATION: 'Being validated',
  PENDING_FUNDS: 'Waiting for funds',
  PENDING_COMPLIANCE: 'Compliance review',
  PENDING_RFI: 'More information needed',
  APPROVED_FOR_EXECUTION: 'Approved',
  PROCESSING: 'Bank transfer in progress',
  COMPLETE: 'Paid out',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  BLOCKED: 'Blocked',
};

/** Rows that will not move any more, ours included. */
const isSettled = (status: string) => TERMINAL_ALFRED_STATUSES.has(status) || status === ALFRED_CREDITED;

const CUSTOMER_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not started',
  INCOMPLETE: 'Information missing — resume verification',
  AWAITING_UBO: 'Information missing — resume verification',
  AWAITING_QUESTIONNAIRE: 'Questionnaire to complete — resume verification',
  UNDER_REVIEW: 'Under review by Alfred',
  ACTIVE: 'Verified',
  PAUSED: 'Paused by Alfred',
  REJECTED: 'Verification refused',
  OFFBOARDED: 'Account closed',
};

const DESTINATION_LABELS: Record<string, string> = {
  PENDING: 'under review by Alfred',
  VERIFIED: 'verified',
  REJECTED: 'refused — register another account',
  EXPIRED: 'expired — register it again',
  REVOKED: 'removed — register another account',
};

/** Statuses where the user can still act inside Alfred's hosted onboarding. */
const KYC_ACTIONABLE = new Set(['NOT_STARTED', 'INCOMPLETE', 'AWAITING_UBO', 'AWAITING_QUESTIONNAIRE']);

/** Destinations that can no longer receive a payout and must be replaced. */
const DESTINATION_DEAD = new Set(['REJECTED', 'EXPIRED', 'REVOKED']);

/** One line of the onboarding checklist. */
const Step = ({ done, title, children }: { done: boolean; title: string; children?: React.ReactNode }) => (
  <div className="flex gap-3 py-3">
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
        done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
      }`}
    >
      {done ? '✓' : '•'}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-color4">{title}</p>
      {children}
    </div>
  </div>
);

/** Alfred movements of this wallet — its status machine, not SEP-24's. */
const AlfredHistory = () => {
  const { data } = useRampHistory();
  const rows = (data ?? []).filter((record) => record.provider === 'alfred').slice(0, 5);
  if (rows.length === 0) return null;

  return (
    <div className="py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">History</p>
      <ul className="mt-2 divide-y divide-gray-100">
        {rows.map((record) => (
          <li key={record.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-gray-600">
              {STATUS_LABELS[record.status] ?? record.status}
              <span className="ml-2 text-xs text-gray-400">
                {new Date(record.startedAt).toLocaleDateString()}
                {!isSettled(record.status) && ' · in progress'}
              </span>
            </span>
            <span className="font-semibold tabular-nums text-color4">
              {record.amountIn} USDC
              {record.amountOut && ` → ${record.amountOut} ${record.payoutCurrency ?? ''}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const QuoteCard = ({ quote, pending, onConfirm }: { quote: AlfredQuote; pending: boolean; onConfirm: () => void }) => (
  <div className="rounded-xl bg-color1 px-4 py-3 text-sm ring-1 ring-inset ring-black/5">
    <p className="text-color4">
      {quote.fromAmount} USDC →{' '}
      <span className="font-semibold">
        {quote.toAmount} {quote.currency}
      </span>
    </p>
    <p className="mt-0.5 text-xs text-gray-500">
      Rate {quote.rate}
      {quote.fees.map((fee) => ` · ${fee.type} fee ${fee.amount} ${fee.currency}`).join('')}
    </p>
    <p className="mt-0.5 text-xs text-gray-400">Valid until {new Date(quote.expiresAt).toLocaleTimeString()}</p>
    <Button size="sm" className="mt-2" disabled={pending} onClick={onConfirm}>
      <ArrowUpFromLine className="mr-1.5 h-4 w-4" />
      {pending ? 'Sending…' : 'Withdraw to my bank'}
    </Button>
  </div>
);

const CorridorPanel = ({ corridor }: { corridor: AlfredCorridor }) => {
  const { onboarding, isLoading, needsProof } = useAlfredOnboarding(corridor);
  const prove = useWalletProof();
  const start = useStartAlfredOnboarding(corridor);
  const kyc = useAlfredKycUrl(corridor);
  const bank = useRegisterBankAccount(corridor);
  const balance = useAlfredBalance(corridor, !!onboarding?.ready);
  const fund = useFundAlfred(corridor);
  const simulate = useSimulateAlfredDeposit(corridor);
  const quoteMutation = useAlfredQuote(corridor);
  const withdraw = useAlfredWithdraw(corridor);

  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [holder, setHolder] = useState('');
  const [taxId, setTaxId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<AlfredQuote | null>(null);

  const run = (promise: Promise<unknown>, success?: string) =>
    promise.then(() => success && notify.success(success)).catch((err) => notify.error(err));

  if (needsProof) {
    return (
      <div className="rounded-xl bg-color1 px-4 py-4 ring-1 ring-inset ring-black/5">
        <p className="text-sm text-gray-600">
          Sign once to prove this wallet is yours. The challenge cannot be submitted to the network — it moves nothing.
        </p>
        <Button size="sm" className="mt-3" onClick={() => run(prove())}>
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Verify wallet
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  }

  const active = onboarding?.status === 'ACTIVE';
  const destinationStatus = onboarding?.linkedAccountStatus ?? null;
  const needsDestination = active && (!destinationStatus || DESTINATION_DEAD.has(destinationStatus));

  // Opened synchronously in the click handler so popup blockers let it through.
  const openVerification = () => {
    const popup = window.open('', '_blank');
    kyc
      .mutateAsync()
      .then((link) => {
        if (popup) popup.location.href = link.url;
        else window.location.href = link.url;
      })
      .catch((err) => {
        popup?.close();
        notify.error(err);
      });
  };

  return (
    <div className="divide-y divide-gray-100">
      <Step done={!!onboarding} title="Contact email">
        {onboarding ? (
          <p className="text-xs text-gray-500">{onboarding.email}</p>
        ) : (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(start.mutateAsync(email), 'Account created at Alfred');
            }}
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-9 max-w-xs"
            />
            <Button size="sm" type="submit" disabled={start.isPending}>
              Continue
            </Button>
          </form>
        )}
      </Step>

      <Step done={active} title="Identity verification">
        <p className="text-xs text-gray-500">
          {CUSTOMER_LABELS[onboarding?.status ?? 'NOT_STARTED'] ?? onboarding?.status}
        </p>
        {onboarding && KYC_ACTIONABLE.has(onboarding.status) && (
          <>
            <p className="mt-1 text-xs text-gray-400">
              Opens Alfred&apos;s own page: your documents are sent to them, never to Tokeshare.
            </p>
            <Button size="sm" variant="outline" className="mt-2" disabled={kyc.isPending} onClick={openVerification}>
              <BadgeCheck className="mr-1.5 h-4 w-4" />
              {onboarding.status === 'NOT_STARTED' ? 'Start verification' : 'Resume verification'}
            </Button>
          </>
        )}
        {active && !onboarding?.endorsementsReady && (
          <p className="mt-1 text-xs text-gray-400">Alfred is enabling USDC withdrawals on your account…</p>
        )}
      </Step>

      <Step done={destinationStatus === 'VERIFIED'} title="Payout account">
        {destinationStatus && (
          <p className="text-xs text-gray-500">
            {corridor.account.identifierType} ····{onboarding?.linkedAccountLast4} —{' '}
            {DESTINATION_LABELS[destinationStatus] ?? destinationStatus}
          </p>
        )}
        {needsDestination ? (
          <form
            className="mt-2 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                bank.mutateAsync({
                  identifier,
                  holderName: holder,
                  holderTaxId: corridor.account.requiresTaxId ? taxId : undefined,
                }),
                'Payout account registered',
              );
            }}
          >
            <Input
              required
              pattern={corridor.account.pattern}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={corridor.account.placeholder}
              aria-label={corridor.account.label}
              className="h-9 max-w-xs"
            />
            <Input
              required
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Account holder name"
              className="h-9 max-w-xs"
            />
            {corridor.account.requiresTaxId && (
              <Input
                required
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Tax id (CPF)"
                className="h-9 max-w-xs"
              />
            )}
            <Button size="sm" type="submit" disabled={bank.isPending}>
              <Building2 className="mr-1.5 h-4 w-4" />
              Save account
            </Button>
          </form>
        ) : (
          !destinationStatus && <p className="text-xs text-gray-400">Available once your identity is verified.</p>
        )}
      </Step>

      <Step done={false} title={`Withdraw to ${corridor.currency}`}>
        {onboarding?.ready ? (
          <div className="mt-2 space-y-3">
            <p className="text-xs text-gray-500">
              Alfred balance:{' '}
              <span className="font-semibold tabular-nums text-color4">{balance.data?.available ?? '…'} USDC</span>
              {balance.data && Number(balance.data.pending) > 0 && ` · ${balance.data.pending} USDC arriving`}
            </p>

            <div>
              <p className="text-xs text-gray-400">1. Send USDC from your wallet to your Alfred balance</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Input
                  inputMode="decimal"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="USDC amount"
                  className="h-9 max-w-[10rem]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!fundAmount || fund.isPending}
                  onClick={() =>
                    fund
                      .mutateAsync(fundAmount)
                      .then(({ hash }) => {
                        setFundAmount('');
                        notify.success(`USDC sent — tx ${hash.slice(0, 8)}…`);
                      })
                      .catch((err) => notify.error(err))
                  }
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  {fund.isPending ? 'Sending…' : 'Send USDC'}
                </Button>
                {ALFRED_SANDBOX && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!fundAmount || simulate.isPending}
                    onClick={() => run(simulate.mutateAsync(fundAmount), 'Sandbox deposit simulated')}
                  >
                    Simulate deposit (sandbox)
                  </Button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400">2. Once available, convert and send it to your bank</p>
              <div className="mt-1 flex gap-2">
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setQuote(null);
                  }}
                  placeholder="USDC amount"
                  className="h-9 max-w-[10rem]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!amount || quoteMutation.isPending}
                  onClick={() =>
                    quoteMutation
                      .mutateAsync(amount)
                      .then(setQuote)
                      .catch((err) => notify.error(err))
                  }
                >
                  Get rate
                </Button>
              </div>
            </div>

            {quote && (
              <QuoteCard
                quote={quote}
                pending={withdraw.isPending}
                onConfirm={() =>
                  withdraw
                    .mutateAsync(quote)
                    .then(() => {
                      setQuote(null);
                      setAmount('');
                      notify.success('Withdrawal sent to your bank');
                    })
                    .catch((err) => {
                      // An expired or used quote cannot be retried — ask for a fresh one.
                      setQuote(null);
                      notify.error(err);
                    })
                }
              />
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Available once the steps above are complete.</p>
        )}
      </Step>

      <AlfredHistory />
    </div>
  );
};

const AlfredOfframpPanel = () => {
  const { isConnected } = useStellarAccount();
  const corridors = enabledCorridors();
  const [active, setActive] = useState(0);

  if (!ALFRED_ENABLED || !isConnected || corridors.length === 0) return null;
  const corridor = corridors[Math.min(active, corridors.length - 1)]!;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-color1 text-color4">
          <Building2 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-titleSemibold text-lg text-color4">Withdraw to a bank account</h2>
          <p className="text-xs text-gray-500">via Alfred Pay · {corridor.label}</p>
        </div>
      </div>

      {corridors.length > 1 && (
        <div className="mt-4 flex gap-2">
          {corridors.map((option, index) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-full px-3 py-1 text-xs ${
                index === active ? 'bg-color4 text-white' : 'bg-color1 text-gray-600'
              }`}
            >
              {option.currency}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        <CorridorPanel key={corridor.key} corridor={corridor} />
      </div>
    </div>
  );
};

export default AlfredOfframpPanel;
