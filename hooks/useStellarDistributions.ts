'use client';

// Investor-side distribution data + the claim flow.
//
// Claiming is the catch-up path (the operator push settles most holders): the
// server builds the claim from its records, the holder signs, and the server
// fee-bumps the submission so a Privy investor with zero XLM can collect.
// When the USDC trustline is missing, it is opened first — also sponsored.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';
import { useStellarAccount } from '@/context/StellarContext';
import { buildPaymentTrustlineXdr } from '@/lib/stellar-assets';

export interface DistributionLine {
  network: StellarNetwork;
  cycleId: number;
  assetSlug: string;
  amount: string;
  status: 'paid' | 'claimable' | 'pending';
  pushed: boolean | null;
  paidAt: string | null;
  paidTx: string | null;
  expiresAt: string;
  expired: boolean;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

/** Every payout line of the connected wallet (claimables + history). */
export function usePortfolioDistributions() {
  const { address } = useStellarAccount();
  return useQuery({
    queryKey: ['stellar-portfolio-distributions', address],
    enabled: !!address,
    staleTime: 30_000,
    queryFn: async (): Promise<DistributionLine[]> => {
      const res = await fetch(`/api/stellar/portfolio/${address}/distributions`);
      if (!res.ok) throw new Error('Failed to load distributions');
      const payload = (await res.json()) as { distributions: DistributionLine[] };
      return payload.distributions;
    },
  });
}

/** Claims one payout line, opening the USDC trustline first if needed. */
export function useClaimDistribution() {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ network, cycleId }: { network: StellarNetwork; cycleId: number }): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const profile = getNetworkProfile(network);

      const build = (): Promise<{ needsTrustline: boolean; xdr?: string }> =>
        postJson('/api/stellar/claim/build', { network, cycleId, address });

      let claim = await build();
      if (claim.needsTrustline) {
        // Open the USDC trustline first; its fee rides the sponsor too.
        const trustlineXdr = await buildPaymentTrustlineXdr(profile, address);
        const signedTrustline = await signTransaction(trustlineXdr, profile.networkPassphrase);
        await postJson('/api/stellar/claim/submit', { network, signedXdr: signedTrustline });
        claim = await build();
      }
      if (!claim.xdr) throw new Error('Claim could not be built');

      const signed = await signTransaction(claim.xdr, profile.networkPassphrase);
      const { hash } = await postJson<{ hash: string }>('/api/stellar/claim/submit', { network, signedXdr: signed });
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-portfolio-distributions', address] });
      queryClient.invalidateQueries({ queryKey: ['stellar-user-assets'] });
    },
  });
}
