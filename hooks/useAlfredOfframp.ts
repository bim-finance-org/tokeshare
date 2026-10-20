'use client';

// Alfred off-ramp: USDC on Stellar → local bank transfer (SPEI, PIX…).
//
// Alfred is not a SEP anchor, so none of the SEP-24 machinery applies here: the
// steps run against our own /api/stellar/ramp/alfred/* routes, which hold the
// credentials. Those routes serve personal data, so they are gated by a wallet
// proof — one signature of an unsubmittable challenge, cached in an httpOnly
// cookie for an hour. `needsProof` surfaces when it has to be renewed.
//
// Money moves in two separate steps, as Alfred v1 models it: the wallet funds
// the user's Alfred balance (a classic USDC payment to their deposit address,
// re-read live every time), then a payout converts and sends it to the bank
// once it is available.

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ALFRED_NETWORK, type AlfredCorridor } from '@/config/alfred';
import { getNetworkProfile } from '@/config/stellar';
import { useStellarAccount } from '@/context/StellarContext';
import { depositMemo } from '@/lib/alfred/memo';
import { buildClassicPaymentXdr } from '@/lib/stellar-assets';
import { submitSignedXdr } from '@/lib/stellar';

const BASE = '/api/stellar/ramp/alfred';

export interface AlfredOnboarding {
  corridor: string;
  customerId: string;
  email: string;
  status: string;
  endorsementsReady: boolean;
  linkedAccountLast4: string | null;
  linkedAccountStatus: string | null;
  ready: boolean;
}

export interface AlfredQuote {
  quoteId: string;
  fromAmount: string;
  toAmount: string;
  currency: string;
  rate: string;
  fees: { type: string; amount: string; currency: string }[];
  expiresAt: string;
}

export interface AlfredBalance {
  available: string;
  pending: string;
}

interface DepositInstructions {
  destination: string;
  memo: string | null;
  assetCode: string;
}

/** Thrown when the wallet proof is missing or expired. */
export class NeedsProofError extends Error {
  constructor() {
    super('Wallet proof required');
    this.name = 'NeedsProofError';
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, credentials: 'same-origin' });
  if (res.status === 401) throw new NeedsProofError();
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

const json = (payload: unknown, method = 'POST'): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

/**
 * One wallet signature proving address ownership, exchanged for a session
 * cookie. The challenge has sequence 0, so it can never reach the network.
 */
export function useWalletProof() {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();

  return useCallback(async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    const profile = getNetworkProfile(ALFRED_NETWORK);

    const challenge = await call<{ xdr: string }>(`/session?address=${address}`);
    const signed = await signTransaction(challenge.xdr, profile.networkPassphrase);
    await call<{ address: string }>('/session', json({ address, xdr: signed }));

    await queryClient.invalidateQueries({ queryKey: ['alfred-onboarding'] });
  }, [address, signTransaction, queryClient]);
}

/**
 * Onboarding state for a corridor; `needsProof` when the session expired.
 * Polls while a verification or a destination review is pending.
 */
export function useAlfredOnboarding(corridor: AlfredCorridor) {
  const { address } = useStellarAccount();

  const query = useQuery({
    queryKey: ['alfred-onboarding', address, corridor.key],
    enabled: !!address,
    retry: false,
    staleTime: 10_000,
    refetchInterval: (q) => {
      const onboarding = q.state.data;
      return onboarding && !onboarding.ready && onboarding.status !== 'NOT_STARTED' ? 20_000 : false;
    },
    queryFn: async (): Promise<AlfredOnboarding | null> => {
      const body = await call<{ onboarding: AlfredOnboarding | null }>(`/customer?corridor=${corridor.key}`);
      return body.onboarding;
    },
  });

  return {
    onboarding: query.data ?? null,
    isLoading: query.isLoading,
    needsProof: query.error instanceof NeedsProofError,
    error: query.error instanceof NeedsProofError ? null : query.error,
  };
}

const useInvalidateOnboarding = (corridor: AlfredCorridor) => {
  const { address } = useStellarAccount();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['alfred-onboarding', address, corridor.key] });
};

