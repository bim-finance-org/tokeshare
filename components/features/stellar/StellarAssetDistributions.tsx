'use client';

// Public revenue-distribution history of one asset, from the indexer-backed
// API. Renders nothing until the asset has had at least one payout — a quiet
// section header would only advertise an absence.

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type StellarAsset } from '@/config/stellar-assets';
import { stroopsToUnits } from '@/lib/stellar';

interface RoundRow {
  id: string;
  total: string;
  createdAt: string;
  holders: number;
  paidCount: number;
}

const StellarAssetDistributions = ({ asset }: { asset: StellarAsset }) => {
  const { data: rounds } = useQuery({
    queryKey: ['stellar-asset-distributions', asset.slug],
    staleTime: 60_000,
    queryFn: async (): Promise<RoundRow[]> => {
      const res = await fetch(`/api/stellar/assets/${asset.slug}/distributions`);
      if (!res.ok) return [];
      const payload = (await res.json()) as { rounds?: RoundRow[] };
      return payload.rounds ?? [];
    },
  });

  if (!rounds || rounds.length === 0) return null;

  const totalDistributed = rounds.reduce((acc, r) => acc + BigInt(r.total), 0n);

  return (
    <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:mt-8 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titleSemibold text-lg text-color4">Revenue distributions</h2>
        <p className="text-sm text-gray-500">
          {stroopsToUnits(totalDistributed)} USDC distributed over {rounds.length}{' '}
          {rounds.length > 1 ? 'payouts' : 'payout'}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {rounds.map((round) => (
          <li key={round.id} className="flex items-center justify-between py-3 text-sm">
            <span className="text-gray-600">
              {new Date(round.createdAt).toLocaleDateString()}
              <span className="ml-2 text-xs text-gray-400">
                {round.paidCount}/{round.holders} holders paid
              </span>
            </span>
            <span className="font-semibold tabular-nums text-color4">{stroopsToUnits(BigInt(round.total))} USDC</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StellarAssetDistributions;
