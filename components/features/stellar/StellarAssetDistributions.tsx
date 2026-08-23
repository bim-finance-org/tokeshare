'use client';

// Public revenue-distribution history of one asset, from the indexer-backed
// API. Renders nothing until the asset has had at least one cycle — a quiet
// section header would only advertise an absence.

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type StellarAsset } from '@/config/stellar-assets';
import { stroopsToUnits } from '@/lib/stellar';

interface CycleRow {
  cycleId: number;
  total: string;
  claimed: string;
  expiresAt: string;
  sweptAt: string | null;
  createdAt: string;
  entryCount: number;
  paidCount: number;
}

const StellarAssetDistributions = ({ asset }: { asset: StellarAsset }) => {
  const { data: cycles } = useQuery({
    queryKey: ['stellar-asset-distributions', asset.slug],
    staleTime: 60_000,
    queryFn: async (): Promise<CycleRow[]> => {
      const res = await fetch(`/api/stellar/assets/${asset.slug}/distributions`);
      if (!res.ok) return [];
      const payload = (await res.json()) as { cycles?: CycleRow[] };
      return payload.cycles ?? [];
    },
  });

  if (!cycles || cycles.length === 0) return null;

  const totalDistributed = cycles.reduce((acc, c) => acc + BigInt(c.total), 0n);

  return (
    <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:mt-8 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titleSemibold text-lg text-color4">Revenue distributions</h2>
        <p className="text-sm text-gray-500">
          {stroopsToUnits(totalDistributed)} USDC distributed over {cycles.length}{' '}
          {cycles.length > 1 ? 'cycles' : 'cycle'}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {cycles.map((cycle) => (
          <li key={cycle.cycleId} className="flex items-center justify-between py-3 text-sm">
            <span className="text-gray-600">
              Cycle #{cycle.cycleId}
              <span className="ml-2 text-xs text-gray-400">
                {new Date(cycle.createdAt).toLocaleDateString()} · {cycle.paidCount}/{cycle.entryCount} holders paid
              </span>
            </span>
            <span className="font-semibold tabular-nums text-color4">
              {stroopsToUnits(BigInt(cycle.total))} USDC
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StellarAssetDistributions;