export function useStartAlfredOnboarding(corridor: AlfredCorridor) {
  const invalidate = useInvalidateOnboarding(corridor);
  return useMutation({
    mutationFn: (email: string) =>
      call<{ onboarding: AlfredOnboarding }>('/customer', json({ corridor: corridor.key, email })),
    onSuccess: invalidate,
  });
}

/** Mints Alfred's hosted onboarding link. */
export function useAlfredKycUrl(corridor: AlfredCorridor) {
  return useMutation({
    mutationFn: () =>
      call<{ url: string; expiresAt: string | null }>(`/kyc?corridor=${corridor.key}`, { method: 'POST' }),
  });
}

export function useRegisterBankAccount(corridor: AlfredCorridor) {
  const invalidate = useInvalidateOnboarding(corridor);
  return useMutation({
    mutationFn: (input: { identifier: string; holderName: string; holderTaxId?: string }) =>
      call<{ onboarding: AlfredOnboarding }>('/bank-account', json({ corridor: corridor.key, ...input })),
    onSuccess: invalidate,
  });
}

/** USDC on the user's Alfred balance; polled while something is still pending. */
export function useAlfredBalance(corridor: AlfredCorridor, enabled: boolean) {
  const { address } = useStellarAccount();
  return useQuery({
    queryKey: ['alfred-balance', address, corridor.key],
    enabled: !!address && enabled,
    retry: false,
    refetchInterval: (q) => (q.state.data && Number(q.state.data.pending) > 0 ? 10_000 : 30_000),
    queryFn: async (): Promise<AlfredBalance> =>
      (await call<{ balance: AlfredBalance }>(`/balance?corridor=${corridor.key}`)).balance,
  });
}

const useInvalidateMoney = (corridor: AlfredCorridor) => {
  const { address } = useStellarAccount();
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['alfred-balance', address, corridor.key] });
    queryClient.invalidateQueries({ queryKey: ['stellar-ramp-history', address] });
  };
};

/**
 * Sends USDC from the wallet to the user's Alfred deposit address. The
 * destination and memo come from Alfred at the moment of paying — never from
 * a stored row — and the memo is what attributes the arrival to this user.
 */
export function useFundAlfred(corridor: AlfredCorridor) {
  const { address, signTransaction } = useStellarAccount();
  const invalidate = useInvalidateMoney(corridor);

  return useMutation({
    mutationFn: async (amount: string): Promise<{ hash: string }> => {
      if (!address) throw new Error('Wallet not connected');
      const profile = getNetworkProfile(ALFRED_NETWORK);

      const { instructions } = await call<{ instructions: DepositInstructions }>(`/deposit?corridor=${corridor.key}`);
      const paymentXdr = await buildClassicPaymentXdr(profile, {
        from: address,
        to: instructions.destination,
        code: instructions.assetCode,
        issuer: profile.pay.issuer,
        amount,
        memo: depositMemo(instructions.memo),
      });
      const signed = await signTransaction(paymentXdr, profile.networkPassphrase);
      const hash = await submitSignedXdr(profile, signed);

      await call('/deposit', json({ corridor: corridor.key, hash, amount }));
      return { hash };
    },
    onSuccess: invalidate,
  });
}

/** Sandbox only: credits the Alfred balance through Alfred's deposit simulator. */
export function useSimulateAlfredDeposit(corridor: AlfredCorridor) {
  const invalidate = useInvalidateMoney(corridor);
  return useMutation({
    mutationFn: (amount: string) => call('/simulate', json({ corridor: corridor.key, amount })),
    onSuccess: invalidate,
  });
}

export function useAlfredQuote(corridor: AlfredCorridor) {
  return useMutation({
    mutationFn: async (amount: string): Promise<AlfredQuote> =>
      (await call<{ quote: AlfredQuote }>('/quote', json({ corridor: corridor.key, amount }))).quote,
  });
}

/** Executes the payout the quote prices; Alfred converts and sends the bank transfer. */
export function useAlfredWithdraw(corridor: AlfredCorridor) {
  const invalidate = useInvalidateMoney(corridor);
  return useMutation({
    mutationFn: async (quote: AlfredQuote): Promise<{ payoutId: string; status: string }> =>
      (
        await call<{ payout: { payoutId: string; status: string } }>(
          '/withdraw',
          json({ corridor: corridor.key, quoteId: quote.quoteId }),
        )
      ).payout,
    onSuccess: invalidate,
  });
}
