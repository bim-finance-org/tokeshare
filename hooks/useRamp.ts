'use client';

// SEP-24 ramp flows (cash-in / cash-out) against the configured anchor
// (MoneyGram in production, the SDF test anchor during development).
//
// The anchor hosts the whole KYC/amount UI; the app's job is: authenticate the
// wallet (SEP-10, signed with the same signTransaction used everywhere else),
// open the anchor's interactive window, poll the transaction status, and — for
// withdrawals — send the USDC payment when the anchor asks for it. Every state
// change is mirrored to /api/stellar/ramp so history survives the session.

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNetworkProfile, type StellarNetworkProfile } from '@/config/stellar';
import { RAMP_NETWORK, getRampAnchor, type RampAnchorConfig } from '@/config/anchors';
import { useStellarAccount } from '@/context/StellarContext';
import { anchorAssetIssuer, fetchAnchorToml, type AnchorToml } from '@/lib/sep/toml';
import { authenticateSep10, jwtExpiry } from '@/lib/sep/sep10';
import {
  TERMINAL_SEP24_STATUSES,
  getSep24Transaction,
  startInteractiveFlow,
  type RampDirection,
  type Sep24Transaction,
} from '@/lib/sep/sep24';
import { buildClassicPaymentXdr, buildTrustlineXdr, hasTrustline } from '@/lib/stellar-assets';
import { submitSignedXdr } from '@/lib/stellar';

export interface RampRecord {
  id: string;
  network: 'testnet' | 'mainnet';
  provider: string;
  direction: RampDirection;
  address: string;
  anchorTxId: string;
  assetCode: string;
  amountIn: string | null;
  amountOut: string | null;
  amountFee: string | null;
  status: string;
  moreInfoUrl: string | null;
  externalRef: string | null;
  stellarTxHash: string | null;
  message: string | null;
  startedAt: string;
}

// ---- module-level caches (persist across renders, die with the tab) --------

const tomlCache = new Map<string, Promise<AnchorToml>>();
const tokenCache = new Map<string, { token: string; exp: number }>();

const getToml = (homeDomain: string): Promise<AnchorToml> => {
  let cached = tomlCache.get(homeDomain);
  if (!cached) {
    cached = fetchAnchorToml(homeDomain).catch((err) => {
      tomlCache.delete(homeDomain); // don't cache failures
      throw err;
    });
    tomlCache.set(homeDomain, cached);
  }
  return cached;
};

const tokenKey = (homeDomain: string, address: string) => `${homeDomain}:${address}`;

/** A still-valid cached JWT, or undefined (30s safety margin). */
function peekToken(homeDomain: string, address: string | undefined): string | undefined {
  if (!address) return undefined;
  const cached = tokenCache.get(tokenKey(homeDomain, address));
  if (!cached) return undefined;
  if (cached.exp !== 0 && cached.exp < Date.now() / 1000 + 30) return undefined;
  return cached.token;
}

// Domain serving our stellar.toml — anchors like MoneyGram whitelist wallets
// by it and require our co-signature on challenges. Empty = plain SEP-10 (the
// SDF test anchor needs none).
const CLIENT_DOMAIN = process.env.NEXT_PUBLIC_STELLAR_RAMP_CLIENT_DOMAIN || '';

async function coSignChallenge(network: string, xdr: string): Promise<string> {
  const res = await fetch('/api/stellar/ramp/sign-challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network, xdr }),
  });
  const body = (await res.json().catch(() => ({}))) as { xdr?: string; error?: string };
  if (!res.ok || !body.xdr) throw new Error(body.error || 'Challenge co-signature failed');
  return body.xdr;
}

async function getAuthToken(opts: {
  profile: StellarNetworkProfile;
  toml: AnchorToml;
  address: string;
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
}): Promise<string> {
  const existing = peekToken(opts.toml.homeDomain, opts.address);
  if (existing) return existing;
  const token = await authenticateSep10({
    webAuthEndpoint: opts.toml.webAuthEndpoint,
    serverSigningKey: opts.toml.signingKey,
    homeDomain: opts.toml.homeDomain,
    account: opts.address,
    networkPassphrase: opts.profile.networkPassphrase,
    signTransaction: opts.signTransaction,
    clientDomain: CLIENT_DOMAIN || undefined,
    coSignChallenge: CLIENT_DOMAIN ? (xdr) => coSignChallenge(opts.profile.network, xdr) : undefined,
  });
  tokenCache.set(tokenKey(opts.toml.homeDomain, opts.address), { token, exp: jwtExpiry(token) });
  return token;
}

// ---- server mirror ---------------------------------------------------------

async function syncRecord(
  anchor: RampAnchorConfig,
  base: { network: string; address: string; direction: RampDirection; assetCode: string },
  tx: Sep24Transaction,
): Promise<void> {
  await fetch('/api/stellar/ramp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      network: base.network,
      provider: anchor.provider,
      direction: base.direction,
      address: base.address,
      anchorTxId: tx.id,
      assetCode: base.assetCode,
      status: tx.status,
      amountIn: tx.amount_in ?? undefined,
      amountOut: tx.amount_out ?? undefined,
      amountFee: tx.amount_fee ?? undefined,
      moreInfoUrl: tx.more_info_url ?? undefined,
      externalRef: tx.external_transaction_id ?? undefined,
      stellarTxHash: tx.stellar_transaction_id ?? undefined,
      message: tx.message ?? undefined,
      completedAt: tx.completed_at ?? undefined,
    }),
  });
}

// ---- hooks -----------------------------------------------------------------

/** Ramp history of the connected wallet (server mirror, newest first). */
export function useRampHistory() {
  const { address } = useStellarAccount();
  return useQuery({
    queryKey: ['stellar-ramp-history', address],
    enabled: !!address,
    staleTime: 15_000,
    queryFn: async (): Promise<RampRecord[]> => {
      const res = await fetch(`/api/stellar/ramp?address=${address}`);
      if (!res.ok) throw new Error('Failed to load ramp history');
      const payload = (await res.json()) as { transactions: RampRecord[] };
      return payload.transactions;
    },
  });
}

/**
 * Starts a deposit or withdrawal. The caller opens a blank popup synchronously
 * in the click handler (popup blockers) and hands it over; the hook navigates
 * it to the anchor's interactive URL once the flow is created.
 */
export function useStartRamp() {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ direction, popup }: { direction: RampDirection; popup: Window | null }): Promise<string> => {
      try {
        if (!address) throw new Error('Wallet not connected');
        const profile = getNetworkProfile(RAMP_NETWORK);
        const anchor = getRampAnchor(RAMP_NETWORK);
        const toml = await getToml(anchor.homeDomain);
        const token = await getAuthToken({ profile, toml, address, signTransaction });

        // Deposits arrive as the ANCHOR's asset — open its trustline up front
        // so the incoming payment can't bounce. The user signs and pays the
        // (sub-cent) fee, like every other flow in the app.
        if (direction === 'deposit') {
          const issuer = anchorAssetIssuer(toml, anchor.assetCode);
          if (issuer && !(await hasTrustline(profile, address, anchor.assetCode, issuer))) {
            const trustlineXdr = await buildTrustlineXdr(profile, address, anchor.assetCode, issuer);
            const signed = await signTransaction(trustlineXdr, profile.networkPassphrase);
            await submitSignedXdr(profile, signed);
          }
        }

        const flow = await startInteractiveFlow({
          transferServer: toml.transferServerSep24,
          direction,
          jwt: token,
          assetCode: anchor.assetCode,
          account: address,
        });

        if (popup && !popup.closed) popup.location.href = flow.url;

        const tx = await getSep24Transaction({ transferServer: toml.transferServerSep24, jwt: token, id: flow.id });
        await syncRecord(anchor, { network: RAMP_NETWORK, address, direction, assetCode: anchor.assetCode }, tx);
        return flow.id;
      } catch (error) {
        if (popup && !popup.closed) popup.close();
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stellar-ramp-history', address] }),
  });
}

/**
 * Polls the anchor for every non-terminal transaction and mirrors changes to
 * the server. Polling needs a valid anchor JWT: it runs silently while one is
 * cached, and exposes `needsAuth` + `authenticate()` (one wallet signature)
 * once it expired — statuses are never wrong meanwhile, just frozen.
 */
export function useRampPolling(records: RampRecord[]) {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();
  const [, bump] = useState(0);

  const anchor = getRampAnchor(RAMP_NETWORK);
  const active = records.filter((r) => !TERMINAL_SEP24_STATUSES.has(r.status) && r.network === RAMP_NETWORK);
  const hasToken = !!peekToken(anchor.homeDomain, address);

  const query = useQuery({
    queryKey: ['stellar-ramp-status', address, active.map((r) => r.anchorTxId).join(',')],
    enabled: !!address && active.length > 0 && hasToken,
    refetchInterval: 6000,
    queryFn: async (): Promise<Record<string, Sep24Transaction>> => {
      if (!address) return {};
      const profile = getNetworkProfile(RAMP_NETWORK);
      const toml = await getToml(anchor.homeDomain);
      const token = await getAuthToken({ profile, toml, address, signTransaction });

      const statuses: Record<string, Sep24Transaction> = {};
      let changed = false;
      await Promise.all(
        active.map(async (record) => {
          try {
            const tx = await getSep24Transaction({
              transferServer: toml.transferServerSep24,
              jwt: token,
              id: record.anchorTxId,
            });
            statuses[record.anchorTxId] = tx;
            if (tx.status !== record.status || (tx.external_transaction_id ?? null) !== record.externalRef) {
              changed = true;
              await syncRecord(
                anchor,
                { network: record.network, address, direction: record.direction, assetCode: record.assetCode },
                tx,
              );
            }
          } catch {
            // one failed poll never breaks the batch — next tick retries
          }
        }),
      );
      if (changed) queryClient.invalidateQueries({ queryKey: ['stellar-ramp-history', address] });
      return statuses;
    },
  });

  const authenticate = useCallback(async () => {
    if (!address) return;
    const profile = getNetworkProfile(RAMP_NETWORK);
    const toml = await getToml(anchor.homeDomain);
    await getAuthToken({ profile, toml, address, signTransaction });
    bump((n) => n + 1);
    queryClient.invalidateQueries({ queryKey: ['stellar-ramp-status', address] });
  }, [address, anchor.homeDomain, signTransaction, queryClient]);

  return {
    statuses: query.data ?? {},
    needsAuth: !!address && active.length > 0 && !hasToken,
    authenticate,
  };
}

/**
 * Withdrawal, final step: when the anchor reaches pending_user_transfer_start
 * it publishes destination + memo; the user signs a classic USDC payment for
 * amount_in and the anchor pays out cash / bank transfer on confirmation.
 */
export function useSendWithdrawal() {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: RampRecord): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const profile = getNetworkProfile(RAMP_NETWORK);
      const anchor = getRampAnchor(RAMP_NETWORK);
      const toml = await getToml(anchor.homeDomain);
      const token = await getAuthToken({ profile, toml, address, signTransaction });

      // Re-read the live record — destination/memo/amount must come from the
      // anchor, never from our mirror.
      const tx = await getSep24Transaction({
        transferServer: toml.transferServerSep24,
        jwt: token,
        id: record.anchorTxId,
      });
      if (tx.status !== 'pending_user_transfer_start') {
        throw new Error('The anchor is not expecting funds for this withdrawal (yet)');
      }
      if (!tx.withdraw_anchor_account || !tx.amount_in) {
        throw new Error('The anchor did not provide payment instructions');
      }

      const issuer = anchorAssetIssuer(toml, record.assetCode) ?? profile.pay.issuer;
      const paymentXdr = await buildClassicPaymentXdr(profile, {
        from: address,
        to: tx.withdraw_anchor_account,
        code: record.assetCode,
        issuer,
        amount: tx.amount_in,
        memo:
          tx.withdraw_memo && tx.withdraw_memo_type
            ? { type: tx.withdraw_memo_type, value: tx.withdraw_memo }
            : null,
      });
      const signed = await signTransaction(paymentXdr, profile.networkPassphrase);
      const hash = await submitSignedXdr(profile, signed);

      await syncRecord(
        anchor,
        { network: record.network, address, direction: record.direction, assetCode: record.assetCode },
        { ...tx, status: 'pending_anchor', stellar_transaction_id: hash },
      );
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-ramp-history', address] });
      queryClient.invalidateQueries({ queryKey: ['stellar-ramp-status', address] });
    },
  });
}

export { RAMP_NETWORK };
